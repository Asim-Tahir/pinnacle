import { useCallback, useEffect } from "react";

export interface GenericEventMap {
  [key: string]: Event;
}

export type WindowEventName = keyof WindowEventMap;
export type DocumentEventName = keyof DocumentEventMap;
export type ShadowRootEventName = keyof ShadowRootEventMap;
export type HTMLElementEventName = keyof HTMLElementEventMap;
export type CookieStoreEventName = keyof CookieStoreEventMap;
export type BroadcastChannelEventName = keyof BroadcastChannelEventMap;

export interface UseEventListenerReturn {
  /**
   * Subscribe to the event listener(s) on the target.
   * @returns subscribe function to add the event listener(s) to the target.
   */
  subscribe: () => void;
  /**
   * Unsubscribe from the event listener(s) on the target.
   * @returns unsubscribe function to remove the event listener(s) from the target.
   */
  unsubscribe: () => void;
}

/**
 * Attaches event listener(s) to the target on mount and automatically removes them on unmount.
 *
 * @param target The event target to which the event listener(s) will be added.
 * @param event The event name(s) to listen for.
 * @param listener The event listener function(s) to be called when the event(s) are triggered.
 * @param options An optional object specifying characteristics about the event listener.
 * @returns An object containing subscribe and unsubscribe functions to manage the event listener(s).
 *
 * @example
 * ```ts
 * import { useEventListener } from "@/hooks/use-event-listener";
 *
 * export function MyComponent() {
 *   const handleClick = (event: MouseEvent) => {
 *     console.log("Window clicked!", event);
 *   };
 *
 *   const { unsubscribe } = useEventListener(window, "click", handleClick);
 *
 *   return <div>
 *     Click anywhere in the window to see the event in the console.
 *     <button onClick={() => unsubscribe()}>Unsubscribe Click Event</button>
 *   </div>;
 * }
 * ```
 */
// @ts-expect-error - TypeScript gets confused with this and can't infer the correct overload
export function useEventListener<E extends WindowEventName>(
  target: Window,
  event: Arrayable<E>,
  listener: Arrayable<(this: Window, event: WindowEventMap[E]) => void>,
  options?: boolean | AddEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<E extends DocumentEventName>(
  target: Document,
  event: Arrayable<E>,
  listener: Arrayable<(this: Document, event: DocumentEventMap[E]) => void>,
  options?: boolean | AddEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<E extends ShadowRootEventName>(
  target: ShadowRoot,
  event: Arrayable<E>,
  listener: Arrayable<(this: ShadowRoot, event: ShadowRootEventMap[E]) => void>,
  options?: boolean | AddEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<E extends HTMLElementEventName>(
  target: HTMLElement,
  event: Arrayable<E>,
  listener: Arrayable<(this: HTMLElement, event: HTMLElementEventMap[E]) => void>,
  options?: boolean | AddEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<E extends CookieStoreEventName>(
  target: CookieStore,
  event: Arrayable<E>,
  listener: Arrayable<(this: CookieStore, event: CookieStoreEventMap[E]) => void>,
  options?: boolean | AddEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<E extends BroadcastChannelEventName>(
  target: BroadcastChannel,
  event: Arrayable<E>,
  listener: Arrayable<(this: BroadcastChannel, event: BroadcastChannelEventMap[E]) => void>,
  options?: boolean | AddEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<
  E extends string = string,
  T extends EventTarget = EventTarget,
  EV extends Event = Event,
>(
  target: T,
  event: Arrayable<E>,
  listener: Arrayable<(this: T, event: EV) => void>,
  options?: boolean | AddEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<E extends string>(
  target: EventTarget,
  event: Arrayable<E>,
  listener: Arrayable<(this: EventTarget, event: Event) => void>,
  options?: boolean | AddEventListenerOptions,
): UseEventListenerReturn {
  const unsubscribe = useCallback(() => {
    const events = Array.isArray(event) ? event : [event];
    const listeners = Array.isArray(listener) ? listener : [listener];

    for (const event of events) {
      for (const listener of listeners) {
        target.removeEventListener(event, listener, options);
      }
    }
  }, [target, event, listener, options]);

  const subscribe = useCallback(() => {
    const events = Array.isArray(event) ? event : [event];
    const listeners = Array.isArray(listener) ? listener : [listener];

    for (const event of events) {
      for (const listener of listeners) {
        target.addEventListener(event, listener, options);
      }
    }

    return unsubscribe;
  }, [target, event, listener, options, unsubscribe]);

  useEffect(() => {
    const unsubscribe = subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  return {
    subscribe,
    unsubscribe,
  };
}
