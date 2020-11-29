defmodule TweetCollector.Repo do
  alias GoogleApi.Firestore.V1.Api.Projects
  alias GoogleApi.Firestore.V1.Model

  def connect() do
    {:ok, token} = Goth.Token.for_scope("https://www.googleapis.com/auth/cloud-platform")

    GoogleApi.Firestore.V1.Connection.new(token.token)
  end

  def find(conn, path) do
    case Projects.firestore_projects_databases_documents_get(conn, document_path(path)) do
      {:ok, doc} -> {:ok, to_map(doc)}
      {:error, reason} -> {:error, reason}
    end
  end

  @max_writes_count 500

  def batch_write(conn, writes) do
    Enum.chunk_every(writes, @max_writes_count)
    |> Enum.map(fn chunk ->
      Projects.firestore_projects_databases_documents_batch_write(
        conn,
        base_path(),
        body: %GoogleApi.Firestore.V1.Model.BatchWriteRequest{
          writes: chunk
        }
      )
    end)
    |> Enum.reduce({:ok, []}, fn {:ok, x}, {:ok, acc} ->
      {:ok, [x | acc]}
    end)
  end

  def prepare_tweets(tweets) do
    tweets
    |> Enum.uniq_by(& &1["id"])
    |> Enum.map(fn tweet = %{"author_id" => author_id, "id" => id} ->
      prepare_write("users/#{author_id}/tweets/#{id}", tweet)
    end)
  end

  def prepare_users(users) do
    users
    |> Enum.uniq_by(& &1["id"])
    |> Task.async_stream(&embed_image_data/1)
    |> Enum.map(fn {:ok, user} ->
      prepare_write("users/#{user["id"]}", user)
    end)
  end

  def prepare_write(path, v) do
    %Model.Write{
      update: %Model.Document{
        name: document_path(path),
        fields: Enum.map(v, fn {k, v} -> {k, to_value(v)} end) |> Map.new()
      }
    }
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

  defp base_path() do
    project = Application.get_env(:tweet_collector, :gcp_project)
    "projects/#{project}/databases/(default)"
  end

  defp document_path("/" <> path) do
    document_path(path)
  end

  defp document_path(path) do
    base_path() <> "/documents/" <> path
  end

  defp to_map(doc = %Model.Document{}) do
    doc.fields
    |> Enum.map(fn {k, v} -> {k, from_value(v)} end)
    |> Map.new()
  end

  defp to_value(v) when is_integer(v), do: %Model.Value{integerValue: v}
  defp to_value(v) when is_binary(v), do: %Model.Value{stringValue: v}
  defp to_value(v) when is_boolean(v), do: %Model.Value{booleanValue: v}
  defp to_value(v) when is_float(v), do: %Model.Value{doubleValue: v}
  defp to_value(nil), do: %Model.Value{nullValue: nil}

  defp to_value(v) when is_map(v) do
    %Model.Value{
      mapValue: %Model.MapValue{
        fields:
          v
          |> Enum.map(fn {k, v} -> {k, to_value(v)} end)
          |> Map.new()
      }
    }
  end

  defp to_value(v) when is_list(v) do
    %Model.Value{
      arrayValue: %Model.ArrayValue{values: Enum.map(v, &to_value/1)}
    }
  end

  defp from_value(%Model.Value{integerValue: v}) when not is_nil(v), do: v
  defp from_value(%Model.Value{booleanValue: v}) when not is_nil(v), do: v
  defp from_value(%Model.Value{stringValue: v}) when not is_nil(v), do: v
  defp from_value(%Model.Value{doubleValue: v}) when not is_nil(v), do: v
  defp from_value(%Model.Value{nullValue: v}) when not is_nil(v), do: v

  defp from_value(%Model.Value{arrayValue: v}) when not is_nil(v) do
    v.arrayValue.values
    |> Enum.map(&from_value/1)
  end

  defp from_value(%Model.Value{mapValue: v}) when not is_nil(v) do
    v.mapValue.fields
    |> Enum.map(fn {k, v} -> {k, from_value(v)} end)
    |> Map.new()
  end
end
