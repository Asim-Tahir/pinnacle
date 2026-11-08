import { BookmarkType } from "@/enums";
import { type IArchivable, type IViewable, Archivable, Viewable, mixins } from "@/mixins";

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

export type IUpdateBookmark = Pick<IBookmark, "type" | "url" | "name" | "description" | "tags">;

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
    this.url = Bookmark.normalizeURL(url);
    this.name = name;
    this.description = description ?? "";
    this.tags = new Set(Bookmark.normalizeTags(tags));
    this.createdAt = new Date();
    this.updatedAt = null;
  }

  private static normalizeURL(value: string | URL): string {
    let url: URL;

    try {
      url = new URL(value.toString().trim());
    } catch {
      throw new Error("Enter a valid absolute URL.");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Bookmark URLs must use HTTP or HTTPS.");
    }

    return url.toString();
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
    this.type = data.type;

    this.name = data.name;

    this.description = data.description;

    for (const tag of data.tags) {
      this.tags.add(tag);
    }

    this.updatedAt = new Date();
  }

  partialUpdate(data: Partial<IUpdateBookmark>) {
    if (data?.type) {
      this.type = data.type;
    }

    if (data?.name) {
      this.name = data.name;
    }

    if (data?.description) {
      this.description = data.description;
    }

    if (data?.tags) {
      for (const tag of data.tags) {
        this.tags.add(tag);
      }
    }

    this.updatedAt = new Date();
  }

  archive() {
    this.type = BookmarkType.Archived;

    super.archive();
  }

  unarchive() {
    this.type = BookmarkType.Active;

    super.unarchive();
  }

  static fromJSON(data: IBookmark) {
    const bookmark = new Bookmark(data.type, data.url, data.name, data.description, data.tags);

    if (data.id) {
      bookmark.id = data.id;
    }

    if (data.createdAt) {
      bookmark.createdAt = data.createdAt;
    }

    if (data.updatedAt) {
      bookmark.updatedAt = data.updatedAt;
    }

    // #region Archivable
    if (data.archivedAt) {
      bookmark.archivedAt = data.archivedAt;
    }
    // #endregion

    // #region Viewable
    if (typeof data.viewCount === "number") {
      bookmark.viewCount = data.viewCount;
    }

    if (data.lastViewedAt) {
      bookmark.lastViewedAt = data.lastViewedAt;
    }
    // #endregion

    return bookmark;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
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
}
