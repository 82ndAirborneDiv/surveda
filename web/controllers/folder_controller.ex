defmodule Ask.FolderController do
  use Ask.Web, :api_controller

  alias Ask.{Folder}

  def create(conn, params = %{"project_id" => project_id}) do
    folder_params = Map.get(params, "folder", %{})
                      |> Map.put("project_id", project_id)

    %Folder{}
    |> Folder.changeset(folder_params)
    |> Repo.insert()
    |> case do
      {:ok, folder} ->
        conn
        |> put_status(:created)
        |> render("show.json", folder: folder)

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(Ask.ChangesetView, "error.json", changeset: changeset)
    end
  end

  def index(conn, %{"project_id" => project_id}) do
    folders = (from f in Folder,
          where: f.project_id == ^project_id)
    |> Repo.all

    conn
    |> render("index.json", folders: folders)
  end

  def show(conn, %{"id" => folder_id}) do
    folder = Folder
    |> Repo.get!(folder_id)

    conn
    |> render("show.json", folder: folder)
  end
end