import React from "react";
import {
  ArrowRight,
  Blinds,
  Cherry,
  Columns3,
  Dices,
  GalleryVerticalEnd,
  GalleryHorizontalEnd,
  Layers3,
  ScanLine,
  Waves,
} from "lucide-react";

const componentCards = [
  {
    title: "Tinder Swiper",
    description: "Interactive card stack with gesture-based swipe controls.",
    icon: <img src="/icons/tinder.svg" className="h-10 w-10" />,
    href: "/components/tinder-swiper",
  },
  {
    title: "Coverflow",
    description: "3D carousel effect for browsing media items smoothly.",
    icon: <img src="/icons/coverflow.svg" className="h-10 w-10" />,
    href: "/components/coverflow",
  },
  {
    title: "ReactPod",
    description: "Retro click-wheel interface with haptic feedback simulation.",
    icon: <img src="/icons/ipod.svg" className="h-10 w-10" />,
    href: "/components/react-pod",
  },
  {
    title: "Cards Stack Slider",
    description: "Looping 3D cards with drag, flip, and orientation controls.",
    icon: <Layers3 aria-hidden="true" className="h-10 w-10" />,
    href: "/components/cards-stack-slider",
  },
  {
    title: "Shader Slider",
    description:
      "WebGL image transitions with accessible controls and graceful fallback.",
    icon: <Waves aria-hidden="true" className="h-10 w-10" />,
    href: "/components/shader-slider",
  },
  {
    title: "Slicer Slider",
    description:
      "Editorial image reveals built from staggered vertical ribbons.",
    icon: <Columns3 aria-hidden="true" className="h-10 w-10" />,
    href: "/components/slicer-slider",
  },
  {
    title: "Shutter Slider",
    description:
      "Cinematic image reveals composed from accessible shutter panels.",
    icon: <Blinds aria-hidden="true" className="h-10 w-10" />,
    href: "/components/shutter-slider",
  },
  {
    title: "Story Slider",
    description:
      "Grouped stories with autoplay, hold-to-pause, tap, swipe, and keyboard controls.",
    icon: <GalleryVerticalEnd aria-hidden="true" className="h-10 w-10" />,
    href: "/components/story-slider",
  },
  {
    title: "Expo Slider",
    description:
      "A focused gallery with expanding edge frames, grayscale depth, and parallax.",
    icon: <GalleryHorizontalEnd aria-hidden="true" className="h-10 w-10" />,
    href: "/components/expo-slider",
  },
] satisfies FeatureCardProps[];

const forFunCards = [
  {
    title: "Lotto Draw",
    description: "Configurable draw with custom ball content and count.",
    icon: <Dices aria-hidden="true" className="h-10 w-10" />,
    href: "/components/lotto",
  },
  {
    title: "Slot Machine",
    description:
      "Customizable reels with editable content and accessible controls.",
    icon: <Cherry aria-hidden="true" className="h-10 w-10" />,
    href: "/components/slot-machine",
  },
  {
    title: "Baccarat Squeeze",
    description:
      "Tactile corner reveal with pointer, touch, and keyboard controls.",
    icon: <ScanLine aria-hidden="true" className="h-10 w-10" />,
    href: "/components/baccarat-squeeze",
  },
] satisfies FeatureCardProps[];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-24 sm:pt-24 sm:pb-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            BK UI
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            A collection of polished, interactive, and fully accessible React
            components.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="https://github.com/bk-git-hub/bk-ui"
              className="group flex items-center text-sm leading-6 font-semibold text-slate-900"
            >
              View on GitHub{" "}
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        <FeatureSection title="Components" cards={componentCards} />
        <FeatureSection title="For Fun" cards={forFunCards} />
      </main>
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
};

function FeatureSection({
  title,
  cards,
}: {
  title: string;
  cards: FeatureCardProps[];
}) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-section`;

  return (
    <section className="mx-auto mt-24 max-w-4xl" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="mb-10 text-center text-xl leading-8 font-semibold text-slate-900"
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <FeatureCard key={card.href} {...card} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ title, description, icon, href }: FeatureCardProps) {
  return (
    <a
      href={href}
      className="group relative flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
    >
      <div className="mb-4 rounded-lg p-2 transition-colors group-hover:bg-indigo-50">
        {icon}
      </div>
      <h3 className="text-base leading-7 font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </a>
  );
}
