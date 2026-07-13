import type { ComponentPropsWithRef, Key, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { LottoBall, LottoBallList, type LottoItemRenderer } from "./LottoDraw";
import { useLottoMachinePhysics } from "./useLottoMachinePhysics";

const DEFAULT_BALL_COLORS = [
  "bg-amber-400 text-slate-950 ring-amber-500/30 shadow-amber-950/20",
  "bg-sky-500 text-white ring-sky-600/30 shadow-sky-950/20",
  "bg-rose-500 text-white ring-rose-600/30 shadow-rose-950/20",
  "bg-slate-500 text-white ring-slate-600/30 shadow-slate-950/20",
  "bg-emerald-500 text-white ring-emerald-600/30 shadow-emerald-950/20",
  "bg-violet-500 text-white ring-violet-600/30 shadow-violet-950/20",
] as const;

export interface LottoMachineProps<T>
  extends Omit<ComponentPropsWithRef<"section">, "children"> {
  items: readonly T[];
  drawnItems?: readonly T[];
  spinning?: boolean;
  motionSeed?: number;
  maxVisibleBalls?: number;
  resultCount?: number;
  renderBall?: LottoItemRenderer<T, ReactNode>;
  getItemKey?: LottoItemRenderer<T, Key>;
  getItemLabel?: LottoItemRenderer<T, string>;
  ballClassName?: string | LottoItemRenderer<T, string>;
  chamberLabel?: string;
  resultLabel?: string;
  readyLabel?: ReactNode;
  spinningLabel?: ReactNode;
  emptyResult?: ReactNode;
}

function getDefaultBallColor(label: string) {
  const numericValue = Number(label);

  if (Number.isFinite(numericValue) && numericValue > 0) {
    const group = Math.min(
      DEFAULT_BALL_COLORS.length - 1,
      Math.floor((numericValue - 1) / 10),
    );
    return DEFAULT_BALL_COLORS[group];
  }

  const hash = Array.from(label).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return DEFAULT_BALL_COLORS[hash % DEFAULT_BALL_COLORS.length];
}

export function LottoMachine<T>({
  items,
  drawnItems = [],
  spinning = false,
  motionSeed = 2_026,
  maxVisibleBalls = 60,
  resultCount = 6,
  renderBall = (item) => String(item),
  getItemKey = (_item, index) => index,
  getItemLabel = (item) => String(item),
  ballClassName,
  chamberLabel = "Lottery chamber",
  resultLabel = "Drawn balls",
  readyLabel = "Ready",
  spinningLabel = "Mixing",
  emptyResult = "Waiting for the draw",
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: LottoMachineProps<T>) {
  const visibleBallLimit = Number.isFinite(maxVisibleBalls)
    ? Math.max(0, Math.floor(maxVisibleBalls))
    : items.length;
  const visibleItems = items.slice(0, visibleBallLimit);
  const { fieldRef, setBallRef } = useLottoMachinePhysics({
    active: spinning,
    ballCount: visibleItems.length,
    motionSeed,
  });
  const placeholderCount = Number.isFinite(resultCount)
    ? Math.min(12, Math.max(1, Math.floor(resultCount)))
    : 6;
  const statusMessage = spinning
    ? `${chamberLabel}: ${items.length} balls are mixing`
    : drawnItems.length > 0
      ? `Draw complete: ${drawnItems.map(getItemLabel).join(", ")}`
      : `${chamberLabel}: ${items.length} balls ready`;
  const machineBallSize =
    visibleItems.length > 36
      ? "size-7 text-[9px] sm:size-8 sm:text-[10px]"
      : "size-8 text-[10px] sm:size-9 sm:text-xs";
  const resolveBallClassName = (item: T, index: number) => {
    const customClassName =
      typeof ballClassName === "function"
        ? ballClassName(item, index)
        : ballClassName;

    return twMerge(
      getDefaultBallColor(getItemLabel(item, index)),
      customClassName,
    );
  };

  return (
    <section
      {...props}
      aria-busy={spinning || undefined}
      aria-label={
        ariaLabelledby ? ariaLabel : (ariaLabel ?? "Lottery drawing machine")
      }
      aria-labelledby={ariaLabelledby}
      data-slot="lotto-machine"
      data-state={spinning ? "spinning" : "idle"}
      className={twMerge(
        "w-full rounded-[2rem] bg-[radial-gradient(circle_at_50%_10%,#1e3a5f_0%,#0f172a_52%,#020617_100%)] p-4 text-white shadow-2xl shadow-slate-950/30 sm:p-6",
        className,
      )}
    >
      <div className="relative isolate mx-auto w-full max-w-[30rem]">
        <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
          <div
            aria-hidden="true"
            className="absolute top-[4%] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-500 bg-slate-950/90 px-3 py-1.5 shadow-lg"
          >
            <span
              className={twMerge(
                "size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]",
                spinning &&
                  "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,.9)] motion-safe:animate-pulse",
              )}
            />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-200 uppercase">
              {spinning ? spinningLabel : readyLabel}
            </span>
          </div>

          <div
            aria-hidden="true"
            className="absolute inset-[1.5%] rounded-full border-[clamp(.55rem,2.5vw,.85rem)] border-slate-300 bg-gradient-to-br from-slate-100 via-slate-500 to-slate-800 shadow-[inset_0_0_0_2px_rgba(255,255,255,.65),0_28px_50px_-25px_rgba(2,6,23,.95)]"
          />

          <div className="absolute inset-[5.5%] overflow-hidden rounded-full border-2 border-white/75 bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,.82)_0%,rgba(186,230,253,.38)_30%,rgba(14,116,144,.18)_65%,rgba(2,6,23,.38)_100%)] shadow-[inset_0_-32px_55px_rgba(15,23,42,.3)]">
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-[7%] h-2 w-[86%] -translate-y-1/2 rounded-full bg-gradient-to-b from-slate-200 via-slate-500 to-slate-800 opacity-55 shadow"
            />
            <div
              aria-hidden="true"
              className="absolute top-[7%] left-1/2 h-[86%] w-2 -translate-x-1/2 rounded-full bg-gradient-to-r from-slate-200 via-slate-500 to-slate-800 opacity-45 shadow"
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 z-10 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-700 shadow-lg sm:size-12"
            />

            <div className="sr-only">
              {chamberLabel}: {items.length} balls
            </div>
            <div
              ref={fieldRef}
              aria-hidden="true"
              data-slot="lotto-machine-balls"
              className="absolute inset-[5%] z-20 rounded-full"
            >
              {visibleItems.map((item, index) => (
                <span
                  key={getItemKey(item, index)}
                  ref={(element) => setBallRef(index, element)}
                  data-slot="lotto-machine-ball-body"
                  className="absolute top-0 left-0"
                >
                  <span
                    data-index={index}
                    data-slot="lotto-machine-ball"
                    title={getItemLabel(item, index)}
                    className={twMerge(
                      "relative flex items-center justify-center overflow-hidden rounded-full border border-white/80 px-1 text-center leading-none font-black shadow-[inset_-3px_-4px_6px_rgba(15,23,42,.28),inset_2px_2px_4px_rgba(255,255,255,.6),0_3px_7px_rgba(15,23,42,.32)] ring-1 before:absolute before:top-[12%] before:left-[18%] before:size-[24%] before:rounded-full before:bg-white/70 before:blur-[1px] before:content-['']",
                      machineBallSize,
                      resolveBallClassName(item, index),
                    )}
                  >
                    <span className="max-w-full truncate">
                      {renderBall(item, index)}
                    </span>
                  </span>
                </span>
              ))}
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-[8%] left-[14%] z-30 h-[35%] w-[12%] -rotate-[28deg] rounded-full bg-white/45 blur-[2px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[12%] bottom-[11%] z-30 h-[16%] w-[8%] rotate-[32deg] rounded-full bg-white/20 blur-[2px]"
            />
          </div>

          <div
            aria-hidden="true"
            data-slot="lotto-machine-chute"
            className="absolute right-[3%] bottom-[10%] z-30 h-[24%] w-[15%] rotate-[24deg] rounded-full border-[clamp(.35rem,1.5vw,.55rem)] border-slate-300 bg-gradient-to-r from-slate-800 via-slate-500 to-slate-900 shadow-xl"
          />
        </div>

        <div
          aria-hidden="true"
          className="relative z-10 mx-auto -mt-[9%] h-20 w-[38%] min-w-28 bg-gradient-to-r from-slate-600 via-slate-200 to-slate-600 [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]"
        />
        <div
          aria-hidden="true"
          className="relative z-20 mx-auto -mt-4 h-8 w-[74%] rounded-[50%] border-4 border-slate-300 bg-gradient-to-b from-slate-500 to-slate-900 shadow-xl"
        />

        <div
          data-slot="lotto-machine-result-tray"
          className="relative z-40 mx-auto -mt-4 w-full rounded-[1.5rem] border-[3px] border-slate-300 bg-gradient-to-b from-slate-100 to-slate-500 p-2 shadow-[0_22px_38px_-24px_rgba(2,6,23,.95)]"
        >
          <div className="rounded-[1.1rem] border border-slate-950/30 bg-slate-950/90 p-3 shadow-inner sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <span className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">
                {resultLabel}
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                {drawnItems.length}
              </span>
            </div>

            {drawnItems.length > 0 ? (
              <LottoBallList
                aria-label={resultLabel}
                className="min-h-14 gap-2 sm:min-h-16 sm:gap-3"
              >
                {drawnItems.map((item, index) => (
                  <LottoBall
                    key={getItemKey(item, index)}
                    className={twMerge(
                      "relative size-11 text-sm shadow-[inset_-4px_-5px_8px_rgba(15,23,42,.26),inset_3px_3px_5px_rgba(255,255,255,.5),0_5px_10px_rgba(2,6,23,.42)] before:absolute before:top-[12%] before:left-[18%] before:size-[24%] before:rounded-full before:bg-white/70 before:blur-[1px] before:content-[''] sm:size-13 sm:text-base",
                      resolveBallClassName(item, index),
                    )}
                    title={getItemLabel(item, index)}
                  >
                    <span className="max-w-full truncate">
                      {renderBall(item, index)}
                    </span>
                  </LottoBall>
                ))}
              </LottoBallList>
            ) : (
              <div className="flex min-h-14 flex-col items-center justify-center gap-2 sm:min-h-16">
                <div
                  aria-hidden="true"
                  className="flex flex-wrap justify-center gap-2"
                >
                  {Array.from({ length: placeholderCount }, (_, index) => (
                    <span
                      key={index}
                      className="size-4 rounded-full border border-slate-600 bg-slate-900 shadow-inner sm:size-5"
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {emptyResult}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </span>
    </section>
  );
}
