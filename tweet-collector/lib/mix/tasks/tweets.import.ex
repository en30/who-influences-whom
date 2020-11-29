defmodule Mix.Tasks.Tweets.Import do
  require Logger
  use Mix.Task
  alias TweetCollector.{Repo, APIClient}

  @shortdoc "Import tweets from a text file which includes one tweet id per line"
  def run([ids_file]) do
    Mix.Task.run("app.start")

    File.stream!(ids_file)
    |> Stream.map(&String.trim/1)
    |> Stream.chunk_every(100)
    |> Task.async_stream(&fetch_and_save/1, timeout: 60_000)
    |> Stream.run()
  end

  defp fetch_and_save(ids) do
    repo_conn = Repo.connect()

    case APIClient.tweets(ids) do
      {:ok, res} ->
        writes =
          Repo.prepare_tweets(res["data"] ++ res["includes"]["tweets"]) ++
            Repo.prepare_users(res["includes"]["users"])

        Logger.info("#{length(writes)} writes")

        Repo.batch_write(repo_conn, writes)
    end
  end
end
