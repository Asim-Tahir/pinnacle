import { useStorage, type UseStorageOptions } from "./useStorage";

export function useSessionStorage(
  key: string,
  initialValue: string,
  options?: UseStorageOptions<string>,
): [string, (value: string | null | ((oldValue: string) => string | null)) => void];
export function useSessionStorage(
  key: string,
  initialValue: boolean,
  options?: UseStorageOptions<boolean>,
): [boolean, (value: boolean | null | ((oldValue: boolean) => boolean | null)) => void];
export function useSessionStorage(
  key: string,
  initialValue: number,
  options?: UseStorageOptions<number>,
): [number, (value: number | null | ((oldValue: number) => number | null)) => void];
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options?: UseStorageOptions<T>,
): [T, (value: T | null | ((oldValue: T) => T | null)) => void];
export function useSessionStorage<T = unknown>(
  key: string,
  initialValue: T,
  options?: UseStorageOptions<T>,
): [T, (value: T | null | ((oldValue: T) => T | null)) => void];

/**
 * Reactive {@link sessionStorage session storage}.
 *
 * Stores and retrieves values from browser's sessionStorage with automatic
 * serialization/deserialization and cross-tab synchronization.
 *
 * SessionStorage is cleared when the tab or browser window is closed.
 *
 * @param key The sessionStorage key
 * @param initialValue Default value if key doesn't exist in storage
 * @param options Configuration options
 *
 * @returns [value, setValue]
 *
 * @example
 * ```ts
 * const [authToken, setAuthToken] = useSessionStorage('token', '')
 * setAuthToken('abc123')
 * ```
 *
 * @example
 * ```ts
 * const [sessionData, setSessionData] = useSessionStorage('data', { logged: false })
 * setSessionData(prev => ({ ...prev, logged: true }))
 * ```
 *
 * @see https://vueuse.org/useSessionStorage
 * @see https://github.com/vueuse/vueuse/tree/239213152c3b43e01eeb7e7dbc4168c5cae4339c/packages/core/useSessionStorage
 */
export function useSessionStorage<T extends string | number | boolean | object | null>(
  key: string,
  initialValue: T,
  options: UseStorageOptions<T> = {},
): [T, (value: T | ((oldValue: T) => T)) => void] {
  return useStorage(key, initialValue, sessionStorage, options);
}
