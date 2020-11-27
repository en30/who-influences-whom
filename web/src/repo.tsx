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

export type Mention = { start: number; end: number; username: string }
export type ShortendedURL = {
  start: number
  end: number
  url: string
  display_url: string
  expanded_url: string
}
export type UserEntities = {
  description?: {
    mentions?: Array<Mention>
    urls: Array<ShortendedURL>
  }
  url?: {
    urls: [ShortendedURL]
  }
}
export type User = {
  id: string
  name: string
  username: string
  description: string
  profile_image_data_uri: string
  profile_image_url: string
  entities?: UserEntities
}
export type Tweet = {
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
