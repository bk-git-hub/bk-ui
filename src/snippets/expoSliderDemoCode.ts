export const expoSliderDemoCode = `import { useState } from "react";
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

const slides = [
  {
    id: "coast",
    src: "/photos/coast.webp",
    alt: "An empty platform facing the sea",
    title: "Platform Blue",
  },
  {
    id: "picnic",
    src: "/photos/picnic.webp",
    alt: "A picnic arranged beside the water",
    title: "Tangerine Radio",
  },
  {
    id: "city",
    src: "/photos/city.webp",
    alt: "A neon-lit alley after rain",
    title: "After Rain",
  },
];

export default function ExpoSliderDemo() {
  const [orientation, setOrientation] =
    useState<ExpoSliderOrientation>("horizontal");
  const [tilted, setTilted] = useState(false);

  return (
    <section className="rounded-3xl bg-neutral-950 p-6 text-white">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() =>
            setOrientation((current) =>
              current === "horizontal" ? "vertical" : "horizontal",
            )
          }
          className="rounded-full border border-white/20 px-4 py-2"
        >
          Toggle orientation
        </button>
        <button
          type="button"
          aria-pressed={tilted}
          onClick={() => setTilted((current) => !current)}
          className="rounded-full border border-white/20 px-4 py-2"
        >
          Toggle tilt
        </button>
      </div>

      <ExpoSliderRoot
        count={slides.length}
        orientation={orientation}
        rotation={tilted ? 8 : 0}
        loop
        aria-label="Field notes"
      >
        <ExpoSliderViewport className="min-h-80">
          {slides.map((slide, index) => (
            <ExpoSliderSlide
              key={slide.id}
              index={index}
              aria-label={slide.title}
            >
              <ExpoSliderFrame>
                <ExpoSliderImage src={slide.src} alt={slide.alt} />
                <ExpoSliderContent className="flex items-end bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h2 className="text-3xl font-semibold">{slide.title}</h2>
                </ExpoSliderContent>
              </ExpoSliderFrame>
            </ExpoSliderSlide>
          ))}
        </ExpoSliderViewport>

        <div className="flex items-center gap-4">
          <ExpoSliderPrevious aria-label="Previous slide">
            Previous
          </ExpoSliderPrevious>
          <ExpoSliderPagination />
          <ExpoSliderStatus />
          <ExpoSliderNext aria-label="Next slide">Next</ExpoSliderNext>
        </div>
      </ExpoSliderRoot>
    </section>
  );
}`;
