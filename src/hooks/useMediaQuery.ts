import { useEffect, useRef, useState } from "react";

import { defaultWindow, type ConfigurableWindow } from "@/hooks/_configurable";
import { useEventListener } from "@/hooks/useEventListener";
import { useSupported } from "@/hooks/useSupported";

export interface UseMediaQueryOptions extends ConfigurableWindow {}

/**
 * Reactive Media Query.
 *
 * @param query
 * @param options
 */
export function useMediaQuery(query: string, options: UseMediaQueryOptions = {}): boolean {
  const { window = defaultWindow } = options;
  const isSupported = useSupported(
    () => window && "matchMedia" in window && typeof window.matchMedia === "function",
  );

  const mediaQuery = useRef<MediaQueryList>(window?.matchMedia?.(query));
  const [matches, setMatches] = useState(false);

  const handler = (event: MediaQueryListEvent) => {
    setMatches(event.matches);
  };

  useEffect(() => {
    if (!isSupported) return;

    mediaQuery.current = window.matchMedia(query);
    setMatches(mediaQuery.current.matches);
  }, [isSupported, window, query]);

  useEventListener(mediaQuery, "change", handler, { passive: true });

  return matches;
}
