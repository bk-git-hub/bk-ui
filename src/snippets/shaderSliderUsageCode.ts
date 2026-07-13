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
    src: "/images/tidal-glass.jpg",
    alt: "Teal ocean waves beneath a warm sun",
    title: "Tidal Glass",
  },
  {
    src: "/images/electric-bloom.jpg",
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
      className="relative overflow-hidden rounded-3xl"
    >
      <ShaderSliderViewport className="aspect-[16/10] w-full">
        {stories.map((story, index) => (
          <ShaderSliderSlide
            key={story.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/80 to-transparent p-8 text-white"
          >
            <h2 className="text-5xl font-black">{story.title}</h2>
          </ShaderSliderSlide>
        ))}
      </ShaderSliderViewport>

      <ShaderSliderPrevious className="absolute left-4 top-1/2 z-30">
        Previous
      </ShaderSliderPrevious>
      <ShaderSliderNext className="absolute right-4 top-1/2 z-30">
        Next
      </ShaderSliderNext>
      <ShaderSliderPagination className="absolute bottom-5 left-5 z-30 text-white" />
      <ShaderSliderStatus className="absolute bottom-5 right-5 z-30 text-white" />
    </ShaderSliderRoot>
  );
}`;
