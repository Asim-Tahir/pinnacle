import { cx } from "cva";
import { Archive, BookmarkIcon, Home, Tag } from "lucide-react";

import { useBookmarkManager } from "@/hooks/useBookmarkManager";

import "./Sidebar.css";

export default function Sidebar() {
  const {
    view,
    setView,
    activeBookmarks,
    archivedBookmarks,
    selectedTags,
    clearSelectedTags,
    tagCounts,
    toggleTag,
  } = useBookmarkManager();

  const archivedCount = archivedBookmarks.length;
  const activeCount = activeBookmarks.length;

  return (
    <aside className="sidebar">
      <a className="brand" onClick={() => setView("active")}>
        <span className="brand-mark">
          <BookmarkIcon size={18} fill="currentColor" />
        </span>
        <span>Pinnacle</span>
      </a>

      <nav className="nav" aria-label="Main navigation">
        <button
          className={`nav-item ${view === "active" ? "is-active" : ""}`}
          type="button"
          onClick={() => {
            setView("active");
          }}
        >
          <Home className="nav-item-icon" size={20} /> Home
          <small className="nav-count">{activeCount ? activeCount : null}</small>
        </button>
        <button
          className={cx("nav-item", { "is-active": view === "archived" })}
          type="button"
          onClick={() => {
            setView("archived");
          }}
        >
          <Archive className="nav-item-icon" size={20} /> Archived
          <small className="nav-count">{archivedCount ? archivedCount : null}</small>
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
              <div className="tag-filter-name">
                <Tag className="tag-filter-icon" size={12} />
                <span className="tag-filter-text">{tag}</span>
              </div>
              <small>{count}</small>
            </label>
          ))}
          {tagCounts.length === 0 && <p className="empty-tags">Your tags will show here.</p>}
        </div>
      </div>

      <div className="sidebar-note">
        <Tag className="sidebar-note-icon" size={16} />
        <span>Saved on this device</span>
      </div>
    </aside>
  );
}
