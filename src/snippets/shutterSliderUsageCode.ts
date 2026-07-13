export const shutterSliderUsageCode = `import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
} from "@/components/ShutterSlider";

const stories = [
  {
    image: {
      src: "/images/han-river.webp",
      alt: "해 질 무렵 불빛이 비치는 한강",
    },
    title: "강의 푸른 시간",
  },
  {
    image: {
      src: "/images/neon-alley.webp",
      alt: "비에 젖은 네온 골목",
    },
    title: "비가 남긴 네온",
  },
  {
    image: {
      src: "/images/sea-platform.webp",
      alt: "철길 너머 바다를 마주한 승강장",
    },
    title: "바다를 기다리는 역",
  },
];

const images = stories.map((story) => story.image);

export default function KoreaTravelJournal() {
  return (
    <ShutterSliderRoot
      slides={images}
      stripCount={5}
      orientation="vertical"
      transitionDuration={820}
      stagger={52}
      loop
      aria-label="한국 여행 기록"
      className="relative overflow-hidden rounded-3xl bg-stone-950 text-white"
    >
      <ShutterSliderViewport className="aspect-[16/10] min-h-96 w-full">
        {stories.map((story, index) => (
          <ShutterSliderSlide
            key={story.image.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/85 via-black/15 to-transparent p-8 pb-20"
          >
            <div>
              <p className="text-xs tracking-[0.24em] text-amber-200 uppercase">
                Journey {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-5xl font-black tracking-tight">
                {story.title}
              </h2>
            </div>
          </ShutterSliderSlide>
        ))}
      </ShutterSliderViewport>

      <ShutterSliderPrevious className="absolute top-1/2 left-4 z-30">
        Previous
      </ShutterSliderPrevious>
      <ShutterSliderNext className="absolute top-1/2 right-4 z-30">
        Next
      </ShutterSliderNext>
      <ShutterSliderPagination className="absolute bottom-6 left-8 z-30 text-amber-200" />
      <ShutterSliderStatus className="absolute right-8 bottom-6 z-30 text-white" />
    </ShutterSliderRoot>
  );
}`;
