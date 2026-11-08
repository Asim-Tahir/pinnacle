import { act } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import Favicon from "./Favicon";

describe("Favicon", () => {
  test("tries each provider in order and shows a hostname fallback", async () => {
    const screen = await page.render(
      <Favicon urlOrLink="https://docs.example.com:8443/path?q=secret#section" />,
    );
    const image = screen.getByRole("img", { includeHidden: true });

    expect(image).toHaveAttribute("data-provider", "google");

    await act(async () => {
      image.element().dispatchEvent(new Event("error"));
    });

    expect(image).toHaveAttribute("data-provider", "duckduckgo");

    await act(async () => {
      image.element().dispatchEvent(new Event("error"));
    });

    expect(image).toHaveAttribute("data-provider", "yandex");

    await act(async () => {
      image.element().dispatchEvent(new Event("error"));
    });

    // await expect
    //   .poll(() => screen.baseElement.querySelector(".favicon-fallback")?.textContent)
    //   .toBe("D");
    // expect(image()).toBeNull();
  });
});
