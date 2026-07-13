export const expoSliderReactExportCode = `// React / Vite export
//
// Required files (keep this framework-neutral core together):
//   src/components/ExpoSlider/ExpoSlider.tsx
//   src/components/ExpoSlider/useExpoSlider.ts
//   src/components/ExpoSlider/index.ts
//
// Runtime helpers imported by the current core:
//   pnpm add clsx tailwind-merge
//
// React, React DOM, and Tailwind CSS should already be configured by the app.
// Swiper, an animation library, and Next.js are not required.

// src/components/ExpoSlider/index.ts
export {
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
  type ExpoSliderContentProps,
  type ExpoSliderControlProps,
  type ExpoSliderFrameProps,
  type ExpoSliderImageProps,
  type ExpoSliderPaginationProps,
  type ExpoSliderPaginationRenderArgs,
  type ExpoSliderPaginationRenderer,
  type ExpoSliderRootProps,
  type ExpoSliderSlideProps,
  type ExpoSliderStatusProps,
  type ExpoSliderStatusRenderer,
  type ExpoSliderViewportProps,
} from "./ExpoSlider";
export {
  getExpoSliderRelativeProgress,
  normalizeExpoSliderValue,
  useExpoSlider,
  type ExpoSliderChangeSource,
  type ExpoSliderDirection,
  type ExpoSliderOrientation,
  type ExpoSliderValueChangeDetail,
  type ExpoSliderValueChangeHandler,
  type UseExpoSliderOptions,
} from "./useExpoSlider";

// src/components/FieldNotes.tsx
// Replace the @ alias with a relative path if your Vite project does not use it.
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
} from "@/components/ExpoSlider";

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

export function FieldNotes() {
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

// Put the referenced images in public/photos, or replace the src values.

// Tailwind CSS v4
// Files copied below src are detected automatically. When consuming BK-UI from
// node_modules, add @source to the stylesheet that imports Tailwind. Resolve the
// path relative to that stylesheet.
//
// src/index.css
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/ExpoSlider";

// Tailwind CSS v3
// Add both your application files and the package source when the component is
// not copied into src. Merge these entries into the existing content array.
//
// tailwind.config.ts
// content: [
//   "./index.html",
//   "./src/**/*.{js,ts,jsx,tsx}",
//   "./node_modules/@your-scope/bk-ui/src/components/ExpoSlider/**/*.{js,ts,jsx,tsx}",
// ];
`;
