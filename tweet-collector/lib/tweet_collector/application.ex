defmodule TweetCollector.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application
  require Logger

  @impl true
  def start(_type, _args) do
    port = System.get_env("PORT", "8080") |> String.to_integer()

    children = [
      {Plug.Cowboy, scheme: :http, plug: TweetCollector.Router, options: [port: port]}
    ]

    Logger.info("Starting application on port #{port}")

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: TweetCollector.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
