import type { ReactPodSliderItem } from "@/components/ReactPod";

export const REACT_POD_DEMO_SLIDER_ITEMS = [
  {
    id: "platform-blue",
    title: "Platform Blue",
    description: "A quiet platform opening onto the East Sea.",
    imageSrc: "/reactpod/photos/sea-platform.webp",
    imageAlt: "An empty railway platform and bench facing a bright blue sea",
    imageObjectPosition: "center 48%",
  },
  {
    id: "tangerine-radio",
    title: "Tangerine Radio",
    description: "A pocket player and warm light beside the water.",
    imageSrc: "/reactpod/photos/seaside-picnic.webp",
    imageAlt:
      "Tangerines, a camera, a music player, and a book at a seaside picnic",
  },
  {
    id: "after-rain",
    title: "After Rain",
    description: "Neon reflected through a narrow Seoul alley.",
    imageSrc: "/reactpod/photos/neon-alley.webp",
    imageAlt: "A bicycle beside a narrow neon-lit alley after rain",
  },
  {
    id: "blue-hour",
    title: "Blue Hour",
    description: "The Han River holding the final color of the day.",
    imageSrc: "/reactpod/photos/han-river.webp",
    imageAlt: "The Han River and bridge lights reflected at blue hour",
    imageObjectPosition: "center 42%",
  },
] as const satisfies readonly ReactPodSliderItem[];
