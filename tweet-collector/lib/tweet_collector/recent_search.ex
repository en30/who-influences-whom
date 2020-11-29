defmodule TweetCollector.RecentSearch do
  require Logger

  alias TweetCollector.Repo

  def import_conversations(id) do
    fetch_and_save(id, &client().related_tweets_of/2, "related_tweets_of")
  end

  def import_quoted_tweets(id) do
    fetch_and_save(id, &client().quoted_tweets_of/2, "quoted_tweets_of")
  end

  defp fetch_and_save(id, fetch, cursor) do
    repo_conn = Repo.connect()

    case fetch_next(repo_conn, id, fetch, cursor) do
      {:ok, %{"meta" => %{"result_count" => 0}}} ->
        Logger.info("no tweet to add")
        {:ok, nil}

      {:ok, res} ->
        writes =
          [Repo.prepare_write("cursors/#{cursor}", res["meta"])] ++
            Repo.prepare_tweets(res["data"] ++ res["includes"]["tweets"]) ++
            Repo.prepare_users(res["includes"]["users"])

        Logger.info("#{length(writes)} writes")

        Repo.batch_write(repo_conn, writes)
    end
  end

  defp fetch_next(conn, id, fetch, cursor) do
    case next_token(conn, cursor) do
      {:ok, nil} ->
        fetch.(id, %{})

      {:ok, next_token} ->
        fetch.(id, %{"next_token" => next_token})
    end
  end

  defp next_token(conn, cursor) do
    case Repo.find(conn, "cursors/#{cursor}") do
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
