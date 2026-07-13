import {
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface LeverStyle extends CSSProperties {
  "--slot-lever-offset": string;
  "--slot-lever-travel": string;
}

export interface SlotMachineLeverProps extends ComponentPropsWithRef<"button"> {
  onPull: () => void;
  active?: boolean;
  maxPullDistance?: number;
  pullThreshold?: number;
}

export function SlotMachineLever({
  onPull,
  active = false,
  maxPullDistance = 64,
  pullThreshold = 0.55,
  disabled,
  className,
  style,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  "aria-label": ariaLabel = "Pull lever to spin",
  ...props
}: SlotMachineLeverProps) {
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const suppressClickRef = useRef(false);

  const setProgress = (nextProgress: number) => {
    const normalized = Math.min(Math.max(nextProgress, 0), 1);
    progressRef.current = normalized;
    setPullProgress(normalized);
  };

  const releaseLever = (
    event: PointerEvent<HTMLButtonElement>,
    activate: boolean,
  ) => {
    if (pointerIdRef.current !== event.pointerId) return;

    const distance =
      startYRef.current === null ? 0 : event.clientY - startYRef.current;
    const shouldActivate =
      activate &&
      (progressRef.current >= pullThreshold || Math.abs(distance) < 4);

    suppressClickRef.current = true;
    startYRef.current = null;
    pointerIdRef.current = null;
    setIsPulling(false);
    setProgress(0);

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    if (shouldActivate && !disabled) onPull();
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;

    if (event.detail === 0) {
      suppressClickRef.current = false;
      onPull();
      return;
    }

    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || disabled || active || !event.isPrimary)
      return;

    suppressClickRef.current = false;
    startYRef.current = event.clientY;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsPulling(true);
    setProgress(0);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(event);
    if (
      event.defaultPrevented ||
      pointerIdRef.current !== event.pointerId ||
      startYRef.current === null
    ) {
      return;
    }

    setProgress((event.clientY - startYRef.current) / maxPullDistance);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerUp?.(event);
    if (!event.defaultPrevented) releaseLever(event, true);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerCancel?.(event);
    releaseLever(event, false);
  };

  const handleLostPointerCapture = (event: PointerEvent<HTMLButtonElement>) => {
    onLostPointerCapture?.(event);
    releaseLever(event, false);
  };

  const leverStyle: LeverStyle = {
    ...style,
    "--slot-lever-offset": `${pullProgress * maxPullDistance}px`,
    "--slot-lever-travel": `${maxPullDistance}px`,
  };

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex min-h-36 w-14 touch-none items-stretch justify-center rounded-2xl border border-white/10 bg-slate-900/85 p-1.5 shadow-inner shadow-black/60 select-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-44 sm:w-16",
        className,
      )}
      data-active={active || undefined}
      data-pulling={isPulling || undefined}
      data-slot="slot-machine-lever"
      disabled={disabled}
      style={leverStyle}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
    >
      <span
        aria-hidden="true"
        className="relative flex h-full w-full flex-col items-center overflow-hidden rounded-xl border border-white/5 bg-[linear-gradient(180deg,#151d2b_0%,#070b12_100%)]"
      >
        <span className="mt-2 text-[0.5rem] font-black tracking-[0.22em] text-amber-200/70 [writing-mode:vertical-rl]">
          PULL
        </span>
        <span
          className="absolute top-8 bottom-5 left-1/2 w-2 -translate-x-1/2 rounded-full border border-slate-500/70 bg-slate-950 shadow-inner shadow-black"
          data-slot="slot-lever-track"
        />
        <span
          className="absolute top-8 bottom-5 left-1/2 z-[5] w-1.5 -translate-x-1/2 rounded-full border-x border-slate-300 bg-gradient-to-r from-slate-500 via-white to-slate-600 shadow-sm"
          data-slot="slot-lever-shaft"
        />
        <span
          data-slot="slot-lever-handle"
          className="absolute top-4 left-1/2 z-10 flex flex-col items-center transition-transform duration-150 ease-out"
        >
          <span className="size-8 rounded-full border border-rose-300/50 bg-[radial-gradient(circle_at_35%_28%,#fb7185_0%,#e11d48_48%,#881337_100%)] shadow-[0_5px_14px_rgba(136,19,55,0.55)] transition-transform group-active:scale-95 sm:size-9" />
        </span>
        <span className="absolute bottom-2 left-1/2 z-20 size-6 -translate-x-1/2 rounded-full border border-slate-400 bg-[radial-gradient(circle_at_35%_30%,#e2e8f0,#475569_70%)] shadow-md shadow-black" />
      </span>
    </button>
  );
}
