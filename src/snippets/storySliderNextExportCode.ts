export const storySliderNextExportCode = `// Next.js App Router export recipe (React 19+)
//
// Reuse the exact same framework-neutral core. Do not create a Next.js copy:
//   src/components/StorySlider/StorySlider.tsx
//   src/components/StorySlider/useStorySlider.ts
//   src/components/StorySlider/index.ts
//
// Install the core helpers:
//   pnpm add clsx tailwind-merge
//
// index.ts already starts with "use client" and exports the stable path
// @/components/StorySlider. The core has no next/* imports.
// If the project does not already define @, add this to compilerOptions in
// tsconfig.json, or replace the import below with a relative path:
//   "baseUrl": ".",
//   "paths": { "@/*": ["./src/*"] }

// FILE: src/app/stories/_components/ProductStories.tsx
"use client";

import { useState } from "react";
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
  type StorySliderValue,
} from "@/components/StorySlider";

const groups = [
  {
    id: "new-arrivals",
    stories: [
      { id: "one", src: "/stories/product-one.webp", alt: "Blue travel bag", duration: 4500 },
      { id: "two", src: "/stories/product-two.webp", alt: "Travel bag detail", duration: 5200 },
    ],
  },
  {
    id: "field-test",
    stories: [
      { id: "three", src: "/stories/product-three.webp", alt: "Travel bag outdoors", duration: 5000 },
    ],
  },
];

export function ProductStories() {
  const [value, setValue] = useState<StorySliderValue>({
    groupIndex: 0,
    itemIndex: 0,
  });

  return (
    <StorySliderRoot
      groupCounts={groups.map((group) => group.stories.length)}
      value={value}
      onValueChange={setValue}
      duration={(current) =>
        groups[current.groupIndex]?.stories[current.itemIndex]?.duration ?? 5000
      }
      aria-label="Product stories"
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
      <StorySliderStatus className="sr-only">
        {({ value: current, itemCount, paused }) =>
          "Group " +
          (current.groupIndex + 1) +
          ", story " +
          (current.itemIndex + 1) +
          " of " +
          itemCount +
          (paused ? ", paused" : ", playing")
        }
      </StorySliderStatus>
    </StorySliderRoot>
  );
}

// FILE: src/app/stories/page.tsx (Server Component)
import { ProductStories } from "./_components/ProductStories";

export default function StoriesPage() {
  return <ProductStories />;
}

// Server/Client and hydration contract
// - Keep onValueChange, onPlaybackEnd, function-valued duration, and render-
//   function children inside ProductStories. Functions are not serializable
//   across the Server Component boundary.
// - Keep groupCounts, the initial value, and rendered story data deterministic.
//   Do not read window/document or call Date/Math.random during render.
// - The core reads browser APIs only in effects and pointer/keyboard events, so
//   server markup and the first hydration render match. dynamic({ ssr: false })
//   is not required.

// Tailwind source discovery
// - Files copied under src/ or app/ are discovered by Tailwind v4 automatically.
// - For a package/shared folder, add this to src/app/globals.css. @source is
//   relative to globals.css:
//
//   @import "tailwindcss";
//   @source "../../node_modules/@your-scope/bk-ui/src/components/StorySlider";
//
// - Tailwind v3: merge, rather than replace, the existing content entries:
//
//   content: [
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
//     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./node_modules/@your-scope/bk-ui/src/components/StorySlider/**/*.{js,ts,jsx,tsx}",
//   ]
`;
