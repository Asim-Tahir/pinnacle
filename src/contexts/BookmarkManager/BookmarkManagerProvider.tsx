import { useEffect, useMemo, useState } from "react";

import {
  BookmarkManagerContext,
  type BookmarkActionResult,
  type BookmarkManagerContextValue,
  type BookmarkSortMode,
  type BookmarkView,
} from "@/contexts/BookmarkManager";
import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import type { Bookmark } from "@/models";
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

  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const hydrated = useBookmarkStore((state) => state.hydrated);
  const persistenceError = useBookmarkStore((state) => state.persistenceError);
  const hydrate = useBookmarkStore((state) => state.hydrate);
  const createBookmark = useBookmarkStore((state) => state.createBookmark);
  const updateBookmark = useBookmarkStore((state) => state.updateBookmark);
  const partialUpdateBookmark = useBookmarkStore((state) => state.partialUpdateBookmark);
  const archive = useBookmarkStore((state) => state.archiveBookmark);
  const restore = useBookmarkStore((state) => state.restoreBookmark);
  const remove = useBookmarkStore((state) => state.deleteBookmark);
  const viewBookmark = useBookmarkStore((state) => state.viewBookmark);

  useEffect(() => {
    void hydrate().catch(() => undefined);
  }, [hydrate]);

  const activeBookmarks = useMemo(
    () => bookmarks.filter((bookmark) => bookmark.archivedAt === null),
    [bookmarks],
  );

  const archivedBookmarks = useMemo(
    () => bookmarks.filter((bookmark) => bookmark.archivedAt !== null),
    [bookmarks],
  );

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

  async function runAction<T>(action: () => Promise<T>): Promise<BookmarkActionResult<T>> {
    setActionError("");
    try {
      return { success: true, value: await action() };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update bookmarks.";
      setActionError(message);
      return { success: false, error: message };
    }
  }

  function archiveBookmark(bookmark: Bookmark) {
    return runAction(() => archive(bookmark.id));
  }

  function restoreBookmark(bookmark: Bookmark) {
    return runAction(() => restore(bookmark.id));
  }

  function deleteBookmark(bookmark: Bookmark) {
    return runAction(() => remove(bookmark.id));
  }

  function openBookmark(bookmark: Bookmark) {
    setBlockedUrl("");

    return runAction(async () => {
      const url = bookmark.url.toString();
      const opened = await openBookmarkTab(url, () => viewBookmark(bookmark.id));
      if (!opened) setBlockedUrl(url);
      return { opened, url };
    });
  }

  const value: BookmarkManagerContextValue = {
    bookmarks,
    activeBookmarks,
    archivedBookmarks,
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
