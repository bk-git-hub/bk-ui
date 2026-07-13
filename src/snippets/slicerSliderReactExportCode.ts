import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const slicerSliderReactExport: ComponentViewerCodeTab = {
  language: "React / Vite TSX",
  description:
    "Copy the three framework-neutral SlicerSlider files into src/components/SlicerSlider, then install clsx and tailwind-merge. Vite can import the local barrel with a relative path (or your configured @ alias). Tailwind v4 scans local src files automatically; an external package needs @source, while Tailwind v3 needs the same path in content.",
  code: `// Required files (copy all three without changing their relative paths):
// src/components/SlicerSlider/SlicerSlider.tsx
// src/components/SlicerSlider/useSlicerSlider.ts
// src/components/SlicerSlider/index.ts
//
// Install the only non-React runtime helpers:
// pnpm add clsx tailwind-merge

// src/components/SlicerSlider/index.ts
export {
  SlicerSliderNext,
  SlicerSliderPagination,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderStatus,
  SlicerSliderViewport,
  type SlicerSliderChangeSource,
  type SlicerSliderControlProps,
  type SlicerSliderDirection,
  type SlicerSliderImage,
  type SlicerSliderPaginationProps,
  type SlicerSliderRootProps,
  type SlicerSliderSlideProps,
  type SlicerSliderStatusProps,
  type SlicerSliderValueChangeDetail,
  type SlicerSliderViewportProps,
} from "./SlicerSlider";
export {
  getSlicerSliderTarget,
  normalizeSlicerSliderValue,
  useSlicerSlider,
  type SlicerSliderTransition,
  type UseSlicerSliderOptions,
} from "./useSlicerSlider";

// src/VisualStories.tsx
import {
  SlicerSliderNext,
  SlicerSliderPagination,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderStatus,
  SlicerSliderViewport,
} from "./components/SlicerSlider";

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
  {
    src: "/images/solar-drift.webp",
    alt: "Amber dunes beneath an oversized sun",
    title: "Solar Drift",
  },
];

export function VisualStories() {
  return (
    <SlicerSliderRoot
      slides={slides}
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
        <SlicerSliderStatus />
        <SlicerSliderNext aria-label="Next story" />
      </div>
      <SlicerSliderPagination className="absolute bottom-5 left-8 z-30" />
    </SlicerSliderRoot>
  );
}

// Tailwind v4: src/index.css
// Local files under src are detected automatically.
// Add this only when SlicerSlider remains inside an external package/workspace:
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/SlicerSlider";
//
// Tailwind v3: include both the app and external component paths in content:
// content: [
//   "./index.html",
//   "./src/**/*.{js,ts,jsx,tsx}",
//   "./node_modules/@your-scope/bk-ui/src/**/*.{js,ts,jsx,tsx}",
// ]`,
};
