import { expect, test } from "vitest";
import { page } from "vitest/browser";

import { BookmarkDialogProvider } from "@/contexts/BookmarkDialog";
import { BookmarkManagerProvider } from "@/contexts/BookmarkManager";
import { BookmarkType } from "@/enums";
import { useBookmarkDialog } from "@/hooks/useBookmarkDialog";
import { Bookmark } from "@/models";

const bookmark = new Bookmark(BookmarkType.Active, "https://example.com/", "Example");

function BookmarkDialogControls() {
  const { state, openCreateDialog, openEditDialog, closeDialog } = useBookmarkDialog();

  return (
    <div>
      <button onClick={openCreateDialog}>Create</button>
      <button onClick={() => openEditDialog(bookmark)}>Edit</button>
      <button onClick={closeDialog}>Close</button>
      <p>{state.type}</p>
      {state.type === "edit" && <p>{state.bookmark.name}</p>}
    </div>
  );
}

function TestApp() {
  return (
    <BookmarkManagerProvider>
      <BookmarkDialogProvider>
        <BookmarkDialogControls />
      </BookmarkDialogProvider>
    </BookmarkManagerProvider>
  );
}

test("provides typed methods to open and close bookmark dialogs", async () => {
  const screen = await page.render(<TestApp />);

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
