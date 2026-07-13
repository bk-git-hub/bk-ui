import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";
import {
  SHADER_SLIDER_EXPORT_ASSET_FILES,
  SHADER_SLIDER_EXPORT_CORE_FILES,
  SHADER_SLIDER_EXPORT_DEPENDENCY_COMMAND,
  SHADER_SLIDER_NEXT_TAILWIND_SOURCE,
} from "./shaderSliderExportMeta";

export const shaderSliderNextExportCode = `'use client';

import { useEffect, useState } from "react";
import {
  ShaderSliderNext,
  ShaderSliderPagination,
  ShaderSliderPrevious,
  ShaderSliderRoot,
  ShaderSliderSlide,
  ShaderSliderStatus,
  ShaderSliderViewport,
} from "@/components/ShaderSlider";

const slides = [
  {
    src: "/shader-slider/tidal-glass.webp",
    alt: "Teal glass waves beneath a warm sun",
    title: "Tidal Glass",
  },
  {
    src: "/shader-slider/electric-bloom.webp",
    alt: "Luminous magenta petals over a violet sky",
    title: "Electric Bloom",
  },
];

export function ShaderSliderClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="aspect-[16/10] w-full rounded-3xl bg-slate-950"
      />
    );
  }

  return (
    <ShaderSliderRoot
      slides={slides}
      effect="wave"
      transitionDuration={950}
      intensity={0.9}
      frequency={2.75}
      dprCap={2}
      loop
      aria-label="Visual stories"
      className="relative overflow-hidden rounded-3xl bg-slate-950 text-white"
    >
      <ShaderSliderViewport className="aspect-[16/10] w-full">
        {slides.map((slide, index) => (
          <ShaderSliderSlide
            key={slide.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/80 to-transparent p-8"
          >
            <h2 className="text-4xl font-black sm:text-6xl">
              {slide.title}
            </h2>
          </ShaderSliderSlide>
        ))}
      </ShaderSliderViewport>

      <ShaderSliderPrevious className="absolute top-1/2 left-4 z-30 -translate-y-1/2 rounded-full bg-black/55 px-4 py-3">
        Previous
      </ShaderSliderPrevious>
      <ShaderSliderNext className="absolute top-1/2 right-4 z-30 -translate-y-1/2 rounded-full bg-black/55 px-4 py-3">
        Next
      </ShaderSliderNext>
      <ShaderSliderPagination className="absolute bottom-5 left-5 z-30 text-white" />
      <ShaderSliderStatus className="absolute right-5 bottom-5 z-30 text-white" />
    </ShaderSliderRoot>
  );
}`;

export const shaderSliderNextJsExport: ComponentViewerCodeTab = {
  language: "Next.js TSX",
  description: `Next.js App Router: run \`${SHADER_SLIDER_EXPORT_DEPENDENCY_COMMAND}\`, copy ${SHADER_SLIDER_EXPORT_CORE_FILES.join(", ")} without adding next/* imports, and copy ${SHADER_SLIDER_EXPORT_ASSET_FILES.join(", ")} into public. Save this code as app/_components/ShaderSliderClient.tsx, then import { ShaderSliderClient } from "./_components/ShaderSliderClient" in the Server Component page. The 'use client' boundary keeps callbacks and slide composition in the client graph; pass only serializable data from Server Components. The mounted placeholder keeps server and first-client markup aligned before matchMedia, WebGL, and ResizeObserver run, so dynamic({ ssr: false }) is unnecessary. Add \`${SHADER_SLIDER_NEXT_TAILWIND_SOURCE}\` to app/globals.css when automatic Tailwind v4 detection cannot see the copied source; Tailwind v3 needs the equivalent content glob. Texture URLs must be same-origin or return valid CORS headers.`,
  code: shaderSliderNextExportCode,
};
