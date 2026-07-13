import type { ComponentViewerCodeTab } from "@/components/layout/component-viewer";

export const lottoReactExportCode = `// React / Vite export
//
// Use the verified React ZIP, Registry JSON, or Copy for AI resource shown
// above this source. This listing is the integration example for that source.
// A release-blocked resource is not a published download or install command.
//
// Required files (keep this single framework-neutral core together):
//   src/components/Lotto/LottoDraw.tsx
//   src/components/Lotto/LottoMachine.tsx
//   src/components/Lotto/useLottoDraw.ts
//   src/components/Lotto/useLottoMachinePhysics.ts
//   src/components/Lotto/lottoMachinePhysics.ts
//   src/components/Lotto/index.ts
//
// Runtime helpers already used by the core:
//   pnpm add lucide-react@^0.542.0 tailwind-merge@^3.3.1
// Tailwind 4.3.2 for Vite (when it is not already configured):
//   pnpm add -D tailwindcss@4.3.2 @tailwindcss/vite@4.3.2

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});

// src/components/ProductLotto.tsx
import { useEffect, useRef, useState } from "react";
import { LottoAction, LottoMachine, useLottoDraw } from "./Lotto";

const balls = Array.from({ length: 45 }, (_, index) => index + 1);

export function ProductLotto() {
  const [result, setResult] = useState<number[]>([]);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const { canDraw, draw, reset } = useLottoDraw({
    items: balls,
    drawCount: 6,
    value: result,
    onValueChange: setResult,
  });

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const startDraw = () => {
    if (!canDraw || spinning) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw();
      return;
    }

    setSpinning(true);
    timerRef.current = window.setTimeout(() => {
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

// Tailwind CSS v4
// Files copied below your app's src directory are detected automatically.
// src/index.css
// @import "tailwindcss";
// If this source is moved outside the scanned app tree, add a stylesheet-
// relative @source directive for the actual components/Lotto directory.
`;

export const lottoReactExport: ComponentViewerCodeTab = {
  code: lottoReactExportCode,
  language: "React TSX",
  description:
    "Use the verified React ZIP, Registry JSON, or Copy for AI resource above. The code below integrates the six-file core in Vite; Tailwind v4 scans local source automatically, and external source needs a stylesheet-relative @source.",
};
