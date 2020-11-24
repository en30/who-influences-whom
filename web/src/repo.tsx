import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  if (process.env.NODE_ENV === 'production') {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.SERVICE_ACCOUNT_KEY!.replace(/\n/g, '\\n'))
      ),
    })
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
  }
}

const db = admin.firestore()

type User = {
  id: string
  username: string
  profile_image_data_uri: string
}
type Tweet = {
  id: string
  author_id: string
  entities?: {
    mentions: Array<{ username: string }>
  }
}

export async function allUsers(): Promise<Array<User>> {
  const snapshot = await db.collection('users').get()
  const res = []
  snapshot.forEach((doc) => {
    res.push({
      id: doc.id,
      ...doc.data(),
    })
  })
  return res
}
export async function allTweets(): Promise<Array<Tweet>> {
  const snapshot = await db.collectionGroup('tweets').get()
  const res = []
  snapshot.forEach((doc) => {
    res.push({
      id: doc.id,
      ...doc.data(),
    })
  })
  return res
}
