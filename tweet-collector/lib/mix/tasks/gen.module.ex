defmodule Mix.Tasks.Gen.Module do
  use Mix.Task
  import Mix.Generator

  embed_template(
    :module,
    """
    defmodule <%= @name %> do

    end
    """
  )

  embed_template(
    :test,
    """
    defmodule <%= @name %>Test do
      use ExUnit.Case
      alias <%= @name %>
    end
    """
  )

  @shortdoc "Generate a module and test file by given name like Mix.Tasks.Hoge."
  def run([name]) do
    create_file(module_path(name), module_template(name: name))
    create_file(test_path(name), test_template(name: name))
  end

  def module_path(name) do
    (["lib"] ++ path_parts(name, ".ex"))
    |> Path.join()
  end

  def test_path(name) do
    (["test"] ++ path_parts(name, "_test.exs"))
    |> Path.join()
  end

  defp path_parts(name, suffix) do
    String.split(name, ".")
    |> Enum.map(fn upper_snake ->
      Regex.replace(~r/([a-z]|[A-Z]+)([A-Z])/, upper_snake, fn _, l, r -> "#{l}_#{r}" end)
    end)
    |> Enum.map(&String.downcase/1)
    |> Enum.reverse()
    |> case do
      [basename | dirs] ->
        [basename <> suffix] ++ dirs
    end
    |> Enum.reverse()
  end
end
