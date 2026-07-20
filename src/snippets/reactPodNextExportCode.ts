import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const reactPodNextJsExport: ComponentViewerCodeTab = {
  language: "Next.js TSX",
  description:
    "App Router can render ReactPod and its native MP3 player through the existing client entry while page.tsx remains a Server Component. Pass serializable track and album data across that boundary; browser audio starts only after hydration and user input.",
  code: `// Next.js App Router export
//
// Required runtime files (the same React + Tailwind core used by React/Vite):
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
// Required client entry for ReactPod:
//   src/components/ReactPod/client.ts
// Optional client entry when importing the standalone ClickWheel directly:
//   src/components/ClickWheel/client.ts
//
// Runtime helpers used by the same framework-neutral core:
//   pnpm add clsx tailwind-merge
// No next/* import or Next.js runtime dependency is used by the shared core.

// src/components/ReactPod/client.ts
"use client";

export * from "./index";

// The copied core uses @/* -> src/*. create-next-app commonly provides this
// alias; if yours does not, merge this mapping into tsconfig.json or replace
// the @ imports with equivalent relative paths.
//
// tsconfig.json
// {
//   "compilerOptions": {
//     "baseUrl": ".",
//     "paths": { "@/*": ["./src/*"] }
//   }
// }

// src/app/react-pod/page.tsx (Server Component)
import {
  ReactPod,
  type ReactPodCoverflowAlbum,
  type ReactPodMenuItem,
  type ReactPodTrack,
} from "@/components/ReactPod/client";

const menuItems = [
  { id: "songs", label: "Library" },
  { id: "now-playing", label: "Now Playing" },
  { id: "coverflow", label: "Coverflow" },
  { id: "about", label: "About This Pod" },
] satisfies readonly ReactPodMenuItem[];

// Put the MP3 in public/audio/streetlights.mp3 and its cover in
// public/albums/night-drive.webp.
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

export default function ReactPodPage() {
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

// SSR / hydration
// - ReactPod does not read window or document during render. Pointer geometry,
//   ResizeObserver, native audio playback, and fallback playback timers run
//   only after hydration in effects or user event handlers, so
//   dynamic(..., { ssr: false }) is unnecessary.
// - Keep menuItems, tracks, photoAlbums, coverflowAlbums, and initial props
//   deterministic between the server render and hydration. Shuffle randomness
//   runs only after selection.
// - Server Components may pass serializable track, menu, photo, and Coverflow
//   album data. Put native event handlers or other function-valued props in
//   your own "use client" wrapper instead of crossing the boundary.

// Tailwind CSS v4
// Local files below app or src are detected automatically. For an external
// package, add all sources relative to app/globals.css (adjust for src/app).
//
// app/globals.css
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/ReactPod";
// @source "../node_modules/@your-scope/bk-ui/src/components/ClickWheel";
// @source "../node_modules/@your-scope/bk-ui/src/components/Coverflow";

// Tailwind CSS v3
// Merge these paths into the existing content array.
//
// tailwind.config.ts
// content: [
//   "./app/**/*.{js,ts,jsx,tsx,mdx}",
//   "./components/**/*.{js,ts,jsx,tsx,mdx}",
//   "./src/**/*.{js,ts,jsx,tsx,mdx}",
//   "./node_modules/@your-scope/bk-ui/src/components/ReactPod/**/*.{js,ts,jsx,tsx}",
//   "./node_modules/@your-scope/bk-ui/src/components/ClickWheel/**/*.{js,ts,jsx,tsx}",
//   "./node_modules/@your-scope/bk-ui/src/components/Coverflow/**/*.{js,ts,jsx,tsx}",
// ];
`,
};
