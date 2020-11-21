defmodule TweetCollectorTest do
  use ExUnit.Case
  doctest TweetCollector

  test "greets the world" do
    assert TweetCollector.hello() == :world
  end
end
