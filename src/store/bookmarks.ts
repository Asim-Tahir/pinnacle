import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { BOOKMARK_STORAGE_KEY, BOOKMARK_STORAGE_VERSION } from "@/constants";
import { BookmarkType } from "@/enums";
import {
  Bookmark,
  type IBookmarkSerializable,
  type ICreateBookmark,
  type IUpdateBookmark,
} from "@/models";

export interface BookmarkStoreState {
  bookmarks: Bookmark[];
  hydrated: boolean;
  persistenceError: string | null;
  hydrate: () => Promise<void>;
  createBookmark: (data: ICreateBookmark) => Promise<Bookmark>;
  updateBookmark: (id: string, data: IUpdateBookmark) => Promise<Bookmark>;
  partialUpdateBookmark: (id: string, data: Partial<IUpdateBookmark>) => Promise<Bookmark>;
  archiveBookmark: (id: string) => Promise<Bookmark>;
  restoreBookmark: (id: string) => Promise<Bookmark>;
  deleteBookmark: (id: string) => Promise<void>;
  viewBookmark: (id: string) => Promise<Bookmark>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to save bookmarks.";
}

function deserializeBookmarks(records: unknown): Bookmark[] {
  if (!Array.isArray(records)) {
    throw new Error("Saved bookmark data has an invalid format.");
  }

  return records.map((record) => {
    const data = record instanceof Bookmark ? record.toJSON() : (record as IBookmarkSerializable);
    return Bookmark.fromJSON({ ...data, type: data.type ?? BookmarkType.Active });
  });
}

export function createBookmarkStore(storage: Storage = localStorage) {
  let suppressPersistence = false;
  let hydrationFailure: { error: unknown } | undefined;

  return create<BookmarkStoreState>()(
    persist(
      (set, get, api) => {
        let writeQueue = Promise.resolve();
        let hydration: Promise<void> | undefined;

        const setWithoutPersistence = (state: Partial<BookmarkStoreState>) => {
          suppressPersistence = true;
          try {
            set(state);
          } finally {
            suppressPersistence = false;
          }
        };

        const commit = <T>(
          operation: (bookmarks: Bookmark[]) => { bookmarks: Bookmark[]; result: T },
        ): Promise<T> => {
          const task = writeQueue.then(async () => {
            if (!get().hydrated) {
              throw new Error("Bookmarks must be hydrated before they can be changed.");
            }

            const previous = get().bookmarks;
            try {
              const next = operation(previous);
              set({
                bookmarks: next.bookmarks,
                persistenceError: null,
              });
              return next.result;
            } catch (error) {
              setWithoutPersistence({
                bookmarks: previous,
                persistenceError: errorMessage(error),
              });
              throw error;
            }
          });

          writeQueue = task.then(
            () => undefined,
            () => undefined,
          );
          return task;
        };

        const updateOne = (
          id: string,
          bookmarks: Bookmark[],
          update: (bookmark: Bookmark) => void,
        ): { bookmarks: Bookmark[]; result: Bookmark } => {
          const index = bookmarks.findIndex((bookmark) => bookmark.id === id);
          if (index === -1) {
            throw new Error("Bookmark not found.");
          }

          const updatedBookmark = bookmarks[index].clone();
          update(updatedBookmark);

          const nextBookmarks = structuredClone(bookmarks);
          nextBookmarks[index] = updatedBookmark;

          return {
            bookmarks: nextBookmarks,
            result: updatedBookmark,
          };
        };

        return {
          bookmarks: [],
          hydrated: false,
          persistenceError: null,
          hydrate: () => {
            if (hydration) {
              return hydration;
            }

            hydrationFailure = undefined;
            hydration = Promise.resolve(api.persist.rehydrate())
              .then(() => {
                if (hydrationFailure) {
                  throw hydrationFailure.error;
                }

                setWithoutPersistence({ hydrated: true, persistenceError: null });
              })
              .catch((error: unknown) => {
                setWithoutPersistence({ hydrated: false, persistenceError: errorMessage(error) });
                hydration = undefined;
                throw error;
              });

            return hydration;
          },
          createBookmark: (data) => {
            const bookmark = new Bookmark(
              BookmarkType.Active,
              data.url,
              data.name ?? "",
              data.description,
              data.tags,
            );

            return commit((bookmarks) => ({
              bookmarks: [...bookmarks, bookmark],
              result: bookmark,
            }));
          },
          updateBookmark: (id, data) =>
            commit((bookmarks) =>
              updateOne(id, bookmarks, (bookmark) => {
                if (bookmark.isArchived) {
                  throw new Error("Archived bookmarks cannot be edited.");
                }

                bookmark.update(data);
              }),
            ),
          partialUpdateBookmark: (id, data) =>
            commit((bookmarks) =>
              updateOne(id, bookmarks, (bookmark) => {
                if (bookmark.isArchived) {
                  throw new Error("Archived bookmarks cannot be edited.");
                }

                bookmark.partialUpdate(data);
              }),
            ),
          archiveBookmark: (id) =>
            commit((bookmarks) =>
              updateOne(id, bookmarks, (bookmark) => {
                if (!bookmark.isArchived) {
                  bookmark.archive();
                }
              }),
            ),
          restoreBookmark: (id) =>
            commit((bookmarks) =>
              updateOne(id, bookmarks, (bookmark) => {
                if (bookmark.isArchived) {
                  bookmark.unarchive();
                }
              }),
            ),
          deleteBookmark: (id) =>
            commit((bookmarks) => {
              if (!bookmarks.some((bookmark) => bookmark.id === id)) {
                throw new Error("Bookmark not found.");
              }
              return {
                bookmarks: bookmarks.filter((bookmark) => bookmark.id !== id),
                result: undefined,
              };
            }),
          viewBookmark: (id) =>
            commit((bookmarks) => updateOne(id, bookmarks, (bookmark) => bookmark.view())),
        };
      },
      {
        name: BOOKMARK_STORAGE_KEY,
        version: BOOKMARK_STORAGE_VERSION,
        storage: createJSONStorage<{ bookmarks: Bookmark[] }>(() => ({
          getItem: (name) => storage.getItem(name),
          setItem: (name, value) => {
            if (!suppressPersistence) {
              storage.setItem(name, value);
            }
          },
          removeItem: (name) => storage.removeItem(name),
        })),
        partialize: (state) => ({ bookmarks: state.bookmarks }),
        skipHydration: true,
        onRehydrateStorage: () => {
          hydrationFailure = undefined;

          return (_state, error) => {
            if (error !== undefined) {
              hydrationFailure = { error };
            }
          };
        },
        migrate: (persistedState, version) => {
          if (version < 0 || version > BOOKMARK_STORAGE_VERSION) {
            throw new Error("Saved bookmark data uses an unsupported version.");
          }

          return persistedState as { bookmarks: Bookmark[] };
        },
        merge: (persistedState, currentState) => {
          const data = persistedState as { bookmarks?: unknown } | undefined;
          return {
            ...currentState,
            bookmarks: data?.bookmarks === undefined ? [] : deserializeBookmarks(data.bookmarks),
          };
        },
      },
    ),
  );
}

export const useBookmarksStore = createBookmarkStore();
