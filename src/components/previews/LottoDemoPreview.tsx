import { useMemo, useState } from "react";
import { LottoDraw } from "@/components/Lotto";
import { parseBallItems } from "./lotto-demo.util";

const DEFAULT_BALLS = Array.from({ length: 45 }, (_, index) =>
  String(index + 1),
).join("\n");

const BALL_COLORS = [
  "bg-amber-400 text-slate-950 ring-amber-500/30 shadow-amber-950/15",
  "bg-sky-500 ring-sky-600/30 shadow-sky-950/15",
  "bg-rose-500 ring-rose-600/30 shadow-rose-950/15",
  "bg-slate-500 ring-slate-600/30 shadow-slate-950/15",
  "bg-emerald-500 ring-emerald-600/30 shadow-emerald-950/15",
  "bg-violet-500 ring-violet-600/30 shadow-violet-950/15",
] as const;

export default function LottoDemoPreview() {
  const [ballSource, setBallSource] = useState(DEFAULT_BALLS);
  const [drawCount, setDrawCount] = useState(6);
  const [drawnBalls, setDrawnBalls] = useState<string[]>([]);
  const balls = useMemo(() => parseBallItems(ballSource), [ballSource]);
  const isCountValid =
    Number.isInteger(drawCount) && drawCount > 0 && drawCount <= balls.length;
  const validationMessage =
    balls.length === 0
      ? "추첨할 공을 한 개 이상 입력해 주세요."
      : !isCountValid
        ? `추첨 개수는 1부터 ${balls.length} 사이여야 합니다.`
        : null;

  const updateBallSource = (nextSource: string) => {
    setBallSource(nextSource);
    setDrawnBalls([]);
  };

  const updateDrawCount = (nextCount: number) => {
    setDrawCount(nextCount);
    setDrawnBalls([]);
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100 p-4 sm:p-6">
      <div className="mx-auto grid min-h-full w-full max-w-5xl content-center gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-xl shadow-indigo-950/10 backdrop-blur sm:p-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-sky-600 uppercase">
                Lucky draw
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                나만의 로또 추첨
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                어떤 텍스트든 공으로 만들고 원하는 개수만큼 추첨하세요.
              </p>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-700">
              {drawCount} / {balls.length}
            </span>
          </div>

          <LottoDraw
            items={balls}
            drawCount={drawCount}
            value={drawnBalls}
            onValueChange={setDrawnBalls}
            getItemKey={(item, index) => `${item}-${index}`}
            getItemLabel={(item) => item}
            renderBall={(item) => (
              <span className="max-w-full truncate">{item}</span>
            )}
            ballClassName={(_item, index) =>
              BALL_COLORS[index % BALL_COLORS.length]
            }
            drawLabel="추첨하기"
            redrawLabel="다시 추첨"
            resetLabel="초기화"
            emptyMessage="공과 개수를 정한 뒤 추첨해 보세요."
            aria-label="사용자 설정 로또 추첨"
            className="border-0 bg-transparent p-0 shadow-none"
          />
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
                onChange={(event) =>
                  updateDrawCount(event.currentTarget.valueAsNumber)
                }
                aria-invalid={!isCountValid}
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
