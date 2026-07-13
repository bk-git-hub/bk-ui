export const shutterSliderReactExportCode = `// React / Vite export
//
// Required files (keep this single framework-neutral core together):
//   src/components/ShutterSlider/ShutterSlider.tsx
//   src/components/ShutterSlider/useShutterSlider.ts
//   src/components/ShutterSlider/index.ts
//
// Runtime helpers used by the core:
//   pnpm add clsx tailwind-merge
// Save each section below as the file named by its // file: comment.

// src/components/ShutterSlider/index.ts
"use client";

export {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
  type ShutterSliderChangeSource,
  type ShutterSliderControlProps,
  type ShutterSliderDirection,
  type ShutterSliderImage,
  type ShutterSliderOrientation,
  type ShutterSliderPaginationProps,
  type ShutterSliderRootProps,
  type ShutterSliderSlideProps,
  type ShutterSliderStatusProps,
  type ShutterSliderTransition,
  type ShutterSliderValueChangeDetail,
  type ShutterSliderViewportProps,
} from "./ShutterSlider";

export {
  getShutterSliderTarget,
  normalizeShutterSliderValue,
  useShutterSlider,
  type ShutterSliderValueChangeHandler,
  type UseShutterSliderOptions,
} from "./useShutterSlider";

// src/components/TravelShutterSlider.tsx
import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
  type ShutterSliderImage,
} from "./ShutterSlider";

// This relative import works with stock Vite when this example lives at
// src/components/TravelShutterSlider.tsx. If your project maps @/* to src/*,
// you can instead import from "@/components/ShutterSlider".

const slides = [
  {
    src: "/images/river.webp",
    alt: "해 질 무렵 불빛이 비치는 강",
  },
  {
    src: "/images/alley.webp",
    alt: "비에 젖은 네온 골목",
  },
] satisfies readonly ShutterSliderImage[];

const titles = ["강의 푸른 시간", "비가 남긴 네온"] as const;

export function TravelShutterSlider() {
  return (
    <ShutterSliderRoot
      slides={slides}
      stripCount={5}
      orientation="vertical"
      transitionDuration={820}
      stagger={52}
      loop
      aria-label="여행 사진"
      className="relative overflow-hidden rounded-3xl bg-slate-950 text-white"
    >
      <ShutterSliderViewport className="aspect-video w-full">
        {slides.map((slide, index) => (
          <ShutterSliderSlide
            key={slide.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/80 to-transparent p-8 pb-20"
          >
            <h2 className="text-4xl font-black">{titles[index]}</h2>
          </ShutterSliderSlide>
        ))}
      </ShutterSliderViewport>

      <ShutterSliderPrevious className="absolute top-1/2 left-4 z-30 px-4 py-2">
        이전
      </ShutterSliderPrevious>
      <ShutterSliderNext className="absolute top-1/2 right-4 z-30 px-4 py-2">
        다음
      </ShutterSliderNext>
      <ShutterSliderPagination
        aria-label="장면 선택"
        className="absolute bottom-6 left-8 z-30"
      />
      <ShutterSliderStatus className="absolute right-8 bottom-6 z-30" />
    </ShutterSliderRoot>
  );
}

// Tailwind CSS v4
// Files copied below your app's src directory are detected automatically.
// If you import BK-UI from node_modules, register the package source in the
// stylesheet that already imports Tailwind (adjust the path to that file):
//
// src/index.css
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/ShutterSlider";
`;
