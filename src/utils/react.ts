export function unwrapGetter<T>(value: MaybeGetter<T>): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function isRef<T = unknown>(value: T | React.RefObject<T>): value is React.RefObject<T> {
  return typeof value === "object" && value !== null && "current" in value;
}

export function unwrapRef<T>(value: MaybeRef<T>): T {
  return isRef(value) ? value.current : value;
}
