export const storySliderReactExportCode = `// React 19+ / Vite export recipe
//
// Copy these framework-neutral files without changing their relative layout:
//   src/components/StorySlider/StorySlider.tsx
//   src/components/StorySlider/useStorySlider.ts
//   src/components/StorySlider/index.ts
//
// Install the only runtime helpers used by the core:
//   pnpm add clsx tailwind-merge

// FILE: src/components/StorySlider/index.ts
// This is the stable public entrypoint. "use client" is harmless in Vite and
// lets the identical source act as a Next.js Client Component entrypoint.
"use client";

export {
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
  StorySliderViewport,
  type StorySliderControlProps,
  type StorySliderGroupProps,
  type StorySliderItemProps,
  type StorySliderItemRenderer,
  type StorySliderItemRenderState,
  type StorySliderPlaybackProps,
  type StorySliderPlaybackRenderer,
  type StorySliderPlaybackRenderState,
  type StorySliderProgressProps,
  type StorySliderRootProps,
  type StorySliderStatusProps,
  type StorySliderStatusRenderer,
  type StorySliderStatusRenderState,
  type StorySliderViewportProps,
} from "./StorySlider";
export {
  getStorySliderGroupPosition,
  getStorySliderStep,
  normalizeStorySliderValue,
  useStorySlider,
  type StorySliderChangeSource,
  type StorySliderDirection,
  type StorySliderPlaybackEndDetail,
  type StorySliderValue,
  type StorySliderValueChangeDetail,
  type StorySliderValueChangeHandler,
  type UseStorySliderOptions,
} from "./useStorySlider";

// FILE: vite.config.ts (only needed when the project does not already define @)
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});

// Add the matching TypeScript alias to compilerOptions in tsconfig.app.json:
//   "baseUrl": ".",
//   "paths": { "@/*": ["./src/*"] }

// FILE: src/features/Stories.tsx
import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
  StorySliderViewport,
} from "@/components/StorySlider";

const groups = [
  {
    id: "city",
    stories: [
      { id: "river", src: "/stories/river.webp", alt: "Han River at sunset" },
      { id: "night", src: "/stories/night.webp", alt: "A neon-lit alley" },
    ],
  },
  {
    id: "coast",
    stories: [
      { id: "picnic", src: "/stories/picnic.webp", alt: "A seaside picnic" },
    ],
  },
];

export function Stories() {
  return (
    <StorySliderRoot
      groupCounts={groups.map((group) => group.stories.length)}
      duration={5000}
      aria-label="Travel stories"
      className="flex items-center justify-center gap-3"
    >
      <StorySliderPrevious className="rounded-full bg-black px-4 py-2 text-white">
        Previous
      </StorySliderPrevious>

      <StorySliderViewport className="h-[min(80vh,680px)] w-auto rounded-3xl bg-black">
        {groups.map((group, groupIndex) => (
          <StorySliderGroup
            key={group.id}
            index={groupIndex}
            className="rounded-3xl bg-black"
          >
            {group.stories.map((story, storyIndex) => (
              <StorySliderItem key={story.id} index={storyIndex}>
                <img
                  src={story.src}
                  alt={story.alt}
                  className="h-full w-full object-cover"
                />
              </StorySliderItem>
            ))}
          </StorySliderGroup>
        ))}

        <StorySliderProgress className="absolute inset-x-0 top-0 z-30 m-4 w-auto" />
        <StorySliderPlayback className="absolute top-8 right-4 z-40 rounded-full bg-black/60 px-3 py-2 text-sm text-white">
          {({ paused }) => (paused ? "Play" : "Pause")}
        </StorySliderPlayback>
      </StorySliderViewport>

      <StorySliderNext className="rounded-full bg-black px-4 py-2 text-white">
        Next
      </StorySliderNext>
      <StorySliderStatus className="sr-only" />
    </StorySliderRoot>
  );
}

// Tailwind source discovery
// - When the copied files stay under src/, Tailwind v4 discovers them automatically.
// - For an installed/shared package, add this to the global CSS. The path is
//   relative to that CSS file:
//
//   @import "tailwindcss";
//   @source "../node_modules/@your-scope/bk-ui/src/components/StorySlider";
//
// - Tailwind v3: merge these paths into the existing content array; do not
//   replace the project's current entries:
//
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//     "./node_modules/@your-scope/bk-ui/src/components/StorySlider/**/*.{js,ts,jsx,tsx}",
//   ]
`;
