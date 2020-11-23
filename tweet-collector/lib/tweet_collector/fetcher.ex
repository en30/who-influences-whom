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
            prepare_tweets(res["data"] ++ res["includes"]["tweets"]) ++
            prepare_users(res["includes"]["users"])

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

  defp prepare_tweets(tweets) do
    tweets
    |> Enum.uniq_by(& &1["id"])
    |> Enum.map(fn tweet = %{"author_id" => author_id, "id" => id} ->
      Repo.prepare_write("users/#{author_id}/tweets/#{id}", tweet)
    end)
  end

  defp prepare_users(users) do
    users
    |> Enum.uniq_by(& &1["id"])
    |> Task.async_stream(&embed_image_data/1)
    |> Enum.map(fn {:ok, user} ->
      Repo.prepare_write("users/#{user["id"]}", user)
    end)
  end

  defp client() do
    Application.get_env(:tweet_collector, :twitter_client)
  end

  defp embed_image_data(user) do
    case :httpc.request(:get, {user["profile_image_url"], []}, [], body_format: :binary) do
      {:ok, {{_, 200, 'OK'}, headers, body}} ->
        content_type = Enum.find_value(headers, fn {k, v} -> k == 'content-type' && v end)

        Map.merge(user, %{
          "profile_image_data_uri" => "data:#{content_type};base64,#{Base.encode64(body)}"
        })
    end
  end
end
