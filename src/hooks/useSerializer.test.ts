import { describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import { useSerializer } from "./useSerializer";

describe("useSerializer", () => {
  test.each([
    { initialValue: { key: "value" }, expectedType: "object" },
    { initialValue: [1, 2, 3], expectedType: "object" },
    {
      initialValue: new Map([
        ["a", 1],
        ["b", 2],
      ]),
      expectedType: "map",
    },
    { initialValue: new Set(["a", "b", "c"]), expectedType: "set" },
    { initialValue: new Date("2024-01-01T00:00:00Z"), expectedType: "date" },
    { initialValue: "string", expectedType: "string" },
    { initialValue: 123, expectedType: "number" },
    { initialValue: true, expectedType: "boolean" },
    { initialValue: null, expectedType: "any" },
  ])(
    "should guess $expectedType serializer type from '$initialValue' initial value",
    async ({ initialValue, expectedType }) => {
      const { result } = await page.renderHook(() => useSerializer(initialValue));

      expect(result.current.type).toBe(expectedType);
    },
  );

  test.each([
    { deserializedValue: { key: "value" }, serializedValue: '{"key":"value"}' },
    { deserializedValue: [1, 2, 3], serializedValue: "[1,2,3]" },
    {
      deserializedValue: new Map([
        ["a", 1],
        ["b", 2],
      ]),
      serializedValue: 'Map([["a",1],["b",2]])',
    },
    { deserializedValue: new Set(["a", "b", "c"]), serializedValue: 'Set(["a","b","c"])' },
    {
      deserializedValue: new Date("2024-01-01T00:00:00Z"),
      serializedValue: "2024-01-01T00:00:00.000Z",
    },
    { deserializedValue: "string", serializedValue: "string" },
    { deserializedValue: 123, serializedValue: "123" },
    { deserializedValue: true, serializedValue: "true" },
  ])(
    "should correctly serialize '$deserializedValue' value to $serializedValue",
    async ({ deserializedValue, serializedValue }) => {
      const { result } = await page.renderHook(() => useSerializer(deserializedValue));

      const serialized = result.current.serializer.write(deserializedValue);
      const serializedFn = result.current.write(deserializedValue);

      expect(serialized).toEqual(serializedValue);
      expect(serializedFn).toEqual(serializedValue);
    },
  );

  test.each([
    { deserializedValue: { key: "value" }, serializedValue: '{"key":"value"}' },
    { deserializedValue: [1, 2, 3], serializedValue: "[1,2,3]" },
    {
      deserializedValue: new Map([
        ["a", 1],
        ["b", 2],
      ]),
      serializedValue: 'Map([["a",1],["b",2]])',
    },
    { deserializedValue: new Set(["a", "b", "c"]), serializedValue: 'Set(["a","b","c"])' },
    {
      deserializedValue: new Date("2024-01-01T00:00:00Z"),
      serializedValue: "2024-01-01T00:00:00.000Z",
    },
    { deserializedValue: "string", serializedValue: "string" },
    { deserializedValue: 123, serializedValue: "123" },
    { deserializedValue: true, serializedValue: "true" },
  ])(
    "should correctly deserialize $serializedValue value to '$deserializedValue'",
    async ({ serializedValue, deserializedValue }) => {
      const { result } = await page.renderHook(() => useSerializer(deserializedValue));

      const deserialized = result.current.serializer.read(serializedValue);
      const deserializedFn = result.current.read(serializedValue);

      expect(deserialized).toEqual(deserializedValue);
      expect(deserializedFn).toEqual(deserializedValue);
    },
  );

  test("should use custom serializer if provided", async () => {
    const customSerializer = {
      read: (v: string) => `read:${v}`,
      write: (v: unknown) => `write:${String(v)}`,
    };

    const { result } = await page.renderHook(() =>
      useSerializer("test", { serializer: customSerializer }),
    );

    expect(result.current.serializer).toBe(customSerializer);

    expect(result.current.serializer.write("value")).toBe("write:value");
    expect(result.current.write("value")).toBe("write:value");

    expect(result.current.serializer.read("value")).toBe("read:value");
    expect(result.current.read("value")).toBe("read:value");
  });

  test.each([
    { initialValue: { initial: "value" }, invalidValue: { invalid: BigInt(1_000_000) } },
    {
      initialValue: [1, 2, 3],
      invalidValue: [BigInt(1_000_000), BigInt(2_000_000), BigInt(3_000_000)],
    },
    {
      initialValue: new Map([
        ["initial-a", "value-1"],
        ["initial-b", "value-2"],
      ]),
      invalidValue: new Map([
        ["invalid-a", BigInt(1_000_000)],
        ["invalid-b", BigInt(2_000_000)],
      ]),
    },
    {
      initialValue: new Set(["in", "it", "ial", "it"]),
      invalidValue: new Set([
        BigInt(1_000_000),
        BigInt(2_000_000),
        BigInt(3_000_000),
        BigInt(2_000_000),
      ]),
    },
  ])(
    'should call `onError` when "$invalidValue" serialization fails',
    async ({ initialValue, invalidValue }) => {
      const onError = vi.fn();

      const { result } = await page.renderHook(() => useSerializer(initialValue, { onError }));

      // @ts-expect-error intentionally invalid type for testing purposes
      result.current.write(invalidValue);

      expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(TypeError));
    },
  );

  test.each([
    { initialValue: { initial: "value" }, invalidValue: '{"key": "value}' },
    { initialValue: [1, 2, 3], invalidValue: "[1, 2, 3" },
    {
      initialValue: new Map([
        ["initial-a", "value-1"],
        ["initial-b", "value-2"],
      ]),
      invalidValue: 'Map([["invalid", "value"])',
    },
    { initialValue: new Set(["a", "b", "c"]), invalidValue: 'Set(["a", "b", "c")' },
  ])(
    'should call `onError` when "$invalidValue" deserialization fails',
    async ({ initialValue, invalidValue }) => {
      const onError = vi.fn();

      const { result } = await page.renderHook(() => useSerializer(initialValue, { onError }));

      result.current.read(invalidValue);

      expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(SyntaxError));
    },
  );
});
