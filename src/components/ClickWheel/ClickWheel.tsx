"use client";

import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useEffect,
  useImperativeHandle,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  useClickWheel,
  type ClickWheelDirection,
  type ClickWheelRotateHandler,
} from "./useClickWheel";

export type ClickWheelButtonName =
  | "menu"
  | "previous"
  | "select"
  | "next"
  | "playPause";

export type ClickWheelButtonProps = Omit<
  ComponentPropsWithRef<"button">,
  "type"
> & {
  wheelDrag?: boolean;
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export type ClickWheelButtonPropsMap = Partial<
  Record<ClickWheelButtonName, ClickWheelButtonProps>
>;

export interface ClickWheelProps
  extends Omit<ComponentPropsWithRef<"div">, "children" | "onSelect"> {
  onRotate?: ClickWheelRotateHandler;
  onMenu?: () => void;
  onMenuLongPress?: () => void;
  onPrevious?: () => void;
  onSelect?: () => void;
  onNext?: () => void;
  onPlayPause?: () => void;
  buttonProps?: ClickWheelButtonPropsMap;
  disabled?: boolean;
}

interface WheelButtonProps {
  name: ClickWheelButtonName;
  defaultLabel: string;
  defaultContent: ReactNode;
  defaultWheelDrag?: boolean;
  enableLongPress?: boolean;
  className: string;
  config?: ClickWheelButtonProps;
  disabled: boolean;
  onPress?: () => void;
}

const DEFAULT_WHEEL_LABEL =
  "Click wheel. Drag or use arrow keys to navigate. Escape activates Menu; Home activates the Menu hold action.";

function SkipIcon({ direction }: { direction: "previous" | "next" }) {
  const path =
    direction === "previous"
      ? "M29 4h-2v16h2zM25 12 15 5v14zM15 12 5 5v14z"
      : "M3 4h2v16H3zM7 12l10-7v14zM17 12l10-7v14z";

  return (
    <svg aria-hidden="true" viewBox="0 0 32 24" className="h-7 w-8">
      <path fill="currentColor" d={path} />
    </svg>
  );
}

function PlayPauseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 36 24" className="h-7 w-9">
      <path fill="currentColor" d="M2 4v16l12-8zM20 4h5v16h-5zM29 4h5v16h-5z" />
    </svg>
  );
}

function WheelButton({
  name,
  defaultLabel,
  defaultContent,
  defaultWheelDrag = false,
  enableLongPress = false,
  className,
  config,
  disabled,
  onPress,
}: WheelButtonProps) {
  const {
    className: consumerClassName,
    children,
    onClick,
    disabled: buttonDisabled = false,
    wheelDrag = defaultWheelDrag,
    ...nativeButtonProps
  } = config ?? {};
  const hasCustomContent =
    config !== undefined &&
    Object.prototype.hasOwnProperty.call(config, "children");
  const isDisabled = disabled || buttonDisabled;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented && !isDisabled) onPress?.();
  };

  return (
    <button
      {...nativeButtonProps}
      type="button"
      disabled={isDisabled}
      onClick={handleClick}
      data-slot={`click-wheel-${name}`}
      data-click-wheel-button={name}
      data-wheel-drag={wheelDrag && !isDisabled ? "" : undefined}
      data-wheel-long-press={enableLongPress && !isDisabled ? "" : undefined}
      aria-label={config?.["aria-label"] ?? defaultLabel}
      className={twMerge(clsx(className, consumerClassName))}
    >
      {hasCustomContent ? children : defaultContent}
    </button>
  );
}

export function ClickWheel({
  ref,
  className,
  buttonProps = {},
  disabled = false,
  onRotate,
  onMenu,
  onMenuLongPress,
  onPrevious,
  onSelect,
  onNext,
  onPlayPause,
  onKeyDown,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onClickCapture,
  tabIndex = 0,
  role = "group",
  "aria-label": ariaLabel = DEFAULT_WHEEL_LABEL,
  ...rootProps
}: ClickWheelProps) {
  const { wheelRef, wheelProps } = useClickWheel({
    onRotate,
    disabled,
    onLongPress: (button) => {
      if (
        button.dataset.clickWheelButton === "menu" &&
        !buttonProps.menu?.disabled
      ) {
        onMenuLongPress?.();
      }
    },
  });
  useImperativeHandle(ref, () => wheelRef.current as HTMLDivElement);

  useEffect(() => {
    const wheelElement = wheelRef.current;
    if (!wheelElement) return;

    const preventPageScroll = (event: globalThis.WheelEvent) => {
      if (!disabled && event.deltaY !== 0) event.preventDefault();
    };

    wheelElement.addEventListener("wheel", preventPageScroll, {
      passive: false,
    });
    return () => wheelElement.removeEventListener("wheel", preventPageScroll);
  }, [disabled, wheelRef]);

  const trigger = (
    name: ClickWheelButtonName,
    action: (() => void) | undefined,
  ) => {
    if (!disabled && !buttonProps[name]?.disabled) action?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }

    const isDirectionalKey = event.key.startsWith("Arrow");
    if (event.repeat && !isDirectionalKey) return;

    const actions: Record<string, () => void> = {
      ArrowUp: () => onRotate?.(-1),
      ArrowLeft: () => onRotate?.(-1),
      ArrowDown: () => onRotate?.(1),
      ArrowRight: () => onRotate?.(1),
      Enter: () => trigger("select", onSelect),
      Escape: () => trigger("menu", onMenu),
      Home: () => trigger("menu", onMenuLongPress),
      " ": () => trigger("playPause", onPlayPause),
    };

    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  return (
    <div
      {...rootProps}
      ref={wheelRef}
      data-slot="click-wheel"
      data-disabled={disabled ? "" : undefined}
      className={twMerge(
        clsx(
          "relative h-[200px] w-[200px] cursor-grab touch-none rounded-full border border-zinc-300 bg-gradient-to-br from-white to-zinc-100 text-zinc-500 shadow-[inset_0_2px_12px_rgba(0,0,0,0.12)] outline-none select-none focus-visible:ring-4 focus-visible:ring-blue-400/60 active:cursor-grabbing data-disabled:cursor-not-allowed data-disabled:opacity-60",
          className,
        ),
      )}
      tabIndex={disabled ? -1 : tabIndex}
      role={role}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      onWheel={(event) => {
        onWheel?.(event);
        if (disabled || event.deltaY === 0) return;
        onRotate?.(event.deltaY > 0 ? 1 : -1);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) wheelProps.onPointerDown(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) wheelProps.onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        wheelProps.onPointerUp(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        wheelProps.onPointerCancel(event);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        wheelProps.onLostPointerCapture(event);
      }}
      onClickCapture={(event) => {
        wheelProps.onClickCapture(event);
        if (!event.defaultPrevented) onClickCapture?.(event);
      }}
    >
      <WheelButton
        name="menu"
        defaultLabel="Menu"
        defaultContent="MENU"
        defaultWheelDrag
        enableLongPress={onMenuLongPress !== undefined}
        className="absolute top-2 left-1/2 flex h-10 -translate-x-1/2 items-center px-2 text-sm font-bold outline-none hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
        config={buttonProps.menu}
        disabled={disabled}
        onPress={onMenu}
      />
      <WheelButton
        name="next"
        defaultLabel="Next"
        defaultContent={<SkipIcon direction="next" />}
        className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-zinc-200/70 focus-visible:ring-2 focus-visible:ring-blue-500"
        config={buttonProps.next}
        disabled={disabled}
        onPress={onNext}
      />
      <WheelButton
        name="previous"
        defaultLabel="Previous"
        defaultContent={<SkipIcon direction="previous" />}
        className="absolute top-1/2 left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-zinc-200/70 focus-visible:ring-2 focus-visible:ring-blue-500"
        config={buttonProps.previous}
        disabled={disabled}
        onPress={onPrevious}
      />
      <WheelButton
        name="playPause"
        defaultLabel="Play or pause"
        defaultContent={<PlayPauseIcon />}
        defaultWheelDrag
        className="absolute bottom-2 left-1/2 flex h-10 -translate-x-1/2 items-center px-3 outline-none hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
        config={buttonProps.playPause}
        disabled={disabled}
        onPress={onPlayPause}
      />
      <WheelButton
        name="select"
        defaultLabel="Select"
        defaultContent={null}
        className="absolute top-1/2 left-1/2 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-zinc-400 bg-gradient-to-br from-zinc-200 to-zinc-300 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-500/70 active:from-zinc-300 active:to-zinc-400"
        config={buttonProps.select}
        disabled={disabled}
        onPress={onSelect}
      />
    </div>
  );
}

export type { ClickWheelDirection };

export default ClickWheel;
