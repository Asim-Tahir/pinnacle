import { useContext } from "react";

import { BookmarkDialogContext, type BookmarkDialogContextValue } from "@/contexts/BookmarkDialog";

/**
 * Reads bookmark dialog state and exposes methods to open or close the dialog.
 *
 * This hook must be used within a {@link BookmarkDialogProvider}.
 *
 * @returns The dialog state and its control methods.
 * @throws {Error} If called outside a `BookmarkDialogProvider`.
 *
 * @example
 * ```tsx
 * import { BookmarkDialogProvider } from "@/contexts/BookmarkDialog";
 * import { useBookmarkDialog } from "@/hooks/useBookmarkDialog";
 * import type { Bookmark } from "@/models";
 *
 * function BookmarkDialogActions({ bookmark }: { bookmark: Bookmark }) {
 *   const { state, openCreateDialog, openEditDialog, closeDialog } = useBookmarkDialog();
 *
 *   return (
 *     <>
 *       <button type="button" onClick={openCreateDialog}>Add bookmark</button>
 *       <button type="button" onClick={() => openEditDialog(bookmark)}>Edit bookmark</button>
 *       {state.type !== "closed" && (
 *         <button type="button" onClick={closeDialog}>Close dialog</button>
 *       )}
 *     </>
 *   );
 * }
 *
 * function AppRoot({ bookmark }: { bookmark: Bookmark }) {
 *   return (
 *     <BookmarkDialogProvider>
 *       <BookmarkDialogActions bookmark={bookmark} />
 *     </BookmarkDialogProvider>
 *   );
 * }
 * ```
 */
export function useBookmarkDialog(): BookmarkDialogContextValue {
  const context = useContext(BookmarkDialogContext);

  if (!context) {
    throw new Error("useBookmarkDialog must be used within a BookmarkDialogProvider.");
  }

  return context;
}
