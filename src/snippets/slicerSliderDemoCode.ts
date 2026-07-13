export const slicerSliderDemoCode = `import {
  SlicerSliderNext,
  SlicerSliderPagination,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderStatus,
  SlicerSliderViewport,
} from "@/components/SlicerSlider";
import {
  SLICER_SLIDER_DATA,
  SLICER_SLIDER_IMAGES,
} from "@/mocks/slicerSliderData";

export default function ApertureFieldJournal() {
  return (
    <SlicerSliderRoot
      slides={SLICER_SLIDER_IMAGES}
      sliceCount={10}
      sliceDuration={760}
      staggerDelay={48}
      loop
      aria-label="Aperture field journal"
      className="relative isolate min-h-[34rem] overflow-hidden rounded-3xl bg-stone-950 text-white"
    >
      <SlicerSliderViewport className="min-h-[34rem] w-full">
        {SLICER_SLIDER_DATA.map((story, index) => (
          <SlicerSliderSlide
            key={story.id}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/90 via-black/10 to-transparent p-8 pb-24"
          >
            <div className="relative z-10 max-w-2xl">
              <p className="text-xs font-bold tracking-[0.28em] uppercase">
                Field note {story.issue} · {story.discipline}
              </p>
              <h2 className="mt-4 text-6xl font-black tracking-tight">
                {story.title}
              </h2>
              <p className="mt-5 text-white/70">{story.description}</p>
            </div>
          </SlicerSliderSlide>
        ))}
      </SlicerSliderViewport>

      <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
        <SlicerSliderPrevious aria-label="Previous field note" />
        <SlicerSliderStatus />
        <SlicerSliderNext aria-label="Next field note" />
      </div>
      <SlicerSliderPagination className="absolute bottom-6 left-8 z-30" />
    </SlicerSliderRoot>
  );
}`;
