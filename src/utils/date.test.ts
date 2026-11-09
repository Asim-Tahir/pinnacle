import { describe, expect, test } from "vitest";

import { compareDates, elapsedDays, parseDate, toDate } from "./date";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

describe("parseDate", () => {
  test("returns the timestamp for a Date instance", () => {
    const date = new Date("2026-01-31T12:00:00.000Z");

    expect(parseDate(date)).toBe(date.getTime());
  });

  test("parses a date string into milliseconds since the Unix epoch", () => {
    expect(parseDate("2026-01-31T12:00:00.000Z")).toBe(Date.UTC(2026, 0, 31, 12));
  });

  test("returns NaN for an invalid date string", () => {
    expect(parseDate("not a date")).toBeNaN();
  });
});

describe("toDate", () => {
  test("returns the same Date instance", () => {
    const date = new Date("2026-01-31T12:00:00.000Z");

    expect(toDate(date)).toBe(date);
  });

  test("converts a date string to a Date", () => {
    expect(toDate("2026-01-31T12:00:00.000Z")).toEqual(new Date("2026-01-31T12:00:00.000Z"));
  });

  test("converts a numeric timestamp to a Date", () => {
    const timestamp = Date.UTC(2026, 0, 31, 12);

    expect(toDate(timestamp)).toEqual(new Date(timestamp));
  });
});

describe("elapsedDays", () => {
  const now = Date.UTC(2026, 0, 31, 12);

  test("returns elapsed whole days for a Date timestamp", () => {
    const timestamp = new Date(now - 3 * millisecondsPerDay);

    expect(elapsedDays(timestamp, now)).toBe(3);
  });

  test("returns fractional days for a date string", () => {
    const timestamp = new Date(now - 12 * 60 * 60 * 1000).toISOString();

    expect(elapsedDays(timestamp, now)).toBe(0.5);
  });

  test("returns zero when the timestamp is in the future", () => {
    const timestamp = new Date(now + millisecondsPerDay);

    expect(elapsedDays(timestamp, now)).toBe(0);
  });

  test("returns NaN for an invalid timestamp", () => {
    expect(elapsedDays("not a date", now)).toBeNaN();
  });
});

describe("compareDates", () => {
  const earlier = "2026-01-30T12:00:00.000Z";
  const later = new Date("2026-01-31T12:00:00.000Z");

  test("compares dates in descending order", () => {
    expect(compareDates(later, earlier, "desc")).toBe(-millisecondsPerDay);
    expect(compareDates(earlier, later, "desc")).toBe(millisecondsPerDay);
  });

  test("compares dates in ascending order", () => {
    expect(compareDates(later, earlier, "asc")).toBe(millisecondsPerDay);
    expect(compareDates(earlier, later, "asc")).toBe(-millisecondsPerDay);
  });

  test("defaults to descending order", () => {
    expect(compareDates(later, earlier)).toBe(-millisecondsPerDay);
  });

  test("returns zero for equal timestamps", () => {
    expect(compareDates(earlier, new Date(earlier))).toBe(0);
  });

  test("returns NaN when either timestamp is invalid", () => {
    expect(compareDates("not a date", later)).toBeNaN();
  });
});
