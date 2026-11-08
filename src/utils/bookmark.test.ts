import { describe, expect, test } from "vitest";

import { BookmarkType } from "@/enums";
import { Bookmark, type IBookmark } from "@/models";

import { rankActiveBookmarks, sortArchivedBookmarks } from "./bookmark";

const now = new Date("2026-01-31T12:00:00.000Z");

function mockBookmark(overrides: Partial<IBookmark> = {}): Bookmark {
  return Bookmark.fromJSON({
    id: "761b55e1-e29a-59d1-94e4-e58ff250d86e",
    type: BookmarkType.Active,
    url: "https://www.google.com/",
    name: "Google",
    description: "",
    tags: [],
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
    updatedAt: new Date("2026-01-01T12:00:00.000Z"),
    viewCount: 0,
    lastViewedAt: null,
    archivedAt: null,
    ...overrides,
  });
}

describe("bookmark domain rules", () => {
  test("normalizes bookmark URLs and tags", () => {
    const created = mockBookmark({
      url: " HTTPS://EXAMPLE.COM:443/a?b=1#section ",
      tags: ["  Work ", "work", "", "Reading"],
    });

    expect(created.url).toBe("https://example.com/a?b=1#section");
    expect([...created.tags]).toEqual(["Work", "Reading"]);

    for (const url of ["/relative/path", "ftp://example.com", "javascript:alert(1)", "not a url"]) {
      expect(() => mockBookmark({ url })).toThrow();
    }
  });

  test("ranks by freshness, recent views, and saturated view count", () => {
    const ranked = rankActiveBookmarks(
      [
        mockBookmark({ id: "stale", createdAt: new Date("2025-12-02T12:00:00.000Z") }),
        mockBookmark({ id: "recent", lastViewedAt: now, viewCount: 1 }),
        mockBookmark({ id: "never-viewed", createdAt: new Date("2026-01-30T12:00:00.000Z") }),
      ],
      now,
    );

    expect(ranked.map(({ id }) => id)).toEqual(["recent", "never-viewed", "stale"]);
  });

  test("orders equal scores by updated time and then stable id", () => {
    const ranked = rankActiveBookmarks(
      [
        mockBookmark({ id: "z", updatedAt: new Date("2026-01-20T12:00:00.000Z") }),
        mockBookmark({ id: "b", updatedAt: new Date("2026-01-20T12:00:00.000Z") }),
        mockBookmark({ id: "newer", updatedAt: new Date("2026-01-21T12:00:00.000Z") }),
      ],
      now,
    );

    expect(ranked.map(({ id }) => id)).toEqual(["newer", "b", "z"]);
  });

  test("orders archived bookmarks newest first without mutating the input", () => {
    const older = mockBookmark({ id: "older", archivedAt: new Date("2026-01-10T12:00:00.000Z") });
    const newer = mockBookmark({ id: "newer", archivedAt: new Date("2026-01-20T12:00:00.000Z") });
    const input = [older, newer];

    expect(sortArchivedBookmarks(input).map(({ id }) => id)).toEqual(["newer", "older"]);
    expect(input).toEqual([older, newer]);
  });

  test("clamps future timestamps when the system clock moves backward", () => {
    const future = new Date("2026-02-01T12:00:00.000Z");
    const ranked = rankActiveBookmarks(
      [
        mockBookmark({
          id: "future",
          createdAt: future,
          updatedAt: new Date("2026-01-20T12:00:00.000Z"),
          lastViewedAt: future,
        }),
        mockBookmark({
          id: "current",
          createdAt: now,
          updatedAt: new Date("2026-01-21T12:00:00.000Z"),
          lastViewedAt: now,
        }),
      ],
      now,
    );

    expect(ranked.map(({ id }) => id)).toEqual(["current", "future"]);
  });
});
