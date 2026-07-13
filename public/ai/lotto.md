# Copy for AI: Lotto Draw

Status: `release-blocked` — use only the exact embedded source below for local verification. Do not claim that an npm package, GitHub permalink, ZIP release, or Registry command is publicly available.

Component version: `1.0.0`
Pinned source commit: `8cb1677b64f5934db933c15a602ae45741c5bbd3`
React: `>=19.0.0 <20` (tested `19.2.7`)
Next.js tested: `16.2.10`

## Artifact integrity

- `public/downloads/lotto-next.zip`: `fd1ad16d80391888208ce42777b640960ad21785791f9349233c2d5e473cc349`
- `public/downloads/lotto-react.zip`: `74118772913e9b115c96aba3b7699fbf060388ab40a3cd99da35b10fefbdb795`
- `public/r/lotto.json`: `2180d860c08ebb899c0396d1945046eade751ce2e32e56cccc7cd9f1109a0e63`

## Tailwind variants

### Tailwind 4

- Range: `>=4.0.0 <5`; tested: `4.3.2`
- Dependencies: `lucide-react@^0.542.0 tailwind-merge@^3.3.1`
- Registry item: `lotto`
- Source discovery: Keep components/Lotto in the locally scanned source tree; for shared or ignored source add a stylesheet-relative @source directive for that directory.

Tailwind 3 is unsupported: The canonical Lotto source and layered machine utilities have not passed the required Tailwind 3.4 Vite and Next.js fixture matrix. BK-UI does not generate an unverified v3 artifact.

## SSR and hydration constraints

- Browser measurement, ResizeObserver, matchMedia, and animation frames run only after hydration; Lotto does not require ssr: false.
- Define onValueChange, renderBall, getItemKey, getItemLabel, random, timers, refs, and DOM handlers inside a Client Component; pass only serializable data from a Server Component.
- Import the Next.js entrypoint from components/Lotto/client; it re-exports the unchanged React core and contains no next/* runtime import.
- Keep items, initial results, motionSeed, drawCount, and labels deterministic between the server render and the first hydration render.
- Random selection begins only when draw is called from an interaction and is never consumed during render.

## Accessibility constraints

- For object items, provide stable getItemKey and meaningful getItemLabel functions inside the client boundary.
- Give LottoDraw or LottoMachine a meaningful accessible name and preserve the polite result status announcement.
- Keep LottoAction as a native button with visible focus styles, disabled behavior, and keyboard activation; do not make drawing pointer-only.
- Keep the decorative chamber pool aria-hidden while exposing the result list and machine state through semantic regions and lists.
- Preserve prefers-reduced-motion handling so the result appears without the mixing delay and the chamber remains static.

## Canonical source

### @components/Lotto/LottoDraw.tsx

- Source: `src/components/Lotto/LottoDraw.tsx`
- SHA-256: `b93f2ea623d7a652f0ff840753b7d6788fb43692fc750bd959f79cfa79d9f035`

```tsx
import type { ComponentPropsWithRef, Key, ReactNode } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  useLottoDraw,
  type LottoRandomSource,
  type LottoValueChangeHandler,
} from "./useLottoDraw";

export type LottoRootProps = ComponentPropsWithRef<"section">;
export type LottoBallListProps = ComponentPropsWithRef<"ol">;
export type LottoBallProps = ComponentPropsWithRef<"li">;
export type LottoActionProps = ComponentPropsWithRef<"button">;
// eslint-disable-next-line no-unused-vars
export type LottoItemRenderer<T, TResult> = (...args: [T, number]) => TResult;

export function LottoRoot({ className, ...props }: LottoRootProps) {
  return (
    <section
      {...props}
      data-slot="lotto"
      className={twMerge(
        "w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5",
        className,
      )}
    />
  );
}

export function LottoBallList({ className, ...props }: LottoBallListProps) {
  return (
    <ol
      {...props}
      data-slot="lotto-ball-list"
      className={twMerge(
        "flex min-h-20 flex-wrap items-center justify-center gap-3",
        className,
      )}
    />
  );
}

export function LottoBall({ className, ...props }: LottoBallProps) {
  return (
    <li
      {...props}
      data-slot="lotto-ball"
      className={twMerge(
        "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-sky-500 px-2 text-center text-base font-bold text-white shadow-lg ring-1 shadow-sky-950/15 ring-sky-600/20",
        className,
      )}
    />
  );
}

export function LottoAction({ className, type, ...props }: LottoActionProps) {
  return (
    <button
      {...props}
      type={type ?? "button"}
      data-slot="lotto-action"
      className={twMerge(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
    />
  );
}

export interface LottoDrawProps<T>
  extends Omit<LottoRootProps, "children" | "defaultValue"> {
  items: readonly T[];
  drawCount: number;
  value?: readonly T[];
  defaultValue?: readonly T[];
  onValueChange?: LottoValueChangeHandler<T>;
  renderBall?: LottoItemRenderer<T, ReactNode>;
  getItemKey?: LottoItemRenderer<T, Key>;
  getItemLabel?: LottoItemRenderer<T, string>;
  ballClassName?: string | LottoItemRenderer<T, string>;
  random?: LottoRandomSource;
  drawLabel?: ReactNode;
  redrawLabel?: ReactNode;
  resetLabel?: ReactNode;
  emptyMessage?: ReactNode;
  disabled?: boolean;
}

export function LottoDraw<T>({
  items,
  drawCount,
  value,
  defaultValue,
  onValueChange,
  renderBall = (item) => String(item),
  getItemKey = (_item, index) => index,
  getItemLabel = (item) => String(item),
  ballClassName,
  random,
  drawLabel = "Draw balls",
  redrawLabel = "Draw again",
  resetLabel = "Reset",
  emptyMessage = "Ready to draw",
  disabled = false,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: LottoDrawProps<T>) {
  const { drawnItems, canDraw, draw, reset } = useLottoDraw({
    items,
    drawCount,
    value,
    defaultValue,
    onValueChange,
    random,
  });
  const hasResult = drawnItems.length > 0;
  const state = !canDraw ? "invalid" : hasResult ? "complete" : "idle";
  const statusMessage = hasResult
    ? `Draw complete: ${drawnItems.map(getItemLabel).join(", ")}`
    : "";

  return (
    <LottoRoot
      {...props}
      aria-label={ariaLabelledby ? ariaLabel : (ariaLabel ?? "Lottery draw")}
      aria-labelledby={ariaLabelledby}
      className={className}
      data-state={state}
    >
      <div className="flex flex-col gap-6">
        {hasResult ? (
          <LottoBallList aria-label="Drawn balls">
            {drawnItems.map((item, index) => (
              <LottoBall
                key={getItemKey(item, index)}
                className={
                  typeof ballClassName === "function"
                    ? ballClassName(item, index)
                    : ballClassName
                }
                data-index={index}
                title={getItemLabel(item, index)}
              >
                {renderBall(item, index)}
              </LottoBall>
            ))}
          </LottoBallList>
        ) : (
          <div
            data-slot="lotto-empty"
            className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-medium text-slate-500"
          >
            {emptyMessage}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <LottoAction
            className="bg-sky-600 text-white shadow-sm hover:bg-sky-700"
            disabled={disabled || !canDraw}
            onClick={draw}
          >
            <Sparkles aria-hidden="true" className="size-4" />
            {hasResult ? redrawLabel : drawLabel}
          </LottoAction>
          {hasResult && (
            <LottoAction
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              disabled={disabled}
              onClick={reset}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {resetLabel}
            </LottoAction>
          )}
        </div>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </span>
    </LottoRoot>
  );
}
```

### @components/Lotto/LottoMachine.tsx

- Source: `src/components/Lotto/LottoMachine.tsx`
- SHA-256: `266df325442d7a04c42a6dbb176d503ddad094207c92a300365252d28811993c`

```tsx
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
  depthLayers?: number;
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
  depthLayers = 5,
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
    depthLayerCount: depthLayers,
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
```

### @components/Lotto/client.ts

- Source: `src/components/Lotto/client.ts`
- SHA-256: `2a179d7a0c52410c0c53e9e162e3ae3aeb084e38cb981117f78427294f757b61`

```ts
"use client";

export * from "./index";
```

### @components/Lotto/index.ts

- Source: `src/components/Lotto/index.ts`
- SHA-256: `46caed85853f5a29ccfab1768c29996f5f86d55556ce07fe3309c628e44296e8`

```ts
export {
  LottoAction,
  LottoBall,
  LottoBallList,
  LottoDraw,
  LottoRoot,
  type LottoActionProps,
  type LottoBallListProps,
  type LottoBallProps,
  type LottoDrawProps,
  type LottoItemRenderer,
  type LottoRootProps,
} from "./LottoDraw";
export { LottoMachine, type LottoMachineProps } from "./LottoMachine";
export {
  drawRandomItems,
  isValidDrawCount,
  useLottoDraw,
  type LottoRandomSource,
  type LottoValueChangeHandler,
  type UseLottoDrawOptions,
  type UseLottoDrawResult,
} from "./useLottoDraw";
```

### @components/Lotto/lottoMachinePhysics.ts

- Source: `src/components/Lotto/lottoMachinePhysics.ts`
- SHA-256: `a1733f72732128644d9cb3cd8efa16f320ea067bdf746de0e9ec6dd5fcbf302a`

```ts
const TAU = Math.PI * 2;
const BOUNDARY_PADDING = 0.018;
const DEFAULT_DEPTH_LAYER_COUNT = 5;
const MAX_DEPTH_LAYER_COUNT = 6;
const DEPTH_TRAVEL = 0.11;
const NOZZLE_POSITIONS = [-0.52, 0, 0.52] as const;

export interface LottoPhysicsBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  angularVelocity: number;
  phase: number;
  depthLayer: number;
  depth: number;
  depthAnchor: number;
  depthVelocity: number;
}

export interface CreateLottoPhysicsBodiesOptions {
  count: number;
  ballRadius: number;
  seed?: number;
  depthLayerCount?: number;
}

export interface StepLottoPhysicsOptions {
  deltaTime: number;
  elapsedTime: number;
  mixing: boolean;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothStep(minimum: number, maximum: number, value: number) {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function normalizeLottoDepthLayerCount(value?: number) {
  if (!Number.isFinite(value)) return DEFAULT_DEPTH_LAYER_COUNT;
  return clamp(
    Math.floor(value ?? DEFAULT_DEPTH_LAYER_COUNT),
    1,
    MAX_DEPTH_LAYER_COUNT,
  );
}

function getDepthAnchor(layer: number, layerCount: number) {
  if (layerCount <= 1) return 0;
  return -0.72 + (layer / (layerCount - 1)) * 1.44;
}

export function getLottoPhysicsPresentation(body: LottoPhysicsBody) {
  const normalizedDepth = clamp((body.depth + 1) / 2, 0, 1);

  return {
    scale: 0.78 + normalizedDepth * 0.3,
    opacity: 0.72 + normalizedDepth * 0.28,
    zIndex: 20 + Math.round(normalizedDepth * 60),
  };
}

function getEffectiveRadius(body: LottoPhysicsBody) {
  const normalizedDepth = clamp((body.depth + 1) / 2, 0, 1);
  return body.radius * (0.78 + normalizedDepth * 0.3);
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function clampBodyToBoundary(body: LottoPhysicsBody, restitution: number) {
  const maximumDistance = 1 - getEffectiveRadius(body) - BOUNDARY_PADDING;
  const distance = Math.hypot(body.x, body.y);
  if (distance <= maximumDistance || distance === 0) return;

  const normalX = body.x / distance;
  const normalY = body.y / distance;
  body.x = normalX * maximumDistance;
  body.y = normalY * maximumDistance;

  const outwardVelocity = body.vx * normalX + body.vy * normalY;
  if (outwardVelocity > 0) {
    body.vx -= (1 + restitution) * outwardVelocity * normalX;
    body.vy -= (1 + restitution) * outwardVelocity * normalY;
    body.angularVelocity += (body.vx * normalY - body.vy * normalX) * 18;
  }
}

function resolveBodyCollisions(
  bodies: LottoPhysicsBody[],
  restitution: number,
) {
  for (let firstIndex = 0; firstIndex < bodies.length; firstIndex += 1) {
    const first = bodies[firstIndex];

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < bodies.length;
      secondIndex += 1
    ) {
      const second = bodies[secondIndex];
      if (first.depthLayer !== second.depthLayer) continue;

      let differenceX = second.x - first.x;
      let differenceY = second.y - first.y;
      let distance = Math.hypot(differenceX, differenceY);
      const minimumDistance =
        getEffectiveRadius(first) + getEffectiveRadius(second);

      if (distance >= minimumDistance) continue;

      if (distance < 0.0001) {
        const fallbackAngle =
          ((firstIndex * 17 + secondIndex * 29) % 360) * (Math.PI / 180);
        differenceX = Math.cos(fallbackAngle) * 0.0001;
        differenceY = Math.sin(fallbackAngle) * 0.0001;
        distance = 0.0001;
      }

      const normalX = differenceX / distance;
      const normalY = differenceY / distance;
      const overlap = minimumDistance - distance;
      const correction = overlap * 0.5 + 0.0002;

      first.x -= normalX * correction;
      first.y -= normalY * correction;
      second.x += normalX * correction;
      second.y += normalY * correction;

      const relativeVelocityX = second.vx - first.vx;
      const relativeVelocityY = second.vy - first.vy;
      const normalVelocity =
        relativeVelocityX * normalX + relativeVelocityY * normalY;

      if (normalVelocity < 0) {
        const impulse = (-(1 + restitution) * normalVelocity) / 2;
        first.vx -= impulse * normalX;
        first.vy -= impulse * normalY;
        second.vx += impulse * normalX;
        second.vy += impulse * normalY;

        const tangentX = -normalY;
        const tangentY = normalX;
        const tangentVelocity =
          relativeVelocityX * tangentX + relativeVelocityY * tangentY;
        first.angularVelocity -= tangentVelocity * 8;
        second.angularVelocity += tangentVelocity * 8;
      }
    }
  }
}

export function createLottoPhysicsBodies({
  count,
  ballRadius,
  seed = 2_026,
  depthLayerCount,
}: CreateLottoPhysicsBodiesOptions): LottoPhysicsBody[] {
  const normalizedCount = Math.max(0, Math.floor(count));
  const normalizedRadius = clamp(ballRadius, 0.035, 0.13);
  const normalizedLayerCount = normalizeLottoDepthLayerCount(depthLayerCount);
  const random = createSeededRandom(seed);
  const layerOffset = Math.floor(random() * normalizedLayerCount);
  const columns = Math.max(5, Math.ceil(Math.sqrt(normalizedCount * 1.4)));
  const rows = Math.max(1, Math.ceil(normalizedCount / columns));
  const horizontalStep = 1.44 / Math.max(1, columns - 0.5);
  const verticalStep = Math.min(
    normalizedRadius * 2.04,
    1 / Math.max(1, rows - 1),
  );

  return Array.from({ length: normalizedCount }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const stagger = (row % 2) * 0.5;
    const x = -0.72 + (column + stagger) * horizontalStep;
    const y = 0.66 - row * verticalStep;
    const depthLayer = (index + layerOffset) % normalizedLayerCount;
    const depthAnchor = getDepthAnchor(depthLayer, normalizedLayerCount);
    const body: LottoPhysicsBody = {
      x,
      y,
      vx: 0,
      vy: 0,
      radius: normalizedRadius,
      rotation: random() * 360,
      angularVelocity: (random() - 0.5) * 40,
      phase: random() * TAU,
      depthLayer,
      depth: depthAnchor + (random() - 0.5) * 0.04,
      depthAnchor,
      depthVelocity: (random() - 0.5) * 0.08,
    };

    clampBodyToBoundary(body, 0);
    return body;
  });
}

export function kickLottoPhysicsBodies(
  bodies: LottoPhysicsBody[],
  seed = 2_026,
) {
  const random = createSeededRandom(seed);

  bodies.forEach((body, index) => {
    body.vx += (random() - 0.5) * 1.1;
    body.vy -= 0.25 + random() * 0.75 + (index % 4) * 0.04;
    body.depthVelocity += (random() - 0.5) * 0.3;
    body.angularVelocity += (random() - 0.5) * 180;
    body.phase = (body.phase + random() * TAU) % TAU;
  });
}

export function stepLottoPhysicsBodies(
  bodies: LottoPhysicsBody[],
  { deltaTime, elapsedTime, mixing }: StepLottoPhysicsOptions,
) {
  const timeStep = clamp(deltaTime, 0, 1 / 30);
  if (timeStep === 0) return;

  const gravity = mixing ? 2.2 : 3.15;
  const damping = Math.exp(-(mixing ? 0.26 : 1.35) * timeStep);
  const angularDamping = Math.exp(-(mixing ? 0.28 : 1.7) * timeStep);
  const depthDamping = Math.exp(-(mixing ? 1.15 : 2.4) * timeStep);
  const maximumSpeed = mixing ? 4.2 : 2.6;
  const wallRestitution = mixing ? 0.68 : 0.34;
  const ballRestitution = mixing ? 0.58 : 0.24;

  bodies.forEach((body, index) => {
    let accelerationX = 0;
    let accelerationY = gravity;

    if (mixing) {
      const lowerChamberInfluence = smoothStep(-0.18, 0.86, body.y);
      const liftWave =
        0.7 +
        ((Math.sin(elapsedTime * (2.45 + (index % 5) * 0.08) + body.phase) +
          1) /
          2) *
          0.3;
      const nozzleX =
        NOZZLE_POSITIONS[(index + body.depthLayer) % NOZZLE_POSITIONS.length];
      const nozzleDistance = body.x - nozzleX;
      const nozzleInfluence =
        0.46 + 0.54 * Math.exp(-(nozzleDistance * nozzleDistance) / 0.1);
      const sustainedLift = (6.2 + liftWave * 3.2) * nozzleInfluence;
      const circulationDirection = body.depthLayer % 2 === 0 ? 1 : -1;
      const circulation =
        (0.62 +
          Math.sin(elapsedTime * 1.35 + body.phase + body.depthLayer) * 0.22) *
        circulationDirection;

      accelerationY -= lowerChamberInfluence * sustainedLift;
      accelerationX +=
        (nozzleX - body.x) * lowerChamberInfluence * 1.9 -
        body.y * circulation +
        Math.sin(elapsedTime * 4.7 + body.phase * 1.6) * 0.9;
      accelerationY +=
        body.x * circulation * 0.35 +
        Math.cos(elapsedTime * 3.9 + body.phase * 1.3) * 0.22;

      const planarSpeed = Math.hypot(body.vx, body.vy);
      if (lowerChamberInfluence > 0.45 && planarSpeed < 0.55) {
        accelerationY -= (0.55 - planarSpeed) * lowerChamberInfluence * 3.8;
      }
    }

    body.vx = (body.vx + accelerationX * timeStep) * damping;
    body.vy = (body.vy + accelerationY * timeStep) * damping;

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maximumSpeed) {
      const scale = maximumSpeed / speed;
      body.vx *= scale;
      body.vy *= scale;
    }

    body.x += body.vx * timeStep;
    body.y += body.vy * timeStep;
    const depthAcceleration =
      (body.depthAnchor - body.depth) * 4.2 +
      (mixing
        ? Math.sin(
            elapsedTime * 1.7 + body.phase * 1.25 + body.depthLayer * 0.8,
          ) * 0.34
        : 0);
    body.depthVelocity =
      (body.depthVelocity + depthAcceleration * timeStep) * depthDamping;
    body.depth += body.depthVelocity * timeStep;

    const minimumDepth = body.depthAnchor - DEPTH_TRAVEL;
    const maximumDepth = body.depthAnchor + DEPTH_TRAVEL;
    if (body.depth < minimumDepth || body.depth > maximumDepth) {
      body.depth = clamp(body.depth, minimumDepth, maximumDepth);
      body.depthVelocity *= -0.45;
    }

    body.angularVelocity =
      (body.angularVelocity + body.vx * 22 * timeStep) * angularDamping;
    body.rotation += body.angularVelocity * timeStep;
    clampBodyToBoundary(body, wallRestitution);
  });

  resolveBodyCollisions(bodies, ballRestitution);
  resolveBodyCollisions(bodies, ballRestitution);
  bodies.forEach((body) => clampBodyToBoundary(body, wallRestitution));
}

export function isLottoPhysicsBodyFinite(body: LottoPhysicsBody) {
  return [
    body.x,
    body.y,
    body.vx,
    body.vy,
    body.radius,
    body.rotation,
    body.angularVelocity,
    body.phase,
    body.depthLayer,
    body.depth,
    body.depthAnchor,
    body.depthVelocity,
  ].every(Number.isFinite);
}
```

### @components/Lotto/useLottoDraw.ts

- Source: `src/components/Lotto/useLottoDraw.ts`
- SHA-256: `fda87ade53d3bb2771a062ce9fa0b8e6af734db8779d7ac2330853d5799391e7`

```ts
import { useCallback, useState } from "react";

export type LottoRandomSource = () => number;
// eslint-disable-next-line no-unused-vars
export type LottoValueChangeHandler<T> = (...args: [T[]]) => void;

export interface UseLottoDrawOptions<T> {
  items: readonly T[];
  drawCount: number;
  value?: readonly T[];
  defaultValue?: readonly T[];
  onValueChange?: LottoValueChangeHandler<T>;
  random?: LottoRandomSource;
}

export interface UseLottoDrawResult<T> {
  drawnItems: readonly T[];
  canDraw: boolean;
  draw: () => T[];
  reset: () => void;
}

export function isValidDrawCount(drawCount: number, itemCount: number) {
  return Number.isInteger(drawCount) && drawCount > 0 && drawCount <= itemCount;
}

export function drawRandomItems<T>(
  items: readonly T[],
  drawCount: number,
  random: LottoRandomSource = Math.random,
): T[] {
  if (!isValidDrawCount(drawCount, items.length)) return [];

  const pool = [...items];

  for (let index = 0; index < drawCount; index += 1) {
    const randomValue = random();
    const normalizedRandom = Number.isFinite(randomValue)
      ? Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON)
      : 0;
    const swapIndex =
      index + Math.floor(normalizedRandom * (pool.length - index));

    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, drawCount);
}

export function useLottoDraw<T>({
  items,
  drawCount,
  value,
  defaultValue = [],
  onValueChange,
  random = Math.random,
}: UseLottoDrawOptions<T>): UseLottoDrawResult<T> {
  const [uncontrolledValue, setUncontrolledValue] = useState<T[]>(() => [
    ...defaultValue,
  ]);
  const isControlled = value !== undefined;
  const drawnItems = isControlled ? value : uncontrolledValue;
  const canDraw = isValidDrawCount(drawCount, items.length);

  const updateValue = useCallback(
    (nextValue: T[]) => {
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  const draw = useCallback(() => {
    const nextValue = drawRandomItems(items, drawCount, random);
    if (nextValue.length > 0) updateValue(nextValue);
    return nextValue;
  }, [drawCount, items, random, updateValue]);

  const reset = useCallback(() => {
    updateValue([]);
  }, [updateValue]);

  return { drawnItems, canDraw, draw, reset };
}
```

### @components/Lotto/useLottoMachinePhysics.ts

- Source: `src/components/Lotto/useLottoMachinePhysics.ts`
- SHA-256: `d3e2552849c6aacfabc8326b34f435d9c375e8cad38f9ed4e13e69f02dfe4440`

```ts
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import {
  createLottoPhysicsBodies,
  getLottoPhysicsPresentation,
  kickLottoPhysicsBodies,
  normalizeLottoDepthLayerCount,
  stepLottoPhysicsBodies,
  type LottoPhysicsBody,
} from "./lottoMachinePhysics";

const SETTLE_DURATION_MS = 1_600;
const FIXED_TIME_STEP = 1 / 120;
const MAX_SUBSTEPS = 6;

interface UseLottoMachinePhysicsOptions {
  active: boolean;
  ballCount: number;
  motionSeed?: number;
  depthLayerCount?: number;
}

interface UseLottoMachinePhysicsResult {
  fieldRef: RefObject<HTMLDivElement | null>;
  // eslint-disable-next-line no-unused-vars
  setBallRef: (...args: [number, HTMLSpanElement | null]) => void;
}

interface FieldMeasurement {
  center: number;
  radius: number;
  ballRadius: number;
}

function applyBodyTransform(
  element: HTMLSpanElement,
  body: LottoPhysicsBody,
  measurement: FieldMeasurement,
) {
  const presentation = getLottoPhysicsPresentation(body);
  const depthRatio = Math.min(1, Math.max(0, (body.depth + 1) / 2));
  const parallax = 0.94 + depthRatio * 0.06;
  const x = measurement.center + body.x * measurement.radius * parallax;
  const y = measurement.center + body.y * measurement.radius * parallax;
  const opacity = String(presentation.opacity);
  const zIndex = String(presentation.zIndex);
  const depthLayer = String(body.depthLayer);
  element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${body.rotation}deg) scale(${presentation.scale})`;
  if (element.style.opacity !== opacity) element.style.opacity = opacity;
  if (element.style.zIndex !== zIndex) element.style.zIndex = zIndex;
  if (element.dataset.depthLayer !== depthLayer) {
    element.dataset.depthLayer = depthLayer;
  }
}

function prefersReducedMotion() {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

export function useLottoMachinePhysics({
  active,
  ballCount,
  motionSeed = 2_026,
  depthLayerCount,
}: UseLottoMachinePhysicsOptions): UseLottoMachinePhysicsResult {
  const normalizedDepthLayerCount =
    normalizeLottoDepthLayerCount(depthLayerCount);
  const fieldRef = useRef<HTMLDivElement>(null);
  const ballRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const bodiesRef = useRef<LottoPhysicsBody[]>([]);
  const measurementRef = useRef<FieldMeasurement | null>(null);
  const frameRef = useRef<number | null>(null);
  const wasActiveRef = useRef(false);
  const runCountRef = useRef(0);
  const configurationRef = useRef<{
    depthLayerCount: number;
    motionSeed: number;
  } | null>(null);

  const setBallRef = useCallback(
    (index: number, element: HTMLSpanElement | null) => {
      ballRefs.current[index] = element;
      const body = bodiesRef.current[index];
      const measurement = measurementRef.current;
      if (element && body && measurement) {
        applyBodyTransform(element, body, measurement);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const elements = ballRefs.current.slice(0, ballCount);
    if (!field || elements.length !== ballCount || elements.includes(null)) {
      return;
    }

    let cancelled = false;
    let lastTimestamp: number | null = null;
    let accumulator = 0;
    let elapsedTime = 0;
    let measurement: FieldMeasurement;
    const shouldSettle = !active && wasActiveRef.current;
    const canAnimate =
      typeof window.requestAnimationFrame === "function" &&
      typeof window.cancelAnimationFrame === "function" &&
      !prefersReducedMotion();
    wasActiveRef.current = active;

    const measureField = (): FieldMeasurement => {
      const fieldRect = field.getBoundingClientRect();
      const diameter = fieldRect.width || field.clientWidth || 320;
      const firstBall = elements[0]?.querySelector<HTMLElement>(
        '[data-slot="lotto-machine-ball"]',
      );
      const ballRect = firstBall?.getBoundingClientRect();
      const ballDiameter =
        firstBall?.offsetWidth ||
        ballRect?.width ||
        Math.max(24, diameter * 0.08);
      const radius = diameter / 2;

      return {
        center: radius,
        radius,
        ballRadius: Math.min(0.12, Math.max(0.035, ballDiameter / 2 / radius)),
      };
    };

    const ensureBodies = () => {
      const requiresNewBodies =
        bodiesRef.current.length !== ballCount ||
        configurationRef.current?.depthLayerCount !==
          normalizedDepthLayerCount ||
        configurationRef.current?.motionSeed !== motionSeed ||
        bodiesRef.current.some(
          (body) => Math.abs(body.radius - measurement.ballRadius) > 0.005,
        );

      if (requiresNewBodies) {
        bodiesRef.current = createLottoPhysicsBodies({
          count: ballCount,
          ballRadius: measurement.ballRadius,
          seed: motionSeed,
          depthLayerCount: normalizedDepthLayerCount,
        });
        configurationRef.current = {
          depthLayerCount: normalizedDepthLayerCount,
          motionSeed,
        };
      } else {
        bodiesRef.current.forEach((body) => {
          body.radius = measurement.ballRadius;
        });
      }
    };

    const applyBodies = () => {
      bodiesRef.current.forEach((body, index) => {
        const element = elements[index];
        if (!element) return;
        applyBodyTransform(element, body, measurement);
      });
    };

    const stopFrame = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    measurement = measureField();
    measurementRef.current = measurement;
    ensureBodies();
    applyBodies();

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            measurement = measureField();
            measurementRef.current = measurement;
            ensureBodies();
            applyBodies();
          })
        : null;
    resizeObserver?.observe(field);

    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      stopFrame();
      bodiesRef.current = createLottoPhysicsBodies({
        count: ballCount,
        ballRadius: measurement.ballRadius,
        seed: motionSeed,
        depthLayerCount: normalizedDepthLayerCount,
      });
      applyBodies();
      elements.forEach((element) => {
        if (element) element.style.willChange = "auto";
      });
    };
    motionQuery?.addEventListener?.("change", handleMotionChange);

    const cleanUp = () => {
      cancelled = true;
      stopFrame();
      resizeObserver?.disconnect();
      motionQuery?.removeEventListener?.("change", handleMotionChange);
      elements.forEach((element) => {
        if (element) element.style.willChange = "auto";
      });
    };

    if (!canAnimate) {
      elements.forEach((element) => {
        if (element) element.style.willChange = "auto";
      });
      return cleanUp;
    }

    if (active) {
      runCountRef.current += 1;
      kickLottoPhysicsBodies(
        bodiesRef.current,
        motionSeed + runCountRef.current * 7_919,
      );
    } else if (!shouldSettle) {
      return cleanUp;
    }

    elements.forEach((element) => {
      if (element) element.style.willChange = "transform, opacity";
    });

    const runFrame = (timestamp: number) => {
      if (cancelled) return;

      if (lastTimestamp === null) lastTimestamp = timestamp;
      const frameDelta = Math.min((timestamp - lastTimestamp) / 1_000, 0.05);
      lastTimestamp = timestamp;
      accumulator += frameDelta;
      let substeps = 0;

      while (accumulator >= FIXED_TIME_STEP && substeps < MAX_SUBSTEPS) {
        elapsedTime += FIXED_TIME_STEP;
        stepLottoPhysicsBodies(bodiesRef.current, {
          deltaTime: FIXED_TIME_STEP,
          elapsedTime,
          mixing: active,
        });
        accumulator -= FIXED_TIME_STEP;
        substeps += 1;
      }

      applyBodies();

      if (active || elapsedTime * 1_000 < SETTLE_DURATION_MS) {
        frameRef.current = window.requestAnimationFrame(runFrame);
      } else {
        frameRef.current = null;
        elements.forEach((element) => {
          if (element) element.style.willChange = "auto";
        });
      }
    };

    frameRef.current = window.requestAnimationFrame(runFrame);
    return cleanUp;
  }, [active, ballCount, motionSeed, normalizedDepthLayerCount]);

  return { fieldRef, setBallRef };
}
```

## React/Vite example

```tsx
import { useEffect, useRef, useState } from "react";
import { LottoAction, LottoMachine, useLottoDraw } from "../components/Lotto";

const balls = Array.from({ length: 45 }, (_, index) => index + 1);

export default function LottoExample() {
  const [result, setResult] = useState<number[]>([]);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { canDraw, draw, reset } = useLottoDraw({
    items: balls,
    drawCount: 6,
    value: result,
    onValueChange: setResult,
  });

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
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
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <LottoMachine
        items={balls}
        drawnItems={spinning ? [] : result}
        spinning={spinning}
        resultCount={6}
        motionSeed={2026}
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
    </main>
  );
}
```

## Next.js App Router examples

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { LottoAction, LottoMachine, useLottoDraw } from "../components/Lotto/client";

export interface LottoMachineClientProps {
  balls: readonly number[];
  drawCount: number;
}

export function LottoMachineClient({ balls, drawCount }: LottoMachineClientProps) {
  const [result, setResult] = useState<number[]>([]);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { canDraw, draw, reset } = useLottoDraw({
    items: balls,
    drawCount,
    value: result,
    onValueChange: setResult,
  });

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
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
        resultCount={drawCount}
        motionSeed={2026}
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
```

```tsx
import { LottoMachineClient } from "./client-wrapper";

const balls = Array.from({ length: 45 }, (_, index) => index + 1);

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <LottoMachineClient balls={balls} drawCount={6} />
    </main>
  );
}
```

## Required verification

- Typecheck and production-build the consuming project.
- Confirm the selected Tailwind major emits the representative utilities from the manifest.
- For Next.js, render production HTML, hydrate without console errors, and exercise one interaction.
- Recompute every file and artifact SHA-256 before using the result.
