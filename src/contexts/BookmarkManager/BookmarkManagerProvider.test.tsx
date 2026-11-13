import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import { BOOKMARK_STORAGE_KEY } from "@/constants";
import { BookmarkManagerProvider } from "@/contexts/BookmarkManager";
import { BookmarkType } from "@/enums";
import { useBookmarkManager } from "@/hooks/useBookmarkManager";
import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import { Bookmark } from "@/models";

const atlasBookmark = {
  url: "https://atlas.example/",
  name: "Atlas",
  description: "A geography guide",
  tags: ["Travel", "Reading"],
};

const zephyrBookmark = {
  url: "https://zephyr.example/",
  name: "Zephyr",
  description: "A design handbook",
  tags: ["Design", "Work"],
};

const missingBookmark = new Bookmark(BookmarkType.Active, "https://missing.example/", "Missing");

beforeEach(() => {
  const { hydrated } = useBookmarkStore.getState();
  useBookmarkStore.setState({ bookmarks: [], hydrated, persistenceError: null });
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function ManagerControls() {
  const manager = useBookmarkManager();
  const firstBookmark = () => manager.bookmarks[0];

  return (
    <div>
      <button onClick={() => void manager.createBookmark(atlasBookmark)}>Create Atlas</button>
      <button onClick={() => void manager.createBookmark(zephyrBookmark)}>Create Zephyr</button>
      <input
        aria-label="Search bookmarks"
        value={manager.query}
        onChange={(event) => manager.setQuery(event.target.value)}
      />
      <button onClick={() => manager.setSortMode("name")}>Sort by name</button>
      <button onClick={() => manager.toggleTag("Travel")}>Toggle Travel</button>
      <button onClick={manager.clearSelectedTags}>Clear tags</button>
      <button onClick={() => manager.setView("active")}>Active view</button>
      <button onClick={() => manager.setView("archived")}>Archived view</button>
      <button
        onClick={() => {
          const bookmark = firstBookmark();
          if (bookmark) void manager.archiveBookmark(bookmark);
        }}
      >
        Archive first
      </button>
      <button
        onClick={() => {
          const bookmark = firstBookmark();
          if (bookmark) void manager.restoreBookmark(bookmark);
        }}
      >
        Restore first
      </button>
      <button
        onClick={() => {
          const bookmark = firstBookmark();
          if (bookmark) {
            void manager.updateBookmark(bookmark.id, {
              url: "https://atlas.example/updated",
              name: "Atlas Revised",
              description: "Updated guide",
              tags: ["Updated"],
            });
          }
        }}
      >
        Update first
      </button>
      <button
        onClick={() => {
          const bookmark = firstBookmark();
          if (bookmark) {
            void manager.partialUpdateBookmark(bookmark.id, { description: "Partial note" });
          }
        }}
      >
        Partially update first
      </button>
      <button
        onClick={() => {
          const bookmark = firstBookmark();
          if (bookmark) void manager.deleteBookmark(bookmark);
        }}
      >
        Delete first
      </button>
      <button onClick={() => void manager.archiveBookmark(missingBookmark)}>Archive missing</button>
      <button
        onClick={() => {
          const bookmark = firstBookmark();
          if (bookmark) void manager.openBookmark(bookmark);
        }}
      >
        Open first
      </button>
      <p>Hydrated: {String(manager.hydrated)}</p>
      <p>View: {manager.view}</p>
      <p>Selected tags: {manager.selectedTags.join(", ") || "none"}</p>
      <p>
        Visible: {manager.visibleBookmarks.map((bookmark) => bookmark.name).join(" | ") || "none"}
      </p>
      <p>Tags: {manager.tagCounts.map(([tag, count]) => `${tag}:${count}`).join(", ") || "none"}</p>
      <p>
        Bookmarks:{" "}
        {manager.bookmarks
          .map(
            (bookmark) =>
              `${bookmark.name}:${bookmark.description}:${[...bookmark.tags].join("+")}:${bookmark.viewCount}`,
          )
          .join(" | ") || "none"}
      </p>
      <p>Action error: {manager.actionError || "none"}</p>
      <p>Persistence error: {manager.persistenceError || "none"}</p>
      <p>Blocked URL: {manager.blockedUrl || "none"}</p>
    </div>
  );
}

async function renderManager() {
  return page.render(
    <BookmarkManagerProvider>
      <ManagerControls />
    </BookmarkManagerProvider>,
  );
}

test("hydrates, sorts, searches, filters tags, and clears filters on view changes", async () => {
  const screen = await renderManager();

  await expect.element(screen.getByText("Hydrated: true")).toBeVisible();
  await screen.getByRole("button", { name: "Create Atlas" }).click();
  await screen.getByRole("button", { name: "Create Zephyr" }).click();

  await screen.getByRole("button", { name: "Sort by name" }).click();
  await expect.element(screen.getByText("Visible: Atlas | Zephyr")).toBeVisible();
  await expect
    .element(screen.getByText("Tags: Design:1, Reading:1, Travel:1, Work:1"))
    .toBeVisible();

  await screen.getByRole("textbox", { name: "Search bookmarks" }).fill("GUIDE");
  await expect.element(screen.getByText("Visible: Atlas")).toBeVisible();
  await screen.getByRole("textbox", { name: "Search bookmarks" }).fill("");

  await screen.getByRole("button", { name: "Toggle Travel" }).click();
  await expect.element(screen.getByText("Visible: Atlas")).toBeVisible();
  await screen.getByRole("button", { name: "Archived view" }).click();
  await expect.element(screen.getByText("Selected tags: none")).toBeVisible();
  await expect.element(screen.getByText("Visible: none")).toBeVisible();

  await screen.getByRole("button", { name: "Archive first" }).click();
  await expect.element(screen.getByText("Visible: Atlas")).toBeVisible();
  await expect.element(screen.getByText("Tags: Reading:1, Travel:1")).toBeVisible();
  await screen.getByRole("button", { name: "Restore first" }).click();
  await expect.element(screen.getByText("Visible: none")).toBeVisible();
  await screen.getByRole("button", { name: "Active view" }).click();
  await expect.element(screen.getByText("Visible: Atlas | Zephyr")).toBeVisible();
});

test("creates, updates, partially updates, and deletes bookmarks", async () => {
  const screen = await renderManager();

  await screen.getByRole("button", { name: "Create Atlas" }).click();
  await screen.getByRole("button", { name: "Update first" }).click();
  await expect
    .element(screen.getByText("Bookmarks: Atlas Revised:Updated guide:Updated:0"))
    .toBeVisible();

  await screen.getByRole("button", { name: "Partially update first" }).click();
  await expect
    .element(screen.getByText("Bookmarks: Atlas Revised:Partial note:Updated:0"))
    .toBeVisible();

  await screen.getByRole("button", { name: "Delete first" }).click();
  await expect.element(screen.getByText("Bookmarks: none")).toBeVisible();
});

test("reports bookmark action failures through manager state", async () => {
  const screen = await renderManager();

  await screen.getByRole("button", { name: "Archive missing" }).click();
  await expect.element(screen.getByText("Action error: Bookmark not found.")).toBeVisible();
});

test("persists a view before navigation and reports blocked popups", async () => {
  const screen = await renderManager();

  await screen.getByRole("button", { name: "Create Atlas" }).click();

  const events: string[] = [];
  let destination = "";
  const location = {
    get href() {
      return destination;
    },
    set href(value: string) {
      events.push("navigate");
      destination = value;
    },
  };
  const tab = { opener: window, location, close: vi.fn() } as unknown as Window;
  const open = vi.spyOn(window, "open").mockReturnValue(tab);
  const originalSetItem = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
    this: Storage,
    key: string,
    value: string,
  ) {
    if (key === BOOKMARK_STORAGE_KEY) events.push("persist");
    originalSetItem.call(this, key, value);
  });

  await screen.getByRole("button", { name: "Open first" }).click();
  await expect
    .element(screen.getByText("Bookmarks: Atlas:A geography guide:Travel+Reading:1"))
    .toBeVisible();
  expect(tab.opener).toBeNull();
  expect(destination).toBe("https://atlas.example/");
  expect(events).toEqual(["persist", "navigate"]);

  open.mockReturnValue(null);
  await screen.getByRole("button", { name: "Open first" }).click();
  await expect.element(screen.getByText("Blocked URL: https://atlas.example/")).toBeVisible();
  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state.bookmarks[0].viewCount).toBe(
    2,
  );
});

test("closes the reserved tab and does not navigate when view persistence fails", async () => {
  const screen = await renderManager();

  await screen.getByRole("button", { name: "Create Atlas" }).click();

  const location = { href: "" };
  const tab = { opener: window, location, close: vi.fn() } as unknown as Window;
  vi.spyOn(window, "open").mockReturnValue(tab);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage is unavailable");
  });

  await screen.getByRole("button", { name: "Open first" }).click();

  await expect.element(screen.getByText("Action error: Storage is unavailable")).toBeVisible();
  expect(tab.close).toHaveBeenCalledOnce();
  expect(location.href).toBe("");
  expect(screen.getByText("Bookmarks: Atlas:A geography guide:Travel+Reading:0")).toBeTruthy();
});
