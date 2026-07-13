import { useId, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
  type ShutterSliderOrientation,
} from "@/components/ShutterSlider";
import {
  SHUTTER_SLIDER_DATA,
  SHUTTER_SLIDER_IMAGES,
} from "@/mocks/shutterSliderData";

const ORIENTATION_OPTIONS: readonly {
  value: ShutterSliderOrientation;
  label: string;
}[] = [
  { value: "vertical", label: "세로" },
  { value: "horizontal", label: "가로" },
];

const STRIP_OPTIONS = [5, 7] as const;
type StripCount = (typeof STRIP_OPTIONS)[number];

export default function ShutterSliderDemoPreview() {
  const [orientation, setOrientation] =
    useState<ShutterSliderOrientation>("vertical");
  const [stripCount, setStripCount] = useState<StripCount>(5);
  const controlId = useId();

  return (
    <div className="h-full min-h-[46rem] w-full overflow-auto rounded-lg bg-[#d9d4ca] p-2 text-white sm:p-4">
      <ShutterSliderRoot
        slides={SHUTTER_SLIDER_IMAGES}
        stripCount={stripCount}
        orientation={orientation}
        transitionDuration={820}
        stagger={52}
        loop
        aria-label="한국의 네 가지 여행 장면"
        className="relative isolate mx-auto h-full min-h-[44rem] w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-black/15 bg-[#11100e] shadow-2xl shadow-stone-950/35"
      >
        <ShutterSliderViewport
          aria-label="좌우 화살표 키를 누르거나 가로로 밀어 여행 장면을 넘기세요"
          className="h-full min-h-[44rem] w-full rounded-[1.7rem] focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-0 focus-visible:ring-inset"
        >
          {SHUTTER_SLIDER_DATA.map((story, index) => (
            <ShutterSliderSlide
              key={story.id}
              index={index}
              aria-label={`${story.title}, ${index + 1}/${SHUTTER_SLIDER_DATA.length}`}
              className="flex items-end overflow-hidden bg-[linear-gradient(180deg,rgba(8,8,7,0.1)_10%,rgba(8,8,7,0.16)_38%,rgba(8,8,7,0.9)_100%)]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,transparent_0,rgba(0,0,0,.14)_48%,rgba(0,0,0,.5)_100%)]"
              />
              <div
                aria-hidden="true"
                className="absolute top-0 bottom-0 left-5 w-px bg-white/15 sm:left-10 lg:left-14"
              />

              <article className="relative z-10 w-full px-7 pt-48 pb-24 sm:px-14 sm:pt-44 sm:pb-28 lg:px-20 lg:pb-32">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      aria-hidden="true"
                      className={`h-px w-8 bg-current sm:w-12 ${story.accentClassName}`}
                    />
                    <p
                      className={`text-[0.62rem] font-bold tracking-[0.28em] uppercase ${story.accentClassName}`}
                    >
                      {story.chapter}
                    </p>
                  </div>

                  <h2 className="mt-4 max-w-4xl text-[clamp(3.1rem,8.5vw,7rem)] leading-[0.9] font-black tracking-[-0.075em] text-balance [word-break:keep-all]">
                    {story.title}
                  </h2>

                  <div className="mt-5 grid max-w-3xl gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-10">
                    <div>
                      <p className="text-[0.58rem] font-bold tracking-[0.22em] text-white/48 uppercase">
                        {story.englishTitle}
                      </p>
                      <p className="mt-2 max-w-xl text-sm leading-6 [word-break:keep-all] text-white/72 sm:text-base sm:leading-7">
                        {story.description}
                      </p>
                    </div>

                    <dl className="hidden min-w-40 border-t border-white/25 pt-3 font-mono text-[0.56rem] tracking-[0.12em] text-white/58 uppercase sm:block">
                      <div className="flex justify-between gap-5">
                        <dt>Place</dt>
                        <dd className="text-right text-white/88">
                          {story.location}
                        </dd>
                      </div>
                      <div className="mt-2 flex justify-between gap-5">
                        <dt>Frame</dt>
                        <dd className="text-right text-white/88">
                          {story.moment}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </article>
            </ShutterSliderSlide>
          ))}
        </ShutterSliderViewport>

        <header className="pointer-events-none absolute top-0 left-0 z-40 flex w-full flex-wrap items-start justify-between gap-4 p-5 sm:p-7 lg:p-9">
          <div>
            <p className="text-[0.68rem] font-black tracking-[0.34em] text-white uppercase">
              BK / 여정
            </p>
            <p className="mt-1 text-[0.55rem] font-semibold tracking-[0.18em] text-white/45 uppercase">
              Korea in four frames
            </p>
          </div>

          <div className="pointer-events-auto flex max-w-full flex-wrap justify-end gap-2">
            <fieldset className="rounded-full border border-white/16 bg-black/30 p-1 backdrop-blur-xl">
              <legend className="sr-only">셔터 방향</legend>
              <div className="flex items-center">
                {ORIENTATION_OPTIONS.map((item) => (
                  <label
                    key={item.value}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-[0.62rem] font-bold tracking-[0.08em] transition-colors has-focus-visible:ring-2 has-focus-visible:ring-amber-200 has-focus-visible:outline-none ${
                      orientation === item.value
                        ? "bg-white text-stone-950"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${controlId}-orientation`}
                      value={item.value}
                      checked={orientation === item.value}
                      onChange={() => setOrientation(item.value)}
                      className="sr-only"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-full border border-white/16 bg-black/30 p-1 backdrop-blur-xl">
              <legend className="sr-only">셔터 조각 수</legend>
              <div className="flex items-center">
                {STRIP_OPTIONS.map((count) => (
                  <label
                    key={count}
                    className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-[0.62rem] font-bold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-amber-200 has-focus-visible:outline-none ${
                      stripCount === count
                        ? "bg-amber-200 text-stone-950"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${controlId}-strip-count`}
                      value={count}
                      checked={stripCount === count}
                      onChange={() => setStripCount(count)}
                      className="sr-only"
                    />
                    {count} CUTS
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </header>

        <ShutterSliderPrevious
          aria-label="이전 여행 장면"
          className="absolute top-1/2 left-3 z-40 grid size-11 -translate-y-1/2 place-items-center border border-white/18 bg-black/25 text-white shadow-lg backdrop-blur-xl hover:bg-white hover:text-stone-950 focus-visible:ring-amber-200 sm:left-5"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </ShutterSliderPrevious>
        <ShutterSliderNext
          aria-label="다음 여행 장면"
          className="absolute top-1/2 right-3 z-40 grid size-11 -translate-y-1/2 place-items-center border border-white/18 bg-black/25 text-white shadow-lg backdrop-blur-xl hover:bg-white hover:text-stone-950 focus-visible:ring-amber-200 sm:right-5"
        >
          <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </ShutterSliderNext>

        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-40 flex items-center justify-between gap-5 px-6 py-6 sm:px-10 sm:py-8 lg:px-14">
          <ShutterSliderPagination
            aria-label="여행 장면 선택"
            getLabel={(index) =>
              `${index + 1}번째 장면, ${SHUTTER_SLIDER_DATA[index]?.title ?? "여행 장면"}`
            }
            className="pointer-events-auto text-amber-200"
          />
          <ShutterSliderStatus className="font-mono text-[0.62rem] font-bold tracking-[0.2em] text-white/65 uppercase">
            {({ value, count }) =>
              `Frame ${String(value + 1).padStart(2, "0")} — ${String(count).padStart(2, "0")}`
            }
          </ShutterSliderStatus>
        </div>
      </ShutterSliderRoot>
    </div>
  );
}
