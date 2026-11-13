import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import "virtual:uno.css";

import App from "@/App";
import { DARK_THEME_CLASS, LIGHT_THEME_CLASS, THEME_STORAGE_KEY } from "@/constants/theme";
import { BookmarkDialogProvider } from "@/contexts/BookmarkDialog";
import { BookmarkManagerProvider } from "@/contexts/BookmarkManager";

function TestApp() {
  return (
    <BookmarkManagerProvider>
      <BookmarkDialogProvider>
        <App />
      </BookmarkDialogProvider>
    </BookmarkManagerProvider>
  );
}

describe("bookmark dashboard", () => {
  test("renders the bookmark manager home view", async () => {
    const screen = await page.render(<TestApp />);

    await expect.element(screen.getByRole("heading", { name: "All bookmarks" })).toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "A good link belongs here" }))
      .toHaveAttribute("data-slot", "empty-title");
    await expect.element(screen.getByPlaceholder("Search by title...")).toBeVisible();
  });

  test("switches and persists the selected color theme", async () => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    const screen = await page.render(<TestApp />);

    await screen.getByRole("button", { name: "Theme: system" }).click();
    await screen.getByRole("menuitemradio", { name: "Dark" }).click();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(true);
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBe(false);

    await screen.getByRole("button", { name: "Theme: dark" }).click();
    await screen.getByRole("menuitemradio", { name: "Light" }).click();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(false);
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBe(true);
    localStorage.removeItem(THEME_STORAGE_KEY);
  });

  test("confirms bookmark deletion with an alert dialog", async () => {
    const screen = await page.render(<TestApp />);

    await screen.getByRole("button", { name: "Add bookmark" }).click();
    await screen.getByPlaceholder("example.com").fill("atlas.example/");
    await screen.getByPlaceholder("A name to remember it by").fill("Atlas");
    const tagInput = screen.getByRole("textbox", { name: "Tags" });
    await tagInput.fill("Design, Reading");
    tagInput.element().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await screen.getByRole("button", { name: "Reading" }).click();
    await screen.getByRole("button", { name: "Add bookmark" }).click();

    const bookmarkCard = screen.getByRole("article");
    await expect.element(bookmarkCard.getByText("Design", { exact: true })).toBeVisible();
    await expect
      .element(bookmarkCard.getByText("Reading", { exact: true }))
      .not.toBeInTheDocument();

    await screen.getByRole("button", { name: "Actions for Atlas" }).click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await expect.element(screen.getByRole("alertdialog")).toBeVisible();
    await expect.element(screen.getByText(/Permanently delete.*Atlas/)).toBeVisible();

    await screen.getByRole("button", { name: "Cancel" }).click();
    await expect.element(screen.getByRole("article")).toBeVisible();

    await screen.getByRole("button", { name: "Actions for Atlas" }).click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await screen.getByRole("button", { name: "Delete bookmark" }).click();
    await expect.element(screen.getByRole("article")).not.toBeInTheDocument();
  });
});
