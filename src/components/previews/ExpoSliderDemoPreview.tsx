import { useState } from "react";
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
  type ExpoSliderOrientation,
} from "@/components/ExpoSlider";
import { EXPO_SLIDER_DATA } from "@/mocks/expoSliderData";

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={direction === "next" ? "size-4 rotate-180" : "size-4"}
    >
      <path
        d="m14.5 5-7 7 7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ORIENTATION_OPTIONS: readonly {
  value: ExpoSliderOrientation;
  label: string;
}[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
];

export default function ExpoSliderDemoPreview() {
  const [orientation, setOrientation] =
    useState<ExpoSliderOrientation>("horizontal");
  const [rotates, setRotates] = useState(false);

  return (
    <div className="h-full w-full overflow-y-auto rounded-lg bg-[#0b0b0c] p-3 text-white sm:p-5">
      <ExpoSliderRoot
        count={EXPO_SLIDER_DATA.length}
        orientation={orientation}
        rotation={rotates ? 8 : 0}
        aria-label="BK field notes"
        className="relative mx-auto min-h-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111113] shadow-2xl shadow-black/50"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 size-80 rounded-full bg-blue-500/10 blur-3xl"
        />

        <header className="relative z-10 flex w-full flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8">
          <div>
            <p className="text-[0.62rem] font-black tracking-[0.3em] text-lime-300 uppercase">
              BK Archive · Vol. 04
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              Small scenes, held open.
            </h2>
            <p className="mt-1 max-w-lg text-sm text-white/45">
              Drag through a photographic field journal. The edges expand while
              the focused frame stays clear.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <fieldset>
              <legend className="sr-only">Slider orientation</legend>
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 p-1">
                {ORIENTATION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.12em] uppercase transition-colors has-focus-visible:ring-2 has-focus-visible:ring-lime-300 has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-[#111113] ${
                      orientation === option.value
                        ? "bg-white text-black"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="expo-slider-orientation"
                      value={option.value}
                      checked={orientation === option.value}
                      onChange={() => setOrientation(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              aria-pressed={rotates}
              onClick={() => setRotates((value) => !value)}
              className={`rounded-full border px-3 py-2 text-[0.65rem] font-bold tracking-[0.12em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] focus-visible:outline-none ${
                rotates
                  ? "border-lime-300 bg-lime-300 text-black"
                  : "border-white/15 bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              Tilt {rotates ? "on" : "off"}
            </button>
          </div>
        </header>

        <div className="relative flex w-full flex-1 flex-col justify-center py-3 sm:py-5">
          <ExpoSliderViewport
            className={
              orientation === "horizontal"
                ? "min-h-[20rem] sm:min-h-[28rem]"
                : "mx-auto aspect-auto h-[38rem] max-h-[72vh] w-full max-w-3xl"
            }
          >
            {EXPO_SLIDER_DATA.map((slide, index) => (
              <ExpoSliderSlide
                key={slide.id}
                index={index}
                aria-label={slide.title}
              >
                <ExpoSliderFrame className="border border-white/10 shadow-2xl shadow-black/60">
                  <ExpoSliderImage
                    src={slide.image.src}
                    alt={slide.image.alt}
                    className="brightness-[0.82]"
                    style={{ objectPosition: slide.image.objectPosition }}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/10"
                  />
                  <ExpoSliderContent className="flex flex-col justify-between p-3 sm:p-7">
                    <div className="flex items-center justify-between text-[0.58rem] font-bold tracking-[0.22em] text-white/60 uppercase">
                      <span>{slide.chapter}</span>
                      <span className="rounded-full border border-white/20 px-2 py-1">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div>
                      <p className="text-[0.6rem] font-bold tracking-[0.2em] text-lime-200 uppercase">
                        {slide.location}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-[-0.05em] sm:mt-2 sm:text-4xl">
                        {slide.title}
                      </h3>
                      <p className="mt-2 hidden max-w-sm text-sm leading-5 text-white/70 sm:block">
                        {slide.description}
                      </p>
                    </div>
                  </ExpoSliderContent>
                </ExpoSliderFrame>
              </ExpoSliderSlide>
            ))}
          </ExpoSliderViewport>

          <div className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 pt-2 sm:px-8">
            <div className="flex items-center gap-2">
              <ExpoSliderPrevious
                aria-label="Previous field note"
                className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:outline-none"
              >
                <ArrowIcon direction="previous" />
              </ExpoSliderPrevious>
              <ExpoSliderNext
                aria-label="Next field note"
                className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:outline-none"
              >
                <ArrowIcon direction="next" />
              </ExpoSliderNext>
            </div>

            <ExpoSliderPagination className="text-lime-300" />

            <ExpoSliderStatus className="min-w-16 text-right font-mono text-xs tracking-[0.16em] text-white/45" />
          </div>
        </div>
      </ExpoSliderRoot>
    </div>
  );
}
