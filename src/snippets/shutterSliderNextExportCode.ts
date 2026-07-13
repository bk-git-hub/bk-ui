export const shutterSliderNextExportCode = `// Next.js App Router export
//
// Required files (the same React + Tailwind core used by every framework):
//   src/components/ShutterSlider/ShutterSlider.tsx
//   src/components/ShutterSlider/useShutterSlider.ts
//   src/components/ShutterSlider/index.ts
//   src/components/ShutterSlider/client.ts
//
// Runtime helpers used by the core:
//   pnpm add clsx tailwind-merge
// No framework module import or Next.js runtime dependency is required by the component.
// Save each section below as the file named by its // file: comment.

// src/components/ShutterSlider/client.ts
"use client";

export * from "./index";

// app/_components/TravelShutterSlider.tsx
// Keep event handlers, hooks, refs, and function-valued props behind this
// explicit Client Component boundary.
"use client";

import { useState } from "react";
import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
  type ShutterSliderImage,
  type ShutterSliderOrientation,
} from "@/components/ShutterSlider/client";

// If your tsconfig does not map @/* to your source directory, replace this
// import with the relative path to components/ShutterSlider/client.

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
  const [orientation, setOrientation] =
    useState<ShutterSliderOrientation>("vertical");

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() =>
          setOrientation((current) =>
            current === "vertical" ? "horizontal" : "vertical",
          )
        }
        className="rounded-full border border-slate-300 px-4 py-2"
      >
        셔터 방향 전환
      </button>

      <ShutterSliderRoot
        slides={slides}
        stripCount={5}
        orientation={orientation}
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
    </section>
  );
}

// app/page.tsx remains a Server Component and renders the client boundary.
import { TravelShutterSlider } from "./_components/TravelShutterSlider";

export default function Page() {
  return <TravelShutterSlider />;
}

// SSR / hydration:
// - Keep slides, defaultValue, and initial orientation deterministic on server
//   and client. Do not read window, document, Date, or random values in render.
// - The core reads browser APIs only after hydration. A dynamic import with
//   ssr: false is unnecessary.
// - onValueChange, getLabel, DOM handlers/refs, and render-function children
//   must be composed in a Client Component because functions are not
//   serializable across the Server-to-Client boundary.

// Tailwind CSS v4
// Files copied into app or src are detected automatically. If BK-UI is imported
// from node_modules, register its source relative to app/globals.css:
//
// app/globals.css
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/ShutterSlider";
`;
