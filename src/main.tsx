import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "virtual:uno.css";

import App from "@/App.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/index.css";
import "@/styles/theme.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </StrictMode>,
);
