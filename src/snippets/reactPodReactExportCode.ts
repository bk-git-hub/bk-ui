import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const reactPodReactExport: ComponentViewerCodeTab = {
  language: "React TSX",
  description:
    "Copy the ReactPod, ClickWheel, and Coverflow runtime files into your React/Vite source tree. Native MP3 playback uses the browser audio element; the shared core needs no media, Next.js, or animation library.",
  code: `// React / Vite export
//
// Required runtime files:
//   src/components/ReactPod/index.ts
//   src/components/ReactPod/ReactPod.tsx
//   src/components/ReactPod/ReactPodProvider.tsx
//   src/components/ReactPod/ReactPodContext.tsx
//   src/components/ReactPod/Display.tsx
//   src/components/ReactPod/ClickWheel.tsx
//   src/components/ReactPod/ReactPodCoverflow.tsx
//   src/components/ReactPod/ReactPodIcons.tsx
//   src/components/ReactPod/reactPodState.ts
//   src/components/ClickWheel/index.ts
//   src/components/ClickWheel/ClickWheel.tsx
//   src/components/ClickWheel/useClickWheel.ts
//   src/components/Coverflow/index.ts
//   src/components/Coverflow/coverflow.tsx
//   src/components/Coverflow/coverflow-item.tsx
//   src/components/Coverflow/coverflow-context.ts
//   src/components/Coverflow/coverflow.util.ts
//   src/components/Coverflow/lazy-image.tsx
//   src/components/Coverflow/use-drag.ts
//   src/components/Coverflow/use-key-navigation.ts
//   src/components/Coverflow/use-wheel-event.ts
//
// Runtime helpers used by the current core:
//   pnpm add clsx tailwind-merge
// Tailwind v4 Vite setup when the app does not already have it:
//   pnpm add -D tailwindcss @tailwindcss/vite
//
// The current public and internal imports use @/* -> src/*. Merge this alias
// into the Vite config generated for your app.

// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

// Add the matching TypeScript path mapping. Keep the rest of your generated
// compilerOptions unchanged.
//
// tsconfig.app.json
// {
//   "compilerOptions": {
//     "baseUrl": ".",
//     "paths": {
//       "@/*": ["src/*"]
//     }
//   }
// }

// src/App.tsx
import {
  ReactPod,
  type ReactPodCoverflowAlbum,
  type ReactPodMenuItem,
  type ReactPodTrack,
} from "@/components/ReactPod";

const menuItems = [
  { id: "songs", label: "Library" },
  { id: "now-playing", label: "Now Playing" },
  { id: "coverflow", label: "Coverflow" },
  { id: "about", label: "About This Pod" },
] satisfies readonly ReactPodMenuItem[];

// Put the referenced MP3 in public/audio/streetlights.mp3 and its cover in
// public/albums/night-drive.webp. Only the active track is loaded.
const tracks = [
  {
    id: "streetlights",
    title: "Streetlights",
    artist: "Night Drive",
    album: "Night Drive",
    duration: 214,
    src: "/audio/streetlights.mp3",
    artworkSrc: "/albums/night-drive.webp",
    artworkAlt: "Blue city lights on the Night Drive album cover",
  },
] satisfies readonly ReactPodTrack[];

const coverflowAlbums = [
  {
    id: "night-drive",
    title: "Night Drive",
    coverSrc: "/albums/night-drive.webp",
    coverAlt: "Blue city lights on the Night Drive album cover",
    tracks: [
      { id: "night-drive-1", title: "Streetlights" },
      { id: "night-drive-2", title: "Last Exit" },
    ],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

export default function App() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <ReactPod
        deviceName="My Pod"
        menuItems={menuItems}
        tracks={tracks}
        coverflowAlbums={coverflowAlbums}
        wheelSensitivity={1.25}
      />
    </main>
  );
}

// Tailwind CSS v4
// Local files copied below src are detected automatically. If BK-UI is loaded
// from a package or monorepo outside the scanned source tree, register all
// component directories relative to the stylesheet that imports Tailwind.
//
// src/index.css
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/ReactPod";
// @source "../node_modules/@your-scope/bk-ui/src/components/ClickWheel";
// @source "../node_modules/@your-scope/bk-ui/src/components/Coverflow";

// Tailwind CSS v3
// Merge these paths into the existing content array.
//
// tailwind.config.ts
// content: [
//   "./index.html",
//   "./src/**/*.{js,ts,jsx,tsx}",
//   "./node_modules/@your-scope/bk-ui/src/components/ReactPod/**/*.{js,ts,jsx,tsx}",
//   "./node_modules/@your-scope/bk-ui/src/components/ClickWheel/**/*.{js,ts,jsx,tsx}",
//   "./node_modules/@your-scope/bk-ui/src/components/Coverflow/**/*.{js,ts,jsx,tsx}",
// ];
`,
};
