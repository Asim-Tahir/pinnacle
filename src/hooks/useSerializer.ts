import { useCallback, useMemo } from "react";

/**
 * Helper function to guess the serializer type based on the initial value for cookie.
 *
 * @param rawInit the initial value to guess the serializer type for
 * @returns the guessed serializer type
 */
export function guessSerializerTypeFromRawInit<T extends string | number | boolean | object | null>(
  rawInit: T,
): "string" | "number" | "boolean" | "object" | "any" | "map" | "set" | "date" {
  return rawInit == null
    ? "any"
    : rawInit instanceof Set
      ? "set"
      : rawInit instanceof Map
        ? "map"
        : rawInit instanceof Date
          ? "date"
          : typeof rawInit === "boolean"
            ? "boolean"
            : typeof rawInit === "string"
              ? "string"
              : typeof rawInit === "object"
                ? "object"
                : !Number.isNaN(rawInit)
                  ? "number"
                  : "any";
}

/**
 * Helper function to guess the serializer type based on the raw string value.
 *
 * @param rawValue the raw string value to guess the serializer type for
 * @returns the guessed serializer type
 */
export function guessSerializerTypeFromRawValue(
  rawValue: string,
): "string" | "number" | "boolean" | "object" | "any" | "map" | "set" | "date" {
  rawValue = rawValue.trim();

  return rawValue === "true" || rawValue === "false"
    ? "boolean"
    : (rawValue.trim().startsWith("{") && rawValue.endsWith("}")) ||
        (rawValue.startsWith("[") && rawValue.endsWith("]"))
      ? "object"
      : !Number.isNaN(Number.parseFloat(rawValue))
        ? "number"
        : rawValue.startsWith("Map(") && rawValue.endsWith(")")
          ? "map"
          : rawValue.startsWith("Set(") && rawValue.endsWith(")")
            ? "set"
            : !Number.isNaN(Date.parse(rawValue))
              ? "date"
              : "string";
}

export interface Serializer<T> {
  read: (raw: string) => T;
  write: (value: T) => string;
}

export const Serializers: Record<
  "boolean" | "object" | "number" | "any" | "string" | "map" | "set" | "date",
  Serializer<any>
> = {
  boolean: {
    read: (v: string) => v === "true",
    write: (v: boolean) => String(v),
  },
  object: {
    read: (v: string) => JSON.parse(v),
    write: (v: any) => JSON.stringify(v),
  },
  number: {
    read: (v: string) => Number.parseFloat(v),
    write: (v: number) => String(v),
  },
  any: {
    read: (v: string) => v,
    write: (v: any) => String(v),
  },
  string: {
    read: (v: string) => v,
    write: (v: string) => String(v),
  },
  map: {
    read: (v: string) => {
      if (v.startsWith("Map(") && v.endsWith(")")) {
        v = v.replace(/^Map\((.*)\)$/, "$1");
      }

      return new Map(JSON.parse(v));
    },
    write: (v: Map<any, any>) => `Map(${JSON.stringify(Array.from(v.entries()))})`,
  },
  set: {
    read: (v: string) => {
      if (v.startsWith("Set(") && v.endsWith(")")) {
        v = v.replace(/^Set\((.*)\)$/, "$1");
      }

      return new Set(JSON.parse(v));
    },
    write: (v: Set<any>) => `Set(${JSON.stringify(Array.from(v))})`,
  },
  date: {
    read: (v: string) => new Date(v),
    write: (v: Date) => v.toISOString(),
  },
};

export interface UseSerializerOptions<T> {
  /**
   * Custom data serialization
   *
   * By default guess serializer based on the type of `initialValue`
   */
  serializer?: Serializer<T>;
  /**
   * On error callback
   *
   * By default log error to `console.error`
   */
  onError?: (error: unknown) => void;
}

export interface UseSerializerReturn<T> {
  type: "string" | "number" | "boolean" | "object" | "any" | "map" | "set" | "date";
  serializer: Serializer<T>;
  read: (rawValue: string) => T;
  write: (value: T) => string;
}

const defaultOnError = (error: unknown) => {
  console.error(error);
};

/**
 * Serializing and deserializing values.
 *
 * @param value The value to guess the serializer type from.
 * @param options Optional configuration for the serializer.
 * @returns An object containing the serializer type, serializer, read and write functions.
 *
 * @example
 * ```ts
 * const { type, serializer, read: serializerRead, write: serializerWrite } = useSerializer(initialValue);
 * const serializedValue = serializerWrite(initialValue);
 * const deserializedValue = serializerRead(serializedValue);
 * initialValue === deserializedValue; // true
 * ```
 */
export function useSerializer(
  value: string,
  options?: UseSerializerOptions<string>,
): UseSerializerReturn<string>;
export function useSerializer(
  value: boolean,
  options?: UseSerializerOptions<boolean>,
): UseSerializerReturn<boolean>;
export function useSerializer(
  value: number,
  options?: UseSerializerOptions<number>,
): UseSerializerReturn<number>;
export function useSerializer<T>(
  value: T,
  options?: UseSerializerOptions<T>,
): UseSerializerReturn<T>;
export function useSerializer<T = unknown>(
  value: T,
  options?: UseSerializerOptions<T>,
): UseSerializerReturn<T>;

export function useSerializer<
  T extends string | number | boolean | object | Map<unknown, unknown> | Set<unknown> | Date | null,
>(value: T, options: UseSerializerOptions<T> = {}): UseSerializerReturn<T> {
  const { onError = defaultOnError } = options;

  const type = useMemo(
    () =>
      typeof value === "string"
        ? guessSerializerTypeFromRawValue(value)
        : guessSerializerTypeFromRawInit(value),
    [value],
  );
  const serializer = useMemo(
    () => options.serializer ?? Serializers[type],
    [options.serializer, type],
  );

  const read = useCallback(
    (rawValue: string) => {
      try {
        return serializer.read(rawValue);
      } catch (error) {
        onError(error);
        return value;
      }
    },
    [serializer, onError, value],
  );

  const write = useCallback(
    (value: T) => {
      try {
        return serializer.write(value);
      } catch (error) {
        onError(error);
        return String(value);
      }
    },
    [serializer, onError],
  );

  return {
    type,
    serializer,
    read,
    write,
  };
}
