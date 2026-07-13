import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const slicerSliderNextJsExport: ComponentViewerCodeTab = {
  language: "Next.js App Router TSX",
  description:
    "App Router uses the same React + Tailwind core plus the client.ts entry point. Keep state, callbacks, and render functions inside the 'use client' wrapper; a Server Component may pass only serializable slide data. The core reads browser APIs only in effects, so SSR / hydration stays deterministic and ssr: false is unnecessary. Tailwind v4 scans local app/src files automatically; external source needs @source (or a Tailwind v3 content glob).",
  code: `// Required files (one shared core; there is no Next.js component copy):
// src/components/SlicerSlider/SlicerSlider.tsx
// src/components/SlicerSlider/useSlicerSlider.ts
// src/components/SlicerSlider/index.ts
// src/components/SlicerSlider/client.ts
//
// pnpm add clsx tailwind-merge

// src/components/SlicerSlider/client.ts
"use client";

export * from "./index";

// app/_components/SlicerGallery.tsx
"use client";

import { useState } from "react";
import {
  SlicerSliderNext,
  SlicerSliderPagination,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderStatus,
  SlicerSliderViewport,
  type SlicerSliderImage,
} from "@/components/SlicerSlider/client";

export interface SlicerGallerySlide extends SlicerSliderImage {
  title: string;
}

export interface SlicerGalleryProps {
  slides: readonly SlicerGallerySlide[];
}

export function SlicerGallery({ slides }: SlicerGalleryProps) {
  const [value, setValue] = useState(0);

  return (
    <SlicerSliderRoot
      slides={slides}
      value={value}
      onValueChange={setValue}
      sliceCount={10}
      sliceDuration={760}
      staggerDelay={48}
      loop
      aria-label="Visual stories"
      className="relative overflow-hidden rounded-3xl bg-stone-950 text-white"
    >
      <SlicerSliderViewport className="aspect-[16/10] min-h-96 w-full">
        {slides.map((slide, index) => (
          <SlicerSliderSlide
            key={slide.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/85 via-transparent to-transparent p-8 pb-20"
          >
            <h2 className="relative z-10 text-5xl font-black">
              {slide.title}
            </h2>
          </SlicerSliderSlide>
        ))}
      </SlicerSliderViewport>

      <div className="absolute top-5 right-5 z-30 flex items-center gap-3">
        <SlicerSliderPrevious aria-label="Previous story" />
        <SlicerSliderStatus>
          {({ value: activeValue, count }) =>
            count === 0 ? "0 / 0" : \`\${activeValue + 1} / \${count}\`
          }
        </SlicerSliderStatus>
        <SlicerSliderNext aria-label="Next story" />
      </div>
      <SlicerSliderPagination className="absolute bottom-5 left-8 z-30" />
    </SlicerSliderRoot>
  );
}

// app/page.tsx (Server Component by default)
import { SlicerGallery } from "./_components/SlicerGallery";

const slides = [
  {
    src: "/images/tidal-glass.webp",
    alt: "Turquoise waves beneath a warm sun",
    title: "Tidal Glass",
  },
  {
    src: "/images/electric-bloom.webp",
    alt: "Violet petals orbiting a golden center",
    title: "Electric Bloom",
  },
];

export default function Page() {
  return <SlicerGallery slides={slides} />;
}

// SSR / hydration notes:
// - Keep slides and the initial value deterministic between server and client.
// - Pass serializable data from Server Components. Keep onValueChange,
//   renderItem, and render-function children inside SlicerGallery.
// - window.matchMedia, requestAnimationFrame, and timers run only in effects.
// - No next/* import or dynamic(..., { ssr: false }) is required by the core.

// Tailwind v4: app/globals.css
// Local files under app/src are detected automatically.
// Add this only when SlicerSlider remains inside an external package/workspace:
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/SlicerSlider";
//
// Tailwind v3: add the external path to tailwind.config content:
// "./node_modules/@your-scope/bk-ui/src/**/*.{js,ts,jsx,tsx}"`,
};
