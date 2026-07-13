export const expoSliderUsageCode = `import {
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

export default function FieldNotes() {
  return (
    <ExpoSliderRoot count={slides.length} loop aria-label="Field notes">
      <ExpoSliderViewport className="min-h-80 bg-neutral-950">
        {slides.map((slide, index) => (
          <ExpoSliderSlide key={slide.id} index={index} aria-label={slide.title}>
            <ExpoSliderFrame>
              <ExpoSliderImage src={slide.src} alt={slide.alt} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <ExpoSliderContent className="flex items-end p-6 text-white">
                <h2 className="text-3xl font-semibold">{slide.title}</h2>
              </ExpoSliderContent>
            </ExpoSliderFrame>
          </ExpoSliderSlide>
        ))}
      </ExpoSliderViewport>

      <div className="flex items-center gap-4">
        <ExpoSliderPrevious aria-label="Previous slide">Previous</ExpoSliderPrevious>
        <ExpoSliderPagination />
        <ExpoSliderStatus />
        <ExpoSliderNext aria-label="Next slide">Next</ExpoSliderNext>
      </div>
    </ExpoSliderRoot>
  );
}`;
