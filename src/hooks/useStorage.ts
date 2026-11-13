// see: https://github.com/vueuse/vueuse/blob/b62d588999072919e1b7e991bb10f6c978a12d00/packages/core/useStorage/index.ts

import { useCallback, useEffect, useState } from "react";

import { useSerializer, type Serializer } from "@/hooks/useSerializer";

export interface UseStorageOptions<T> {
  /**
   * Listen to storage changes, useful for multiple tabs application
   *
   * @default true
   */
  listenToStorageChanges?: boolean;

  /**
   * Write the initial value to the storage when it does not exist
   *
   * @default true
   */
  writeInitialValue?: boolean;

  /**
   * Merge the initial value with the value read from the storage.
   *
   * When setting it to true, it will perform a **shallow merge** for objects.
   * You can pass a function to perform custom merge (e.g. deep merge)
   *
   * @default false
   */
  mergeInitialValue?: boolean | ((storageValue: T, initialValue: T) => T);

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

  /**
   * Wait for the component to be mounted before reading the storage.
   *
   * @default false
   */
  initOnMounted?: boolean;
}

export function useStorage(
  key: string,
  initialValue: string,
  storage: Storage,
  options?: UseStorageOptions<string>,
): [string, (value: string | null | ((oldValue: string) => string | null)) => void];
export function useStorage(
  key: string,
  initialValue: boolean,
  storage: Storage,
  options?: UseStorageOptions<boolean>,
): [boolean, (value: boolean | null | ((oldValue: boolean) => boolean | null)) => void];
export function useStorage(
  key: string,
  initialValue: number,
  storage: Storage,
  options?: UseStorageOptions<number>,
): [number, (value: number | null | ((oldValue: number) => number | null)) => void];
export function useStorage<T>(
  key: string,
  initialValue: T,
  storage: Storage,
  options?: UseStorageOptions<T>,
): [T, (value: T | null | ((oldValue: T) => T | null)) => void];
export function useStorage<T = unknown>(
  key: string,
  initialValue: T,
  storage: Storage,
  options?: UseStorageOptions<T>,
): [T, (value: T | null | ((oldValue: T) => T | null)) => void];

/**
 * React hook to access browser storage ({@link localStorage} or {@link sessionStorage}) reactively.
 *
 * @param key The storage key to use for storing the value
 * @param initialValue The initial value to use if the key doesn't exist in storage
 * @param storage Which storage to use (e.g. `localStorage` or `sessionStorage`)
 * @param options Configuration options for the hook
 *
 * @returns
 * A tuple containing:
 * - `[0]` - The current stored value from storage
 * - `[1]` - Setter function (accepts value or updater function)
 *
 * @example
 * ```ts
 * // Basic usage with string
 * const [storedName, setStoredName] = useStorage('userName', 'Anonymous')
 * setStoredName('John') // Updates storage and state
 * ```
 *
 * @example
 * ```ts
 * // Basic usage with number
 * const [storedAge, setStoredAge] = useStorage('userAge', 30)
 * ```
 *
 * @example
 * ```ts
 * // Basic usage with objects
 * const [storedUser, setStoredUser] = useStorage('user', { id: 1, name: 'John' })
 * setStoredUser(prev => ({ ...prev, name: 'Jane' }))
 * ```
 *
 * @example
 * ```ts
 * // Basic usage with sessionStorage
 * const [storedToken, setStoredToken] = useStorage('authToken', '', { storage: sessionStorage })
 * ```
 *
 * @example
 * ```ts
 * // Delete item from storage
 * const [storedAuthToken, setStoredAuthToken] = useStorage('authToken', 'abc123')
 * setStoredAuthToken(null) // Removes the item from storage
 * ```
 *
 * @example
 * ```ts
 * // Custom error handling
 * const [data, setData] = useStorage('data', {}, {
 *   onError: (error) => console.error('Storage error:', error)
 * })
 * ```
 *
 * @see https://vueuse.org/useStorage
 * @see https://github.com/vueuse/vueuse/tree/239213152c3b43e01eeb7e7dbc4168c5cae4339c/packages/core/useStorage
 */
export function useStorage<T extends string | number | boolean | object | null>(
  key: string,
  initialValue: T,
  storage: Storage,
  options: UseStorageOptions<T> = {},
): [T, (value: T | ((oldValue: T) => T)) => void] {
  const {
    listenToStorageChanges = true,
    writeInitialValue = true,
    mergeInitialValue = false,
    onError = (e) => {
      console.error(e);
    },
  } = options;

  const {
    type,
    read: serializerRead,
    write: serializerWrite,
  } = useSerializer(initialValue, {
    onError,
    serializer: options.serializer,
  });

  const getStoredValue = useCallback((): T => {
    try {
      const rawValue = storage.getItem(key);

      if (rawValue == null) {
        if (writeInitialValue && initialValue != null) {
          storage.setItem(key, serializerWrite(initialValue));
        }

        return initialValue;
      }

      const value = serializerRead(rawValue);

      if (mergeInitialValue) {
        if (typeof mergeInitialValue === "function") {
          return mergeInitialValue(value, initialValue);
        }

        if (type === "object" && !Array.isArray(value)) {
          return {
            ...(initialValue as object),
            ...(value as T[]),
          } as T;
        }
      }

      return value;
    } catch (error) {
      onError(error);

      return initialValue;
    }
  }, [
    storage,
    key,
    writeInitialValue,
    initialValue,
    serializerRead,
    serializerWrite,
    mergeInitialValue,
    type,
    onError,
  ]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  const dispatchStorageEvent = useCallback(
    (oldValue: string | null, newValue: string | null): void => {
      if (typeof window !== "undefined") {
        const storageEvent = new StorageEvent("storage", {
          key,
          oldValue,
          newValue,
          storageArea: storage ?? null,
        });

        window.dispatchEvent(storageEvent);
      }
    },
    [key, storage],
  );

  const writeToStorage = useCallback(
    (v: T): void => {
      try {
        const oldValue = storage.getItem(key);

        if (v == null) {
          storage.removeItem(key);

          dispatchStorageEvent(oldValue, null);
        } else {
          const serialized = serializerWrite(v);

          if (oldValue !== serialized) {
            storage.setItem(key, serialized);

            dispatchStorageEvent(oldValue, serialized);
          }
        }
      } catch (e) {
        onError(e);
      }
    },
    [storage, key, serializerWrite, onError, dispatchStorageEvent],
  );

  useEffect(() => {
    if (!listenToStorageChanges) {
      return;
    }

    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key !== key || event.storageArea !== storage) {
        return;
      }

      try {
        if (event.newValue == null) {
          setStoredValue(initialValue);
        } else {
          const newVal = serializerRead(event.newValue);
          setStoredValue(newVal);
        }
      } catch (e) {
        onError(e);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, listenToStorageChanges, initialValue, serializerRead, storage, onError]);

  const updateValue = useCallback(
    (value: T | ((oldValue: T) => T)): void => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);
      writeToStorage(valueToStore);
    },
    [storedValue, writeToStorage],
  );

  return [storedValue, updateValue];
}
