import { createRef } from "react";
import { describe, expect, test } from "vitest";

import { isRef, unwrapRef } from "./react";

describe("isRef", () => {
  test("identifies React refs", () => {
    const ref = createRef<string | null>();

    expect(isRef(ref)).toBeTruthy();
  });

  test("rejects null and primitive values", () => {
    expect(isRef(null)).toBeFalsy();
    expect(isRef("value")).toBeFalsy();
  });
});

describe("unwrapRef", () => {
  test("unwraps the current value from a React ref", () => {
    const ref = createRef<string | null>();
    ref.current = "value";

    expect(unwrapRef(ref)).toBe("value");
  });

  test("returns a non-ref value unchanged", () => {
    const value = { message: "hello" };

    expect(unwrapRef(value)).toBe(value);
  });
});
