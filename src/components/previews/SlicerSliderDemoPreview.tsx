import {
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

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={`size-4 ${direction === "next" ? "rotate-180" : ""}`}
    >
      <path
        d="m14.5 5-7 7 7 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SlicerSliderDemoPreview() {
  return (
    <div className="h-full min-h-[36rem] w-full overflow-auto rounded-lg bg-[#d8d3c9] p-2 text-white sm:p-4">
      <SlicerSliderRoot
        slides={SLICER_SLIDER_IMAGES}
        sliceCount={10}
        sliceDuration={760}
        staggerDelay={48}
        loop
        aria-label="Aperture field journal"
        className="relative isolate mx-auto h-full min-h-[34rem] w-full max-w-6xl overflow-hidden rounded-[1.5rem] border border-black/15 bg-[#11110f] shadow-2xl shadow-stone-950/30"
      >
        <SlicerSliderViewport
          aria-label="Swipe, drag, or use the arrow keys to browse the journal"
          className="h-full min-h-[34rem] w-full outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-inset"
        >
          {SLICER_SLIDER_DATA.map((story, index) => (
            <SlicerSliderSlide
              key={story.id}
              index={index}
              aria-label={`${story.title}, story ${index + 1} of ${SLICER_SLIDER_DATA.length}`}
              className="flex min-h-[34rem] items-end overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,8,0.08)_12%,rgba(9,9,8,0.18)_42%,rgba(9,9,8,0.92)_100%)]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 [background-image:linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:10%_100%] opacity-25"
              />

              <article className="relative z-10 grid w-full gap-6 px-5 pt-28 pb-20 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end sm:px-8 sm:pt-32 sm:pb-24 lg:grid-cols-[minmax(0,1fr)_15rem] lg:px-10">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={`h-px w-8 sm:w-12 ${story.ruleClassName}`}
                    />
                    <p
                      className={`text-[0.62rem] font-bold tracking-[0.28em] uppercase ${story.accentClassName}`}
                    >
                      Field note {story.issue} · {story.discipline}
                    </p>
                  </div>
                  <h2 className="mt-4 max-w-2xl text-5xl leading-[0.86] font-black tracking-[-0.065em] text-balance sm:text-7xl lg:text-[5.5rem]">
                    {story.title}
                  </h2>
                  <p className="mt-5 max-w-xl border-l border-white/35 pl-4 text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
                    {story.description}
                  </p>
                </div>

                <dl className="hidden border-t border-white/25 pt-3 text-[0.6rem] font-semibold tracking-[0.16em] text-white/62 uppercase sm:block">
                  <div className="flex items-start justify-between gap-3">
                    <dt>Coordinates</dt>
                    <dd className="text-right text-white/90">
                      {story.location}
                    </dd>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <dt>Edition</dt>
                    <dd className="text-right text-white/90">{story.season}</dd>
                  </div>
                </dl>
              </article>
            </SlicerSliderSlide>
          ))}
        </SlicerSliderViewport>

        <div className="pointer-events-none absolute top-0 left-0 z-40 flex w-full items-start justify-between gap-4 p-5 sm:p-8 lg:p-10">
          <div>
            <p className="text-[0.68rem] font-black tracking-[0.34em] text-white uppercase">
              Aperture / 04
            </p>
            <p className="mt-1 hidden text-[0.56rem] font-semibold tracking-[0.2em] text-white/48 uppercase sm:block">
              A journal of synthetic landscapes
            </p>
          </div>

          <div className="pointer-events-auto flex items-center rounded-full border border-white/20 bg-black/20 p-1 text-white backdrop-blur-md">
            <SlicerSliderPrevious
              aria-label="Previous field note"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ArrowIcon direction="previous" />
            </SlicerSliderPrevious>
            <SlicerSliderStatus className="min-w-16 text-center font-mono text-[0.6rem] font-bold tracking-[0.14em] text-white/75" />
            <SlicerSliderNext
              aria-label="Next field note"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ArrowIcon direction="next" />
            </SlicerSliderNext>
          </div>
        </div>

        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-40 flex items-center justify-between gap-5 px-5 py-5 sm:px-8 sm:py-7 lg:px-10">
          <SlicerSliderPagination
            aria-label="Choose a field note"
            className="pointer-events-auto text-white"
          />
          <p className="hidden text-[0.56rem] font-bold tracking-[0.2em] text-white/45 uppercase sm:block">
            Drag to cut through the archive
          </p>
        </div>
      </SlicerSliderRoot>
    </div>
  );
}
