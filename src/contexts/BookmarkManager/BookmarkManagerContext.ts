import { createContext } from "react";

import type { Bookmark, ICreateBookmark, IUpdateBookmark } from "@/models";

export type BookmarkView = "active" | "archived";
export type BookmarkSortMode = "recommended" | "recent" | "name";

export interface BookmarkManagerContextValue {
  bookmarks: Bookmark[];
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
  archiveBookmark: (bookmark: Bookmark) => Promise<void>;
  restoreBookmark: (bookmark: Bookmark) => Promise<void>;
  deleteBookmark: (bookmark: Bookmark) => Promise<void>;
  openBookmark: (bookmark: Bookmark) => Promise<void>;
}

export const BookmarkManagerContext = createContext<BookmarkManagerContextValue | null>(null);
