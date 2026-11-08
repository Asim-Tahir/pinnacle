export const BookmarkType = {
  Active: "bookmark::active",
  Archived: "bookmark::archived",
} as const;

export type BookmarkType = (typeof BookmarkType)[keyof typeof BookmarkType];
