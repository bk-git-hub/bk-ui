import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";
import {
  SHADER_SLIDER_EXPORT_ASSET_FILES,
  SHADER_SLIDER_EXPORT_CORE_FILES,
  SHADER_SLIDER_EXPORT_DEPENDENCY_COMMAND,
  SHADER_SLIDER_REACT_TAILWIND_SOURCE,
} from "./shaderSliderExportMeta";

export const shaderSliderReactExportCode = `import {
  ShaderSliderNext,
  ShaderSliderPagination,
  ShaderSliderPrevious,
  ShaderSliderRoot,
  ShaderSliderSlide,
  ShaderSliderStatus,
  ShaderSliderViewport,
} from "./components/ShaderSlider";

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

export default function ShaderSliderExample() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <ShaderSliderRoot
        slides={slides}
        effect="wave"
        transitionDuration={950}
        intensity={0.9}
        frequency={2.75}
        dprCap={2}
        loop
        aria-label="Visual stories"
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl"
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
    </main>
  );
}`;

export const shaderSliderReactExport: ComponentViewerCodeTab = {
  language: "React TSX",
  description: `React + Vite: run \`${SHADER_SLIDER_EXPORT_DEPENDENCY_COMMAND}\`, copy ${SHADER_SLIDER_EXPORT_CORE_FILES.join(", ")}, and copy the demo textures ${SHADER_SLIDER_EXPORT_ASSET_FILES.join(", ")} (or replace their URLs with your own raster images). Save this code as src/ShaderSliderExample.tsx. Tailwind v4 scans local src files automatically; for an excluded/shared directory add \`${SHADER_SLIDER_REACT_TAILWIND_SOURCE}\` to src/index.css. Tailwind v3 must include src/components/ShaderSlider/**/*.{ts,tsx} in content.`,
  code: shaderSliderReactExportCode,
};
