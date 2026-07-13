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
