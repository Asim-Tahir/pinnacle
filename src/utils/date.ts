export function parseDate(date: Date | string) {
  if (date instanceof Date) {
    return date.getTime();
  }

  return Date.parse(date);
}

export function toDate(date: Date | string | number): Date {
  if (date instanceof Date) {
    return date;
  }

  return new Date(date);
}

export function shortFormatDate(date: Date | null | undefined) {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(date);
}

export function elapsedDays(timestamp: Date | string, now: number): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, (now - parseDate(timestamp)) / millisecondsPerDay);
}

export function compareDates(
  left: Date | string,
  right: Date | string,
  order: "asc" | "desc" = "desc",
): number {
  switch (order) {
    case "desc":
      return parseDate(right) - parseDate(left);

    case "asc":
      return parseDate(left) - parseDate(right);

    default:
      return 0;
  }
}
