import { expect, test } from "vitest";
import { page } from "vitest/browser";

import { BookmarkDialogProvider } from "@/contexts/BookmarkDialog/BookmarkDialogProvider";
import { BookmarkType } from "@/enums";
import { useBookmarkDialog } from "@/hooks/useBookmarkDialog";
import { Bookmark } from "@/models";

const bookmark = new Bookmark(BookmarkType.Active, "https://example.com/", "Example");

function DialogControls() {
  const { state: dialog, openCreateDialog, openEditDialog, closeDialog } = useBookmarkDialog();

  return (
    <div>
      <button onClick={openCreateDialog}>Create</button>
      <button onClick={() => openEditDialog(bookmark)}>Edit</button>
      <button onClick={closeDialog}>Close</button>
      <p>{dialog.type}</p>
      {dialog.type === "edit" && <p>{dialog.bookmark.name}</p>}
    </div>
  );
}

test("provides typed methods to open and close bookmark dialogs", async () => {
  const screen = await page.render(
    <BookmarkDialogProvider>
      <DialogControls />
    </BookmarkDialogProvider>,
  );

  await expect.element(screen.getByText("closed")).toBeVisible();

  await screen.getByRole("button", { name: "Create" }).click();
  await expect.element(screen.getByText("create")).toBeVisible();
  await expect.element(screen.getByRole("heading", { name: "Add a bookmark" })).toBeVisible();
  await screen.getByRole("button", { name: "Cancel" }).click();

  await screen.getByRole("button", { name: "Edit" }).click();
  await expect.element(screen.getByText("Example")).toBeVisible();
  await expect.element(screen.getByRole("heading", { name: "Edit bookmark" })).toBeVisible();
  await screen.getByRole("button", { name: "Cancel" }).click();

  await screen.getByRole("button", { name: "Close" }).click();
  await expect.element(screen.getByText("closed")).toBeVisible();
});
