import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const tinderReactExport: ComponentViewerCodeTab = {
  language: "React TSX",
  description:
    'Run "pnpm add clsx tailwind-merge", then copy src/components/Tinder into your Vite source tree. Tailwind v4 scans local source automatically; shared source needs an @source "../shared/components" entry in your CSS. Tailwind v3 needs "./src/components/**/*.{js,ts,jsx,tsx}" or the equivalent copied path in content.',
  code: `
// React / Vite copy recipe
// Copy src/components/Tinder/index.tsx and useTinderSwipe.ts.
// Install the runtime helpers: pnpm add clsx tailwind-merge

import {
  TinderCard,
  TinderEmptyFallback,
  TinderLikeButton,
  TinderNopeButton,
  TinderResetButton,
  TinderRoot,
} from "@/components/Tinder";

export interface TinderDeckCard {
  id: string;
  name: string;
  age: number;
  imageSrc: string;
}

export interface TinderDeckProps {
  cards: readonly TinderDeckCard[];
  deckKey?: string;
  onSwipeLeft?: (card: TinderDeckCard) => void;
  onSwipeRight?: (card: TinderDeckCard) => void;
}

export function TinderDeck({
  cards,
  deckKey,
  onSwipeLeft,
  onSwipeRight,
}: TinderDeckProps) {
  return (
    <div className="flex min-h-[36rem] w-full flex-col items-center justify-center bg-gray-100 p-4">
      <TinderRoot
        key={deckKey}
        cards={cards}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      >
        {({ visibleCards, currentIndex }) => (
          <>
            <div className="relative aspect-[2.5/3.5] w-full max-w-[21.5rem]">
              {visibleCards.map(({ item: card, index }) => (
                <TinderCard key={card.id} index={index}>
                  <img
                    src={card.imageSrc}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    decoding="async"
                    fetchPriority={index === currentIndex ? "high" : "auto"}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                    <h3 className="text-2xl font-bold">
                      {card.name}, {card.age}
                    </h3>
                  </div>
                </TinderCard>
              ))}

              <TinderEmptyFallback className="absolute inset-0 grid place-items-center">
                <div className="text-center text-black">
                  <p className="text-xl font-bold">
                    모든 카드를 확인했습니다.
                  </p>
                  <TinderResetButton
                    type="button"
                    className="mt-8 rounded-full bg-black px-5 py-3 text-white"
                  >
                    RESET
                  </TinderResetButton>
                </div>
              </TinderEmptyFallback>
            </div>

            <div className="mt-8 flex gap-8">
              <TinderNopeButton
                type="button"
                aria-label="Pass card"
                className="rounded-full bg-white p-4 text-3xl text-red-500 shadow-xl"
              >
                ×
              </TinderNopeButton>
              <TinderLikeButton
                type="button"
                aria-label="Like card"
                className="rounded-full bg-white p-4 text-3xl text-green-500 shadow-xl"
              >
                ♥
              </TinderLikeButton>
            </div>
          </>
        )}
      </TinderRoot>
    </div>
  );
}

// Tailwind v4 scans files copied under src automatically. For shared source,
// add a stylesheet-relative path such as this to your Tailwind CSS entry:
// @source "../shared/components/Tinder";
// Tailwind v3: include the copied directory in tailwind.config content:
// "./src/components/Tinder/**/*.{js,ts,jsx,tsx}"
`,
};

export const tinderNextJsExport: ComponentViewerCodeTab = {
  language: "Next.js TSX",
  description:
    'App Router: copy the Tinder core with client.ts and keep the render prop and callbacks inside this "use client" wrapper. Server Components should pass only serializable cards and deckKey. Browser APIs run after events or effects, so disabling SSR is unnecessary. Tailwind v4 scans local source automatically; shared source needs @source in globals.css, while Tailwind v3 needs "./src/components/**/*.{js,ts,jsx,tsx}" in content.',
  code: `
// Next.js App Router copy recipe
// Copy index.tsx, useTinderSwipe.ts, and client.ts into
// src/components/Tinder. Install: pnpm add clsx tailwind-merge

// src/components/Tinder/client.ts
"use client";

export * from "./index";

// app/people/tinder-deck.tsx
"use client";

import Image from "next/image";
import {
  TinderCard,
  TinderEmptyFallback,
  TinderLikeButton,
  TinderNopeButton,
  TinderResetButton,
  TinderRoot,
} from "@/components/Tinder/client";

export interface TinderDeckCard {
  id: string;
  name: string;
  age: number;
  imageSrc: string;
}

export interface TinderDeckProps {
  cards: readonly TinderDeckCard[];
  deckKey: string;
}

export function TinderDeck({ cards, deckKey }: TinderDeckProps) {
  return (
    <div className="flex min-h-[36rem] w-full flex-col items-center justify-center bg-gray-100 p-4">
      <TinderRoot key={deckKey} cards={cards}>
        {({ visibleCards, currentIndex }) => (
          <>
            <div className="relative aspect-[2.5/3.5] w-full max-w-[21.5rem]">
              {visibleCards.map(({ item: card, index }) => (
                <TinderCard key={card.id} index={index}>
                  <Image
                    src={card.imageSrc}
                    alt=""
                    aria-hidden="true"
                    fill
                    draggable={false}
                    fetchPriority={index === currentIndex ? "high" : "auto"}
                    sizes="(max-width: 374px) calc(100vw - 2rem), 343px"
                    className="pointer-events-none object-cover object-center select-none"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                    <h3 className="text-2xl font-bold">
                      {card.name}, {card.age}
                    </h3>
                  </div>
                </TinderCard>
              ))}

              <TinderEmptyFallback className="absolute inset-0 grid place-items-center">
                <div className="text-center text-black">
                  <p className="text-xl font-bold">
                    모든 카드를 확인했습니다.
                  </p>
                  <TinderResetButton
                    type="button"
                    className="mt-8 rounded-full bg-black px-5 py-3 text-white"
                  >
                    RESET
                  </TinderResetButton>
                </div>
              </TinderEmptyFallback>
            </div>

            <div className="mt-8 flex gap-8">
              <TinderNopeButton
                type="button"
                aria-label="Pass card"
                className="rounded-full bg-white p-4 text-3xl text-red-500 shadow-xl"
              >
                ×
              </TinderNopeButton>
              <TinderLikeButton
                type="button"
                aria-label="Like card"
                className="rounded-full bg-white p-4 text-3xl text-green-500 shadow-xl"
              >
                ♥
              </TinderLikeButton>
            </div>
          </>
        )}
      </TinderRoot>
    </div>
  );
}

// app/people/page.tsx (Server Component)
import { TinderDeck } from "./tinder-deck";

const cards = [
  {
    id: "jennifer",
    name: "Jennifer",
    age: 24,
    imageSrc: "/tinder/jennifer.webp",
  },
];

export default function PeoplePage() {
  return (
    <TinderDeck
      cards={cards}
      deckKey={cards.map((card) => card.id).join(":")}
    />
  );
}

// Pass only serializable data from the Server Component. Keep TinderRoot's
// render function and ordinary event callbacks inside tinder-deck.tsx.
// The core reads browser APIs only after events/effects, so ssr: false is not
// required and deterministic cards/deckKey keep the first hydration stable.
// Tailwind v4 scans local src automatically. For shared source in globals.css:
// @source "../shared/components/Tinder";
// Tailwind v3 tailwind.config content:
// "./src/components/Tinder/**/*.{js,ts,jsx,tsx}"
`,
};
