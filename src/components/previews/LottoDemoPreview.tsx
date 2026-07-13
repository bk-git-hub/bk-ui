import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { LottoAction, LottoMachine, useLottoDraw } from "@/components/Lotto";
import { LOTTO_MIX_DURATION_MS, parseBallItems } from "./lotto-demo.util";

const DEFAULT_BALLS = Array.from({ length: 45 }, (_, index) =>
  String(index + 1),
).join("\n");

export default function LottoDemoPreview() {
  const [ballSource, setBallSource] = useState(DEFAULT_BALLS);
  const [drawCount, setDrawCount] = useState(6);
  const [drawnBalls, setDrawnBalls] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const drawTimerRef = useRef<number | null>(null);
  const balls = useMemo(() => parseBallItems(ballSource), [ballSource]);
  const { canDraw, draw, reset } = useLottoDraw({
    items: balls,
    drawCount,
    value: drawnBalls,
    onValueChange: setDrawnBalls,
  });
  const validationMessage =
    balls.length === 0
      ? "추첨할 공을 한 개 이상 입력해 주세요."
      : !canDraw
        ? `추첨 개수는 1부터 ${balls.length} 사이여야 합니다.`
        : null;

  useEffect(() => {
    return () => {
      if (drawTimerRef.current !== null) {
        window.clearTimeout(drawTimerRef.current);
      }
    };
  }, []);

  const cancelPendingDraw = () => {
    if (drawTimerRef.current !== null) {
      window.clearTimeout(drawTimerRef.current);
      drawTimerRef.current = null;
    }
    setIsSpinning(false);
  };

  const updateBallSource = (nextSource: string) => {
    cancelPendingDraw();
    setBallSource(nextSource);
    setDrawnBalls([]);
  };

  const updateDrawCount = (nextCount: number) => {
    cancelPendingDraw();
    setDrawCount(Number.isFinite(nextCount) ? nextCount : 0);
    setDrawnBalls([]);
  };

  const startDraw = () => {
    if (!canDraw || isSpinning) return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (prefersReducedMotion) {
      draw();
      return;
    }

    setIsSpinning(true);
    drawTimerRef.current = window.setTimeout(() => {
      draw();
      setIsSpinning(false);
      drawTimerRef.current = null;
    }, LOTTO_MIX_DURATION_MS);
  };

  const resetDraw = () => {
    cancelPendingDraw();
    reset();
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 p-4 sm:p-6">
      <div className="mx-auto grid min-h-full w-full max-w-5xl content-center gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-indigo-950/20 sm:p-6">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-sky-400 uppercase">
                Automatic draw system
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                라이브 로또 추첨기
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                투명한 챔버에서 공을 섞고 결과 트레이로 배출합니다.
              </p>
            </div>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-bold text-sky-300">
              {drawCount} / {balls.length}
            </span>
          </div>

          <LottoMachine
            items={balls}
            drawnItems={isSpinning ? [] : drawnBalls}
            spinning={isSpinning}
            resultCount={drawCount}
            getItemKey={(item, index) => `${item}-${index}`}
            getItemLabel={(item) => item}
            renderBall={(item) => (
              <span className="max-w-full truncate">{item}</span>
            )}
            chamberLabel="추첨 챔버"
            resultLabel="당첨 공"
            readyLabel="준비 완료"
            spinningLabel="혼합 중"
            emptyResult="추첨 대기 중"
            aria-label="사용자 설정 로또 추첨기"
            className="bg-transparent p-0 shadow-none"
          />

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <LottoAction
              className="min-w-32 bg-sky-500 text-white shadow-lg shadow-sky-950/30 hover:bg-sky-400"
              disabled={!canDraw || isSpinning}
              onClick={startDraw}
            >
              {isSpinning ? (
                <RefreshCw
                  aria-hidden="true"
                  className="size-4 motion-safe:animate-spin"
                />
              ) : (
                <Sparkles aria-hidden="true" className="size-4" />
              )}
              {isSpinning
                ? "섞는 중..."
                : drawnBalls.length > 0
                  ? "다시 추첨"
                  : "추첨하기"}
            </LottoAction>
            {drawnBalls.length > 0 && (
              <LottoAction
                className="border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                disabled={isSpinning}
                onClick={resetDraw}
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                초기화
              </LottoAction>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-950/5 sm:p-6">
          <h3 className="text-base font-bold text-slate-900">추첨 설정</h3>

          <div className="mt-5 space-y-5">
            <div>
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="lotto-ball-source"
              >
                공 내용
              </label>
              <textarea
                id="lotto-ball-source"
                value={ballSource}
                disabled={isSpinning}
                onChange={(event) => updateBallSource(event.target.value)}
                aria-describedby="lotto-ball-source-help"
                rows={7}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <p
                className="mt-1.5 text-xs leading-5 text-slate-500"
                id="lotto-ball-source-help"
              >
                줄바꿈이나 쉼표로 구분합니다. 현재 {balls.length}개입니다.
              </p>
            </div>

            <div>
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="lotto-draw-count"
              >
                추첨할 공 개수
              </label>
              <input
                id="lotto-draw-count"
                type="number"
                min={1}
                max={Math.max(1, balls.length)}
                value={drawCount}
                disabled={isSpinning}
                onChange={(event) =>
                  updateDrawCount(event.currentTarget.valueAsNumber)
                }
                aria-invalid={!canDraw}
                aria-describedby={
                  validationMessage ? "lotto-validation" : undefined
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 transition outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {validationMessage && (
              <p
                className="rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 font-medium text-rose-700"
                id="lotto-validation"
                role="alert"
              >
                {validationMessage}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
