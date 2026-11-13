declare global {
  export type MaybeGetter<T> = T | (() => T);
  export type MaybeRef<T> = T | React.RefObject<T>;
}

export {};
