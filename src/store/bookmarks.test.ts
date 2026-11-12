import { beforeEach, expect, test, vi } from "vitest";

import { BOOKMARK_STORAGE_KEY } from "@/constants";
import { BookmarkType } from "@/enums";
import { Bookmark, type IBookmark, type ICreateBookmark } from "@/models";
import { createBookmarkStore } from "@/store/bookmarks";

const createBookmarkInput: ICreateBookmark = {
  url: "https://example.com/",
  name: "Example",
  description: "A useful site",
  tags: ["Work"],
};

function getOldBookmark(overrides: Partial<IBookmark> = {}): IBookmark {
  return {
    id: "old-id",
    type: BookmarkType.Active,
    url: "https://example.com/",
    name: "Old",
    description: "",
    tags: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: null,
    archivedAt: null,
    viewCount: 0,
    lastViewedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

test("hydrates an empty library explicitly", async () => {
  const store = createBookmarkStore();

  expect(store.getState().hydrated).toBe(false);
  await store.getState().hydrate();

  expect(store.getState().hydrated).toBe(true);
  expect(store.getState().bookmarks).toEqual([]);
});

test("blocks writes after hydration fails and permits a retry", async () => {
  localStorage.setItem(
    BOOKMARK_STORAGE_KEY,
    JSON.stringify({ state: { bookmarks: [getOldBookmark()] }, version: 0 }),
  );

  const store = createBookmarkStore();
  const failedRead = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Storage is unavailable");
  });

  await expect(store.getState().hydrate()).rejects.toThrow("Storage is unavailable");

  expect(store.getState().hydrated).toBeFalsy();
  await expect(store.getState().createBookmark(createBookmarkInput)).rejects.toThrow(
    "must be hydrated",
  );
  failedRead.mockRestore();
  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state.bookmarks).toHaveLength(1);

  await store.getState().hydrate();
  expect(store.getState().bookmarks[0].id).toBe("old-id");
});

test("hydrates persisted bookmarks with defaults for missing fields", async () => {
  localStorage.setItem(
    BOOKMARK_STORAGE_KEY,
    JSON.stringify({
      state: {
        bookmarks: [
          {
            id: "old-id",
            url: "https://example.com/",
            name: "Old",
            description: "",
            tags: [],
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      version: 0,
    }),
  );

  const store = createBookmarkStore();

  await store.getState().hydrate();

  const [bookmark] = store.getState().bookmarks;
  expect(bookmark.type).toBe(BookmarkType.Active);
  expect(bookmark.createdAt).toEqual(new Date("2026-01-01T00:00:00.000Z"));
  expect(bookmark.viewCount).toBe(0);
  expect(bookmark.lastViewedAt).toBeNull();
  expect(bookmark.archivedAt).toBeNull();
  expect(bookmark.url).toBe("https://example.com/");
  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).version).toBe(0);
});

test("repairs malformed persisted tags so the bookmark can be edited", async () => {
  localStorage.setItem(
    BOOKMARK_STORAGE_KEY,
    JSON.stringify({
      state: {
        bookmarks: [{ ...getOldBookmark(), tags: {} }],
      },
      version: 0,
    }),
  );

  const store = createBookmarkStore();
  await store.getState().hydrate();

  expect(store.getState().bookmarks[0].tags).toEqual(new Set());

  await store.getState().partialUpdateBookmark("old-id", { name: "Edited" });

  expect(store.getState().bookmarks[0].name).toBe("Edited");
  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state.bookmarks[0].tags).toEqual(
    [],
  );
});

test("uses the persist envelope and rehydrates Bookmark instances", async () => {
  const store = createBookmarkStore();
  await store.getState().hydrate();
  const bookmark = await store.getState().createBookmark(createBookmarkInput);

  const persisted = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!);
  expect(persisted.state.bookmarks[0].id).toBe(bookmark.id);

  const rehydratedStore = createBookmarkStore();
  await rehydratedStore.getState().hydrate();

  expect(rehydratedStore.getState().bookmarks[0]).toBeInstanceOf(Bookmark);
});

test("persists create, edit, archive, restore, and delete operations", async () => {
  const store = createBookmarkStore();
  await store.getState().hydrate();
  const bookmark = await store.getState().createBookmark(createBookmarkInput);

  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state.bookmarks).toHaveLength(1);

  await store.getState().updateBookmark(bookmark.id, {
    url: "https://changed.example/path",
    name: "Changed",
    description: "Updated note",
    tags: ["Reading"],
  });
  expect(store.getState().bookmarks[0].url).toBe("https://changed.example/path");
  expect(store.getState().bookmarks[0].tags).toEqual(new Set(["Reading"]));
  expect(store.getState().bookmarks[0].updatedAt).toBeInstanceOf(Date);
  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state.bookmarks[0]).toMatchObject({
    url: "https://changed.example/path",
    name: "Changed",
    tags: ["Reading"],
  });

  await store.getState().archiveBookmark(bookmark.id);
  expect(store.getState().bookmarks[0].type).toBe(BookmarkType.Archived);
  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state.bookmarks[0]).toMatchObject({
    type: BookmarkType.Archived,
    archivedAt: expect.any(String),
  });
  await expect(
    store.getState().updateBookmark(bookmark.id, { ...createBookmarkInput, name: "No edit" }),
  ).rejects.toThrow();

  await store.getState().restoreBookmark(bookmark.id);
  expect(store.getState().bookmarks[0].type).toBe(BookmarkType.Active);
  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state.bookmarks[0]).toMatchObject({
    type: BookmarkType.Active,
    archivedAt: null,
  });

  await store.getState().deleteBookmark(bookmark.id);
  expect(store.getState().bookmarks).toEqual([]);
  expect(JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state.bookmarks).toEqual([]);
});

test("keeps bookmark instances when editing repeatedly", async () => {
  const store = createBookmarkStore();
  await store.getState().hydrate();
  const bookmark = await store.getState().createBookmark(createBookmarkInput);

  await store.getState().partialUpdateBookmark(bookmark.id, { name: "First edit" });
  expect(store.getState().bookmarks[0]).toBeInstanceOf(Bookmark);

  await store.getState().partialUpdateBookmark(bookmark.id, { name: "Second edit" });

  expect(store.getState().bookmarks[0]).toBeInstanceOf(Bookmark);
  expect(store.getState().bookmarks[0].name).toBe("Second edit");
});

test("view bookmark resolves after the view count is durably saved", async () => {
  const store = createBookmarkStore();
  await store.getState().hydrate();
  const bookmark = await store.getState().createBookmark(createBookmarkInput);

  await store.getState().viewBookmark(bookmark.id);

  const persisted = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!);
  expect(persisted.state.bookmarks[0].viewCount).toBe(1);
  expect(persisted.state.bookmarks[0].lastViewedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(store.getState().bookmarks[0].updatedAt).toBeInstanceOf(Date);
});

test("records a view for an archived bookmark without restoring it", async () => {
  const store = createBookmarkStore();
  await store.getState().hydrate();
  const bookmark = await store.getState().createBookmark(createBookmarkInput);
  const archived = await store.getState().archiveBookmark(bookmark.id);

  await store.getState().viewBookmark(bookmark.id);

  const persistedBookmark = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)!).state
    .bookmarks[0];
  expect(store.getState().bookmarks[0].type).toBe(BookmarkType.Archived);
  expect(store.getState().bookmarks[0].archivedAt).toEqual(archived.archivedAt);
  expect(store.getState().bookmarks[0].viewCount).toBe(1);
  expect(store.getState().bookmarks[0].lastViewedAt).toBeInstanceOf(Date);
  expect(persistedBookmark).toMatchObject({
    type: BookmarkType.Archived,
    archivedAt: archived.archivedAt?.toISOString(),
    viewCount: 1,
    lastViewedAt: expect.any(String),
  });
});

test("keeps view state unchanged and rejects when persistence fails", async () => {
  const store = createBookmarkStore();
  await store.getState().hydrate();
  const bookmark = await store.getState().createBookmark(createBookmarkInput);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage is unavailable");
  });

  await expect(store.getState().viewBookmark(bookmark.id)).rejects.toThrow(
    "Storage is unavailable",
  );

  expect(store.getState().bookmarks[0].viewCount).toBe(0);
  expect(store.getState().persistenceError).toBe("Storage is unavailable");
});
