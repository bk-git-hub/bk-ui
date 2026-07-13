import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";
import { shutterSliderNextExportCode } from "./shutterSliderNextExportCode";
import { shutterSliderReactExportCode } from "./shutterSliderReactExportCode";

export const shutterSliderReactExport: ComponentViewerCodeTab = {
  code: shutterSliderReactExportCode,
  language: "React / Vite TSX",
  description:
    "Copy the framework-neutral core files, barrel exports, usage example, and Tailwind source setup into a React or Vite project.",
};

export const shutterSliderNextJsExport: ComponentViewerCodeTab = {
  code: shutterSliderNextExportCode,
  language: "Next.js App Router TSX",
  description:
    "Reuse the same core through its client entry and keep function props inside the documented client boundary. Deterministic initial props keep SSR and hydration aligned; package consumers must register the Tailwind source path.",
};
