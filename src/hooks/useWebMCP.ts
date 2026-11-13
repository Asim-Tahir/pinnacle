import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { useSupported } from "@/hooks/useSupported";
import { unwrapGetter } from "@/utils/react";

/**
 * A single block of a WebMCP tool result.
 *
 * @see https://github.com/webmachinelearning/webmcp
 */
export interface WebMCPToolContent {
  type: string;
  text?: string;
  [key: string]: unknown;
}

/**
 * The normalized result an agent receives after a tool runs.
 */
export interface WebMCPToolResponse {
  content: WebMCPToolContent[];
  isError?: boolean;
}
/**
 * Hints an author can attach to a tool to shape how an agent uses it.
 */
export interface WebMCPToolAnnotations {
  /**
   * The tool does not mutate state and is safe to call speculatively.
   */
  readOnlyHint?: boolean;
  /**
   * The tool may return content that should be treated as untrusted.
   */
  untrustedContentHint?: boolean;
  [key: string]: unknown;
}

/**
 * The imperative descriptor passed to `document.modelContext.registerTool`.
 */
export interface WebMCPToolDescriptor<Args = unknown> {
  name: string;
  description: string;
  inputSchema?: object;
  annotations?: WebMCPToolAnnotations;
  execute: (args: Args) => Promise<WebMCPToolResponse> | WebMCPToolResponse;
}

/**
 * The (experimental) imperative WebMCP API surface exposed on `document`.
 */
export interface ModelContext {
  registerTool: <Args>(
    tool: WebMCPToolDescriptor<Args>,
    options?: { signal?: AbortSignal },
  ) => void;
}

// The WebMCP API is experimental and not yet in the DOM lib, so narrow the
// `document` locally rather than augmenting the global `Document` type (a
// `declare global` here would risk type conflicts for downstream consumers
// once the DOM lib ships its own definition).
export type DocumentWithModelContext = Document & { modelContext?: ModelContext };

export interface UseWebMCPOptions<Args, Result> {
  document?: Document;
  /**
   * Tool identifier the agent uses to invoke this tool.
   */
  name: MaybeGetter<string>;
  /**
   * Natural-language description the agent reads to decide when to call it.
   */
  description: MaybeGetter<string>;
  /**
   * JSON Schema describing the tool arguments.
   */
  inputSchema?: MaybeGetter<object | undefined>;
  /**
   * Hints (`readOnlyHint`, `untrustedContentHint`, …) shaping agent behavior.
   */
  annotations?: MaybeGetter<WebMCPToolAnnotations | undefined>;
  /**
   * The function the agent calls. May be async. Its return value is normalized
   * into a WebMCP tool result, and any thrown/returned `Error` becomes an
   * `isError` result.
   */
  execute: (args: Args) => Result | Promise<Result>;
  /**
   * Register the tool only while this is `true`.
   *
   * @default true
   */
  enabled?: MaybeGetter<boolean>;
  /**
   * Shape the `execute` result before it is normalized into a tool response.
   */
  formatOutput?: (result: Result, args: Args) => unknown;
  /**
   * Side effect invoked when `execute` (or `formatOutput`) throws/returns an error.
   */
  onError?: (error: unknown) => void;
}

export interface UseWebMCPReturn {
  isSupported: boolean;
  /**
   * Whether the tool is currently registered with the browser.
   */
  isRegistered: boolean;
  /**
   * Registration error, e.g. a `NotAllowedError` from a `tools` permissions policy.
   */
  error: Error | null;
}

type RegistrationSnapshot = Pick<UseWebMCPReturn, "isRegistered" | "error"> & {
  key: symbol | null;
};

function createRegistrationStore() {
  let snapshot: RegistrationSnapshot = { key: null, isRegistered: false, error: null };
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    publish(next: RegistrationSnapshot) {
      if (
        snapshot.key === next.key &&
        snapshot.isRegistered === next.isRegistered &&
        snapshot.error === next.error
      )
        return;
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
  };
}

const defaultDocument = typeof document === "undefined" ? undefined : document;

// Stringify for error reporting without ever throwing itself
// (JSON.stringify throws on circular references and BigInt).
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Normalize whatever `execute` returns into an MCP tool result, so callers can
// return a plain string/object and still hand the agent a valid response.
function toToolResponse(value: unknown): WebMCPToolResponse {
  // Already a well-formed MCP tool result — pass it through untouched.
  if (value && typeof value === "object" && Array.isArray((value as WebMCPToolResponse).content))
    return value as WebMCPToolResponse;

  // `execute` returned nothing — report a successful, empty result.
  if (value === undefined || value === null) return { content: [] };

  // Strings map directly to a single text block.
  if (typeof value === "string") return { content: [{ type: "text", text: value }] };

  // Anything else (objects, arrays, numbers) is serialized to JSON text.
  // `safeStringify` so exotic values (circular refs / BigInt) can't turn a
  // successful result into an error.
  return { content: [{ type: "text", text: safeStringify(value) }] };
}

// Every failure becomes an explicit `isError` result, whatever was thrown — a
// thrown string or plain object must not read as success to the agent.
function toErrorResponse(error: unknown): WebMCPToolResponse {
  const text =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : safeStringify(error);
  return { content: [{ type: "text", text }], isError: true };
}

/**
 * Executes a tool callback and normalizes its output for WebMCP.
 *
 * Applies `formatOutput` before normalization. If execution or formatting
 * throws, or returns an `Error`, calls `onError` and returns an error response.
 * Errors thrown by `onError` are ignored so they cannot interrupt the tool.
 *
 * @example
 * ```ts
 * const response = await executeWebMCPTool<{ query: string }, string>(
 *   { execute: ({ query }) => `Searching for ${query}` },
 *   { query: "React" },
 * );
 * ```
 *
 * @param options Execution callback and optional output/error handlers.
 * @param args Arguments passed to `execute` and `formatOutput`.
 * @returns A normalized WebMCP response, including `isError` on failure.
 */
export async function executeWebMCPTool<Args, Result>(
  options: Pick<UseWebMCPOptions<Args, Result>, "execute" | "formatOutput" | "onError">,
  args: Args,
): Promise<WebMCPToolResponse> {
  try {
    const result = await options.execute(args);
    const shaped = options.formatOutput ? options.formatOutput(result, args) : result;
    if (shaped instanceof Error) throw shaped;
    return toToolResponse(shaped);
  } catch (error) {
    try {
      options.onError?.(error);
    } catch {}
    return toErrorResponse(error);
  }
}

/**
 * Register a [WebMCP](https://github.com/webmachinelearning/webmcp) tool and
 * tie its registration to the component lifecycle.
 *
 * The tool is registered after the component mounts and re-registered whenever
 * its discoverable metadata (`name`, `description`, `inputSchema` or
 * `annotations`) or `enabled` changes. The previous registration is aborted on
 * cleanup, including when the component unmounts. Call this hook multiple times
 * to register multiple tools.
 *
 * The API is experimental (`document.modelContext`), so this feature-detects
 * and degrades to a no-op wherever it is absent.
 *
 * @example
 * ```tsx
 * function BookmarkSearchTool() {
 *   const { isSupported, isRegistered, error } = useWebMCP<{ query: string }, string>({
 *     name: "search_bookmarks",
 *     description: "Search the local bookmark library by title.",
 *     inputSchema: {
 *       type: "object",
 *       properties: { query: { type: "string" } },
 *       required: ["query"],
 *     },
 *     annotations: { readOnlyHint: true },
 *     execute: ({ query }) => `Searching bookmarks for "${query}".`,
 *   });
 *
 *   if (!isSupported) return <p>WebMCP is not available in this browser.</p>;
 *   if (error) return <p role="alert">{error.message}</p>;
 *   return <p>{isRegistered ? "Search tool is available." : "Registering search tool..."}</p>;
 * }
 * ```
 *
 * @see https://vueuse.org/useWebMCP
 * @see https://github.com/webmachinelearning/webmcp
 */
export function useWebMCP<Args = Record<string, unknown>, Result = unknown>(
  options: UseWebMCPOptions<Args, Result>,
): UseWebMCPReturn {
  const { document = defaultDocument, enabled = true } = options;

  const doc = document as DocumentWithModelContext | undefined;

  // Require `registerTool` to be callable, not merely that `modelContext`
  // exists — a present-but-incomplete API should report unsupported rather
  // than surface a registration error.
  const isSupported = useSupported(() => typeof doc?.modelContext?.registerTool === "function");
  const [registrationStore] = useState(createRegistrationStore);
  const {
    key: snapshotRegistrationKey,
    isRegistered,
    error,
  } = useSyncExternalStore(
    registrationStore.subscribe,
    registrationStore.getSnapshot,
    registrationStore.getSnapshot,
  );
  const name = unwrapGetter(options.name);
  const description = unwrapGetter(options.description);
  const inputSchema = unwrapGetter(options.inputSchema);
  const annotations = unwrapGetter(options.annotations);
  const enabledValue = unwrapGetter(enabled);
  const schemaKey = inputSchema ? safeStringify(inputSchema) : "";
  const annotationsKey = annotations ? safeStringify(annotations) : "";
  const registrationKey = useMemo(() => Symbol(), []);
  const latestRef = useRef({
    annotations,
    description,
    document: doc,
    inputSchema,
    name,
    options,
  });

  useLayoutEffect(() => {
    latestRef.current = {
      annotations,
      description,
      document: doc,
      inputSchema,
      name,
      options,
    };
  });

  useEffect(() => {
    if (!isSupported || !enabledValue) {
      registrationStore.publish({ key: registrationKey, isRegistered: false, error: null });
      return;
    }

    const controller = new AbortController();
    const metadata = latestRef.current;

    try {
      metadata.document!.modelContext!.registerTool(
        {
          name: metadata.name,
          description: metadata.description,
          inputSchema: metadata.inputSchema,
          annotations: metadata.annotations,
          async execute(args: Args) {
            return executeWebMCPTool(latestRef.current.options, args);
          },
        },
        { signal: controller.signal },
      );
      registrationStore.publish({ key: registrationKey, isRegistered: true, error: null });
    } catch (err) {
      // e.g. NotAllowedError when the `tools` permissions policy is disabled.
      registrationStore.publish({
        key: registrationKey,
        isRegistered: false,
        error: err instanceof Error ? err : new Error(safeStringify(err)),
      });
    }

    return () => controller.abort();
  }, [
    annotationsKey,
    description,
    doc,
    enabledValue,
    isSupported,
    name,
    registrationKey,
    registrationStore,
    schemaKey,
  ]);

  const isCurrentRegistration = snapshotRegistrationKey === registrationKey;

  return {
    isSupported,
    isRegistered: isCurrentRegistration && isRegistered,
    error: isCurrentRegistration ? error : null,
  };
}
