import { createContext } from "react";

import type { Bookmark, ICreateBookmark, IUpdateBookmark } from "@/models";

export type BookmarkView = "active" | "archived";
export type BookmarkSortMode = "recommended" | "recent" | "name";

export type BookmarkActionResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

export interface BookmarkManagerContextValue {
  bookmarks: Bookmark[];
  activeBookmarks: Bookmark[];
  archivedBookmarks: Bookmark[];
  visibleBookmarks: Bookmark[];
  tagCounts: [string, number][];
  hydrated: boolean;
  persistenceError: string | null;
  view: BookmarkView;
  query: string;
  selectedTags: string[];
  sortMode: BookmarkSortMode;
  actionError: string;
  blockedUrl: string;
  setView: (view: BookmarkView) => void;
  setQuery: (query: string) => void;
  setSortMode: (sortMode: BookmarkSortMode) => void;
  toggleTag: (tag: string) => void;
  clearSelectedTags: () => void;
  createBookmark: (data: ICreateBookmark) => Promise<Bookmark>;
  updateBookmark: (id: string, data: IUpdateBookmark) => Promise<Bookmark>;
  partialUpdateBookmark: (id: string, data: Partial<IUpdateBookmark>) => Promise<Bookmark>;
  archiveBookmark: (bookmark: Bookmark) => Promise<BookmarkActionResult<Bookmark>>;
  restoreBookmark: (bookmark: Bookmark) => Promise<BookmarkActionResult<Bookmark>>;
  deleteBookmark: (bookmark: Bookmark) => Promise<BookmarkActionResult<void>>;
  openBookmark: (
    bookmark: Bookmark,
  ) => Promise<BookmarkActionResult<{ opened: boolean; url: string }>>;
}

export const BookmarkManagerContext = createContext<BookmarkManagerContextValue | null>(null);
