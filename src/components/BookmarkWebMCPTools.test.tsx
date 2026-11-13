import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import BookmarkWebMCPTools, {
  type BookmarkWebMCPToolInputMap,
  type BookmarkWebMCPToolNames,
} from "@/components/BookmarkWebMCPTools";
import { BookmarkManagerProvider } from "@/contexts/BookmarkManager";
import { useBookmarkStore } from "@/hooks/useBookmarkStore";
import type { ICreateBookmark } from "@/models";
import type { WebMCP } from "@mcp-b/react-webmcp";

const tools = new Map<string, WebMCP.ModelContextTool>();

const modelContext = {
  __isBrowserMcpServer: true,
  async registerTool(
    tool: WebMCP.ModelContextTool,
    options?: WebMCP.ModelContextRegisterToolOptions,
  ) {
    tools.set(tool.name, tool);
    options?.signal?.addEventListener("abort", () => tools.delete(tool.name), { once: true });
  },
};

async function runTool<
  Name extends BookmarkWebMCPToolNames,
  Args extends BookmarkWebMCPToolInputMap[Name],
>(name: Name, args: Args): Promise<unknown> {
  const tool = tools.get(name);
  if (!tool) throw new Error(`Tool "${name}" was not registered.`);
  return tool.execute(args as Record<string, unknown>, {
    signal: new AbortController().signal,
  });
}

function outputOf<T>(value: unknown): T {
  const response = value as {
    content?: Array<{ text?: string }>;
    isError?: boolean;
    structuredContent?: T;
  };
  if (response.isError) {
    throw new Error(response.content?.[0]?.text ?? "WebMCP tool failed.");
  }
  if (response.structuredContent !== undefined) {
    return response.structuredContent;
  }

  const text = response.content?.[0]?.text;
  if (text === undefined) throw new Error("WebMCP tool returned no structured result.");
  return JSON.parse(text) as T;
}

async function renderTools() {
  return page.render(
    <BookmarkManagerProvider>
      <BookmarkWebMCPTools />
    </BookmarkManagerProvider>,
  );
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
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: modelContext,
  });
});

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
  useBookmarkStore.setState({ bookmarks: [], hydrated: true, persistenceError: null });
  localStorage.clear();
  vi.restoreAllMocks();
});

test("registers the local bookmark tools", async () => {
  const screen = await renderTools();

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
  const screen = await renderTools();
  const created = outputOf<{ id: string; name: string }>(
    await runTool("create_bookmark", {
      url: "https://example.com",
      name: "Example",
      description: "A useful site",
      tags: ["Work"],
    }),
  );

  expect(created.name).toBe("Example");
  expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
  screen.unmount();
});

test("updates a bookmark", async () => {
  const screen = await renderTools();
  const bookmark = await seedBookmark();

  const updated = outputOf<{ url: string; name: string; description: string }>(
    await runTool("update_bookmark", {
      bookmarkId: bookmark.id,
      url: "https://updated.example",
      name: "Updated",
      description: "Updated note",
      tags: ["Updated"],
    }),
  );

  expect(updated.url).toBe("https://updated.example/");
  expect(updated.name).toBe("Updated");
  expect(updated.description).toBe("Updated note");
  screen.unmount();
});

test("partially updates a bookmark", async () => {
  const screen = await renderTools();
  const bookmark = await seedBookmark();

  const updated = outputOf<{ description: string; name: string }>(
    await runTool("partial_update_bookmark", {
      bookmarkId: bookmark.id,
      description: "Updated note",
    }),
  );

  expect(updated.description).toBe("Updated note");
  expect(updated.name).toBe("Example");
  screen.unmount();
});

test("archives a bookmark", async () => {
  const screen = await renderTools();
  const bookmark = await seedBookmark();

  const archived = outputOf<{ archivedAt: string | null }>(
    await runTool("archive_bookmark", { bookmarkId: bookmark.id }),
  );

  expect(archived.archivedAt).not.toBeNull();
  screen.unmount();
});

test("restores an archived bookmark", async () => {
  const screen = await renderTools();
  const bookmark = await seedBookmark();
  await useBookmarkStore.getState().archiveBookmark(bookmark.id);

  const restored = outputOf<{ archivedAt: string | null }>(
    await runTool("restore_bookmark", { bookmarkId: bookmark.id }),
  );

  expect(restored.archivedAt).toBeNull();
  screen.unmount();
});

test("lists and searches bookmarks", async () => {
  const screen = await renderTools();
  const matching = await seedBookmark({ description: "A useful site" });
  await seedBookmark({ url: "https://another.example", name: "Another" });
  await useBookmarkStore.getState().archiveBookmark(matching.id);

  const listed = outputOf<Array<{ id: string; archivedAt: string | null }>>(
    await runTool("list_bookmarks", { status: "archived", query: "useful" }),
  );

  expect(listed).toHaveLength(1);
  expect(listed[0].id).toBe(matching.id);
  expect(listed[0].archivedAt).not.toBeNull();
  screen.unmount();
});

test("rejects deletion without explicit confirmation", async () => {
  const screen = await renderTools();
  const bookmark = await seedBookmark();

  const response = await runTool("delete_bookmark", {
    bookmarkId: bookmark.id,
    confirm: false,
  });
  expect(response).toMatchObject({ isError: true });
  expect(useBookmarkStore.getState().bookmarks).toHaveLength(1);
  screen.unmount();
});

test("deletes a bookmark after explicit confirmation", async () => {
  const screen = await renderTools();
  const bookmark = await seedBookmark();

  const result = outputOf<{ deleted: boolean; bookmarkId: string }>(
    await runTool("delete_bookmark", { bookmarkId: bookmark.id, confirm: true }),
  );

  expect(result).toEqual({ deleted: true, bookmarkId: bookmark.id });
  expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
  screen.unmount();
});

test("opening records the view and reports when the browser blocks a new tab", async () => {
  const screen = await renderTools();
  const bookmark = await seedBookmark();
  vi.spyOn(window, "open").mockReturnValue(null);

  const result = outputOf<{ opened: boolean; url: string; message: string }>(
    await runTool("open_bookmark", { bookmarkId: bookmark.id }),
  );

  expect(result).toEqual({
    opened: false,
    url: "https://example.com/",
    message: expect.any(String),
  });
  expect(useBookmarkStore.getState().bookmarks[0].viewCount).toBe(1);
  expect(useBookmarkStore.getState().bookmarks[0].lastViewedAt).toBeInstanceOf(Date);
  screen.unmount();
});
