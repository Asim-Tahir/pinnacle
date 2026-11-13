import { z } from "zod";

export const bookmarkUrlArgsSchema = z
  .url()
  .trim()
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    message: "Bookmark URLs must use HTTP or HTTPS.",
  });

export const bookmarkIdInputSchema = z
  .object({
    bookmarkId: z.uuidv4(),
  })
  .strict();

export const listBookmarksInputSchema = z
  .object({
    query: z.string().trim().optional(),
    status: z.enum(["all", "active", "archived"]).optional(),
  })
  .strict();

export const createBookmarkInputSchema = z
  .object({
    url: bookmarkUrlArgsSchema,
    name: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

export const updateBookmarkInputSchema = z
  .object({
    ...bookmarkIdInputSchema.shape,
    url: bookmarkUrlArgsSchema,
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
  })
  .strict();

export const partialUpdateBookmarkInputSchema = z
  .object({
    ...bookmarkIdInputSchema.shape,
    url: bookmarkUrlArgsSchema.optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict()
  .refine(
    ({ url, name, description, tags }) =>
      url !== undefined || name !== undefined || description !== undefined || tags !== undefined,
    { message: "Provide at least one field to update." },
  );

export const deleteBookmarkInputSchema = z
  .object({
    ...bookmarkIdInputSchema.shape,
    confirm: z.boolean().refine((value) => value, {
      message: "Permanent deletion requires confirm: true.",
    }),
  })
  .strict();

export type BookmarkIdInputSchema = z.infer<typeof bookmarkIdInputSchema>;
export type ListBookmarksInputSchema = z.infer<typeof listBookmarksInputSchema>;
export type CreateBookmarkInputSchema = z.infer<typeof createBookmarkInputSchema>;
export type UpdateBookmarkInputSchema = z.infer<typeof updateBookmarkInputSchema>;
export type PartialUpdateBookmarkInputSchema = z.infer<typeof partialUpdateBookmarkInputSchema>;
export type ArchiveBookmarkInputSchema = BookmarkIdInputSchema;
export type RestoreBookmarkInputSchema = BookmarkIdInputSchema;
export type DeleteBookmarkInputSchema = z.infer<typeof deleteBookmarkInputSchema>;
export type OpenBookmarkInputSchema = BookmarkIdInputSchema;
