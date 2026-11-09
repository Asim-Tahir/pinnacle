import { describe, expect, test, vi } from "vitest";

import { BookmarkType } from "@/enums";
import { Bookmark, type IBookmarkSerializable } from "@/models";

import {
  displayBookmark,
  openBookmark,
  rankActiveBookmarks,
  sortArchivedBookmarks,
} from "./bookmark";

const now = "2026-01-31T12:00:00.000Z";

function mockBookmark(overrides: Partial<IBookmarkSerializable> = {}): Bookmark {
  return Bookmark.fromJSON({
    id: "761b55e1-e29a-59d1-94e4-e58ff250d86e",
    type: BookmarkType.Active,
    url: "https://www.google.com/",
    name: "Google",
    description: "",
    tags: [],
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T14:24:34.754Z",
    viewCount: 0,
    lastViewedAt: null,
    archivedAt: null,
    ...overrides,
  });
}

describe("displayBookmark", () => {
  test("returns a trimmed bookmark name", () => {
    expect(displayBookmark(mockBookmark({ name: "  Search  " }))).toBe("Search");
  });

  test("falls back to the URL hostname when the name is empty", () => {
    expect(displayBookmark(mockBookmark({ name: "" }))).toBe("www.google.com");
  });

  test("falls back to the URL hostname when the name contains only whitespace", () => {
    expect(displayBookmark(mockBookmark({ name: "   " }))).toBe("www.google.com");
  });
});

describe("openBookmark", () => {
  function reservedTab() {
    return {
      opener: window,
      location: { href: "about:blank" },
      close: vi.fn(),
    } as unknown as Window;
  }

  test("reserves a protected tab and navigates only after view persistence", async () => {
    const tab = reservedTab();
    const events: string[] = [];
    let finishPersistence!: () => void;
    const persistView = vi.fn(() => {
      events.push("persist");
      return new Promise<void>((resolve) => {
        finishPersistence = resolve;
      });
    });
    const reserveTab = vi.fn(() => {
      events.push("reserve");
      return tab;
    });

    const opening = openBookmark("https://example.com/path", persistView, reserveTab);

    expect(events).toEqual(["reserve", "persist"]);
    expect(tab.opener).toBeNull();
    expect(tab.location.href).toBe("about:blank");

    finishPersistence();
    await expect(opening).resolves.toBe(true);

    expect(tab.location.href).toBe("https://example.com/path");
    expect(events).toEqual(["reserve", "persist"]);
  });

  test("reports a blocked popup only after view persistence", async () => {
    const events: string[] = [];
    const persistView = vi.fn(async () => {
      events.push("persist");
    });
    const reserveTab = vi.fn(() => {
      events.push("reserve");
      return null;
    });

    await expect(openBookmark("https://example.com/", persistView, reserveTab)).resolves.toBe(
      false,
    );

    expect(events).toEqual(["reserve", "persist"]);
  });

  test("closes the reserved tab and does not navigate when persistence fails", async () => {
    const tab = reservedTab();
    const failure = new Error("Storage is unavailable");
    const persistView = vi.fn().mockRejectedValue(failure);

    await expect(openBookmark("https://example.com/", persistView, () => tab)).rejects.toBe(
      failure,
    );

    expect(tab.location.href).toBe("about:blank");
    expect(tab.close).toHaveBeenCalledOnce();
  });
});

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
        mockBookmark({ id: "stale", createdAt: "2025-12-02T12:00:00.000Z" }),
        mockBookmark({ id: "recent", lastViewedAt: now, viewCount: 1 }),
        mockBookmark({ id: "never-viewed", createdAt: "2026-01-30T12:00:00.000Z" }),
      ],
      now,
    );

    expect(ranked.map(({ id }) => id)).toEqual(["recent", "never-viewed", "stale"]);
  });

  test("orders equal scores by updated time and then stable id", () => {
    const ranked = rankActiveBookmarks(
      [
        mockBookmark({ id: "z", updatedAt: "2026-01-20T12:00:00.000Z" }),
        mockBookmark({ id: "b", updatedAt: "2026-01-20T12:00:00.000Z" }),
        mockBookmark({ id: "newer", updatedAt: "2026-01-21T12:00:00.000Z" }),
      ],
      now,
    );

    expect(ranked.map(({ id }) => id)).toEqual(["newer", "b", "z"]);
  });

  test("orders archived bookmarks newest first without mutating the input", () => {
    const older = mockBookmark({ id: "older", archivedAt: "2026-01-10T12:00:00.000Z" });
    const newer = mockBookmark({ id: "newer", archivedAt: "2026-01-20T12:00:00.000Z" });
    const input = [older, newer];

    expect(sortArchivedBookmarks(input).map(({ id }) => id)).toEqual(["newer", "older"]);
    expect(input).toEqual([older, newer]);
  });

  test("clamps future timestamps when the system clock moves backward", () => {
    const future = "2026-02-01T12:00:00.000Z";
    const ranked = rankActiveBookmarks(
      [
        mockBookmark({
          id: "future",
          createdAt: future,
          updatedAt: "2026-01-20T12:00:00.000Z",
          lastViewedAt: future,
        }),
        mockBookmark({
          id: "current",
          createdAt: now,
          updatedAt: "2026-01-21T12:00:00.000Z",
          lastViewedAt: now,
        }),
      ],
      now,
    );

    expect(ranked.map(({ id }) => id)).toEqual(["current", "future"]);
  });
});
