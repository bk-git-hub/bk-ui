export const expoSliderNextExportCode = `// Next.js App Router export
//
// Required files (reuse the exact same React + Tailwind core):
//   src/components/ExpoSlider/ExpoSlider.tsx
//   src/components/ExpoSlider/useExpoSlider.ts
//   src/components/ExpoSlider/index.ts
//   src/components/ExpoSlider/client.ts
//
// Runtime helpers imported by the current core:
//   pnpm add clsx tailwind-merge
//
// Do not duplicate the component for Next.js. The client entry below only marks
// the existing public API as an interactive Client Component boundary. It has no
// next/* import or Next.js runtime dependency.

// src/components/ExpoSlider/client.ts
"use client";

export * from "./index";

// app/gallery/_components/ExpoGallery.tsx
// Hooks, event handlers, refs, and function-valued props stay behind this
// explicit Client Component boundary.
"use client";

import {
  ExpoSliderContent,
  ExpoSliderFrame,
  ExpoSliderImage,
  ExpoSliderNext,
  ExpoSliderPagination,
  ExpoSliderPrevious,
  ExpoSliderRoot,
  ExpoSliderSlide,
  ExpoSliderStatus,
  ExpoSliderViewport,
} from "@/components/ExpoSlider/client";

export interface ExpoGallerySlide {
  id: string;
  src: string;
  alt: string;
  title: string;
}

export interface ExpoGalleryProps {
  slides: readonly ExpoGallerySlide[];
}

export function ExpoGallery({ slides }: ExpoGalleryProps) {
  return (
    <ExpoSliderRoot
      count={slides.length}
      loop
      aria-label="Field notes"
      className="mx-auto max-w-5xl"
    >
      <ExpoSliderViewport className="min-h-80 bg-neutral-950">
        {slides.map((slide, index) => (
          <ExpoSliderSlide
            key={slide.id}
            index={index}
            aria-label={slide.title}
          >
            <ExpoSliderFrame>
              <ExpoSliderImage src={slide.src} alt={slide.alt} />
              <ExpoSliderContent className="flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 text-white">
                <h2 className="text-3xl font-semibold">{slide.title}</h2>
              </ExpoSliderContent>
            </ExpoSliderFrame>
          </ExpoSliderSlide>
        ))}
      </ExpoSliderViewport>

      <div className="flex items-center gap-4">
        <ExpoSliderPrevious
          aria-label="Previous slide"
          className="rounded-full border border-neutral-300 px-4 py-2"
        >
          Previous
        </ExpoSliderPrevious>
        <ExpoSliderPagination aria-label="Choose a slide" />
        <ExpoSliderStatus />
        <ExpoSliderNext
          aria-label="Next slide"
          className="rounded-full border border-neutral-300 px-4 py-2"
        >
          Next
        </ExpoSliderNext>
      </div>
    </ExpoSliderRoot>
  );
}

// app/gallery/page.tsx remains a Server Component. This static array contains
// only strings, so the data crossing into ExpoGallery is serializable.
import { ExpoGallery } from "./_components/ExpoGallery";

const slides = [
  {
    id: "coast",
    src: "/photos/coast.webp",
    alt: "An empty platform facing the sea",
    title: "Platform Blue",
  },
  {
    id: "picnic",
    src: "/photos/picnic.webp",
    alt: "A picnic arranged beside the water",
    title: "Tangerine Radio",
  },
  {
    id: "city",
    src: "/photos/city.webp",
    alt: "A neon-lit alley after rain",
    title: "After Rain",
  },
] as const;

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <ExpoGallery slides={slides} />
    </main>
  );
}

// Put the referenced images in public/photos, or replace the src values.

// SSR / hydration
// - The shared core does not read window or document during render. Pointer and
//   media-query browser APIs run after hydration, so a dynamic import with
//   ssr: false is unnecessary.
// - Keep slides, count, defaultValue, and orientation deterministic between the
//   server render and hydration. Do not derive them from Date, random values, or
//   viewport state during render.
// - Props crossing from a Server Component into ExpoGallery must be serializable.
//   Define onValueChange, renderItem, getItemLabel, refs, event handlers, and
//   function-valued status children inside the Client Component wrapper.

// Tailwind CSS v4
// Files copied below app or src are detected automatically. When consuming BK-UI
// from node_modules, register the package source relative to app/globals.css.
// Adjust the path when globals.css lives below src/app.
//
// app/globals.css
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/ExpoSlider";

// Tailwind CSS v3
// Merge these paths into the existing content array.
//
// tailwind.config.ts
// content: [
//   "./app/**/*.{js,ts,jsx,tsx,mdx}",
//   "./components/**/*.{js,ts,jsx,tsx,mdx}",
//   "./src/**/*.{js,ts,jsx,tsx,mdx}",
//   "./node_modules/@your-scope/bk-ui/src/components/ExpoSlider/**/*.{js,ts,jsx,tsx}",
// ];
`;
