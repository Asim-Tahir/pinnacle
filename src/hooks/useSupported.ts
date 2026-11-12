/**
 *
 * @__NO_SIDE_EFFECTS__
 *
 * @param callback
 * @returns
 */

import { useMemo } from "react";

/* @__NO_SIDE_EFFECTS__ */
export function useSupported(callback: () => boolean): boolean {
  const isSupported = useMemo(() => {
    try {
      if (typeof callback !== "function") {
        return false;
      }

      const result = callback();

      return Boolean(result);
    } catch {
      return false;
    }
  }, [callback]);

  return isSupported;
}
