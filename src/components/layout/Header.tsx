import { Plus, Search, X } from "lucide-react";

import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBookmarkDialog } from "@/hooks/useBookmarkDialog";
import { useBookmarkManager } from "@/hooks/useBookmarkManager";

import "./Header.css";

export default function Header() {
  const { query, setQuery } = useBookmarkManager();
  const { openCreateDialog } = useBookmarkDialog();

  return (
    <header className="header">
      <label className="header-search-box">
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
      <div className="header-actions">
        <ThemeSwitcher />
        <button
          className="add-button"
          type="button"
          aria-label="Add bookmark"
          onClick={openCreateDialog}
        >
          <Plus size={17} /> <span>Add Bookmark</span>
        </button>
        <Avatar className="header-profile-avatar" role="img" aria-label="Current user avatar">
          <AvatarImage
            src="https://api.dicebear.com/10.x/lorelei-neutral/svg?seed=Aneka&backgroundColor=dff0eb&eyebrowsColor=0f3d38&eyesColor=0f3d38&frecklesColor=0f3d38&glassesColor=0f3d38&mouthColor=0f3d38&noseColor=0f3d38"
            alt="Current user avatar"
          />
          <AvatarFallback>AN</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
