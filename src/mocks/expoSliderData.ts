export interface ExpoSliderDemoSlide {
  id: string;
  chapter: string;
  title: string;
  description: string;
  location: string;
  image: {
    src: string;
    alt: string;
    objectPosition?: string;
  };
}

export const EXPO_SLIDER_DATA: readonly ExpoSliderDemoSlide[] = [
  {
    id: "platform-blue",
    chapter: "Field note 01",
    title: "Platform Blue",
    description: "A pause between the railway and an open horizon.",
    location: "East coast · 10:42",
    image: {
      src: "/reactpod/photos/sea-platform.webp",
      alt: "An empty railway platform and bench facing a bright blue sea",
      objectPosition: "center 48%",
    },
  },
  {
    id: "tangerine-radio",
    chapter: "Field note 02",
    title: "Tangerine Radio",
    description: "Warm light, a pocket player, and nowhere else to be.",
    location: "Jeju shore · 17:18",
    image: {
      src: "/reactpod/photos/seaside-picnic.webp",
      alt: "Tangerines, a camera, a music player, and a book at a seaside picnic",
      objectPosition: "center center",
    },
  },
  {
    id: "after-rain",
    chapter: "Field note 03",
    title: "After Rain",
    description: "Neon gathers in every footprint the city leaves behind.",
    location: "Seoul · 23:07",
    image: {
      src: "/reactpod/photos/neon-alley.webp",
      alt: "A bicycle beside a narrow neon-lit alley after rain",
      objectPosition: "center center",
    },
  },
  {
    id: "blue-hour",
    chapter: "Field note 04",
    title: "Blue Hour",
    description: "The river keeps the last color long after the day lets go.",
    location: "Han River · 19:36",
    image: {
      src: "/reactpod/photos/han-river.webp",
      alt: "The Han River and bridge lights reflected at blue hour",
      objectPosition: "center 42%",
    },
  },
];
