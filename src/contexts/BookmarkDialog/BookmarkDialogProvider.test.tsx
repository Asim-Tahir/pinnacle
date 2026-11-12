import { beforeEach, expect, test } from "vitest";
import { page } from "vitest/browser";

import { BOOKMARK_STORAGE_KEY } from "@/constants";
import { BookmarkDialogProvider } from "@/contexts/BookmarkDialog";
import { BookmarkManagerProvider } from "@/contexts/BookmarkManager";
import { BookmarkType } from "@/enums";
import { useBookmarkDialog } from "@/hooks/useBookmarkDialog";
import { useBookmarkManager } from "@/hooks/useBookmarkManager";
import { Bookmark } from "@/models";
import { useBookmarksStore } from "@/store/bookmarks";

const bookmark = new Bookmark(BookmarkType.Active, "https://example.com/", "Example");

beforeEach(() => {
  const { hydrated } = useBookmarksStore.getState();
  useBookmarksStore.setState({ bookmarks: [], hydrated, persistenceError: null });
  localStorage.removeItem(BOOKMARK_STORAGE_KEY);
});

function BookmarkDialogControls() {
  const { state, openCreateDialog, openEditDialog, closeDialog } = useBookmarkDialog();
  const { bookmarks } = useBookmarkManager();

  return (
    <div>
      <button onClick={openCreateDialog}>Create</button>
      <button onClick={() => openEditDialog(bookmark)}>Edit</button>
      <button onClick={closeDialog}>Close</button>
      <p>{state.type}</p>
      {state.type === "edit" && <p>{state.bookmark.name}</p>}
      <p>
        Saved:{" "}
        {bookmarks.map(({ name, url, description }) => `${name}:${url}:${description}`).join("|") ||
          "none"}
      </p>
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

test("creates a bookmark from valid form data", async () => {
  const screen = await page.render(<TestApp />);

  await screen.getByRole("button", { name: "Create" }).click();
  await screen.getByPlaceholder("example.com").fill("example.com/guide");
  await screen.getByPlaceholder("A name to remember it by").fill("Example");
  await screen.getByPlaceholder("What makes this page useful?").fill("Useful page");
  await screen.getByRole("button", { name: "Add bookmark" }).click();

  await expect
    .element(screen.getByText("Saved: Example:https://example.com/guide:Useful page"))
    .toBeVisible();
  await expect.element(screen.getByText("closed")).toBeVisible();
});

test("keeps the form open when the URL is invalid", async () => {
  const screen = await page.render(<TestApp />);

  await screen.getByRole("button", { name: "Create" }).click();
  const urlInput = screen.getByPlaceholder("example.com");
  await urlInput.fill("ftp://example.com");
  await screen.getByRole("button", { name: "Add bookmark" }).click();

  await expect.element(urlInput).toBeInvalid();
  await expect.element(screen.getByRole("heading", { name: "Add a bookmark" })).toBeVisible();
  await expect.element(screen.getByText("Saved: none")).toBeVisible();
});

test.each(["a.co", "ab.c"])(
  "rejects %s because the domain and TLD require two characters",
  async (invalidURL) => {
    const screen = await page.render(<TestApp />);

    await screen.getByRole("button", { name: "Create" }).click();
    const urlInput = screen.getByPlaceholder("example.com");

    await urlInput.fill(invalidURL);
    expect((urlInput.element() as HTMLInputElement).validity.patternMismatch).toBe(true);
    await screen.getByRole("button", { name: "Add bookmark" }).click();
    await expect.element(screen.getByRole("heading", { name: "Add a bookmark" })).toBeVisible();
    await expect.element(screen.getByText("Saved: none")).toBeVisible();
  },
);

test.each(["ab.co", "atlas.example"])(
  "accepts %s with a valid domain and TLD",
  async (validURL) => {
    const screen = await page.render(<TestApp />);

    await screen.getByRole("button", { name: "Create" }).click();
    const urlInput = screen.getByPlaceholder("example.com");

    await urlInput.fill(validURL);
    expect((urlInput.element() as HTMLInputElement).validity.patternMismatch).toBe(false);
    await screen.getByPlaceholder("A name to remember it by").fill("Valid bookmark");
    await screen.getByRole("button", { name: "Add bookmark" }).click();
    await expect.element(screen.getByText(/^Saved: Valid bookmark:/)).toBeVisible();
  },
);
