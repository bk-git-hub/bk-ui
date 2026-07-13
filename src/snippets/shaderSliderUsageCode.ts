export const shaderSliderUsageCode = `import {
  ShaderSliderNext,
  ShaderSliderPagination,
  ShaderSliderPrevious,
  ShaderSliderRoot,
  ShaderSliderSlide,
  ShaderSliderStatus,
  ShaderSliderViewport,
} from "@/components/ShaderSlider";

const stories = [
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

export default function VisualStories() {
  return (
    <ShaderSliderRoot
      slides={stories}
      effect="wave"
      transitionDuration={950}
      intensity={0.9}
      loop
      aria-label="Visual stories"
      className="relative overflow-hidden rounded-3xl bg-slate-950 text-white"
    >
      <ShaderSliderViewport className="aspect-[16/10] w-full">
        {stories.map((story, index) => (
          <ShaderSliderSlide
            key={story.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/80 to-transparent p-8"
          >
            <h2 className="text-5xl font-black">{story.title}</h2>
          </ShaderSliderSlide>
        ))}
      </ShaderSliderViewport>

      <ShaderSliderPrevious className="absolute top-1/2 left-4 z-30 -translate-y-1/2 bg-black/50 px-4 py-2">
        Previous
      </ShaderSliderPrevious>
      <ShaderSliderNext className="absolute top-1/2 right-4 z-30 -translate-y-1/2 bg-black/50 px-4 py-2">
        Next
      </ShaderSliderNext>
      <ShaderSliderPagination className="absolute bottom-5 left-5 z-30 text-white" />
      <ShaderSliderStatus className="absolute right-5 bottom-5 z-30 text-white" />
    </ShaderSliderRoot>
  );
}`;
