import { describe, expect, test } from "vitest";

import { BookmarkType } from "@/enums";
import { Bookmark } from "@/models/Bookmark";

describe("Bookmark", () => {
  test("clones bookmark state into an independent instance", () => {
    const bookmark = new Bookmark(
      BookmarkType.Archived,
      "https://example.com/",
      "Example",
      "A useful site",
      ["Work"],
    );
    bookmark.id = "bookmark-id";
    bookmark.createdAt = new Date("2026-01-01T00:00:00.000Z");
    bookmark.updatedAt = new Date("2026-01-02T00:00:00.000Z");
    bookmark.archivedAt = new Date("2026-01-03T00:00:00.000Z");
    bookmark.viewCount = 3;
    bookmark.lastViewedAt = new Date("2026-01-04T00:00:00.000Z");

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
