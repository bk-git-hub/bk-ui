import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const lottoNextExportCode = `// Next.js App Router export
//
// Required files (the same React + Tailwind core used by every framework):
//   src/components/Lotto/LottoDraw.tsx
//   src/components/Lotto/LottoMachine.tsx
//   src/components/Lotto/useLottoDraw.ts
//   src/components/Lotto/useLottoMachinePhysics.ts
//   src/components/Lotto/lottoMachinePhysics.ts
//   src/components/Lotto/index.ts
//
// Runtime helpers already used by the core:
//   pnpm add lucide-react tailwind-merge
// No next/* import or Next.js runtime dependency is required by the core.
// Tailwind v4 for Next.js (when it is not already configured):
//   pnpm add -D tailwindcss @tailwindcss/postcss

// app/_components/LottoMachineClient.tsx
// Keep hooks, timers, event handlers, and function-valued props behind this
// explicit Client Component boundary.
"use client";

import { useEffect, useRef, useState } from "react";
import {
  LottoAction,
  LottoMachine,
  useLottoDraw,
} from "@/components/Lotto";

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
// Files copied into app or src are detected automatically. If BK-UI is imported
// from node_modules, register its source relative to app/globals.css:
//
// app/globals.css
// @import "tailwindcss";
// @source "../node_modules/@your-scope/bk-ui/src/components/Lotto";
`;

export const lottoNextExport: ComponentViewerCodeTab = {
  code: lottoNextExportCode,
  language: "Next.js TSX",
  description:
    "App Router: keep hooks, callbacks, and timers in the shown 'use client' wrapper and import the same @/components/Lotto core. Deterministic initial data hydrates safely, disabling SSR is unnecessary, and external Tailwind source needs @source.",
};
