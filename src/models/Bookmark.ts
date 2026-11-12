import { BookmarkType } from "@/enums";
import { type IArchivable, type IViewable, Archivable, Viewable, mixins } from "@/mixins";
import { normalizeBookmarkURL } from "@/utils/bookmark";
import { toDate } from "@/utils/date";

export interface IBookmark extends IArchivable, IViewable {
  id: string;
  type: BookmarkType;
  url: string | URL;
  name: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date | null;
}

export interface IBookmarkSerializable {
  id: string;
  type: BookmarkType;
  url: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string | null;
  archivedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
}

export type ICreateBookmark = Pick<IBookmark, "url" | "name" | "description" | "tags">;
export type IUpdateBookmark = Pick<IBookmark, "url" | "name" | "description" | "tags">;

export class Bookmark extends mixins(Archivable, Viewable) implements Omit<IBookmark, "tags"> {
  id: string;
  /**
   * @default `BookmarkType.Active`
   */
  type: BookmarkType = BookmarkType.Active;
  url: string | URL;
  name: string;
  description: string;
  /**
   * @default Empty set
   */
  tags: Set<string> = new Set<string>();
  /**
   * @default instance creation date
   */
  createdAt: Date = new Date();
  /**
   * @default null
   */
  updatedAt: Date | null = null;

  constructor(
    type: BookmarkType,
    url: string | URL,
    name: string,
    description?: string,
    tags: string[] = [],
  ) {
    super();

    this.id = crypto.randomUUID();
    this.type = type;
    this.url = normalizeBookmarkURL(url);
    this.name = name;
    this.description = description ?? "";
    this.tags = new Set(Bookmark.normalizeTags(tags));
    this.createdAt = new Date();
    this.updatedAt = null;
  }

  private static normalizeTags(tags: readonly string[]): string[] {
    const seen = new Set<string>();

    return tags.reduce<string[]>((normalized, tag) => {
      const trimmed = tag.trim();
      const key = trimmed.toLowerCase();

      if (trimmed && !seen.has(key)) {
        normalized.push(trimmed);
        seen.add(key);
      }

      return normalized;
    }, []);
  }

  update(data: IUpdateBookmark) {
    this.url = normalizeBookmarkURL(data.url);
    this.name = data.name;
    this.description = data.description;
    this.tags = new Set(Bookmark.normalizeTags(data.tags));
    this.updatedAt = new Date();
  }

  partialUpdate(data: Partial<IUpdateBookmark>) {
    if (data.url !== undefined) {
      this.url = normalizeBookmarkURL(data.url);
    }

    if (data.name !== undefined) {
      this.name = data.name;
    }

    if (data.description !== undefined) {
      this.description = data.description;
    }

    if (data.tags !== undefined) {
      this.tags = new Set(Bookmark.normalizeTags(data.tags));
    }

    this.updatedAt = new Date();
  }

  archive() {
    this.type = BookmarkType.Archived;
    super.archive();
    this.updatedAt = new Date();
  }

  unarchive() {
    this.type = BookmarkType.Active;
    super.unarchive();
    this.updatedAt = new Date();
  }

  view() {
    super.view();
    this.updatedAt = new Date();
  }

  static fromJSON(data: IBookmarkSerializable) {
    const bookmark = new Bookmark(
      data.type,
      data.url,
      data.name,
      data.description,
      data.tags ?? [],
    );

    if (data.id) {
      bookmark.id = data.id;
    }

    bookmark.createdAt = data.createdAt ? toDate(data.createdAt) : new Date();
    bookmark.updatedAt = data.updatedAt ? toDate(data.updatedAt) : null;
    bookmark.archivedAt = data.archivedAt ? toDate(data.archivedAt) : null;
    if (typeof data.viewCount === "number") {
      bookmark.viewCount = data.viewCount;
    }
    if (data.lastViewedAt) {
      bookmark.lastViewedAt = toDate(data.lastViewedAt);
    }

    return bookmark;
  }

  toJSON(): IBookmarkSerializable {
    return {
      id: this.id,
      type: this.type,
      url: this.url.toString(),
      name: this.name,
      description: this.description,
      tags: Array.from(this.tags),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      archivedAt: this.archivedAt?.toISOString() ?? null,
      viewCount: this.viewCount,
      lastViewedAt: this.lastViewedAt?.toISOString() ?? null,
    };
  }

  clone(): Bookmark {
    return Bookmark.fromJSON(this.toJSON());
  }
}
