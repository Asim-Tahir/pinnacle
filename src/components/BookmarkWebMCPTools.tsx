import { useWebMCP } from "@mcp-b/react-webmcp";
import { useEffect } from "react";

import type { BookmarkActionResult } from "@/contexts/BookmarkManager";
import { useBookmarkManager } from "@/hooks/useBookmarkManager";
import type { Bookmark, ICreateBookmark, IUpdateBookmark } from "@/models";
import {
  bookmarkIdInputSchema,
  createBookmarkInputSchema,
  deleteBookmarkInputSchema,
  listBookmarksInputSchema,
  partialUpdateBookmarkInputSchema,
  updateBookmarkInputSchema,
  type ArchiveBookmarkInputSchema,
  type CreateBookmarkInputSchema,
  type DeleteBookmarkInputSchema,
  type ListBookmarksInputSchema,
  type OpenBookmarkInputSchema,
  type PartialUpdateBookmarkInputSchema,
  type RestoreBookmarkInputSchema,
  type UpdateBookmarkInputSchema,
} from "@/schemas/webmcp";
import { rankActiveBookmarks, sortArchivedBookmarks } from "@/utils/bookmark";

export interface BookmarkWebMCPToolInputMap {
  list_bookmarks: ListBookmarksInputSchema;
  create_bookmark: CreateBookmarkInputSchema;
  update_bookmark: UpdateBookmarkInputSchema;
  partial_update_bookmark: PartialUpdateBookmarkInputSchema;
  archive_bookmark: ArchiveBookmarkInputSchema;
  restore_bookmark: RestoreBookmarkInputSchema;
  delete_bookmark: DeleteBookmarkInputSchema;
  open_bookmark: OpenBookmarkInputSchema;
}

export type BookmarkWebMCPToolNames = keyof BookmarkWebMCPToolInputMap;

function getHydratedBookmarks(bookmarks: Bookmark[], hydrated: boolean): Bookmark[] {
  if (!hydrated) {
    throw new Error("Bookmarks are still loading. Try again after they finish loading.");
  }

  return bookmarks;
}

function findBookmark(bookmarks: Bookmark[], bookmarkId: string): Bookmark {
  const bookmark = bookmarks.find((item) => item.id === bookmarkId);
  if (!bookmark) {
    throw new Error("Bookmark not found.");
  }

  return bookmark;
}

function unwrapAction<T>(result: BookmarkActionResult<T>): T {
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.value;
}

export default function BookmarkWebMCPTools() {
  const manager = useBookmarkManager();
  const { bookmarks, hydrated } = manager;

  const listTool = useWebMCP({
    name: "list_bookmarks",
    description: "List and search bookmarks in the local library.",
    inputSchema: listBookmarksInputSchema,
    annotations: { readOnlyHint: true },
    execute: ({ query = "", status = "all" }) => {
      const currentBookmarks = getHydratedBookmarks(bookmarks, hydrated);
      const ordered =
        status === "active"
          ? rankActiveBookmarks(currentBookmarks)
          : status === "archived"
            ? sortArchivedBookmarks(currentBookmarks)
            : [
                ...rankActiveBookmarks(currentBookmarks),
                ...sortArchivedBookmarks(currentBookmarks),
              ];

      return ordered
        .filter((bookmark) => {
          if (!query) return true;
          const searchable = [
            bookmark.name,
            bookmark.url.toString(),
            bookmark.description,
            ...bookmark.tags,
          ]
            .join(" ")
            .toLocaleLowerCase();
          return searchable.includes(query.toLocaleLowerCase());
        })
        .map((bookmark) => bookmark.toJSON());
    },
  });

  const createTool = useWebMCP({
    name: "create_bookmark",
    description: "Create a bookmark in the local library.",
    inputSchema: createBookmarkInputSchema,
    execute: async ({ url, name, description, tags }) => {
      const data: ICreateBookmark = {
        url,
        name: name ?? "",
        description: description ?? "",
        tags: tags ?? [],
      };

      return (await manager.createBookmark(data)).toJSON();
    },
  });

  const updateTool = useWebMCP({
    name: "update_bookmark",
    description: "Replace all editable fields on an active bookmark.",
    inputSchema: updateBookmarkInputSchema,
    execute: async ({ bookmarkId, url, name, description, tags }) => {
      const data: IUpdateBookmark = { url, name, description, tags };
      return (await manager.updateBookmark(bookmarkId, data)).toJSON();
    },
  });

  const partialUpdateTool = useWebMCP({
    name: "partial_update_bookmark",
    description: "Update one or more editable fields on an active bookmark.",
    inputSchema: partialUpdateBookmarkInputSchema,
    execute: async ({ bookmarkId, ...data }) =>
      (await manager.partialUpdateBookmark(bookmarkId, data)).toJSON(),
  });

  const archiveTool = useWebMCP({
    name: "archive_bookmark",
    description: "Archive a bookmark so it no longer appears in the active library.",
    inputSchema: bookmarkIdInputSchema,
    execute: async ({ bookmarkId }) => {
      const bookmark = findBookmark(getHydratedBookmarks(bookmarks, hydrated), bookmarkId);
      return unwrapAction(await manager.archiveBookmark(bookmark)).toJSON();
    },
  });

  const restoreTool = useWebMCP({
    name: "restore_bookmark",
    description: "Restore an archived bookmark to the active library.",
    inputSchema: bookmarkIdInputSchema,
    execute: async ({ bookmarkId }) => {
      const bookmark = findBookmark(getHydratedBookmarks(bookmarks, hydrated), bookmarkId);
      return unwrapAction(await manager.restoreBookmark(bookmark)).toJSON();
    },
  });

  const deleteTool = useWebMCP({
    name: "delete_bookmark",
    description: "Permanently delete a bookmark. Requires confirm: true.",
    inputSchema: deleteBookmarkInputSchema,
    annotations: { destructiveHint: true },
    execute: async ({ bookmarkId }) => {
      const bookmark = findBookmark(getHydratedBookmarks(bookmarks, hydrated), bookmarkId);
      unwrapAction(await manager.deleteBookmark(bookmark));
      return { deleted: true, bookmarkId };
    },
  });

  const openTool = useWebMCP({
    name: "open_bookmark",
    description: "Open a bookmark in a new tab and persist its view statistics before navigating.",
    inputSchema: bookmarkIdInputSchema,
    execute: async ({ bookmarkId }) => {
      const bookmark = findBookmark(getHydratedBookmarks(bookmarks, hydrated), bookmarkId);
      const { opened, url } = unwrapAction(await manager.openBookmark(bookmark));

      return {
        opened,
        url,
        message: opened
          ? "Bookmark opened in a new tab."
          : "View recorded, but the browser did not open a new tab. Use the returned URL to open it.",
      };
    },
  });

  useEffect(() => {
    for (const [name, error] of [
      ["list_bookmarks", listTool.registrationError],
      ["create_bookmark", createTool.registrationError],
      ["update_bookmark", updateTool.registrationError],
      ["partial_update_bookmark", partialUpdateTool.registrationError],
      ["archive_bookmark", archiveTool.registrationError],
      ["restore_bookmark", restoreTool.registrationError],
      ["delete_bookmark", deleteTool.registrationError],
      ["open_bookmark", openTool.registrationError],
    ] as const) {
      if (error) console.error(`Failed to register WebMCP tool "${name}".`, error);
    }
  }, [
    archiveTool.registrationError,
    createTool.registrationError,
    deleteTool.registrationError,
    listTool.registrationError,
    openTool.registrationError,
    partialUpdateTool.registrationError,
    restoreTool.registrationError,
    updateTool.registrationError,
  ]);

  return null;
}
