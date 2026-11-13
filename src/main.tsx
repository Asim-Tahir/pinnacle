import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "virtual:uno.css";

import "@/index.css";
import "@/styles/theme.css";

import BookmarkWebMCPTools from "@/components/BookmarkWebMCPTools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookmarkDialogProvider } from "@/contexts/BookmarkDialog";
import { BookmarkManagerProvider } from "@/contexts/BookmarkManager";

import App from "@/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <BookmarkManagerProvider>
        <BookmarkWebMCPTools />
        <BookmarkDialogProvider>
          <App />
        </BookmarkDialogProvider>
      </BookmarkManagerProvider>
    </TooltipProvider>
  </StrictMode>,
);
