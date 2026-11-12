import { ArrowDownWideNarrow, Bookmark as BookmarkIcon, Plus } from "lucide-react";

import "@/App.css";

import BookmarkCard from "@/components/BookmarkCard";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { BookmarkSortMode } from "@/contexts/BookmarkManager";
import { useBookmarkDialog } from "@/hooks/useBookmarkDialog";
import { useBookmarkManager } from "@/hooks/useBookmarkManager";

function App() {
  const {
    hydrated,
    persistenceError,
    view,
    query,
    selectedTags,
    sortMode,
    setSortMode,
    visibleBookmarks,
    actionError,
    blockedUrl,
  } = useBookmarkManager();
  const { openCreateDialog } = useBookmarkDialog();

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-column">
        <Header />

        <main className="main-content">
          <div className="content-heading">
            <div>
              <h1>{view === "active" ? "All bookmarks" : "Archived bookmarks"}</h1>
            </div>
            {view === "active" && (
              <label className="sort-control">
                <ArrowDownWideNarrow size={16} />
                <span className="sort-label">Sort by</span>
                <select
                  aria-label="Sort bookmarks"
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as BookmarkSortMode)}
                >
                  <option value="recommended">Recommended</option>
                  <option value="recent">Recently viewed</option>
                  <option value="name">Name</option>
                </select>
              </label>
            )}
          </div>

          {(persistenceError || actionError) && (
            <p className="status-message" role="alert">
              {actionError || persistenceError}
            </p>
          )}
          {blockedUrl && (
            <p className="status-message" role="status">
              Pop-up blocked.{" "}
              <a href={blockedUrl} target="_blank" rel="noopener noreferrer">
                Open bookmark
              </a>
            </p>
          )}

          {!hydrated ? (
            <div className="library-message" role="status">
              Loading your bookmarks...
            </div>
          ) : visibleBookmarks.length > 0 ? (
            <section
              className="bookmark-grid"
              aria-label={view === "active" ? "Bookmarks" : "Archived bookmarks"}
            >
              {visibleBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  archived={view === "archived"}
                />
              ))}
            </section>
          ) : (
            <Empty className="library-empty">
              <EmptyHeader>
                <EmptyMedia className="empty-mark">
                  <BookmarkIcon size={24} />
                </EmptyMedia>
                <EmptyTitle>
                  {query || selectedTags.length > 0
                    ? "No matching bookmarks"
                    : view === "archived"
                      ? "Nothing archived yet"
                      : "A good link belongs here"}
                </EmptyTitle>
                <EmptyDescription>
                  {query || selectedTags.length > 0
                    ? "Try a different search or clear your tag filters."
                    : view === "archived"
                      ? "Bookmarks you archive will be kept here."
                      : "Keep the pages you come back to, all in one quiet place."}
                </EmptyDescription>
              </EmptyHeader>
              {!query && selectedTags.length === 0 && view === "active" && (
                <EmptyContent>
                  <button className="add-button empty-add" type="button" onClick={openCreateDialog}>
                    <Plus size={16} /> Add your first bookmark
                  </button>
                </EmptyContent>
              )}
            </Empty>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
