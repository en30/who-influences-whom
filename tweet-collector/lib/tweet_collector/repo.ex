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

  def prepare_write(path, v) do
    %Model.Write{
      update: %Model.Document{
        name: document_path(path),
        fields: Enum.map(v, fn {k, v} -> {k, to_value(v)} end) |> Map.new()
      }
    }
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
