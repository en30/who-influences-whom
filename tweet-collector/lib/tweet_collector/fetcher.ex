defmodule TweetCollector.Fetcher do
  require Logger
  import Plug.Conn

  alias TweetCollector.Repo

  def init(options), do: options

  def call(conn = %Plug.Conn{params: %{"id" => tweet_id}}, _opts) do
    {:ok, _} = fetch_and_save(tweet_id)

    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, "OK\n")
  end

  defp fetch_and_save(tweet_id) do
    repo_conn = Repo.connect()

    case fetch(repo_conn, tweet_id) do
      {:ok, %{"meta" => %{"result_count" => 0}}} ->
        Logger.info("no tweet to add")
        {:ok, nil}

      {:ok, res} ->
        writes =
          [Repo.prepare_write("cursors/related_tweets_of", res["meta"])] ++
            Repo.prepare_tweets(res["data"] ++ res["includes"]["tweets"]) ++
            Repo.prepare_users(res["includes"]["users"])

        Logger.info("#{length(writes)} writes")

        Repo.batch_write(repo_conn, writes)
    end
  end

  defp fetch(conn, tweet_id) do
    case next_token(conn) do
      {:ok, nil} ->
        client().related_tweets_of(tweet_id)

      {:ok, next_token} ->
        client().related_tweets_of(tweet_id, %{"next_token" => next_token})
    end
  end

  defp next_token(conn) do
    case Repo.find(conn, "cursors/related_tweets_of") do
      {:ok, meta} ->
        {:ok, meta["next_token"]}

      {:error, %{status: 404}} ->
        {:ok, nil}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp client() do
    Application.get_env(:tweet_collector, :twitter_client)
  end
end
