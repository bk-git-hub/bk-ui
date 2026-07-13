export const lottoDemoCode = `import { useEffect, useRef, useState } from "react";
import { LottoAction, LottoMachine, useLottoDraw } from "@/components/Lotto";

const BALLS = Array.from({ length: 45 }, (_, index) => String(index + 1));
const MIX_DURATION = 4_800;

export default function LottoMachineDemo() {
  const [result, setResult] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const { canDraw, draw, reset } = useLottoDraw({
    items: BALLS,
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
    }, MIX_DURATION);
  };

  return (
    <section className="space-y-6">
      <LottoMachine
        items={BALLS}
        drawnItems={spinning ? [] : result}
        spinning={spinning}
        resultCount={6}
        getItemKey={(ball) => ball}
        aria-label="Lotto machine"
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
}`;
