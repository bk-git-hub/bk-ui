import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const cardsStackSliderReactExport: ComponentViewerCodeTab = {
  language: "React / Vite TSX",
  description:
    "The deterministic React ZIP contains the alias-free core, a complete example, README, file hashes, and an UNLICENSED distribution notice. It is a local verification artifact while the release is blocked; no bk-ui@latest or public download command is available. Choose the dependency set for the host Tailwind major, keep the copied folder in a scanned source tree, and use the relative import below without configuring an alias.",
  code: `// Release status: release-blocked (local verification only)
//
// Canonical manifest:
//   registry/components/cards-stack-slider.json
// Generated React/Vite archive:
//   public/downloads/cards-stack-slider-react.zip
// Registry JSON:
//   public/r/cards-stack-slider.json                 (Tailwind 4)
//   public/r/cards-stack-slider-tailwind-v3.json     (Tailwind 3.4)
// Copy for AI / verified hashes:
//   public/ai/cards-stack-slider.md
//   public/install/cards-stack-slider.json
//
// Generate and verify only this component:
//   pnpm artifacts:build -- --manifest registry/components/cards-stack-slider.json
//   pnpm artifacts:check -- --manifest registry/components/cards-stack-slider.json
//   node --test fixtures/install/cards-stack-slider/cards-stack-slider-artifacts.test.mjs
//
// Extract components/CardsStackSlider from the React ZIP into src/components.
// Tailwind 4:
//   npm install clsx@^2.1.1 tailwind-merge@^3.3.1
//   pnpm add clsx@^2.1.1 tailwind-merge@^3.3.1
// Tailwind 3.4:
//   npm install clsx@^2.1.1 tailwind-merge@2.6.0
//   pnpm add clsx@^2.1.1 tailwind-merge@2.6.0
//
// A local src/components copy is scanned automatically by Tailwind 4.
// For external source, add a stylesheet-relative @source directive.
// Tailwind 3.4 content must include "./src/**/*.{js,ts,jsx,tsx}".

import {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
  type CardsStackOrientation,
} from "./components/CardsStackSlider";

export interface TravelCard {
  id: string;
  title: string;
  details: string;
}

export interface TravelCardsProps {
  cards: readonly TravelCard[];
  orientation?: CardsStackOrientation;
}

export function TravelCards({
  cards,
  orientation = "horizontal",
}: TravelCardsProps) {
  return (
    <CardsStackRoot
      count={cards.length}
      orientation={orientation}
      loop
      aria-label="Travel cards"
    >
      <CardsStackViewport className="h-80 w-full max-w-md">
        {cards.map((card, index) => (
          <CardsStackItem key={card.id} index={index}>
            <CardsStackFront className="bg-slate-950 p-6 text-white">
              <h2 className="text-3xl font-bold">{card.title}</h2>
            </CardsStackFront>
            <CardsStackBack className="bg-slate-900 p-6 text-white">
              <p>{card.details}</p>
            </CardsStackBack>
          </CardsStackItem>
        ))}
      </CardsStackViewport>

      <div className="mt-6 flex items-center gap-4">
        <CardsStackPrevious>Previous</CardsStackPrevious>
        <CardsStackStatus />
        <CardsStackNext>Next</CardsStackNext>
      </div>
    </CardsStackRoot>
  );
}`,
};

export const cardsStackSliderNextJsExport: ComponentViewerCodeTab = {
  language: "Next.js App Router TSX",
  description:
    "The Next.js ZIP reuses the exact React core bytes and adds only client.ts plus App Router examples. It remains an UNLICENSED local verification artifact until the release gate passes. Keep state, callbacks, and function-valued children in the Client Component; Server Components pass only serializable cards. Render-time output is deterministic, so disabling SSR is unnecessary.",
  code: `// Release status: release-blocked (local verification only)
//
// Generated Next.js App Router archive:
//   public/downloads/cards-stack-slider-next.zip
// It contains the exact React core bytes plus:
//   components/CardsStackSlider/client.ts
//   examples/client-wrapper.tsx
//   examples/page.tsx
//
// Generate and verify only this component:
//   pnpm artifacts:build -- --manifest registry/components/cards-stack-slider.json
//   pnpm artifacts:check -- --manifest registry/components/cards-stack-slider.json
//   node --test fixtures/install/cards-stack-slider/cards-stack-slider-artifacts.test.mjs
//
// Extract components/CardsStackSlider into src/components.
// Tailwind 4:
//   npm install clsx@^2.1.1 tailwind-merge@^3.3.1
//   pnpm add clsx@^2.1.1 tailwind-merge@^3.3.1
// Tailwind 3.4:
//   npm install clsx@^2.1.1 tailwind-merge@2.6.0
//   pnpm add clsx@^2.1.1 tailwind-merge@2.6.0

// src/app/cards/cards-gallery.tsx
"use client";

// SSR / hydration: keep count, order, and initial value deterministic.
// Server Components pass serializable data; callbacks stay in this file.
// Render-time window/document access is avoided, so ssr: false is unnecessary.
// Tailwind 4 scans local src/components automatically. External source needs
// a stylesheet-relative @source in globals.css. Tailwind 3.4 must include the
// copied src path in tailwind.config content.

import { useState } from "react";
import {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
} from "../../components/CardsStackSlider/client";

export interface TravelCard {
  id: string;
  title: string;
  details: string;
}

export interface CardsGalleryProps {
  cards: readonly TravelCard[];
}

export function CardsGallery({ cards }: CardsGalleryProps) {
  const [value, setValue] = useState(0);

  return (
    <CardsStackRoot
      count={cards.length}
      value={value}
      onValueChange={(nextValue) => setValue(nextValue)}
      loop
      aria-label="Travel cards"
    >
      <CardsStackViewport className="h-80 w-full max-w-md">
        {cards.map((card, index) => (
          <CardsStackItem key={card.id} index={index}>
            <CardsStackFront className="bg-slate-950 p-6 text-white">
              <h2 className="text-3xl font-bold">{card.title}</h2>
            </CardsStackFront>
            <CardsStackBack className="bg-slate-900 p-6 text-white">
              <p>{card.details}</p>
            </CardsStackBack>
          </CardsStackItem>
        ))}
      </CardsStackViewport>

      <div className="mt-6 flex items-center gap-4">
        <CardsStackPrevious>Previous</CardsStackPrevious>
        <CardsStackStatus />
        <CardsStackNext>Next</CardsStackNext>
      </div>
    </CardsStackRoot>
  );
}

// A Server Component can render:
// <CardsGallery cards={serializableCards} />`,
};
