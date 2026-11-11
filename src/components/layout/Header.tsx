import { Plus, Search, X } from "lucide-react";

import { useBookmarkDialog } from "@/hooks/useBookmarkDialog";
import { useBookmarkManager } from "@/hooks/useBookmarkManager";

export default function Header() {
  const { query, setQuery } = useBookmarkManager();
  const { openCreateDialog } = useBookmarkDialog();

  return (
    <header className="topbar">
      <label className="search-box">
        <Search size={16} />
        <input
          type="search"
          placeholder="Search by title..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search bookmarks"
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
            <X size={16} />
          </button>
        )}
      </label>
      <div className="topbar-actions">
        <button
          className="add-button"
          type="button"
          aria-label="Add bookmark"
          onClick={openCreateDialog}
        >
          <Plus size={17} /> <span>Add Bookmark</span>
        </button>
        <span className="profile-avatar" aria-label="Local bookmark library">
          P
        </span>
      </div>
    </header>
  );
}
