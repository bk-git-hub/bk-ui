export const slicerSliderUsageCode = `import {
  SlicerSliderNext,
  SlicerSliderPagination,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderStatus,
  SlicerSliderViewport,
} from "@/components/SlicerSlider";

const stories = [
  {
    src: "/images/tidal-glass.webp",
    alt: "Layered turquoise waves beneath a warm sun",
    title: "Tidal Glass",
  },
  {
    src: "/images/electric-bloom.webp",
    alt: "Radiant violet petals orbiting a golden center",
    title: "Electric Bloom",
  },
  {
    src: "/images/solar-drift.webp",
    alt: "Layered amber dunes beneath an oversized sun",
    title: "Solar Drift",
  },
];

export default function FieldJournal() {
  return (
    <SlicerSliderRoot
      slides={stories}
      sliceCount={10}
      sliceDuration={760}
      staggerDelay={48}
      loop
      aria-label="Field journal"
      className="relative overflow-hidden rounded-3xl bg-stone-950 text-white"
    >
      <SlicerSliderViewport className="aspect-[16/10] min-h-96 w-full">
        {stories.map((story, index) => (
          <SlicerSliderSlide
            key={story.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/85 via-black/10 to-transparent p-8 pb-20"
          >
            <div>
              <p className="text-xs tracking-[0.24em] text-white/60 uppercase">
                Field note {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-5xl font-black tracking-tight">
                {story.title}
              </h2>
            </div>
          </SlicerSliderSlide>
        ))}
      </SlicerSliderViewport>

      <div className="absolute top-5 right-5 z-30 flex items-center gap-3">
        <SlicerSliderPrevious aria-label="Previous story">
          Previous
        </SlicerSliderPrevious>
        <SlicerSliderStatus />
        <SlicerSliderNext aria-label="Next story">Next</SlicerSliderNext>
      </div>
      <SlicerSliderPagination className="absolute bottom-5 left-8 z-30" />
    </SlicerSliderRoot>
  );
}`;
