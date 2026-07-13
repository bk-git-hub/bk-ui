import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
  StorySliderViewport,
  type StorySliderValue,
} from "@/components/StorySlider";
import { STORY_SLIDER_GROUPS } from "@/mocks/storySliderData";

const GROUP_COUNTS = STORY_SLIDER_GROUPS.map((group) => group.stories.length);

export default function StorySliderDemoPreview() {
  const [value, setValue] = useState<StorySliderValue>({
    groupIndex: 0,
    itemIndex: 0,
  });
  const activeGroup = STORY_SLIDER_GROUPS[value.groupIndex];

  return (
    <div className="relative min-h-full w-full overflow-hidden rounded-lg bg-[#0a0a0c] px-4 py-7 text-white sm:px-7 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -bottom-36 size-80 rounded-full bg-orange-500/10 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center">
        <header className="mb-5 flex w-full max-w-xl items-end justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-black tracking-[0.3em] text-white/45 uppercase">
              BK Stories · No. 01
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-[-0.035em] sm:text-2xl">
              오늘의 장면들
            </h2>
          </div>
          <p className="hidden text-right text-[0.68rem] leading-5 text-white/40 sm:block">
            탭으로 넘기고
            <br />
            길게 눌러 멈춰보세요
          </p>
        </header>

        <nav
          aria-label="스토리 크리에이터"
          className="mb-6 flex w-full max-w-xl justify-center gap-5"
        >
          {STORY_SLIDER_GROUPS.map((group, groupIndex) => {
            const isActive = groupIndex === value.groupIndex;
            return (
              <button
                key={group.id}
                type="button"
                aria-label={`${group.name} 스토리 열기`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setValue({ groupIndex, itemIndex: 0 })}
                className="group flex w-16 flex-col items-center gap-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0c]"
              >
                <span
                  className={`rounded-full bg-gradient-to-tr p-[2px] transition duration-300 ${group.ringClassName} ${
                    isActive
                      ? "scale-105 shadow-[0_0_24px_rgba(255,255,255,0.14)]"
                      : "saturate-50 group-hover:saturate-100"
                  }`}
                >
                  <span className="block rounded-full bg-[#0a0a0c] p-[2px]">
                    <img
                      src={group.avatar}
                      alt=""
                      className="size-11 rounded-full object-cover"
                    />
                  </span>
                </span>
                <span
                  className={`max-w-full truncate text-[0.62rem] font-semibold transition-colors ${
                    isActive ? "text-white" : "text-white/45"
                  }`}
                >
                  {group.name}
                </span>
              </button>
            );
          })}
        </nav>

        <StorySliderRoot
          groupCounts={GROUP_COUNTS}
          value={value}
          onValueChange={(nextValue) => setValue(nextValue)}
          duration={(nextValue) =>
            STORY_SLIDER_GROUPS[nextValue.groupIndex]?.stories[
              nextValue.itemIndex
            ]?.duration ?? 5000
          }
          aria-label="오늘의 크리에이터 스토리"
          className="flex w-full items-center justify-center gap-3 sm:gap-5"
        >
          <StorySliderPrevious className="hidden border border-white/10 bg-white/5 text-white backdrop-blur transition hover:-translate-x-0.5 hover:bg-white/10 sm:inline-flex">
            <ChevronLeft aria-hidden="true" className="size-5" />
          </StorySliderPrevious>

          <StorySliderViewport className="h-[min(64vh,620px)] min-h-[500px] w-auto max-w-none rounded-[2rem] bg-neutral-900 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:min-h-[540px]">
            {STORY_SLIDER_GROUPS.map((group, groupIndex) => (
              <StorySliderGroup
                key={group.id}
                index={groupIndex}
                aria-label={`${group.name}의 스토리`}
                className="rounded-[2rem] border border-white/10 bg-neutral-900 shadow-2xl"
              >
                {group.stories.map((story, storyIndex) => (
                  <StorySliderItem
                    key={story.id}
                    index={storyIndex}
                    aria-label={`${story.title.replace("\n", " ")}. ${story.description}`}
                    className="overflow-hidden rounded-[2rem]"
                  >
                    <img
                      src={story.image}
                      alt={story.alt}
                      draggable={false}
                      loading={
                        groupIndex === value.groupIndex ? "eager" : "lazy"
                      }
                      className={`absolute inset-0 h-full w-full object-cover ${story.imagePositionClassName ?? "object-center"}`}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.52)_0%,transparent_32%,transparent_48%,rgba(0,0,0,.82)_100%)]"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,transparent_0%,rgba(0,0,0,.08)_52%,rgba(0,0,0,.32)_100%)]"
                    />

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-5 pb-7 sm:px-6 sm:pb-8">
                      <div className="mb-4 flex items-center gap-2">
                        <span className={`h-px w-7 ${story.accentClassName}`} />
                        <span className="text-[0.58rem] font-black tracking-[0.24em] text-white/75 uppercase">
                          {story.badge}
                        </span>
                      </div>
                      <p className="text-[0.63rem] font-bold tracking-[0.2em] text-white/55 uppercase">
                        {story.eyebrow}
                      </p>
                      <h3 className="mt-2 text-[1.65rem] leading-[1.03] font-black tracking-[-0.055em] text-balance whitespace-pre-line sm:text-[2rem]">
                        {story.title}
                      </h3>
                      <p className="mt-3 max-w-[17rem] text-xs leading-5 font-medium text-white/65">
                        {story.description}
                      </p>
                    </div>
                  </StorySliderItem>
                ))}

                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-4 sm:p-5">
                  <StorySliderProgress className="mb-4" />
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-full bg-gradient-to-tr p-[1.5px] ${group.ringClassName}`}
                    >
                      <span className="block rounded-full bg-black p-px">
                        <img
                          src={group.avatar}
                          alt=""
                          className="size-8 rounded-full object-cover"
                        />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">
                        {group.handle}
                      </p>
                      <p className="mt-0.5 text-[0.58rem] text-white/50">
                        {group.timeLabel} · Original
                      </p>
                    </div>
                    <Volume2
                      aria-hidden="true"
                      className="size-4 text-white/75"
                    />
                    <MoreHorizontal
                      aria-hidden="true"
                      className="size-5 text-white/75"
                    />
                  </div>
                </div>

                <StorySliderPlayback className="absolute top-12 right-14 z-40 min-h-9 min-w-9 text-white/80 transition hover:bg-white/10 focus-visible:ring-offset-0">
                  {({ paused }) =>
                    paused ? (
                      <Play
                        aria-hidden="true"
                        className="size-4 fill-current"
                      />
                    ) : (
                      <Pause
                        aria-hidden="true"
                        className="size-4 fill-current"
                      />
                    )
                  }
                </StorySliderPlayback>
              </StorySliderGroup>
            ))}
          </StorySliderViewport>

          <StorySliderNext className="hidden border border-white/10 bg-white/5 text-white backdrop-blur transition hover:translate-x-0.5 hover:bg-white/10 sm:inline-flex">
            <ChevronRight aria-hidden="true" className="size-5" />
          </StorySliderNext>

          <StorySliderStatus className="sr-only">
            {({ value: currentValue, itemCount, paused }) => {
              const group = STORY_SLIDER_GROUPS[currentValue.groupIndex];
              return `${group?.name ?? "스토리"}, ${currentValue.itemIndex + 1} / ${itemCount}, ${paused ? "일시정지" : "재생 중"}`;
            }}
          </StorySliderStatus>
        </StorySliderRoot>

        <div className="mt-5 flex items-center gap-2 text-[0.65rem] font-medium text-white/40">
          <span className="inline-block size-1.5 rounded-full bg-white/35" />
          <span className="sm:hidden">좌우 영역을 탭해 넘기세요</span>
          <span className="hidden sm:inline">
            탭: 다음 장면 · 길게 누르기: 일시정지 · 스와이프: 크리에이터 전환
          </span>
        </div>

        <p
          aria-live="polite"
          className="mt-2 text-xs font-semibold text-white/65"
        >
          {activeGroup?.name}
          <span className="mx-1.5 text-white/25">·</span>
          {value.itemIndex + 1} / {activeGroup?.stories.length ?? 0}
        </p>
      </div>
    </div>
  );
}
