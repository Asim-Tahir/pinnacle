import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  Clock3,
  ExternalLink,
  Eye,
  MoreVertical,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Favicon } from "@/components/favicon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBookmarkDialog } from "@/hooks/useBookmarkDialog";
import { useBookmarkManager } from "@/hooks/useBookmarkManager";
import type { Bookmark } from "@/models";
import { displayBookmark } from "@/utils/bookmark";
import { shortFormatDate } from "@/utils/date";
import { toURL } from "@/utils/url";

import "./BookmarkCard.css";

export interface BookmarkCardProps {
  bookmark: Bookmark;
  archived: boolean;
}

export default function BookmarkCard({ bookmark, archived }: BookmarkCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { openBookmark, archiveBookmark, restoreBookmark, deleteBookmark } = useBookmarkManager();
  const { openEditDialog } = useBookmarkDialog();

  const url = toURL(bookmark.url);

  return (
    <Card className="bookmark-card" role="article">
      <CardHeader className="bookmark-card-header">
        <Favicon urlOrLink={url} />
        <div className="bookmark-card-title">
          <span>{displayBookmark(bookmark)}</span>
          <small>{url.hostname}</small>
        </div>
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
                <DropdownMenuItem onSelect={() => openEditDialog(bookmark)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void archiveBookmark(bookmark)}>
                  <Archive /> Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {archived && (
              <DropdownMenuItem onSelect={() => void restoreBookmark(bookmark)}>
                <ArchiveRestore /> Restore
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteDialogOpen(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <div className="bookmark-card-body">
        <span className="bookmark-card-description">
          {bookmark.description || "No description added."}
        </span>
        {bookmark.tags.size > 0 && (
          <span className="bookmark-card-tags">
            {[...bookmark.tags].map((tag) => (
              <span className="bookmark-card-tag-chip" key={tag}>
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </span>
        )}
      </div>

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
            void openBookmark(bookmark);
          }}
        >
          <ExternalLink size={16} />
        </a>
      </CardFooter>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete “{displayBookmark(bookmark)}”? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void deleteBookmark(bookmark)}>
              Delete bookmark
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
