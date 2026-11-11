import { createContext } from "react";

import type { Bookmark } from "@/models";

export type BookmarkDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; bookmark: Bookmark };

export interface BookmarkDialogContextValue {
  state: BookmarkDialogState;
  openCreateDialog: () => void;
  openEditDialog: (bookmark: Bookmark) => void;
  closeDialog: () => void;
}

export const BookmarkDialogContext = createContext<BookmarkDialogContextValue | null>(null);
