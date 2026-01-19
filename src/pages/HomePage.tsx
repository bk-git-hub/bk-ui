import React from "react";
import { ArrowRight } from "lucide-react";

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

        {/* FEATURED COMPONENTS GRID */}
        <div className="mx-auto mt-24 max-w-4xl">
          <h2 className="mb-10 text-center text-xl leading-8 font-semibold text-slate-900">
            Explore Featured Components
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <FeatureCard
              title="Tinder Swiper"
              description="Interactive card stack with gesture-based swipe controls."
              icon={<img src="/icons/tinder.svg" className="h-10 w-10" />}
              href="/components/tinder-swiper"
            />

            <FeatureCard
              title="Coverflow"
              description="3D carousel effect for browsing media items smoothly."
              icon={<img src="/icons/coverflow.svg" className="h-10 w-10" />}
              href="/components/coverflow"
            />

            <FeatureCard
              title="react Pod Controller"
              description="Retro click-wheel interface with haptic feedback simulation."
              icon={<img src="/icons/ipod.svg" className="h-10 w-10" />}
              href="/components/ipod"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-component for cleaner code organization
function FeatureCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
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
