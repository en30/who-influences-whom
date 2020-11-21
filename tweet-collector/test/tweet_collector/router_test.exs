defmodule TweetCollector.RouterTest do
  use ExUnit.Case
  use Plug.Test

  alias TweetCollector.Router

  @opts Router.init([])

  setup do
    Mox.stub_with(TweetCollector.MockClient, TweetCollector.StubClient)
    {:ok, []}
  end

  test "returns ok" do
    res =
      conn(:post, "/tweets/1/visit")
      |> Router.call(@opts)
      |> sent_resp()

    assert res = {200, [], "OK\n"}
  end
end
