import { useEffect, useMemo, useState } from "react";

import {
  BookmarkManagerContext,
  type BookmarkManagerContextValue,
  type BookmarkSortMode,
  type BookmarkView,
} from "@/contexts/BookmarkManager";
import type { Bookmark } from "@/models";
import { useBookmarksStore } from "@/store/bookmarks";
import {
  displayBookmark,
  openBookmark as openBookmarkTab,
  rankActiveBookmarks,
  sortArchivedBookmarks,
} from "@/utils/bookmark";

export function BookmarkManagerProvider({ children }: React.PropsWithChildren) {
  const [view, setViewState] = useState<BookmarkView>("active");
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<BookmarkSortMode>("recommended");
  const [actionError, setActionError] = useState("");
  const [blockedUrl, setBlockedUrl] = useState("");

  const bookmarks = useBookmarksStore((state) => state.bookmarks);
  const hydrated = useBookmarksStore((state) => state.hydrated);
  const persistenceError = useBookmarksStore((state) => state.persistenceError);
  const hydrate = useBookmarksStore((state) => state.hydrate);
  const createBookmark = useBookmarksStore((state) => state.createBookmark);
  const updateBookmark = useBookmarksStore((state) => state.updateBookmark);
  const partialUpdateBookmark = useBookmarksStore((state) => state.partialUpdateBookmark);
  const archive = useBookmarksStore((state) => state.archiveBookmark);
  const restore = useBookmarksStore((state) => state.restoreBookmark);
  const remove = useBookmarksStore((state) => state.deleteBookmark);
  const viewBookmark = useBookmarksStore((state) => state.viewBookmark);

  useEffect(() => {
    void hydrate().catch(() => undefined);
  }, [hydrate]);

  const visibleBookmarks = useMemo(() => {
    let result =
      view === "active" ? rankActiveBookmarks(bookmarks) : sortArchivedBookmarks(bookmarks);

    if (view === "active" && sortMode === "name") {
      result = result.toSorted((left, right) =>
        displayBookmark(left).localeCompare(displayBookmark(right)),
      );
    } else if (view === "active" && sortMode === "recent") {
      result = result.toSorted(
        (left, right) => (right.lastViewedAt?.getTime() ?? 0) - (left.lastViewedAt?.getTime() ?? 0),
      );
    }

    const normalizedQuery = query.trim().toLocaleLowerCase();
    return result.filter((bookmark) => {
      const matchesQuery =
        !normalizedQuery ||
        [displayBookmark(bookmark), bookmark.url.toString(), bookmark.description, ...bookmark.tags]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      const matchesTags = selectedTags.every((tag) => bookmark.tags.has(tag));
      return matchesQuery && matchesTags;
    });
  }, [bookmarks, query, selectedTags, sortMode, view]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bookmark of bookmarks) {
      if ((bookmark.archivedAt !== null) !== (view === "archived")) continue;
      for (const tag of bookmark.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts].toSorted(([left], [right]) => left.localeCompare(right));
  }, [bookmarks, view]);

  function setView(nextView: BookmarkView) {
    setViewState(nextView);
    setSelectedTags([]);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag],
    );
  }

  async function runAction(action: () => Promise<unknown>) {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update bookmarks.");
    }
  }

  async function archiveBookmark(bookmark: Bookmark) {
    await runAction(() => archive(bookmark.id));
  }

  async function restoreBookmark(bookmark: Bookmark) {
    await runAction(() => restore(bookmark.id));
  }

  async function deleteBookmark(bookmark: Bookmark) {
    if (!window.confirm(`Permanently delete “${displayBookmark(bookmark)}”?`)) return;
    await runAction(() => remove(bookmark.id));
  }

  async function openBookmark(bookmark: Bookmark) {
    setActionError("");
    setBlockedUrl("");

    try {
      const url = bookmark.url.toString();
      const opened = await openBookmarkTab(url, () => viewBookmark(bookmark.id));
      if (!opened) setBlockedUrl(url);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to open this bookmark.");
    }
  }

  const value: BookmarkManagerContextValue = {
    bookmarks,
    visibleBookmarks,
    tagCounts,
    hydrated,
    persistenceError,
    view,
    query,
    selectedTags,
    sortMode,
    actionError,
    blockedUrl,
    setView,
    setQuery,
    setSortMode,
    toggleTag,
    clearSelectedTags: () => setSelectedTags([]),
    createBookmark,
    updateBookmark,
    partialUpdateBookmark,
    archiveBookmark,
    restoreBookmark,
    deleteBookmark,
    openBookmark,
  };

  return (
    <BookmarkManagerContext.Provider value={value}>{children}</BookmarkManagerContext.Provider>
  );
}
