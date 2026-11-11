import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "virtual:uno.css";

import "@/index.css";
import "@/styles/theme.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { BookmarkDialogProvider } from "@/contexts/BookmarkDialog";
import { BookmarkManagerProvider } from "@/contexts/BookmarkManager";

import App from "@/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <BookmarkManagerProvider>
        <BookmarkDialogProvider>
          <App />
        </BookmarkDialogProvider>
      </BookmarkManagerProvider>
    </TooltipProvider>
  </StrictMode>,
);
