import { useEffect } from "react";

import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import { useWebMCP } from "@/hooks/useWebMCP";
import type { ICreateBookmark, IUpdateBookmark } from "@/models";
import {
  openBookmark as openBookmarkTab,
  rankActiveBookmarks,
  sortArchivedBookmarks,
} from "@/utils/bookmark";

export interface BookmarkIdArgs {
  bookmarkId: string;
}

export interface ListBookmarksArgs {
  query?: string;
  status?: "all" | "active" | "archived";
}

export interface CreateBookmarkArgs extends ICreateBookmark {}

export interface UpdateBookmarkArgs extends BookmarkIdArgs, IUpdateBookmark {}

export interface PartialUpdateBookmarkArgs extends BookmarkIdArgs, Partial<IUpdateBookmark> {}

export interface ArchiveBookmarkArgs extends BookmarkIdArgs {}

export interface RestoreBookmarkArgs extends BookmarkIdArgs {}

export interface DeleteBookmarkArgs extends BookmarkIdArgs {
  confirm: boolean;
}

export interface OpenBookmarkArgs extends BookmarkIdArgs {}

export interface BookmarkWebMCPToolArgsMap {
  list_bookmarks: ListBookmarksArgs;
  create_bookmark: CreateBookmarkArgs;
  update_bookmark: UpdateBookmarkArgs;
  partial_update_bookmark: PartialUpdateBookmarkArgs;
  archive_bookmark: ArchiveBookmarkArgs;
  restore_bookmark: RestoreBookmarkArgs;
  delete_bookmark: DeleteBookmarkArgs;
  open_bookmark: OpenBookmarkArgs;
}

export type BookmarkWebMCPToolNames = keyof BookmarkWebMCPToolArgsMap;

function getArguments(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Tool arguments must be an object.");
  }

  return value as Record<string, unknown>;
}

function requiredString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} must be a non-empty string.`);
  }

  return value.trim();
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${key} must be a string.`);
  }

  return value;
}

function requiredFieldString(args: Record<string, unknown>, key: string): string {
  const value = optionalString(args, key);
  if (value === undefined) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function optionalTags(args: Record<string, unknown>): string[] | undefined {
  const value = args.tags;
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((tag) => typeof tag === "string")) {
    throw new Error("tags must be an array of strings.");
  }

  return value;
}

function requiredTags(args: Record<string, unknown>): string[] {
  const tags = optionalTags(args);
  if (tags === undefined) {
    throw new Error("tags is required.");
  }

  return tags;
}

function getHydratedState() {
  const state = useBookmarkStore.getState();
  if (!state.hydrated) {
    throw new Error("Bookmarks are still loading. Try again after they finish loading.");
  }

  return state;
}

function findBookmark(bookmarkId: string) {
  const bookmark = getHydratedState().bookmarks.find((item) => item.id === bookmarkId);
  if (!bookmark) {
    throw new Error("Bookmark not found.");
  }

  return bookmark;
}

function bookmarkIdSchema() {
  return {
    type: "object",
    properties: {
      bookmarkId: { type: "string", description: "The bookmark's stable ID." },
    },
    required: ["bookmarkId"],
    additionalProperties: false,
  };
}

const listBookmarksSchema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Text to match against bookmark fields." },
    status: {
      type: "string",
      enum: ["all", "active", "archived"],
      description: "Which bookmarks to include. Defaults to all.",
    },
  },
  additionalProperties: false,
};

const createBookmarkSchema = {
  type: "object",
  properties: {
    url: { type: "string", description: "An absolute HTTP or HTTPS URL." },
    name: { type: "string", description: "Optional display name." },
    description: { type: "string", description: "Optional note." },
    tags: { type: "array", items: { type: "string" }, description: "Optional tags." },
  },
  required: ["url"],
  additionalProperties: false,
};

const updateBookmarkSchema = {
  type: "object",
  properties: {
    bookmarkId: { type: "string", description: "The bookmark's stable ID." },
    url: { type: "string", description: "Replacement absolute HTTP or HTTPS URL." },
    name: { type: "string", description: "Replacement display name." },
    description: { type: "string", description: "Replacement note." },
    tags: { type: "array", items: { type: "string" }, description: "Replacement tags." },
  },
  required: ["bookmarkId", "url", "name", "description", "tags"],
  additionalProperties: false,
};

const partialUpdateBookmarkSchema = {
  type: "object",
  properties: {
    bookmarkId: { type: "string", description: "The bookmark's stable ID." },
    url: { type: "string", description: "Replacement absolute HTTP or HTTPS URL." },
    name: { type: "string", description: "Replacement display name." },
    description: { type: "string", description: "Replacement note." },
    tags: { type: "array", items: { type: "string" }, description: "Replacement tags." },
  },
  required: ["bookmarkId"],
  additionalProperties: false,
};

const deleteBookmarkSchema = {
  type: "object",
  properties: {
    bookmarkId: { type: "string", description: "The bookmark's stable ID." },
    confirm: {
      type: "boolean",
      const: true,
      description: "Must be true to confirm permanent deletion.",
    },
  },
  required: ["bookmarkId", "confirm"],
  additionalProperties: false,
};

export default function BookmarkWebMCPTools() {
  const createBookmark = useBookmarkStore((state) => state.createBookmark);
  const updateBookmark = useBookmarkStore((state) => state.updateBookmark);
  const partialUpdateBookmark = useBookmarkStore((state) => state.partialUpdateBookmark);
  const archiveBookmark = useBookmarkStore((state) => state.archiveBookmark);
  const restoreBookmark = useBookmarkStore((state) => state.restoreBookmark);
  const deleteBookmark = useBookmarkStore((state) => state.deleteBookmark);
  const viewBookmark = useBookmarkStore((state) => state.viewBookmark);

  const listTool = useWebMCP<ListBookmarksArgs>({
    name: "list_bookmarks",
    description: "List and search bookmarks in the local library.",
    inputSchema: listBookmarksSchema,
    annotations: { readOnlyHint: true },
    execute: (args) => {
      const values = getArguments(args);
      const query = optionalString(values, "query")?.trim().toLocaleLowerCase() ?? "";
      const status = values.status ?? "all";
      if (status !== "all" && status !== "active" && status !== "archived") {
        throw new Error("status must be all, active, or archived.");
      }

      const bookmarks = getHydratedState().bookmarks;
      const ordered =
        status === "active"
          ? rankActiveBookmarks(bookmarks)
          : status === "archived"
            ? sortArchivedBookmarks(bookmarks)
            : [...rankActiveBookmarks(bookmarks), ...sortArchivedBookmarks(bookmarks)];

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
          return searchable.includes(query);
        })
        .map((bookmark) => bookmark.toJSON());
    },
  });

  const createTool = useWebMCP<CreateBookmarkArgs>({
    name: "create_bookmark",
    description: "Create a bookmark in the local library.",
    inputSchema: createBookmarkSchema,
    execute: async (args) => {
      const values = getArguments(args);
      const data: ICreateBookmark = {
        url: requiredString(values, "url"),
        name: optionalString(values, "name") ?? "",
        description: optionalString(values, "description") ?? "",
        tags: optionalTags(values) ?? [],
      };

      return (await createBookmark(data)).toJSON();
    },
  });

  const updateTool = useWebMCP<UpdateBookmarkArgs>({
    name: "update_bookmark",
    description: "Replace all editable fields on an active bookmark.",
    inputSchema: updateBookmarkSchema,
    execute: async (args) => {
      const values = getArguments(args);
      const bookmarkId = requiredString(values, "bookmarkId");
      const data: IUpdateBookmark = {
        url: requiredString(values, "url"),
        name: requiredFieldString(values, "name"),
        description: requiredFieldString(values, "description"),
        tags: requiredTags(values),
      };

      return (await updateBookmark(bookmarkId, data)).toJSON();
    },
  });

  const partialUpdateTool = useWebMCP<PartialUpdateBookmarkArgs>({
    name: "partial_update_bookmark",
    description: "Update one or more editable fields on an active bookmark.",
    inputSchema: partialUpdateBookmarkSchema,
    execute: async (args) => {
      const values = getArguments(args);
      const bookmarkId = requiredString(values, "bookmarkId");
      const data: Partial<IUpdateBookmark> = {};
      const url = optionalString(values, "url");
      const name = optionalString(values, "name");
      const description = optionalString(values, "description");
      const tags = optionalTags(values);

      if (url !== undefined) data.url = url;
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (tags !== undefined) data.tags = tags;
      if (Object.keys(data).length === 0) {
        throw new Error("Provide at least one field to update.");
      }

      return (await partialUpdateBookmark(bookmarkId, data)).toJSON();
    },
  });

  const archiveTool = useWebMCP<BookmarkIdArgs>({
    name: "archive_bookmark",
    description: "Archive a bookmark so it no longer appears in the active library.",
    inputSchema: bookmarkIdSchema(),
    execute: async (args) => {
      const bookmarkId = requiredString(getArguments(args), "bookmarkId");
      return (await archiveBookmark(bookmarkId)).toJSON();
    },
  });

  const restoreTool = useWebMCP<BookmarkIdArgs>({
    name: "restore_bookmark",
    description: "Restore an archived bookmark to the active library.",
    inputSchema: bookmarkIdSchema(),
    execute: async (args) => {
      const bookmarkId = requiredString(getArguments(args), "bookmarkId");
      return (await restoreBookmark(bookmarkId)).toJSON();
    },
  });

  const deleteTool = useWebMCP<DeleteBookmarkArgs>({
    name: "delete_bookmark",
    description: "Permanently delete a bookmark. Requires confirm: true.",
    inputSchema: deleteBookmarkSchema,
    execute: async (args) => {
      const values = getArguments(args);
      const bookmarkId = requiredString(values, "bookmarkId");
      if (values.confirm !== true) {
        throw new Error("Permanent deletion requires confirm: true.");
      }

      findBookmark(bookmarkId);
      await deleteBookmark(bookmarkId);
      return { deleted: true, bookmarkId };
    },
  });

  const openTool = useWebMCP<BookmarkIdArgs>({
    name: "open_bookmark",
    description: "Open a bookmark in a new tab and persist its view statistics before navigating.",
    inputSchema: bookmarkIdSchema(),
    execute: async (args) => {
      const bookmarkId = requiredString(getArguments(args), "bookmarkId");
      const bookmark = findBookmark(bookmarkId);
      const url = bookmark.url.toString();
      const opened = await openBookmarkTab(url, () => viewBookmark(bookmarkId));

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
      ["list_bookmarks", listTool.error],
      ["create_bookmark", createTool.error],
      ["update_bookmark", updateTool.error],
      ["partial_update_bookmark", partialUpdateTool.error],
      ["archive_bookmark", archiveTool.error],
      ["restore_bookmark", restoreTool.error],
      ["delete_bookmark", deleteTool.error],
      ["open_bookmark", openTool.error],
    ] as const) {
      if (error) console.error(`Failed to register WebMCP tool "${name}".`, error);
    }
  }, [
    archiveTool.error,
    createTool.error,
    deleteTool.error,
    listTool.error,
    openTool.error,
    partialUpdateTool.error,
    restoreTool.error,
    updateTool.error,
  ]);

  return null;
}
