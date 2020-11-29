defmodule TweetCollector.APIClient do
  @base_uri %URI{
    scheme: "https",
    host: "api.twitter.com"
  }

  @tweet_fields ~w[
    attachments
    author_id
    context_annotations
    conversation_id
    created_at
    entities
    in_reply_to_user_id
    referenced_tweets
  ]

  @expansions ~w[
    author_id
    referenced_tweets.id
    in_reply_to_user_id
    entities.mentions.username
    referenced_tweets.id.author_id
  ]

  @user_fields ~w[
    id
    name
    username
    created_at
    description
    entities
    profile_image_url
    public_metrics
    url
  ]

  def related_tweets_of(id, params \\ %{}) do
    request(
      :get,
      "/tweets/search/recent",
      Map.merge(
        %{
          "query" => "conversation_id:#{id}",
          "max_results" => 100,
          "tweet.fields" => @tweet_fields,
          "expansions" => @expansions,
          "user.fields" => @user_fields
        },
        params
      )
    )
  end

  def tweets(ids, params \\ %{}) do
    request(
      :get,
      "/tweets",
      Map.merge(
        %{
          "ids" => Enum.join(ids, ","),
          "tweet.fields" => @tweet_fields,
          "expansions" => @expansions,
          "user.fields" => @user_fields
        },
        params
      )
    )
  end

  def quoted_tweets_of(id, params \\ %{}) do
    request(
      :get,
      "/tweets/search/recent",
      Map.merge(
        %{
          "query" => "is:quote has:mentions \"#{full_tweet_url(id)}\"",
          "max_results" => 100,
          "tweet.fields" => @tweet_fields,
          "expansions" => @expansions,
          "user.fields" => @user_fields
        },
        params
      )
    )
  end

  defp full_tweet_url(id) do
    tweet = ExTwitter.show(id)

    "https://twitter.com/#{tweet.user.screen_name}/status/#{id}"
  end

  defp request(method, path, params) do
    case :httpc.request(
           method,
           {
             url(path, params),
             headers()
           },
           [],
           []
         ) do
      {:ok, {_status, _headers, body}} ->
        {:ok, Jason.decode!(body)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp token() do
    Application.get_env(:tweet_collector, :twitter_bearer_token)
  end

  defp headers() do
    [
      {'Authorization', to_charlist("Bearer #{token()}")}
    ]
  end

  defp url(path, params) do
    @base_uri
    |> Map.merge(%{
      path: Path.join(["/2", path]),
      query: query(params)
    })
    |> URI.to_string()
  end

  defp query(params) do
    Enum.map(params, fn
      {key, value} when is_list(value) -> {key, Enum.join(value, ",")}
      kv -> kv
    end)
    |> URI.encode_query()
  end
end
