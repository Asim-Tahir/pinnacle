import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  Clock3,
  ExternalLink,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import "./BookmarkCard.css";

import { Favicon } from "@/components/favicon";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Bookmark } from "@/models";
import { displayBookmark } from "@/utils/bookmark";
import { shortFormatDate } from "@/utils/date";
import { toURL } from "@/utils/url";

export interface BookmarkCardProps {
  bookmark: Bookmark;
  archived: boolean;
  onOpen: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onArchive: (bookmark: Bookmark) => void;
  onRestore: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
}

export default function BookmarkCard({
  bookmark,
  archived,
  onOpen,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: BookmarkCardProps) {
  const url = toURL(bookmark.url);

  return (
    <Card className="bookmark-card" role="article">
      <CardHeader className="bookmark-card-header">
        <Favicon urlOrLink={url} />
        <button className="bookmark-card-title" type="button" onClick={() => onOpen(bookmark)}>
          <span>{displayBookmark(bookmark)}</span>
          <small>{url.hostname}</small>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="bookmark-card-menu-button"
              type="button"
              aria-label={`Actions for ${displayBookmark(bookmark)}`}
            >
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!archived && (
              <>
                <DropdownMenuItem onSelect={() => onEdit(bookmark)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onArchive(bookmark)}>
                  <Archive /> Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {archived && (
              <DropdownMenuItem onSelect={() => onRestore(bookmark)}>
                <ArchiveRestore /> Restore
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(bookmark)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <button className="bookmark-card-open-area" type="button" onClick={() => onOpen(bookmark)}>
        <span className="bookmark-card-description">
          {bookmark.description || "No description added."}
        </span>
        {bookmark.tags.size > 0 && (
          <span className="bookmark-card-tags">
            {[...bookmark.tags].map((tag) => (
              <span className="bookmark-card-tag-chip" key={tag}>
                {tag}
              </span>
            ))}
          </span>
        )}
      </button>

      <CardFooter className="bookmark-card-footer">
        <span title="Times opened">
          <Eye size={12} /> {bookmark.viewCount}
        </span>
        <span title="Last opened">
          <Clock3 size={12} /> {shortFormatDate(bookmark.lastViewedAt)}
        </span>
        <span title="Date saved">
          <CalendarDays size={12} /> {shortFormatDate(bookmark.createdAt)}
        </span>
        <a
          className="bookmark-card-external-link"
          href={bookmark.url.toString()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${displayBookmark(bookmark)} in a new tab`}
          onClick={(event) => {
            event.preventDefault();
            onOpen(bookmark);
          }}
        >
          <ExternalLink size={16} />
        </a>
      </CardFooter>
    </Card>
  );
}
