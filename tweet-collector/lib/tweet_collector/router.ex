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

  post("/tweets/:id/fetch", to: TweetCollector.Fetcher)
end
