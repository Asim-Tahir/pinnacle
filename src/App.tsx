import { cx } from "cva";
import {
  Archive,
  ArrowDownWideNarrow,
  Bookmark as BookmarkIcon,
  Home,
  Plus,
  Tag,
} from "lucide-react";

import "@/App.css";

import BookmarkCard from "@/components/BookmarkCard";
import Header from "@/components/layout/Header";
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
    bookmarks,
    hydrated,
    persistenceError,
    view,
    setView,
    query,
    selectedTags,
    clearSelectedTags,
    toggleTag,
    sortMode,
    setSortMode,
    visibleBookmarks,
    tagCounts,
    actionError,
    blockedUrl,
  } = useBookmarkManager();
  const { openCreateDialog } = useBookmarkDialog();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" onClick={() => setView("active")}>
          <span className="brand-mark">
            <BookmarkIcon size={18} fill="currentColor" />
          </span>
          <span>Pinnacle</span>
        </a>

        <nav className="primary-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${view === "active" ? "is-active" : ""}`}
            type="button"
            onClick={() => {
              setView("active");
            }}
          >
            <Home size={16} /> Home
          </button>
          <button
            className={cx("nav-item", { "is-active": view === "archived" })}
            type="button"
            onClick={() => {
              setView("archived");
            }}
          >
            <Archive size={16} /> Archived
            <span className="nav-count">
              {bookmarks.filter((bookmark) => bookmark.archivedAt !== null).length}
            </span>
          </button>
        </nav>

        <div className="tag-section">
          <div className="sidebar-label">
            <span>Tags</span>
            {selectedTags.length > 0 && (
              <button type="button" onClick={clearSelectedTags}>
                Clear
              </button>
            )}
          </div>
          <div className="tag-list">
            {tagCounts.map(([tag, count]) => (
              <label className="tag-filter" key={tag}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                <span>{tag}</span>
                <small>{count}</small>
              </label>
            ))}
            {tagCounts.length === 0 && <p className="empty-tags">Your tags will show here.</p>}
          </div>
        </div>

        <div className="sidebar-note">
          <span className="note-icon">
            <Tag size={16} />
          </span>
          <span>Saved on this device</span>
        </div>
      </aside>

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
