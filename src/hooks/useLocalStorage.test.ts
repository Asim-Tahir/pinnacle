import { beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();

    vi.clearAllMocks();
  });

  describe("Basic functionality", () => {
    test("should initialize with default value", async () => {
      const { result } = await page.renderHook(() => useLocalStorage("test-key", "default-value"));
      const [value] = result.current;

      expect(value).toBe("default-value");
    });

    test("should retrieve value from storage", async () => {
      localStorage.setItem("existing-key", "existing-value");
      const { result } = await page.renderHook(() =>
        useLocalStorage("existing-key", "default-value"),
      );
      const [value] = result.current;

      expect(value).toBe("existing-value");
    });

    test("should update value and persist to storage", async () => {
      const { result, act } = await page.renderHook(() => useLocalStorage("test-key", "initial"));
      const [, setValue] = result.current;

      act(() => {
        setValue("updated");
      });

      expect(result.current[0]).toBe("updated");
      expect(localStorage.getItem("test-key")).toBe("updated");
    });

    test("should support function updates", async () => {
      const { result, act } = await page.renderHook(() => useLocalStorage("counter", 0));
      const [, setValue] = result.current;

      act(() => {
        setValue((prev) => (prev as number) + 1);
      });

      expect(result.current[0]).toBe(1);
      expect(localStorage.getItem("counter")).toBe("1");
    });
  });

  describe("Type serialization", () => {
    test("should serialize and deserialize boolean", async () => {
      const { result, act } = await page.renderHook(() => useLocalStorage("bool-key", true));
      const [, setValue] = result.current;

      await act(() => {
        setValue(false);
      });

      expect(result.current[0]).toBe(false);
      expect(localStorage.getItem("bool-key")).toBe("false");
    });

    test("should serialize and deserialize number", async () => {
      const { result, act } = await page.renderHook(() => useLocalStorage("num-key", 42));
      const [, setValue] = result.current;

      await act(() => {
        setValue(100);
      });

      expect(result.current[0]).toBe(100);
      expect(localStorage.getItem("num-key")).toBe("100");
    });

    test("should serialize and deserialize object", async () => {
      const obj = { name: "John", age: 30 };
      const { result, act } = await page.renderHook(() => useLocalStorage("obj-key", obj));
      const [, setValue] = result.current;

      const updated = { name: "Jane", age: 25 };
      await act(() => {
        setValue(updated);
      });

      expect(result.current[0]).toEqual(updated);
      expect(localStorage.getItem("obj-key")).toBe(JSON.stringify(updated));
    });

    test("should serialize and deserialize Map", async () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      const { result, act } = await page.renderHook(() => useLocalStorage("map-key", map));
      const [, setValue] = result.current;

      const newMap = new Map([["key3", "value3"]]);
      await act(() => {
        setValue(newMap);
      });

      expect(result.current[0]).toEqual(newMap);
      expect(result.current[0].get("key3")).toBe("value3");
    });

    test("should serialize and deserialize Set", async () => {
      const set = new Set(["a", "b", "c"]);
      const { result, act } = await page.renderHook(() => useLocalStorage("set-key", set));
      const [, setValue] = result.current;

      const newSet = new Set(["d", "e"]);
      await act(() => {
        setValue(newSet);
      });

      expect(result.current[0]).toEqual(newSet);
      expect(result.current[0].has("d")).toBe(true);
    });

    test("should serialize and deserialize Date", async () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const { result, act } = await page.renderHook(() => useLocalStorage("date-key", date));
      const [, setValue] = result.current;

      const newDate = new Date("2025-01-01T00:00:00Z");
      await act(() => {
        setValue(newDate);
      });

      expect(result.current[0]).toEqual(newDate);
      expect((result.current[0] as Date).toISOString()).toBe("2025-01-01T00:00:00.000Z");
    });
  });

  describe("Default value handling", () => {
    test("should write default value to storage when writeInitialValue is true", async () => {
      await page.renderHook(() =>
        useLocalStorage("new-key", "default", {
          writeInitialValue: true,
        }),
      );

      expect(localStorage.getItem("new-key")).toBe("default");
    });

    test("should not write default value when writeInitialValue is false", async () => {
      await page.renderHook(() =>
        useLocalStorage("new-key", "default", {
          writeInitialValue: false,
        }),
      );

      expect(localStorage.getItem("new-key")).toBeNull();
    });

    test("should return initial value if key does not exist", async () => {
      const { result } = await page.renderHook(() =>
        useLocalStorage("nonexistent", "fallback", {
          writeInitialValue: false,
        }),
      );
      const [value] = result.current;

      expect(value).toBe("fallback");
    });
  });

  describe("Merge initial values", () => {
    test("should merge objects when `mergeInitialValue` is true", async () => {
      const stored = { name: "John" };
      localStorage.setItem("merge-key", JSON.stringify(stored));

      const { result } = await page.renderHook(() =>
        useLocalStorage(
          "merge-key",
          { name: "", age: 0 },
          {
            mergeInitialValue: true,
          },
        ),
      );
      const [value] = result.current;

      expect(value).toEqual({ name: "John", age: 0 });
    });

    test("should use custom merge function", async () => {
      const stored = { a: 1, b: 2 };
      localStorage.setItem("custom-merge", JSON.stringify(stored));

      const { result } = await page.renderHook(() =>
        useLocalStorage(
          "custom-merge",
          { a: 10, c: 30 },
          {
            mergeInitialValue: (storageValue, initialValue) => ({
              ...initialValue,
              ...storageValue,
              merged: true,
            }),
          },
        ),
      );
      const [value] = result.current;

      expect(value).toEqual({ a: 1, b: 2, c: 30, merged: true });
    });

    test("should not merge when `mergeInitialValue` is false", async () => {
      const stored = { name: "John" };
      localStorage.setItem("no-merge-key", JSON.stringify(stored));

      const { result } = await page.renderHook(() =>
        useLocalStorage(
          "no-merge-key",
          { name: "", age: 0 },
          {
            mergeInitialValue: false,
          },
        ),
      );
      const [value] = result.current;

      expect(value).toEqual({ name: "John" });
    });
  });

  describe("Storage operations", () => {
    test("should remove value from storage via null set", async () => {
      localStorage.setItem("remove-key", "value");
      const { result, act } = await page.renderHook(() => useLocalStorage("remove-key", "default"));
      const [, setValue] = result.current;

      await act(() => {
        setValue(null);
      });

      expect(localStorage.getItem("remove-key")).toBeNull();
      expect(result.current[0]).toBe("default");
    });

    test("should handle null values by removing from storage", async () => {
      const { result, act } = await page.renderHook(() => useLocalStorage("null-key", "initial"));
      const [, setValue] = result.current;

      await act(() => {
        setValue(null);
      });

      expect(localStorage.getItem("null-key")).toBeNull();
    });
  });

  describe("Error handling", () => {
    test("should call onError callback on serialization error", async () => {
      const onError = vi.fn();
      const circularRef: { a: number; self?: unknown } = { a: 1 };
      circularRef.self = circularRef;

      await page.renderHook(() => useLocalStorage("error-key", circularRef, { onError }));

      expect(onError).toHaveBeenCalled();
    });

    test("should call onError callback on deserialization error", async () => {
      const onError = vi.fn();
      localStorage.setItem("bad-json", "{invalid json}");

      const { result } = await page.renderHook(() =>
        useLocalStorage("bad-json", { default: "value" }, { onError }),
      );

      expect(onError).toHaveBeenCalled();
      expect(result.current[0]).toEqual({ default: "value" });
    });

    test("should use default console.error if onError not provided", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      localStorage.setItem("bad-json-2", "{invalid json}");

      await page.renderHook(() => useLocalStorage("bad-json-2", { default: "value" }));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Storage events", () => {
    test("should listen to storage changes when `listenToStorageChanges` is true", async () => {
      const { result, act } = await page.renderHook(() =>
        useLocalStorage("event-key", "initial", {
          listenToStorageChanges: true,
        }),
      );

      await act(() => {
        const event = new StorageEvent("storage", {
          key: "event-key",
          newValue: "changed",
          storageArea: localStorage,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe("changed");
    });

    test("should not listen to storage changes when `listenToStorageChanges` is false", async () => {
      const { result, act } = await page.renderHook(() =>
        useLocalStorage("event-key-2", "initial", {
          listenToStorageChanges: false,
        }),
      );

      await act(() => {
        const event = new StorageEvent("storage", {
          key: "event-key-2",
          newValue: "changed",
          storageArea: localStorage,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe("initial");
    });

    test("should ignore storage events for different keys", async () => {
      const { result, act } = await page.renderHook(() => useLocalStorage("key-a", "initial"));

      await act(() => {
        const event = new StorageEvent("storage", {
          key: "key-b",
          newValue: "changed",
          storageArea: localStorage,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe("initial");
    });

    test("should reset to default value on storage clear event", async () => {
      const { result, act } = await page.renderHook(() => useLocalStorage("clear-key", "default"));

      await act(() => {
        const event = new StorageEvent("storage", {
          key: null,
          newValue: null,
          storageArea: localStorage,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe("default");
    });
  });

  describe("Custom serializers", () => {
    test("should use custom serializer", async () => {
      const customSerializer = {
        read: (raw: string) => raw.toUpperCase(),
        write: (value: string) => value.toLowerCase(),
      };

      const { result, act } = await page.renderHook(() =>
        useLocalStorage("custom-serial", "Hello", {
          serializer: customSerializer,
        }),
      );
      const [, setValue] = result.current;

      await act(() => {
        setValue("World");
      });

      expect(localStorage.getItem("custom-serial")).toBe("world");
      expect(result.current[0]).toBe("WORLD");
    });
  });

  describe("Edge cases", () => {
    test("should handle empty string", async () => {
      const { result } = await page.renderHook(() => useLocalStorage("empty-string", ""));
      const [value] = result.current;

      expect(value).toBe("");
      expect(localStorage.getItem("empty-string")).toBe("");
    });

    test("should handle zero", async () => {
      const { result } = await page.renderHook(() => useLocalStorage("zero", 0));
      const [value] = result.current;

      expect(value).toBe(0);
      expect(localStorage.getItem("zero")).toBe("0");
    });

    test("should handle false boolean", async () => {
      const { result } = await page.renderHook(() => useLocalStorage("false-bool", false));
      const [value] = result.current;

      expect(value).toBe(false);
      expect(localStorage.getItem("false-bool")).toBe("false");
    });

    test("should handle empty object", async () => {
      const { result } = await page.renderHook(() => useLocalStorage("empty-obj", {}));
      const [value] = result.current;

      expect(value).toEqual({});
      expect(localStorage.getItem("empty-obj")).toBe("{}");
    });

    test("should handle array", async () => {
      const arr = [1, 2, 3];
      const { result } = await page.renderHook(() => useLocalStorage("array", arr));
      const [value] = result.current;

      expect(value).toEqual([1, 2, 3]);
      expect(localStorage.getItem("array")).toBe("[1,2,3]");
    });
  });

  describe("Type safety", () => {
    test("should maintain type inference for string", async () => {
      const { result } = await page.renderHook(() => useLocalStorage("str", "hello"));
      const [value] = result.current;

      expect(typeof value).toBe("string");
    });

    test("should maintain type inference for number", async () => {
      const { result } = await page.renderHook(() => useLocalStorage("num", 42));
      const [value] = result.current;

      expect(typeof value).toBe("number");
    });

    test("should maintain type inference for boolean", async () => {
      const { result } = await page.renderHook(() => useLocalStorage("bool", true));
      const [value] = result.current;

      expect(typeof value).toBe("boolean");
    });

    test("should maintain type inference for object", async () => {
      const obj = { a: 1, b: "test" };
      const { result } = await page.renderHook(() => useLocalStorage("obj", obj));
      const [value] = result.current;

      expect(typeof value).toBe("object");
      expect(value.a).toBe(1);
    });
  });
});
