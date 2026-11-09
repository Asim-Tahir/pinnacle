import { Bookmark } from "@/models";

import { compareDates, elapsedDays, toDate } from "./date";

/**
 * Scores a bookmark by freshness, recent use, and accumulated views.
 * Future timestamps are treated as having zero elapsed time.
 *
 * @param bookmark Persisted fields used to calculate the score.
 * @param now Current time in milliseconds since the Unix epoch.
 * @returns A score in the range [0, 1) when the view count is non-negative.
 */
function scoreBookmark(bookmark: Bookmark, now: number): number {
  const freshness = Math.exp(-elapsedDays(bookmark.createdAt, now) / 30);
  const recentUse = bookmark.lastViewedAt
    ? Math.exp(-elapsedDays(bookmark.lastViewedAt, now) / 14)
    : 0;
  const accumulatedViews = bookmark.viewCount / (bookmark.viewCount + 5);

  return 0.45 * freshness + 0.35 * recentUse + 0.2 * accumulatedViews;
}

/**
 * Returns active bookmarks ordered by score, then update time, creation time, and ID.
 * Future timestamps are treated as having zero elapsed time when calculating scores.
 *
 * @param bookmarks Bookmarks to rank; archived bookmarks are excluded.
 * @param now Time used to calculate scores. Defaults to the current time.
 * @returns A new array of active bookmarks in ranking order.
 */
export function rankActiveBookmarks(
  bookmarks: readonly Bookmark[],
  now: Date | string | number = new Date(),
): Bookmark[] {
  const timestamp = toDate(now).getTime();

  return bookmarks
    .filter((bookmark) => bookmark.archivedAt === null)
    .toSorted(
      (left, right) =>
        scoreBookmark(right, timestamp) - scoreBookmark(left, timestamp) ||
        (left.updatedAt && right.updatedAt && compareDates(left.updatedAt, right.updatedAt)) ||
        compareDates(left.createdAt, right.createdAt) ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    );
}

/**
 * Returns archived bookmarks newest first, with IDs ascending for equal archive times.
 *
 * @param bookmarks Bookmarks to sort; active bookmarks are excluded.
 * @returns A new array of archived bookmarks without changing the input array.
 */
export function sortArchivedBookmarks(bookmarks: readonly Bookmark[]): Bookmark[] {
  return bookmarks
    .filter((bookmark) => bookmark.archivedAt !== null)
    .toSorted(
      (left, right) =>
        compareDates(left.archivedAt!, right.archivedAt!) ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    );
}
