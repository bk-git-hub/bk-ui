import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";
import tinderManifest from "../../registry/components/tinder.json";

export interface TinderExportFile {
  path: string;
  code: string;
}

export const tinderReactExportFiles: readonly TinderExportFile[] = [
  {
    path: "src/App.tsx",
    code: tinderManifest.examples.react.trim(),
  },
];

export const tinderNextJsExportFiles: readonly TinderExportFile[] = [
  {
    path: "src/app/client-wrapper.tsx",
    code: tinderManifest.examples.nextClient.trim(),
  },
  {
    path: "src/app/page.tsx",
    code: tinderManifest.examples.nextServer.trim(),
  },
];

const renderExportFiles = (files: readonly TinderExportFile[]) =>
  files.map(({ path, code }) => `// FILE: ${path}\n${code}`).join("\n\n");

export const tinderReactExport: ComponentViewerCodeTab = {
  language: "React TSX",
  description:
    'Install "clsx" and "tailwind-merge", copy the React ZIP files into the project, then use this Vite entry. Tailwind v4 scans local source automatically; shared source needs an @source directive. Tailwind v3 needs the copied component path in content.',
  code: renderExportFiles(tinderReactExportFiles),
};

export const tinderNextJsExport: ComponentViewerCodeTab = {
  language: "Next.js TSX",
  description:
    'App Router: copy the Next.js ZIP files, then place these two files at the labeled paths. Keep the render prop and callbacks in the "use client" wrapper. Server Components should pass only serializable cards and deckKey. The core defers browser APIs until events or effects, so disabling SSR is unnecessary. Tailwind v4 scans local source automatically; shared source needs @source in globals.css, while Tailwind v3 needs the copied component path in content.',
  code: renderExportFiles(tinderNextJsExportFiles),
};
