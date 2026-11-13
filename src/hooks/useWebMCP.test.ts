import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import {
  executeWebMCPTool,
  useWebMCP,
  type DocumentWithModelContext,
  type ModelContext,
  type UseWebMCPOptions,
  type WebMCPToolDescriptor,
  type WebMCPToolResponse,
} from "./useWebMCP";

interface RegisteredTool {
  descriptor: WebMCPToolDescriptor<unknown>;
  controller: AbortController;
  aborted: () => boolean;
}

function installModelContext() {
  const tools: RegisteredTool[] = [];
  const registerTool = vi.fn(
    (descriptor: WebMCPToolDescriptor<unknown>, options?: { signal?: AbortSignal }) => {
      const signal = options?.signal;
      tools.push({
        descriptor,
        controller: { abort: () => {} } as AbortController,
        aborted: () => Boolean(signal?.aborted),
      });
    },
  );
  const modelContext: ModelContext = {
    registerTool<Args>(descriptor: WebMCPToolDescriptor<Args>, options?: { signal?: AbortSignal }) {
      registerTool(descriptor as WebMCPToolDescriptor<unknown>, options);
    },
  };
  return {
    tools,
    registerTool,
    documentWithModelContext: { modelContext } as DocumentWithModelContext,
  };
}

describe("useWebMCP", () => {
  test("should be defined", () => {
    expect(useWebMCP).toBeDefined();
  });

  test("reports unsupported and stays a no-op when the API is absent", async () => {
    const screen = await page.renderHook(() =>
      useWebMCP({
        document: {} as DocumentWithModelContext,
        name: "noop",
        description: "no-op",
        execute: () => "ok",
      }),
    );

    expect(screen.result.current.isSupported).toBeFalsy();
    expect(screen.result.current.isRegistered).toBeFalsy();
    expect(screen.result.current.error).toBeNull();
    screen.unmount();
  });

  test("reports unsupported when modelContext lacks a callable registerTool", async () => {
    const screen = await page.renderHook(() =>
      useWebMCP({
        document: { modelContext: {} } as DocumentWithModelContext,
        name: "noop",
        description: "no-op",
        execute: () => "ok",
      }),
    );

    expect(screen.result.current.isSupported).toBeFalsy();
    expect(screen.result.current.isRegistered).toBeFalsy();
    expect(screen.result.current.error).toBeNull();
    screen.unmount();
  });

  test("registers on mount and aborts registration when unmounted", async () => {
    const { documentWithModelContext, tools, registerTool } = installModelContext();
    const screen = await page.renderHook(() =>
      useWebMCP({
        document: documentWithModelContext,
        name: "add-todo",
        description: "Add a todo",
        execute: () => "ok",
      }),
    );

    expect(registerTool).toHaveBeenCalledOnce();
    expect(screen.result.current.isSupported).toBeTruthy();
    expect(screen.result.current.isRegistered).toBeTruthy();
    expect(tools[0].descriptor.name).toBe("add-todo");
    expect(tools[0].aborted()).toBeFalsy();

    screen.unmount();
    expect(tools[0].aborted()).toBeTruthy();
  });

  test("does not register while `enabled` is false, and (un)registers as it toggles", async () => {
    const { documentWithModelContext, tools, registerTool } = installModelContext();
    const screen = await page.renderHook(() => {
      const [enabled, setEnabled] = useState(false);
      const result = useWebMCP({
        name: "toggle",
        description: "toggle tool",
        document: documentWithModelContext,
        enabled,
        execute: () => "ok",
      });
      return { ...result, setEnabled };
    });

    expect(registerTool).not.toHaveBeenCalled();
    expect(screen.result.current.isRegistered).toBeFalsy();

    await screen.act(() => screen.result.current.setEnabled(true));
    expect(registerTool).toHaveBeenCalledOnce();
    expect(screen.result.current.isRegistered).toBeTruthy();

    await screen.act(() => screen.result.current.setEnabled(false));
    expect(screen.result.current.isRegistered).toBeFalsy();
    expect(tools[0].aborted()).toBeTruthy();
    screen.unmount();
  });

  test("re-registers when a discoverable field changes", async () => {
    const { documentWithModelContext, tools, registerTool } = installModelContext();
    const screen = await page.renderHook(() => {
      const [description, setDescription] = useState("v1");
      const result = useWebMCP({
        name: "search",
        description,
        document: documentWithModelContext,
        execute: () => "ok",
      });
      return { ...result, setDescription };
    });

    expect(registerTool).toHaveBeenCalledTimes(1);
    await screen.act(() => screen.result.current.setDescription("v2"));

    expect(registerTool).toHaveBeenCalledTimes(2);
    expect(tools[0].aborted()).toBeTruthy();
    screen.unmount();
  });

  test("does not re-register when a content-equal schema is passed", async () => {
    const { documentWithModelContext, registerTool } = installModelContext();
    const screen = await page.renderHook(() => {
      const [inputSchema, setInputSchema] = useState<object>({
        type: "object",
        properties: { a: { type: "string" } },
      });
      useWebMCP({
        name: "schema",
        description: "schema tool",
        document: documentWithModelContext,
        inputSchema,
        execute: () => "ok",
      });
      return { setInputSchema };
    });

    expect(registerTool).toHaveBeenCalledOnce();
    await screen.act(() =>
      screen.result.current.setInputSchema({
        type: "object",
        properties: { a: { type: "string" } },
      }),
    );
    expect(registerTool).toHaveBeenCalledOnce();
    screen.unmount();
  });

  test("captures a registration error (e.g. NotAllowedError)", async () => {
    const { documentWithModelContext, registerTool } = installModelContext();
    registerTool.mockImplementation(() => {
      const registrationError = new Error("blocked");
      registrationError.name = "NotAllowedError";
      throw registrationError;
    });
    const screen = await page.renderHook(() =>
      useWebMCP({
        name: "blocked",
        description: "blocked tool",
        document: documentWithModelContext,
        execute: () => "ok",
      }),
    );

    expect(screen.result.current.isRegistered).toBeFalsy();
    expect(screen.result.current.error).toBeInstanceOf(Error);
    expect(screen.result.current.error?.name).toBe("NotAllowedError");
    screen.unmount();
  });

  describe("result normalization", () => {
    async function runExecute(
      execute: UseWebMCPOptions<unknown, unknown>["execute"],
      args: unknown = {},
      options: Pick<UseWebMCPOptions<unknown, unknown>, "formatOutput" | "onError"> = {},
    ): Promise<WebMCPToolResponse> {
      return executeWebMCPTool({ execute, ...options }, args);
    }

    test("wraps strings in a text block", async () => {
      await expect(runExecute(() => "hi")).resolves.toEqual({
        content: [{ type: "text", text: "hi" }],
      });
    });

    test("maps undefined/null to an empty successful results", async () => {
      await expect(runExecute(() => undefined)).resolves.toEqual({ content: [] });
      await expect(runExecute(() => null)).resolves.toEqual({ content: [] });
    });

    test("passes an already-formed tool result through untouched", async () => {
      const already: WebMCPToolResponse = { content: [{ type: "text", text: "x" }] };
      await expect(runExecute(() => already)).resolves.toBe(already);
    });

    test("serializes other values to JSON text", async () => {
      await expect(runExecute(() => ({ a: 1 }))).resolves.toEqual({
        content: [{ type: "text", text: '{"a":1}' }],
      });
    });

    test("does not throw on non-serializable (circular) results", async () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;
      const response = await runExecute(() => circular);

      expect(response.isError).toBeUndefined();
      expect(response.content[0].type).toBe("text");
    });

    test("turns a thrown Error into an isError result and calls onError'", async () => {
      const onError = vi.fn();
      const res = await runExecute(
        () => {
          throw new Error("boom");
        },
        {},
        { onError },
      );
      expect(res).toEqual({ content: [{ type: "text", text: "boom" }], isError: true });
      expect(onError).toHaveBeenCalledOnce();
    });

    test("turns a thrown non-Error into an isError result", async () => {
      const thrownString = await runExecute(() => {
        // oxlint-disable-next-line no-throw-literal
        throw "nope";
      });
      expect(thrownString).toEqual({ content: [{ type: "text", text: "nope" }], isError: true });

      const thrownObject = await runExecute(() => {
        // oxlint-disable-next-line no-throw-literal
        throw { code: 403 };
      });
      expect(thrownObject).toEqual({
        content: [{ type: "text", text: '{"code":403}' }],
        isError: true,
      });
    });

    test("treats a returned Error like a throw", async () => {
      const onError = vi.fn();
      const res = await runExecute(() => new Error("returned"), {}, { onError });
      expect(res).toEqual({ content: [{ type: "text", text: "returned" }], isError: true });
      expect(onError).toHaveBeenCalledOnce();
    });

    test("does not let a throwing onError break the tool execution path", async () => {
      const onError = vi.fn(() => {
        throw new Error("onError blew up");
      });
      const res = await runExecute(
        () => {
          throw new Error("boom");
        },
        {},
        { onError },
      );
      expect(res).toEqual({ content: [{ type: "text", text: "boom" }], isError: true });
      expect(onError).toHaveBeenCalledOnce();
    });

    test("applies formatOutput before normalization", async () => {
      const res = await runExecute(
        () => ({ raw: 1 }),
        {},
        { formatOutput: (r: any) => `count=${r.raw}` },
      );
      expect(res).toEqual({ content: [{ type: "text", text: "count=1" }] });
    });
  });
});
