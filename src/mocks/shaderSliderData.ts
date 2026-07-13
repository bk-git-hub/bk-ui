import type { ShaderSliderImage } from "@/components/ShaderSlider";

export interface ShaderSliderDemoSlide {
  id: string;
  image: ShaderSliderImage;
  eyebrow: string;
  title: string;
  description: string;
  coordinates: string;
  accentClassName: string;
}

export const SHADER_SLIDER_DATA: readonly ShaderSliderDemoSlide[] = [
  {
    id: "tidal-glass",
    image: {
      src: "/shader-slider/tidal-glass.webp",
      alt: "Abstract teal ocean waves beneath a warm sun",
    },
    eyebrow: "Chapter 01 · East Sea",
    title: "Tidal Glass",
    description: "Where the horizon folds into a liquid signal.",
    coordinates: "37.5665° N · 126.9780° E",
    accentClassName: "text-cyan-200",
  },
  {
    id: "electric-bloom",
    image: {
      src: "/shader-slider/electric-bloom.webp",
      alt: "Luminous magenta petals radiating over a violet night sky",
    },
    eyebrow: "Chapter 02 · Neon Garden",
    title: "Electric Bloom",
    description: "A midnight garden tuned to impossible frequencies.",
    coordinates: "35.1796° N · 129.0756° E",
    accentClassName: "text-fuchsia-200",
  },
  {
    id: "solar-drift",
    image: {
      src: "/shader-slider/solar-drift.webp",
      alt: "Layered amber dunes drifting beneath an oversized sun",
    },
    eyebrow: "Chapter 03 · Red Desert",
    title: "Solar Drift",
    description: "Heat, color, and distance moving as one surface.",
    coordinates: "33.4996° N · 126.5312° E",
    accentClassName: "text-amber-100",
  },
  {
    id: "afterlight",
    image: {
      src: "/shader-slider/afterlight.webp",
      alt: "Indigo mountain ridges illuminated by a pale moon",
    },
    eyebrow: "Chapter 04 · Night Ridge",
    title: "Afterlight",
    description: "The quiet geometry that remains after sunset.",
    coordinates: "36.3504° N · 127.3845° E",
    accentClassName: "text-indigo-100",
  },
];

export const SHADER_SLIDER_IMAGES: readonly ShaderSliderImage[] =
  SHADER_SLIDER_DATA.map((slide) => slide.image);
