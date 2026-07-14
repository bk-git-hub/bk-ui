const SITE_URL = "https://bk-ui.vercel.app";
const DEFAULT_TITLE = "BK UI - Interactive React Components";
const DEFAULT_DESCRIPTION =
  "A collection of polished, interactive, and accessible React + Tailwind component demos.";

export const PAGE_METADATA_SITE = {
  url: SITE_URL,
  name: "BK UI",
  image: `${SITE_URL}/BKUI.png`,
} as const;

export type PageMetadataEntry = {
  path: string;
  title: string;
  description: string;
};

export const pageMetadataEntries = [
  {
    path: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  {
    path: "/components/tinder-swiper",
    title: "Tinder Swiper | BK UI",
    description:
      "Gesture-driven React card stack with keyboard support, accessible controls, and reusable Tailwind styling.",
  },
  {
    path: "/components/coverflow",
    title: "Coverflow | BK UI",
    description:
      "3D React coverflow carousel for browsing media with smooth drag, wheel, and keyboard navigation.",
  },
  {
    path: "/components/react-pod",
    title: "ReactPod | BK UI",
    description:
      "Retro click-wheel React controller with composable menus, photo albums, and Coverflow browsing.",
  },
  {
    path: "/components/lotto",
    title: "Lotto Draw | BK UI",
    description:
      "Configurable React lotto draw interface with custom ball rendering, draw state, and accessible controls.",
  },
  {
    path: "/components/slot-machine",
    title: "Slot Machine | BK UI",
    description:
      "Reusable React slot machine with customizable reels, accessible lever controls, and Tailwind visuals.",
  },
  {
    path: "/components/baccarat-squeeze",
    title: "Baccarat Squeeze | BK UI",
    description:
      "Tactile Baccarat card squeeze component with pointer, touch, and keyboard reveal interactions.",
  },
  {
    path: "/components/cards-stack-slider",
    title: "Cards Stack Slider | BK UI",
    description:
      "Looping 3D React card stack slider with drag, flip, orientation controls, and reusable APIs.",
  },
  {
    path: "/components/shader-slider",
    title: "Shader Slider | BK UI",
    description:
      "WebGL-powered React image slider with graceful fallback, accessible controls, and Tailwind layout.",
  },
  {
    path: "/components/slicer-slider",
    title: "Slicer Slider | BK UI",
    description:
      "Editorial React image reveal slider built from staggered vertical slices and keyboard-friendly controls.",
  },
  {
    path: "/components/shutter-slider",
    title: "Shutter Slider | BK UI",
    description:
      "Cinematic React shutter reveal slider composed from accessible panels and Tailwind utilities.",
  },
  {
    path: "/components/story-slider",
    title: "Story Slider | BK UI",
    description:
      "Grouped React stories with autoplay, hold-to-pause, tap, swipe, and keyboard navigation.",
  },
  {
    path: "/components/expo-slider",
    title: "Expo Slider | BK UI",
    description:
      "Focused React gallery with expanding edge frames, grayscale depth, parallax, and accessible navigation.",
  },
] satisfies PageMetadataEntry[];

function normalizePath(pathname: string) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

export function getPageMetadata(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  return (
    pageMetadataEntries.find((entry) => entry.path === normalizedPath) ??
    pageMetadataEntries[0]
  );
}
