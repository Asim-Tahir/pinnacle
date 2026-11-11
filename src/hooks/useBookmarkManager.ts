import { useContext } from "react";

import {
  BookmarkManagerContext,
  type BookmarkManagerContextValue,
} from "@/contexts/BookmarkManager";

export function useBookmarkManager(): BookmarkManagerContextValue {
  const context = useContext(BookmarkManagerContext);

  if (!context) {
    throw new Error("useBookmarkManager must be used within a BookmarkManagerProvider.");
  }

  return context;
}
