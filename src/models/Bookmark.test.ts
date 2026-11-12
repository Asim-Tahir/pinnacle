import { describe, expect, test } from "vitest";

import { BookmarkType } from "@/enums";
import { Bookmark, type IBookmarkSerializable } from "@/models/Bookmark";

function mockBookmark(overrides: Partial<IBookmarkSerializable> = {}): Bookmark {
  return Bookmark.fromJSON({
    id: "761b55e1-e29a-59d1-94e4-e58ff250d86e",
    type: BookmarkType.Archived,
    url: "https://example.com/",
    name: "Example",
    description: "A useful site",
    tags: ["Work"],
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T14:24:34.754Z",
    viewCount: 3,
    lastViewedAt: "2026-01-04T12:00:00.000Z",
    archivedAt: "2026-01-03T12:00:00.000Z",
    ...overrides,
  });
}

describe("Bookmark", () => {
  test("clones bookmark state into an independent instance", () => {
    const bookmark = mockBookmark();

    const cloned = bookmark.clone();

    expect(cloned).toBeInstanceOf(Bookmark);
    expect(cloned).not.toBe(bookmark);
    expect(cloned.toJSON()).toEqual(bookmark.toJSON());
    expect(cloned.tags).not.toBe(bookmark.tags);
    expect(cloned.createdAt).not.toBe(bookmark.createdAt);
    expect(cloned.updatedAt).not.toBe(bookmark.updatedAt);
    expect(cloned.archivedAt).not.toBe(bookmark.archivedAt);
    expect(cloned.lastViewedAt).not.toBe(bookmark.lastViewedAt);
  });
});
