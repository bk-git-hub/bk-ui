import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useCardSqueeze,
  type SqueezeCorner,
  type SqueezeOrigin,
  type SqueezeState,
  type UseCardSqueezeOptions,
} from "./useCardSqueeze";

export type BaccaratRank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
export type BaccaratSuit = "clubs" | "diamonds" | "hearts" | "spades";

// The base ESLint rule cannot distinguish type-only function parameters.
// eslint-disable-next-line no-unused-vars
export type SqueezeValueTextFormatter = (progress: number) => string;

interface BaccaratSqueezeContextValue {
  progress: number;
  state: SqueezeState;
  corner: SqueezeCorner;
  origin: SqueezeOrigin;
  isDragging: boolean;
  disabled: boolean;
  readOnly: boolean;
  getValueText: SqueezeValueTextFormatter;
  reveal: ReturnType<typeof useCardSqueeze>["reveal"];
  reset: ReturnType<typeof useCardSqueeze>["reset"];
  cardProps: ReturnType<typeof useCardSqueeze>["cardProps"];
}

const BaccaratSqueezeContext =
  createContext<BaccaratSqueezeContextValue | null>(null);

function useBaccaratSqueezeContext(componentName: string) {
  const context = useContext(BaccaratSqueezeContext);
  if (!context) {
    throw new Error(
      `${componentName} must be rendered inside BaccaratSqueezeRoot.`,
    );
  }
  return context;
}

function defaultValueText(progress: number) {
  if (progress === 0) return "Card concealed";
  if (progress === 1) return "Card fully revealed";
  return `Card ${Math.round(progress * 100)} percent revealed`;
}

export interface BaccaratSqueezeRootProps
  extends Omit<ComponentPropsWithRef<"section">, "defaultValue">,
    UseCardSqueezeOptions {
  getValueText?: SqueezeValueTextFormatter;
  revealAnnouncement?: ReactNode;
}

export function BaccaratSqueezeRoot({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  onReveal,
  corner,
  revealThreshold,
  keyboardStep,
  edgeHitArea,
  disabled,
  readOnly,
  getValueText = defaultValueText,
  revealAnnouncement = "Card revealed",
  className,
  style,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: BaccaratSqueezeRootProps) {
  const squeeze = useCardSqueeze({
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    onReveal,
    corner,
    revealThreshold,
    keyboardStep,
    edgeHitArea,
    disabled,
    readOnly,
  });
  const context = useMemo<BaccaratSqueezeContextValue>(
    () => ({ ...squeeze, getValueText }),
    [getValueText, squeeze],
  );

  return (
    <BaccaratSqueezeContext.Provider value={context}>
      <section
        {...props}
        aria-label={ariaLabelledby ? ariaLabel : (ariaLabel ?? "Card squeeze")}
        aria-labelledby={ariaLabelledby}
        data-slot="baccarat-squeeze"
        data-state={squeeze.state}
        data-corner={squeeze.corner}
        data-origin={squeeze.origin}
        data-disabled={squeeze.disabled ? "" : undefined}
        data-readonly={squeeze.readOnly ? "" : undefined}
        className={twMerge(
          "inline-flex flex-col items-center gap-4",
          className,
        )}
        style={
          {
            "--squeeze-progress": squeeze.progress,
            ...style,
          } as CSSProperties
        }
      >
        {children}
        <span className="sr-only" role="status" aria-live="polite">
          {squeeze.state === "revealed" ? revealAnnouncement : ""}
        </span>
      </section>
    </BaccaratSqueezeContext.Provider>
  );
}

export interface BaccaratSqueezeCardProps extends ComponentPropsWithRef<"div"> {
  concealedLabel?: string;
}

export function BaccaratSqueezeCard({
  concealedLabel = "Squeeze card. Drag any corner diagonally, pull either long edge inward, or use the arrow keys.",
  className,
  style,
  tabIndex,
  role,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onKeyDown,
  children,
  ...props
}: BaccaratSqueezeCardProps) {
  const context = useBaccaratSqueezeContext("BaccaratSqueezeCard");
  const internal = context.cardProps;

  return (
    <div
      {...props}
      role={role ?? "slider"}
      tabIndex={tabIndex ?? (context.disabled ? -1 : 0)}
      aria-label={props["aria-label"] ?? concealedLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(context.progress * 100)}
      aria-valuetext={
        props["aria-valuetext"] ?? context.getValueText(context.progress)
      }
      aria-disabled={context.disabled || undefined}
      aria-readonly={context.readOnly || undefined}
      data-slot="baccarat-squeeze-card"
      data-state={context.state}
      data-corner={context.corner}
      data-origin={context.origin}
      data-dragging={context.isDragging ? "" : undefined}
      data-disabled={context.disabled ? "" : undefined}
      data-readonly={context.readOnly ? "" : undefined}
      className={twMerge(
        "relative aspect-[5/7] w-64 touch-none overflow-hidden rounded-[1.25rem] border border-white/30 bg-emerald-950 shadow-[0_24px_60px_rgba(0,0,0,0.38),0_2px_8px_rgba(0,0,0,0.2)] outline-none select-none focus-visible:ring-4 focus-visible:ring-amber-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-emerald-950 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
        context.state === "revealed"
          ? "cursor-default"
          : context.isDragging
            ? "cursor-grabbing"
            : "cursor-grab",
        className,
      )}
      style={{ perspective: "900px", ...style }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) internal.onPointerDown(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) internal.onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (!event.defaultPrevented) internal.onPointerUp(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        if (!event.defaultPrevented) internal.onPointerCancel(event);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        if (!event.defaultPrevented) internal.onLostPointerCapture(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) internal.onKeyDown(event);
      }}
    >
      {children}
    </div>
  );
}

export type BaccaratSqueezeBackProps = ComponentPropsWithRef<"div">;

export function BaccaratSqueezeBack({
  className,
  style,
  children,
  ...props
}: BaccaratSqueezeBackProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      data-slot="baccarat-squeeze-back"
      className={twMerge(
        "pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit] border-[7px] border-[#f3dfad] bg-[#143f39] shadow-[inset_0_0_0_2px_rgba(20,63,57,0.8),inset_0_0_26px_rgba(0,0,0,0.38)]",
        className,
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(243,223,173,.09) 0 2px, transparent 2px 8px), repeating-linear-gradient(-45deg, rgba(243,223,173,.06) 0 2px, transparent 2px 8px)",
        ...style,
      }}
    >
      {children ?? (
        <>
          <div className="absolute inset-3 rounded-xl border border-[#f3dfad]/35" />
          <div className="absolute inset-7 rounded-lg border border-[#f3dfad]/20" />
          <div className="absolute top-1/2 left-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 rotate-45 place-items-center rounded-2xl border-2 border-[#f3dfad]/55 bg-emerald-950/45 shadow-lg">
            <div className="size-14 rounded-xl border border-[#f3dfad]/35" />
          </div>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black tracking-[0.35em] text-[#f3dfad]/80 uppercase">
            Baccarat
          </span>
        </>
      )}
    </div>
  );
}

const CORNER_FOLD_DIRECTIONS: Record<SqueezeCorner, string> = {
  "top-left": "to bottom right",
  "top-right": "to bottom left",
  "bottom-left": "to top right",
  "bottom-right": "to top left",
};

const clampProgress = (progress: number) => Math.min(1, Math.max(0, progress));

function toPercent(value: number) {
  return `${Math.round(value * 10_000) / 100}%`;
}

function getLinearRevealClipPath(
  progress: number,
  corner: SqueezeCorner,
  origin: SqueezeOrigin,
) {
  const amount = clampProgress(progress);
  const concealed = toPercent(1 - amount);

  if (origin === "left-edge") return `inset(0 ${concealed} 0 0)`;
  if (origin === "right-edge") return `inset(0 0 0 ${concealed})`;

  const sweep = amount * 2;
  const basePoints =
    sweep <= 1
      ? [
          [0, 0],
          [sweep, 0],
          [sweep, 0],
          [0, sweep],
          [0, sweep],
        ]
      : [
          [0, 0],
          [1, 0],
          [1, sweep - 1],
          [sweep - 1, 1],
          [0, 1],
        ];
  const fromRight = corner.endsWith("right");
  const fromBottom = corner.startsWith("bottom");
  const points = basePoints.map(([x, y]) => [
    fromRight ? 1 - x : x,
    fromBottom ? 1 - y : y,
  ]);

  return `polygon(${points
    .map(([x, y]) => `${toPercent(x)} ${toPercent(y)}`)
    .join(", ")})`;
}

function getLinearFoldBackground(
  progress: number,
  corner: SqueezeCorner,
  origin: SqueezeOrigin,
) {
  const amount = clampProgress(progress);
  const position = amount * 100;
  const direction =
    origin === "corner"
      ? CORNER_FOLD_DIRECTIONS[corner]
      : origin === "right-edge"
        ? "to left"
        : "to right";
  const shadowStart = Math.max(0, position - 2.2);
  const highlightStart = Math.max(0, position - 0.65);
  const highlightEnd = Math.min(100, position + 0.65);
  const shadowEnd = Math.min(100, position + 2.2);

  return `linear-gradient(${direction}, transparent ${toPercent(shadowStart / 100)}, rgba(0,0,0,.24) ${toPercent(shadowStart / 100)}, rgba(255,255,255,.82) ${toPercent(highlightStart / 100)}, rgba(255,235,189,.5) ${toPercent(highlightEnd / 100)}, transparent ${toPercent(shadowEnd / 100)})`;
}

export type BaccaratSqueezeFaceProps = ComponentPropsWithRef<"div">;

export function BaccaratSqueezeFace({
  className,
  style,
  children,
  "aria-hidden": ariaHidden,
  ...props
}: BaccaratSqueezeFaceProps) {
  const { progress, state, corner, origin, isDragging } =
    useBaccaratSqueezeContext("BaccaratSqueezeFace");
  return (
    <div
      {...props}
      aria-hidden={ariaHidden ?? state !== "revealed"}
      data-slot="baccarat-squeeze-face"
      data-state={state}
      data-origin={origin}
      className={twMerge(
        "pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit] bg-white",
        isDragging
          ? "transition-none will-change-[clip-path]"
          : "transition-[clip-path] duration-250 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none",
        className,
      )}
      style={{
        clipPath: getLinearRevealClipPath(progress, corner, origin),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export type BaccaratSqueezeFoldProps = ComponentPropsWithRef<"div">;

export function BaccaratSqueezeFold({
  className,
  style,
  ...props
}: BaccaratSqueezeFoldProps) {
  const { progress, corner, origin, isDragging } = useBaccaratSqueezeContext(
    "BaccaratSqueezeFold",
  );
  return (
    <div
      {...props}
      aria-hidden="true"
      data-slot="baccarat-squeeze-fold"
      data-origin={origin}
      className={twMerge(
        "pointer-events-none absolute inset-0 z-30 rounded-[inherit] motion-reduce:hidden",
        className,
      )}
      style={{
        opacity: progress > 0 && progress < 1 ? 1 : 0,
        background: getLinearFoldBackground(progress, corner, origin),
        transition: isDragging
          ? "none"
          : "opacity 160ms ease-out, background 240ms cubic-bezier(.2,.8,.2,1)",
        ...style,
      }}
    />
  );
}

const HANDLE_POSITIONS: Record<SqueezeCorner, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3 rotate-90",
  "bottom-left": "bottom-3 left-3 -rotate-90",
  "bottom-right": "right-3 bottom-3 rotate-180",
};

export type BaccaratSqueezeHandleProps = ComponentPropsWithRef<"div">;

export function BaccaratSqueezeHandle({
  className,
  children,
  ...props
}: BaccaratSqueezeHandleProps) {
  const { state, corner, origin, isDragging } = useBaccaratSqueezeContext(
    "BaccaratSqueezeHandle",
  );

  return (
    <>
      {(["left-edge", "right-edge"] as const).map((edge) => (
        <span
          key={edge}
          aria-hidden="true"
          data-slot="baccarat-squeeze-edge-handle"
          data-edge={edge}
          data-active={origin === edge && isDragging ? "" : undefined}
          className={twMerge(
            "pointer-events-none absolute top-1/2 z-40 h-14 w-2 -translate-y-1/2 rounded-full border border-white/25 bg-black/20 shadow-sm backdrop-blur-sm transition duration-200 data-[active]:border-amber-200/80 data-[active]:bg-amber-200/25",
            edge === "left-edge" ? "left-1.5" : "right-1.5",
            state === "revealed" && "opacity-0",
          )}
        />
      ))}
      <div
        {...props}
        aria-hidden="true"
        data-slot="baccarat-squeeze-handle"
        data-origin={origin}
        className={twMerge(
          "pointer-events-none absolute z-40 flex size-12 items-center justify-center rounded-full border border-white/45 bg-black/35 text-white shadow-lg backdrop-blur-sm transition-opacity duration-200",
          HANDLE_POSITIONS[corner],
          state === "revealed" && "opacity-0",
          className,
        )}
      >
        {children ?? (
          <div className="relative size-6">
            <span className="absolute top-1 left-0 h-px w-6 rotate-45 bg-current" />
            <span className="absolute top-2.5 left-0 h-px w-4 rotate-45 bg-current/80" />
            <span className="absolute top-4 left-0 h-px w-2 rotate-45 bg-current/60" />
          </div>
        )}
      </div>
    </>
  );
}

export interface BaccaratSqueezeHintProps extends ComponentPropsWithRef<"p"> {
  concealedText?: ReactNode;
  squeezingText?: ReactNode;
  revealedText?: ReactNode;
}

export function BaccaratSqueezeHint({
  concealedText = "네 모서리 중 하나를 대각선으로 밀거나 좌우 옆면을 안쪽으로 당겨보세요",
  squeezingText,
  revealedText = "카드가 공개되었습니다",
  className,
  children,
  ...props
}: BaccaratSqueezeHintProps) {
  const { state, origin, progress } = useBaccaratSqueezeContext(
    "BaccaratSqueezeHint",
  );
  const content =
    children ??
    (state === "revealed"
      ? revealedText
      : state === "squeezing"
        ? (squeezingText ??
          `${origin === "corner" ? "대각선" : "옆면"}에서 ${Math.round(progress * 100)}% 공개`)
        : concealedText);

  return (
    <p
      {...props}
      data-slot="baccarat-squeeze-hint"
      data-state={state}
      data-origin={origin}
      className={twMerge("text-center text-sm font-medium", className)}
    >
      {content}
    </p>
  );
}

export interface BaccaratSqueezeActionProps
  extends ComponentPropsWithRef<"button"> {
  revealLabel?: ReactNode;
  resetLabel?: ReactNode;
}

export function BaccaratSqueezeAction({
  revealLabel = "바로 공개",
  resetLabel = "다시 가리기",
  className,
  type,
  disabled,
  onClick,
  children,
  ...props
}: BaccaratSqueezeActionProps) {
  const context = useBaccaratSqueezeContext("BaccaratSqueezeAction");
  const isRevealed = context.state === "revealed";

  return (
    <button
      {...props}
      type={type ?? "button"}
      disabled={disabled || context.disabled || context.readOnly}
      data-slot="baccarat-squeeze-action"
      data-state={context.state}
      data-origin={context.origin}
      className={twMerge(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (isRevealed) context.reset("action");
        else context.reveal("action");
      }}
    >
      {children ?? (
        <>
          {isRevealed ? (
            <RotateCcw aria-hidden="true" className="size-4" />
          ) : (
            <Sparkles aria-hidden="true" className="size-4" />
          )}
          {isRevealed ? resetLabel : revealLabel}
        </>
      )}
    </button>
  );
}

interface PipPosition {
  column: 1 | 2 | 3;
  row: 1 | 2 | 3 | 4 | 5;
  flipped?: boolean;
}

const NUMBER_PIPS: Partial<Record<BaccaratRank, readonly PipPosition[]>> = {
  A: [{ column: 2, row: 3 }],
  "2": [
    { column: 2, row: 1 },
    { column: 2, row: 5, flipped: true },
  ],
  "3": [
    { column: 2, row: 1 },
    { column: 2, row: 3 },
    { column: 2, row: 5, flipped: true },
  ],
  "4": [
    { column: 1, row: 1 },
    { column: 3, row: 1 },
    { column: 1, row: 5, flipped: true },
    { column: 3, row: 5, flipped: true },
  ],
  "5": [
    { column: 1, row: 1 },
    { column: 3, row: 1 },
    { column: 2, row: 3 },
    { column: 1, row: 5, flipped: true },
    { column: 3, row: 5, flipped: true },
  ],
  "6": [
    { column: 1, row: 1 },
    { column: 3, row: 1 },
    { column: 1, row: 3 },
    { column: 3, row: 3 },
    { column: 1, row: 5, flipped: true },
    { column: 3, row: 5, flipped: true },
  ],
  "7": [
    { column: 1, row: 1 },
    { column: 3, row: 1 },
    { column: 2, row: 2 },
    { column: 1, row: 3 },
    { column: 3, row: 3 },
    { column: 1, row: 5, flipped: true },
    { column: 3, row: 5, flipped: true },
  ],
  "8": [
    { column: 1, row: 1 },
    { column: 3, row: 1 },
    { column: 2, row: 2 },
    { column: 1, row: 3 },
    { column: 3, row: 3 },
    { column: 2, row: 4, flipped: true },
    { column: 1, row: 5, flipped: true },
    { column: 3, row: 5, flipped: true },
  ],
  "9": [
    { column: 1, row: 1 },
    { column: 3, row: 1 },
    { column: 1, row: 2 },
    { column: 3, row: 2 },
    { column: 2, row: 3 },
    { column: 1, row: 4, flipped: true },
    { column: 3, row: 4, flipped: true },
    { column: 1, row: 5, flipped: true },
    { column: 3, row: 5, flipped: true },
  ],
  "10": [
    { column: 1, row: 1 },
    { column: 3, row: 1 },
    { column: 2, row: 2 },
    { column: 1, row: 2 },
    { column: 3, row: 2 },
    { column: 1, row: 4, flipped: true },
    { column: 3, row: 4, flipped: true },
    { column: 2, row: 4, flipped: true },
    { column: 1, row: 5, flipped: true },
    { column: 3, row: 5, flipped: true },
  ],
};

const SUIT_SYMBOLS: Record<BaccaratSuit, string> = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
};

export interface BaccaratPlayingCardProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  rank: BaccaratRank;
  suit: BaccaratSuit;
}

export function BaccaratPlayingCard({
  rank,
  suit,
  className,
  role,
  "aria-label": ariaLabel,
  ...props
}: BaccaratPlayingCardProps) {
  const symbol = SUIT_SYMBOLS[suit];
  const isRed = suit === "diamonds" || suit === "hearts";
  const pips = NUMBER_PIPS[rank];

  return (
    <div
      {...props}
      role={role ?? "img"}
      aria-label={ariaLabel ?? `${rank} of ${suit}`}
      data-slot="baccarat-playing-card"
      data-rank={rank}
      data-suit={suit}
      className={twMerge(
        clsx(
          "relative h-full w-full overflow-hidden rounded-[inherit] border-[7px] border-[#f7f2e8] bg-[#fffdfa] shadow-[inset_0_0_18px_rgba(51,38,22,0.1)]",
          isRed ? "text-rose-600" : "text-slate-950",
        ),
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute top-3 left-3 flex min-w-8 flex-col items-center text-2xl leading-[0.82] font-black tracking-tighter"
      >
        <span>{rank}</span>
        <span className="mt-1 text-xl">{symbol}</span>
      </div>

      <div
        aria-hidden="true"
        className="absolute right-3 bottom-3 flex min-w-8 rotate-180 flex-col items-center text-2xl leading-[0.82] font-black tracking-tighter"
      >
        <span>{rank}</span>
        <span className="mt-1 text-xl">{symbol}</span>
      </div>

      {pips ? (
        <div
          aria-hidden="true"
          className="absolute inset-x-12 inset-y-10 grid grid-cols-3 grid-rows-5 place-items-center text-[2rem] leading-none font-bold"
        >
          {pips.map((pip, index) => (
            <span
              key={`${pip.column}-${pip.row}-${index}`}
              className={pip.flipped ? "rotate-180" : undefined}
              style={{ gridColumn: pip.column, gridRow: pip.row }}
            >
              {symbol}
            </span>
          ))}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 flex size-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-current/20 bg-current/5"
        >
          <span className="text-7xl leading-none font-black">{rank}</span>
          <span className="text-4xl leading-none">{symbol}</span>
        </div>
      )}
    </div>
  );
}

export { BaccaratSqueezeRoot as BaccaratSqueeze };
