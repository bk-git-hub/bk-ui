export interface SlicerSliderDemoImage {
  readonly src: string;
  readonly alt: string;
  readonly objectPosition?: string;
}

export interface SlicerSliderDemoStory {
  readonly id: string;
  readonly image: SlicerSliderDemoImage;
  readonly issue: string;
  readonly discipline: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly season: string;
  readonly accentClassName: string;
  readonly ruleClassName: string;
}

export const SLICER_SLIDER_DATA = [
  {
    id: "tidal-glass",
    image: {
      src: "/shader-slider/tidal-glass.webp",
      alt: "Layered turquoise waves beneath a warm sun",
      objectPosition: "68% center",
    },
    issue: "01",
    discipline: "Hydrography",
    title: "Tidal Glass",
    description:
      "A field study in moving horizons, traced where deep water meets first light.",
    location: "East Sea · 37.56° N",
    season: "Summer study / 2026",
    accentClassName: "text-cyan-100",
    ruleClassName: "bg-cyan-100/70",
  },
  {
    id: "electric-bloom",
    image: {
      src: "/shader-slider/electric-bloom.webp",
      alt: "Radiant violet petals orbiting a golden center",
      objectPosition: "66% center",
    },
    issue: "02",
    discipline: "Night botany",
    title: "Electric Bloom",
    description:
      "Impossible petals gather around a small sun, tuned to the frequency of midnight.",
    location: "Neon Garden · 35.17° N",
    season: "Nocturne study / 2026",
    accentClassName: "text-fuchsia-100",
    ruleClassName: "bg-fuchsia-100/70",
  },
  {
    id: "solar-drift",
    image: {
      src: "/shader-slider/solar-drift.webp",
      alt: "Layered amber dunes beneath an oversized sun",
      objectPosition: "68% center",
    },
    issue: "03",
    discipline: "Desert forms",
    title: "Solar Drift",
    description:
      "Heat, distance, and color settle into one continuous line across the horizon.",
    location: "Red Desert · 33.49° N",
    season: "High-sun study / 2026",
    accentClassName: "text-amber-100",
    ruleClassName: "bg-amber-100/70",
  },
  {
    id: "afterlight",
    image: {
      src: "/shader-slider/afterlight.webp",
      alt: "Indigo mountain ridges illuminated by a pale moon",
      objectPosition: "66% center",
    },
    issue: "04",
    discipline: "Lunar terrain",
    title: "Afterlight",
    description:
      "The quiet geometry of a mountain range, recorded in the hour after blue becomes black.",
    location: "Night Ridge · 36.35° N",
    season: "Moonrise study / 2026",
    accentClassName: "text-indigo-100",
    ruleClassName: "bg-indigo-100/70",
  },
] as const satisfies readonly SlicerSliderDemoStory[];

export const SLICER_SLIDER_IMAGES: readonly SlicerSliderDemoImage[] =
  SLICER_SLIDER_DATA.map((story) => story.image);
