import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const baccaratSqueezeReactExport: ComponentViewerCodeTab = {
  language: "React TSX",
  description:
    "Copy BaccaratSqueeze.tsx, useCardSqueeze.ts, and index.ts into src/components/Baccarat, then install clsx, lucide-react, and tailwind-merge. Import the public API from @/components/Baccarat. Tailwind v4 scans files copied under src automatically; package source needs @source, while Tailwind v3 needs a matching content glob.",
  code: `// React / Vite
// Required core files:
//   src/components/Baccarat/BaccaratSqueeze.tsx
//   src/components/Baccarat/useCardSqueeze.ts
//   src/components/Baccarat/index.ts
// Runtime helpers used by that core:
//   pnpm add clsx lucide-react tailwind-merge

import {
  BaccaratPlayingCard,
  BaccaratSqueezeAction,
  BaccaratSqueezeBack,
  BaccaratSqueezeCard,
  BaccaratSqueezeFace,
  BaccaratSqueezeFold,
  BaccaratSqueezeHandle,
  BaccaratSqueezeHint,
  BaccaratSqueezeRoot,
  type BaccaratRank,
  type BaccaratSuit,
  type SqueezeCorner,
} from "@/components/Baccarat";

export interface PlayerCardProps {
  rank?: BaccaratRank;
  suit?: BaccaratSuit;
  corner?: SqueezeCorner;
}

export function PlayerCard({
  rank = "8",
  suit = "diamonds",
  corner = "bottom-right",
}: PlayerCardProps) {
  const cardLabel = [rank, "of", suit].join(" ");

  return (
    <div className="grid min-h-screen place-items-center bg-emerald-950 p-6 text-white">
      <BaccaratSqueezeRoot
        corner={corner}
        revealThreshold={0.68}
        revealAnnouncement={cardLabel + " revealed"}
        aria-label="Player card"
      >
        <BaccaratSqueezeCard>
          <BaccaratSqueezeBack />
          <BaccaratSqueezeFace>
            <BaccaratPlayingCard
              rank={rank}
              suit={suit}
              aria-label={cardLabel}
            />
          </BaccaratSqueezeFace>
          <BaccaratSqueezeFold />
          <BaccaratSqueezeHandle />
        </BaccaratSqueezeCard>
        <BaccaratSqueezeHint />
        <BaccaratSqueezeAction />
      </BaccaratSqueezeRoot>
    </div>
  );
}

// Tailwind CSS v4, when the core is consumed from a package instead of src:
// src/index.css
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/Baccarat";

// Tailwind CSS v3, merge these entries into tailwind.config.ts content:
// content: [
//   "./index.html",
//   "./src/**/*.{js,ts,jsx,tsx}",
//   "./node_modules/@your-scope/bk-ui/src/components/Baccarat/**/*.{js,ts,jsx,tsx}",
// ];
`,
};

export const baccaratSqueezeNextJsExport: ComponentViewerCodeTab = {
  language: "Next.js TSX",
  description:
    "App Router uses the same Baccarat React + Tailwind core plus client.ts. Import from @/components/Baccarat/client and keep state, handlers, refs, and function props inside a 'use client' wrapper. Server Components may pass only serializable props. The core is SSR/hydration-safe without disabling SSR. Tailwind v4 package source needs @source; Tailwind v3 needs a content glob.",
  code: `// Next.js App Router
// Required files (the same core, not a Next.js component copy):
//   src/components/Baccarat/BaccaratSqueeze.tsx
//   src/components/Baccarat/useCardSqueeze.ts
//   src/components/Baccarat/index.ts
//   src/components/Baccarat/client.ts
// Runtime helpers used by that core:
//   pnpm add clsx lucide-react tailwind-merge
// No next/* import or Next.js runtime dependency is required by the core.

// src/components/Baccarat/client.ts
"use client";

export * from "./index";

// app/_components/PlayerCard.tsx
"use client";

import { useState } from "react";
import {
  BaccaratPlayingCard,
  BaccaratSqueezeAction,
  BaccaratSqueezeBack,
  BaccaratSqueezeCard,
  BaccaratSqueezeFace,
  BaccaratSqueezeFold,
  BaccaratSqueezeHandle,
  BaccaratSqueezeHint,
  BaccaratSqueezeRoot,
  type BaccaratRank,
  type BaccaratSuit,
  type SqueezeCorner,
} from "@/components/Baccarat/client";

export interface PlayerCardProps {
  rank: BaccaratRank;
  suit: BaccaratSuit;
  corner?: SqueezeCorner;
}

export function PlayerCard({
  rank,
  suit,
  corner = "bottom-right",
}: PlayerCardProps) {
  const [progress, setProgress] = useState(0);
  const cardLabel = [rank, "of", suit].join(" ");

  return (
    <BaccaratSqueezeRoot
      value={progress}
      onValueChange={(nextProgress) => setProgress(nextProgress)}
      corner={corner}
      revealThreshold={0.68}
      revealAnnouncement={cardLabel + " revealed"}
      aria-label="Player card"
    >
      <BaccaratSqueezeCard>
        <BaccaratSqueezeBack />
        <BaccaratSqueezeFace>
          <BaccaratPlayingCard
            rank={rank}
            suit={suit}
            aria-label={cardLabel}
          />
        </BaccaratSqueezeFace>
        <BaccaratSqueezeFold />
        <BaccaratSqueezeHandle />
      </BaccaratSqueezeCard>
      <BaccaratSqueezeHint />
      <BaccaratSqueezeAction />
    </BaccaratSqueezeRoot>
  );
}

// app/page.tsx remains a Server Component. Its props are serializable strings.
import { PlayerCard } from "./_components/PlayerCard";

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-emerald-950 p-6 text-white">
      <PlayerCard rank="8" suit="diamonds" corner="bottom-right" />
    </main>
  );
}

// SSR / hydration:
// - The core does not read window or document during render. Pointer APIs run
//   from user events or Effect cleanup, so dynamic(..., { ssr: false }) is
//   unnecessary.
// - Keep value/defaultValue and the first card deterministic on server and
//   client. Do not derive initial render state from Date, random, or browser data.
// - Define onValueChange, onReveal, getValueText, refs, and other function props
//   in a Client Component because they are not serializable across the boundary.

// Tailwind CSS v4, when the core is consumed from a package:
// app/globals.css (adjust the path if this file is under src/app)
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/Baccarat";

// Tailwind CSS v3, merge these entries into tailwind.config.ts content:
// content: [
//   "./app/**/*.{js,ts,jsx,tsx,mdx}",
//   "./components/**/*.{js,ts,jsx,tsx,mdx}",
//   "./src/**/*.{js,ts,jsx,tsx,mdx}",
//   "./node_modules/@your-scope/bk-ui/src/components/Baccarat/**/*.{js,ts,jsx,tsx}",
// ];
`,
};
