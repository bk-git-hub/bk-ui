import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const lottoNextExportCode = `// Next.js App Router export
//
// Use the verified Next.js ZIP, Registry JSON, or Copy for AI resource shown
// above this source. This listing is the integration example for that source.
// A release-blocked resource is not a published download or install command.
//
// Required files (the same React + Tailwind core used by every framework):
//   src/components/Lotto/LottoDraw.tsx
//   src/components/Lotto/LottoMachine.tsx
//   src/components/Lotto/useLottoDraw.ts
//   src/components/Lotto/useLottoMachinePhysics.ts
//   src/components/Lotto/lottoMachinePhysics.ts
//   src/components/Lotto/index.ts
//   src/components/Lotto/client.ts  (Next-only "use client" entry)
//
// Runtime helpers already used by the core:
//   pnpm add lucide-react@^0.542.0 tailwind-merge@^3.3.1
// No next/* import or Next.js runtime dependency is required by the core.
// Tailwind 4.3.2 for Next.js (when it is not already configured):
//   pnpm add -D tailwindcss@4.3.2 @tailwindcss/postcss@4.3.2

// app/_components/LottoMachineClient.tsx
// Keep hooks, timers, event handlers, and function-valued props behind this
// explicit Client Component boundary.
"use client";

import { useEffect, useRef, useState } from "react";
import {
  LottoAction,
  LottoMachine,
  useLottoDraw,
} from "../../components/Lotto/client";

const balls = Array.from({ length: 45 }, (_, index) => index + 1);

export function LottoMachineClient() {
  const [result, setResult] = useState<number[]>([]);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { canDraw, draw, reset } = useLottoDraw({
    items: balls,
    drawCount: 6,
    value: result,
    onValueChange: setResult,
  });

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const startDraw = () => {
    if (!canDraw || spinning) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw();
      return;
    }

    setSpinning(true);
    timerRef.current = setTimeout(() => {
      draw();
      setSpinning(false);
      timerRef.current = null;
    }, 4_800);
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <LottoMachine
        items={balls}
        drawnItems={spinning ? [] : result}
        spinning={spinning}
        resultCount={6}
        getItemKey={(ball) => ball}
        aria-label="Weekly lotto machine"
      />
      <div className="flex justify-center gap-3">
        <LottoAction disabled={!canDraw || spinning} onClick={startDraw}>
          {spinning ? "Mixing..." : "Draw"}
        </LottoAction>
        <LottoAction disabled={spinning || result.length === 0} onClick={reset}>
          Reset
        </LottoAction>
      </div>
    </section>
  );
}

// app/page.tsx remains a Server Component and renders the client boundary.
import { LottoMachineClient } from "./_components/LottoMachineClient";

export default function Page() {
  return <LottoMachineClient />;
}

// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

// SSR / hydration:
// - Keep ball data and initial result/state deterministic on server and client.
//   Trigger random drawing only from an event; never during render.
// - The physics core reads browser animation APIs only after hydration. A
//   dynamic import with ssr: false is unnecessary.
// - onValueChange, renderBall, getItemKey, timers, handlers, and refs belong in
//   a Client Component because functions are not serializable across the
//   Server-to-Client boundary.

// Tailwind CSS v4
// Files copied into app or src are detected automatically.
// app/globals.css
// @import "tailwindcss";
// If this source is moved outside the scanned app tree, add a stylesheet-
// relative @source directive for the actual components/Lotto directory.
`;

export const lottoNextExport: ComponentViewerCodeTab = {
  code: lottoNextExportCode,
  language: "Next.js TSX",
  description:
    "Use the verified Next.js ZIP, Registry JSON, or Copy for AI resource above. Its client entry re-exports the same core; keep callbacks and timers in the shown wrapper. Deterministic initial data hydrates safely without disabling SSR, and source outside app needs a stylesheet-relative @source.",
};
