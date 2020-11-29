import '../styles/globals.css'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Who influences whom?</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.twttr = (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || { };
          if (d.getElementById(id)) return t;
          js = d.createElement(s);
          js.id = id;
          js.src = "https://platform.twitter.com/widgets.js";
          fjs.parentNode.insertBefore(js, fjs);

          t._e = [];
          t.ready = function(f) {
            t._e.push(f);
          };

          return t;
        }(document, "script", "twitter-wjs"));
        `,
          }}
        ></script>

        <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#" />
        <meta
          property="og:url"
          content="https://who-influences-whom.vercel.app"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Who influences whom?" />
        <meta
          property="og:description"
          content={`Mention graph of a tweet from auth0, "Name a developer who's had an influence on you."`}
        />
        <meta
          property="og:image"
          content="https://who-influences-whom.vercel.app/screen_shot.png"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@en30Y" />
        <meta name="twitter:title" content="Who influences whom?" />
        <meta
          name="twitter:description"
          content={`Mention graph of a tweet from auth0, "Name a developer who's had an influence on you."`}
        />
        <meta
          name="twitter:image"
          content="https://who-influences-whom.vercel.app/screen_shot.png"
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
