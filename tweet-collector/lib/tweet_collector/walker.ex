defmodule TweetCollector.Walker do
  import Plug.Conn

  def init(options), do: options

  def call(conn, _opts) do
    conn
    |> visit()
    |> put_resp_content_type("text/plain")
    |> send_resp(200, "OK\n")
  end

  def visit(
        conn = %Plug.Conn{
          params: %{"id" => tweet_id}
        }
      ) do
    visit(tweet_id)
    conn
  end

  def visit(tweet_id) do
    tweet_id
  end
end
