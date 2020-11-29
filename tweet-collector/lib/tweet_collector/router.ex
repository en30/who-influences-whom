defmodule TweetCollector.Router do
  use Plug.Router

  if Mix.env() == :dev do
    use Plug.Debugger
  end

  plug(:match)
  plug(Plug.RequestId)
  plug(Plug.Logger)

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Jason
  )

  plug(:dispatch)

  post "/tweets/:id/conversations/fetch" do
    %Plug.Conn{params: %{"id" => tweet_id}} = conn
    {:ok, _} = TweetCollector.RecentSearch.import_conversations(tweet_id)
    send_resp(conn, 200, "OK")
  end

  post "/tweets/:id/quoted_tweets/fetch" do
    %Plug.Conn{params: %{"id" => tweet_id}} = conn
    {:ok, _} = TweetCollector.RecentSearch.import_quoted_tweets(tweet_id)
    send_resp(conn, 200, "OK")
  end
end
