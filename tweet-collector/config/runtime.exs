import Config

config :tweet_collector,
  gcp_project: System.fetch_env!("GOOGLE_CLOUD_PROJECT"),
  twitter_bearer_token: System.fetch_env!("TWITTER_BEARER_TOKEN"),
  twitter_client: TweetCollector.APIClient

config :extwitter, :oauth,
  consumer_key: System.fetch_env!("TWITTER_API_KEY"),
  consumer_secret: System.fetch_env!("TWITTER_API_SECRET"),
  access_token: System.fetch_env!("TWITTER_ACCESS_TOKEN"),
  access_token_secret: System.fetch_env!("TWITTER_ACCESS_TOKEN_SECRET")
