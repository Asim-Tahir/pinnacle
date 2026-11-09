import { useStorage, type UseStorageOptions } from "./useStorage";

export function useLocalStorage(
  key: string,
  initialValue: string,
  options?: UseStorageOptions<string>,
): [string, (value: string | null | ((oldValue: string) => string | null)) => void];
export function useLocalStorage(
  key: string,
  initialValue: boolean,
  options?: UseStorageOptions<boolean>,
): [boolean, (value: boolean | null | ((oldValue: boolean) => boolean | null)) => void];
export function useLocalStorage(
  key: string,
  initialValue: number,
  options?: UseStorageOptions<number>,
): [number, (value: number | null | ((oldValue: number) => number | null)) => void];
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseStorageOptions<T>,
): [T, (value: T | null | ((oldValue: T) => T | null)) => void];
export function useLocalStorage<T = unknown>(
  key: string,
  initialValue: T,
  options?: UseStorageOptions<T>,
): [T, (value: T | null | ((oldValue: T) => T | null)) => void];

/**
 * Reactive {@link localStorage local storage}.
 *
 * Stores and retrieves values from browser's localStorage with automatic
 * serialization/deserialization and cross-tab synchronization.
 *
 * @param key The localStorage key
 * @param initialValue Default value if key doesn't exist in storage
 * @param options Configuration options
 * @returns [value, setValue]
 *
 * @example
 * const [user, setUser] = useLocalStorage('user', { name: 'John' })
 *
 * @see https://vueuse.org/useLocalStorage
 * @see https://github.com/vueuse/vueuse/tree/2d1797b9f3a554f86c81cf57a914d419bd7e3064/packages/core/useLocalStorage
 */
export function useLocalStorage<T extends string | number | boolean | object | null>(
  key: string,
  initialValue: T,
  options: UseStorageOptions<T> = {},
): [T, (value: T | ((oldValue: T) => T)) => void] {
  return useStorage(key, initialValue, localStorage, options);
}
