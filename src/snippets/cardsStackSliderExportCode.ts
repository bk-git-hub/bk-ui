import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const cardsStackSliderReactExport: ComponentViewerCodeTab = {
  language: "React / Vite TSX",
  description:
    'Copy CardsStackSlider.tsx, useCardsStackSlider.ts, and index.ts into src/components/CardsStackSlider, then run "pnpm add clsx tailwind-merge". Tailwind v4 scans local src automatically; external source needs @source "../vendor/BK-UI/src/components/CardsStackSlider" in CSS. Tailwind v3 needs the equivalent "./vendor/BK-UI/src/components/CardsStackSlider/**/*.{js,ts,jsx,tsx}" path in content. Configure an @ → src alias or replace the import with a relative path.',
  code: `// Copy into src/components/CardsStackSlider:
// CardsStackSlider.tsx, useCardsStackSlider.ts, index.ts
// Install: pnpm add clsx tailwind-merge
// Tailwind v4 external source (CSS-relative):
// @source "../vendor/BK-UI/src/components/CardsStackSlider";
// Tailwind v3 content (project-root-relative):
// "./vendor/BK-UI/src/components/CardsStackSlider/**/*.{js,ts,jsx,tsx}"

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
} from "@/components/CardsStackSlider";

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
    "Copy the same core and split the two file blocks below into client.ts and the Client Component. Keep state and callbacks in the Client Component and pass only serializable cards from Server Components. Render-time output is deterministic and browser APIs run after events/effects, so dynamic(..., { ssr: false }) is unnecessary. Keep count, order, and initial value stable for hydration. Tailwind v4 scans local app/src/components automatically; external source needs @source in globals.css, while Tailwind v3 needs the copied path in content.",
  code: `// src/components/CardsStackSlider/client.ts
"use client";

export * from "./index";

// app/cards/cards-gallery.tsx
"use client";

// Copy CardsStackSlider.tsx, useCardsStackSlider.ts, and index.ts too.
// Install: pnpm add clsx tailwind-merge
// SSR / hydration: keep count, order, and initial value deterministic.
// Server Components pass serializable data; callbacks stay in this file.
// Render-time window/document access is avoided, so ssr: false is unnecessary.
// Tailwind v4 external source in globals.css:
// @source "../vendor/BK-UI/src/components/CardsStackSlider";
// Tailwind v3 content:
// "./vendor/BK-UI/src/components/CardsStackSlider/**/*.{js,ts,jsx,tsx}"

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
} from "@/components/CardsStackSlider/client";

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
