import type {
  ComponentPropsWithRef,
  CSSProperties,
  Key,
  ReactNode,
} from "react";
import { clsx } from "clsx";
import { RotateCcw, Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  useSlotMachine,
  type SlotRandomSource,
  type SlotValueChangeHandler,
} from "./useSlotMachine";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

export type SlotMachineRootProps = ComponentPropsWithRef<"section">;
export type SlotReelListProps = ComponentPropsWithRef<"ol">;
export type SlotReelProps = ComponentPropsWithRef<"li">;
export type SlotMachineActionProps = ComponentPropsWithRef<"button">;
// eslint-disable-next-line no-unused-vars
export type SlotItemRenderer<T, TResult> = (...args: [T, number]) => TResult;

export function SlotMachineRoot({ className, ...props }: SlotMachineRootProps) {
  return (
    <section
      {...props}
      data-slot="slot-machine"
      className={cn(
        "w-full rounded-[2rem] border border-slate-700/80 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/25 sm:p-7",
        className,
      )}
    />
  );
}

export function SlotReelList({ className, ...props }: SlotReelListProps) {
  return (
    <ol
      {...props}
      data-slot="slot-reel-list"
      className={cn(
        "grid min-h-36 auto-cols-fr grid-flow-col gap-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-inner shadow-black/70 sm:min-h-44 sm:gap-3 sm:p-3",
        className,
      )}
    />
  );
}

export function SlotReel({ className, ...props }: SlotReelProps) {
  return (
    <li
      {...props}
      data-slot="slot-reel"
      className={cn(
        "relative flex min-w-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#dfe5ec_0%,#ffffff_42%,#ffffff_58%,#d8e0e8_100%)] px-2 text-center text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_8px_rgba(15,23,42,0.18)] before:pointer-events-none before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-slate-300/70 after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1/3 after:bg-gradient-to-b after:from-slate-900/10 after:to-transparent",
        className,
      )}
    />
  );
}

export function SlotMachineAction({
  className,
  type,
  ...props
}: SlotMachineActionProps) {
  return (
    <button
      {...props}
      type={type ?? "button"}
      data-slot="slot-machine-action"
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black tracking-wide transition focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

export interface SlotMachineProps<T>
  extends Omit<SlotMachineRootProps, "children" | "defaultValue"> {
  reels: readonly (readonly T[])[];
  value?: readonly T[];
  defaultValue?: readonly T[];
  onValueChange?: SlotValueChangeHandler<T>;
  renderItem?: SlotItemRenderer<T, ReactNode>;
  getItemLabel?: SlotItemRenderer<T, string>;
  getItemKey?: SlotItemRenderer<T, Key>;
  reelClassName?: string | SlotItemRenderer<T, string>;
  random?: SlotRandomSource;
  spinDuration?: number;
  spinLabel?: ReactNode;
  respinLabel?: ReactNode;
  spinningLabel?: ReactNode;
  resetLabel?: ReactNode;
  disabled?: boolean;
}

interface SlotAnimationStyle extends CSSProperties {
  "--slot-reel-duration": string;
  "--slot-reel-delay": string;
}

export function SlotMachine<T>({
  reels,
  value,
  defaultValue,
  onValueChange,
  renderItem = (item) => String(item),
  getItemLabel = (item) => String(item),
  getItemKey = (_item, reelIndex) => reelIndex,
  reelClassName,
  random,
  spinDuration = 900,
  spinLabel = "Spin",
  respinLabel = "Spin again",
  spinningLabel = "Spinning…",
  resetLabel = "Reset",
  disabled = false,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: SlotMachineProps<T>) {
  const { selectedItems, canSpin, hasSpun, isSpinning, spin, reset } =
    useSlotMachine({
      reels,
      value,
      defaultValue,
      onValueChange,
      random,
      spinDuration,
    });
  const state = !canSpin
    ? "invalid"
    : isSpinning
      ? "spinning"
      : hasSpun
        ? "complete"
        : "idle";
  const statusMessage =
    hasSpun && selectedItems.length === reels.length
      ? `Result: ${selectedItems.map(getItemLabel).join(", ")}`
      : "";

  return (
    <SlotMachineRoot
      {...props}
      aria-busy={isSpinning || undefined}
      aria-label={ariaLabelledby ? ariaLabel : (ariaLabel ?? "Slot machine")}
      aria-labelledby={ariaLabelledby}
      className={className}
      data-state={state}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.8)]" />
          <span className="size-2.5 rounded-full bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.8)]" />
          <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[0.65rem] font-black tracking-[0.2em] text-amber-200 uppercase">
          Lucky spin
        </span>
      </div>

      {canSpin ? (
        <SlotReelList aria-label="Slot reels">
          {selectedItems.map((item, reelIndex) => {
            const reelDuration = Math.max(
              0,
              spinDuration - reelIndex * Math.min(90, spinDuration / 4),
            );
            const animationStyle: SlotAnimationStyle = {
              "--slot-reel-duration": `${reelDuration}ms`,
              "--slot-reel-delay": `${Math.min(reelIndex * 90, spinDuration)}ms`,
            };

            return (
              <SlotReel
                key={getItemKey(item, reelIndex)}
                aria-label={`Reel ${reelIndex + 1}: ${getItemLabel(item, reelIndex)}`}
                className={
                  typeof reelClassName === "function"
                    ? reelClassName(item, reelIndex)
                    : reelClassName
                }
                data-spinning={isSpinning || undefined}
              >
                <div
                  aria-hidden="true"
                  data-slot="slot-symbol"
                  style={animationStyle}
                  className="relative z-10 flex min-w-0 flex-col items-center justify-center"
                >
                  {renderItem(item, reelIndex)}
                </div>
              </SlotReel>
            );
          })}
        </SlotReelList>
      ) : (
        <div
          data-slot="slot-machine-empty"
          className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 px-5 text-center text-sm font-semibold text-slate-400"
        >
          Add at least one item to every reel.
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <SlotMachineAction
          className="bg-rose-500 text-white shadow-lg shadow-rose-950/40 hover:-translate-y-0.5 hover:bg-rose-400 hover:shadow-xl active:translate-y-0"
          disabled={disabled || !canSpin || isSpinning}
          onClick={spin}
        >
          <Sparkles aria-hidden="true" className="size-4" />
          {isSpinning ? spinningLabel : hasSpun ? respinLabel : spinLabel}
        </SlotMachineAction>

        {hasSpun && (
          <SlotMachineAction
            className="border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            disabled={disabled || isSpinning}
            onClick={reset}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {resetLabel}
          </SlotMachineAction>
        )}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </span>
    </SlotMachineRoot>
  );
}
