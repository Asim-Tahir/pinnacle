import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import BookmarkWebMCPTools, {
  type BookmarkWebMCPToolArgsMap,
  type BookmarkWebMCPToolNames,
} from "@/components/BookmarkWebMCPTools";
import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import type {
  DocumentWithModelContext,
  ModelContext,
  WebMCPToolDescriptor,
  WebMCPToolResponse,
} from "@/hooks/useWebMCP";
import type { ICreateBookmark } from "@/models";

const tools = new Map<string, WebMCPToolDescriptor<unknown>>();
const testDocument = document as DocumentWithModelContext;

const modelContext: ModelContext = {
  registerTool<Args>(descriptor: WebMCPToolDescriptor<Args>) {
    tools.set(descriptor.name, {
      name: descriptor.name,
      description: descriptor.description,
      inputSchema: descriptor.inputSchema,
      annotations: descriptor.annotations,
      execute: (args) => descriptor.execute(args as Args),
    });
  },
};

async function runTool<
  Name extends BookmarkWebMCPToolNames,
  Args extends BookmarkWebMCPToolArgsMap[Name],
>(name: Name, args: Args): Promise<WebMCPToolResponse> {
  const tool = tools.get(name);
  if (!tool) throw new Error(`Tool "${name}" was not registered.`);
  return tool.execute(args);
}

function parseResult(response: WebMCPToolResponse) {
  const text = response.content[0]?.text;
  if (text === undefined) throw new Error("Tool returned no text result.");
  return JSON.parse(text) as unknown;
}

async function seedBookmark(overrides: Partial<ICreateBookmark> = {}) {
  return useBookmarkStore.getState().createBookmark({
    url: "https://example.com",
    name: "Example",
    description: "A useful site",
    tags: ["Work"],
    ...overrides,
  });
}

beforeEach(() => {
  tools.clear();
  useBookmarkStore.setState({ bookmarks: [], hydrated: true, persistenceError: null });
  localStorage.clear();
  Object.defineProperty(testDocument, "modelContext", {
    configurable: true,
    value: modelContext,
  });
});

afterEach(() => {
  Reflect.deleteProperty(testDocument, "modelContext");
  useBookmarkStore.setState({ bookmarks: [], hydrated: true, persistenceError: null });
  localStorage.clear();
  vi.restoreAllMocks();
});

test("registers the local bookmark tools", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);

  expect([...tools.keys()]).toEqual([
    "list_bookmarks",
    "create_bookmark",
    "update_bookmark",
    "partial_update_bookmark",
    "archive_bookmark",
    "restore_bookmark",
    "delete_bookmark",
    "open_bookmark",
  ]);
  screen.unmount();
});

test("creates a bookmark", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const createdResponse = await runTool("create_bookmark", {
    url: "https://example.com",
    name: "Example",
    description: "A useful site",
    tags: ["Work"],
  });
  const created = parseResult(createdResponse) as { id: string; name: string };

  expect(createdResponse.isError).toBeUndefined();
  expect(created.name).toBe("Example");
  expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
  screen.unmount();
});

test("updates a bookmark", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const bookmark = await seedBookmark();

  const updatedResponse = await runTool("update_bookmark", {
    bookmarkId: bookmark.id,
    url: "https://updated.example",
    name: "Updated",
    description: "Updated note",
    tags: ["Updated"],
  });
  const updated = parseResult(updatedResponse) as {
    url: string;
    name: string;
    description: string;
  };

  expect(updatedResponse.isError).toBeUndefined();
  expect(updated.url).toBe("https://updated.example/");
  expect(updated.name).toBe("Updated");
  expect(updated.description).toBe("Updated note");
  screen.unmount();
});

test("partially updates a bookmark", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const bookmark = await seedBookmark();

  const response = await runTool("partial_update_bookmark", {
    bookmarkId: bookmark.id,
    description: "Updated note",
  });
  const updated = parseResult(response) as { description: string; name: string };

  expect(response.isError).toBeUndefined();
  expect(updated.description).toBe("Updated note");
  expect(updated.name).toBe("Example");
  screen.unmount();
});

test("archives a bookmark", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const bookmark = await seedBookmark();

  const response = await runTool("archive_bookmark", { bookmarkId: bookmark.id });
  const archived = parseResult(response) as { archivedAt: string | null };

  expect(response.isError).toBeUndefined();
  expect(archived.archivedAt).not.toBeNull();
  screen.unmount();
});

test("restores an archived bookmark", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const bookmark = await seedBookmark();
  await useBookmarkStore.getState().archiveBookmark(bookmark.id);

  const response = await runTool("restore_bookmark", { bookmarkId: bookmark.id });
  const restored = parseResult(response) as { archivedAt: string | null };

  expect(response.isError).toBeUndefined();
  expect(restored.archivedAt).toBeNull();
  screen.unmount();
});

test("lists and searches bookmarks", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const matching = await seedBookmark({ description: "A useful site" });
  await seedBookmark({ url: "https://another.example", name: "Another" });
  await useBookmarkStore.getState().archiveBookmark(matching.id);

  const response = await runTool("list_bookmarks", {
    status: "archived",
    query: "useful",
  });
  const listed = parseResult(response) as Array<{ id: string; archivedAt: string | null }>;

  expect(response.isError).toBeUndefined();
  expect(listed).toHaveLength(1);
  expect(listed[0].id).toBe(matching.id);
  expect(listed[0].archivedAt).not.toBeNull();
  screen.unmount();
});

test("rejects deletion without explicit confirmation", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const bookmark = await seedBookmark();

  const response = await runTool("delete_bookmark", {
    bookmarkId: bookmark.id,
    confirm: false,
  });

  expect(response.isError).toBe(true);
  expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
  screen.unmount();
});

test("deletes a bookmark after explicit confirmation", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const bookmark = await seedBookmark();

  const response = await runTool("delete_bookmark", {
    bookmarkId: bookmark.id,
    confirm: true,
  });

  expect(response.isError).toBeUndefined();
  expect(parseResult(response)).toEqual({ deleted: true, bookmarkId: bookmark.id });
  expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
  screen.unmount();
});

test("opening records the view and reports when the browser blocks a new tab", async () => {
  const screen = await page.render(<BookmarkWebMCPTools />);
  const bookmark = await seedBookmark();
  vi.spyOn(window, "open").mockReturnValue(null);

  const response = await runTool("open_bookmark", { bookmarkId: bookmark.id });
  const result = parseResult(response) as { opened: boolean; url: string };

  expect(response.isError).toBeUndefined();
  expect(result).toEqual({
    opened: false,
    url: "https://example.com/",
    message: expect.any(String),
  });
  expect(useBookmarkStore.getState().bookmarks[0].viewCount).toBe(1);
  expect(useBookmarkStore.getState().bookmarks[0].lastViewedAt).toBeInstanceOf(Date);
  screen.unmount();
});
