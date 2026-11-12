import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TagField } from "@/components/ui/tag-field";
import {
  BookmarkDialogContext,
  type BookmarkDialogContextValue,
  type BookmarkDialogState,
} from "@/contexts/BookmarkDialog";
import { useBookmarkManager } from "@/hooks/useBookmarkManager";
import { Bookmark, type IUpdateBookmark } from "@/models";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/İnput-group";
import "./BookmarkDialogProvider.css";

interface BookmarkForm {
  url: string;
  name: string;
  description: string;
  tags: string[];
}

const emptyForm: BookmarkForm = {
  url: "",
  name: "",
  description: "",
  tags: [],
};

export function BookmarkDialogProvider({ children }: React.PropsWithChildren) {
  const [dialogState, setDialogState] = useState<BookmarkDialogState>({ type: "closed" });
  const [form, setForm] = useState<BookmarkForm>(emptyForm);
  const [formError, setFormError] = useState("");

  const { createBookmark, updateBookmark } = useBookmarkManager();

  function openCreateDialog() {
    setForm(emptyForm);
    setFormError("");
    setDialogState({ type: "create" });
  }

  function openEditDialog(bookmark: Bookmark) {
    setForm({
      url: bookmark.url.toString(),
      name: bookmark.name,
      description: bookmark.description,
      tags: Array.from(bookmark.tags),
    });
    setFormError("");
    setDialogState({ type: "edit", bookmark });
  }

  function closeDialog() {
    setDialogState({ type: "closed" });
  }

  async function submitForm(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const data: IUpdateBookmark = {
      url: form.url,
      name: form.name.trim(),
      description: form.description.trim(),
      tags: form.tags,
    };

    try {
      if (dialogState.type === "edit") {
        await updateBookmark(dialogState.bookmark.id, data);
      } else if (dialogState.type === "create") {
        await createBookmark(data);
      }
      closeDialog();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save this bookmark.");
    }
  }

  const value: BookmarkDialogContextValue = {
    state: dialogState,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  };

  const editingBookmark = dialogState.type === "edit" ? dialogState.bookmark : null;

  return (
    <BookmarkDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={dialogState.type !== "closed"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="bookmark-dialog">
          <DialogHeader>
            <DialogTitle>{editingBookmark ? "Edit bookmark" : "Add a bookmark"}</DialogTitle>
          </DialogHeader>
          <form className="bookmark-form" onSubmit={submitForm}>
            <label>
              <span>
                URL <b aria-hidden="true">*</b>
              </span>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{urlPrefix}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  autoFocus
                  type="text"
                  inputMode="url"
                  required
                  placeholder="example.com"
                  value={form.url}
                  onChange={(event) => setForm({ ...form, url: event.target.value })}
                  aria-describedby={formError ? "bookmark-form-error" : undefined}
                />
              </InputGroup>
            </label>
            <label>
              <span>Name</span>
              <input
                type="text"
                placeholder="A name to remember it by"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                rows={3}
                placeholder="What makes this page useful?"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <TagField
              className="bookmark-tags-field"
              label="Tags"
              placeholder="Design, Reading, Work"
              value={form.tags}
              onChange={(tags) => setForm({ ...form, tags })}
            />
            {formError && (
              <p className="form-error" id="bookmark-form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button className="cancel-button" type="button" onClick={closeDialog}>
                Cancel
              </button>
              <button className="add-button" type="submit">
                {editingBookmark ? "Save changes" : "Add bookmark"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </BookmarkDialogContext.Provider>
  );
}
