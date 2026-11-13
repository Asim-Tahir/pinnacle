export function isRef<T = unknown>(value: T | React.RefObject<T>): value is React.RefObject<T> {
  return typeof value === "object" && value !== null && "current" in value;
}

export function unwrapRef<T>(value: MaybeRef<T>): T {
  return isRef(value) ? value.current : value;
}
