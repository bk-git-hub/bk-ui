"use client";

import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useEffect,
  useImperativeHandle,
  useState,
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
  sensitivity?: number;
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
  pressing: boolean;
  onPressEnd: () => void;
  onPress?: () => void;
}

const DEFAULT_WHEEL_LABEL =
  "Click wheel. Drag or use arrow keys to navigate. Escape activates Menu; Home activates the Menu hold action.";

const KEYBOARD_BUTTON_NAMES: Partial<Record<string, ClickWheelButtonName>> = {
  Enter: "select",
  Escape: "menu",
  Home: "menu",
  " ": "playPause",
};

function getClickWheelButtonName(target: EventTarget | null) {
  const button =
    target instanceof Element
      ? target.closest<HTMLButtonElement>("[data-click-wheel-button]")
      : null;
  if (!button || button.disabled) return null;

  return button.dataset.clickWheelButton as ClickWheelButtonName;
}

function SkipIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 113 56"
      className="h-8 w-8 text-[#D9D9D9]"
      data-skip-direction={direction}
    >
      {direction === "previous" ? (
        <>
          <path
            fill="currentColor"
            d="M15 28.5L56.25 4.6843L56.25 52.3157L15 28.5Z"
          />
          <path
            fill="currentColor"
            d="M58 27.5L99.25 3.6843V51.3157L58 27.5Z"
          />
          <rect y="3" width="15" height="50" fill="currentColor" />
        </>
      ) : (
        <>
          <path
            fill="currentColor"
            d="M98 27.5L56.75 51.3157L56.75 3.6843L98 27.5Z"
          />
          <path
            fill="currentColor"
            d="M55 28.5L13.75 52.3157L13.75 4.6843L55 28.5Z"
          />
          <rect
            x="113"
            y="53"
            width="15"
            height="50"
            transform="rotate(180 113 53)"
            fill="currentColor"
          />
        </>
      )}
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
  pressing,
  onPressEnd,
  onPress,
}: WheelButtonProps) {
  const {
    className: consumerClassName,
    children,
    onClick,
    onPointerLeave,
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
      data-pressing={pressing && !isDisabled ? "" : undefined}
      aria-label={config?.["aria-label"] ?? defaultLabel}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented) onPressEnd();
      }}
      className={twMerge(
        clsx(
          "transition-[transform,box-shadow,filter,background-color,color] duration-75 ease-out data-pressing:scale-[0.94] data-pressing:shadow-[inset_0_2px_5px_rgba(0,0,0,0.24)] data-pressing:brightness-90 motion-reduce:transition-none",
          className,
          consumerClassName,
        ),
      )}
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
  sensitivity,
  onRotate,
  onMenu,
  onMenuLongPress,
  onPrevious,
  onSelect,
  onNext,
  onPlayPause,
  onKeyDown,
  onKeyUp,
  onBlur,
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
  const [pressingButton, setPressingButton] =
    useState<ClickWheelButtonName | null>(null);

  const {
    wheelRef,
    wheelProps,
    sensitivity: normalizedSensitivity,
  } = useClickWheel({
    onRotate,
    disabled,
    sensitivity,
    onRotationStart: () => setPressingButton(null),
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
      if (!event.repeat && (event.key === "Enter" || event.key === " ")) {
        setPressingButton(getClickWheelButtonName(event.target));
      }
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
    setPressingButton(KEYBOARD_BUTTON_NAMES[event.key] ?? null);
    action();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyUp?.(event);
    const isButtonActivation =
      event.target instanceof Element &&
      event.target.closest("button") &&
      (event.key === "Enter" || event.key === " ");
    if (isButtonActivation || KEYBOARD_BUTTON_NAMES[event.key]) {
      setPressingButton(null);
    }
  };

  return (
    <div
      {...rootProps}
      ref={wheelRef}
      data-slot="click-wheel"
      data-disabled={disabled ? "" : undefined}
      data-sensitivity={normalizedSensitivity}
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
      onKeyUp={handleKeyUp}
      onBlur={(event) => {
        onBlur?.(event);
        setPressingButton(null);
      }}
      onWheel={(event) => {
        onWheel?.(event);
        if (disabled || event.deltaY === 0) return;
        onRotate?.(event.deltaY > 0 ? 1 : -1);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) {
          const isPrimaryPress =
            event.pointerType !== "mouse" || event.button === 0;
          setPressingButton(
            !disabled && isPrimaryPress
              ? getClickWheelButtonName(event.target)
              : null,
          );
          wheelProps.onPointerDown(event);
        }
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) wheelProps.onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        wheelProps.onPointerUp(event);
        setPressingButton(null);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        wheelProps.onPointerCancel(event);
        setPressingButton(null);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        wheelProps.onLostPointerCapture(event);
        setPressingButton(null);
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
        className="absolute top-2 left-1/2 flex h-10 -translate-x-1/2 items-center rounded-full px-2 text-sm font-bold outline-none hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500 data-pressing:bg-zinc-300/70"
        config={buttonProps.menu}
        disabled={disabled}
        pressing={pressingButton === "menu"}
        onPressEnd={() => setPressingButton(null)}
        onPress={onMenu}
      />
      <WheelButton
        name="next"
        defaultLabel="Next"
        defaultContent={<SkipIcon direction="next" />}
        className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-zinc-200/70 focus-visible:ring-2 focus-visible:ring-blue-500 data-pressing:bg-zinc-300/80"
        config={buttonProps.next}
        disabled={disabled}
        pressing={pressingButton === "next"}
        onPressEnd={() => setPressingButton(null)}
        onPress={onNext}
      />
      <WheelButton
        name="previous"
        defaultLabel="Previous"
        defaultContent={<SkipIcon direction="previous" />}
        className="absolute top-1/2 left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-zinc-200/70 focus-visible:ring-2 focus-visible:ring-blue-500 data-pressing:bg-zinc-300/80"
        config={buttonProps.previous}
        disabled={disabled}
        pressing={pressingButton === "previous"}
        onPressEnd={() => setPressingButton(null)}
        onPress={onPrevious}
      />
      <WheelButton
        name="playPause"
        defaultLabel="Play or pause"
        defaultContent={<PlayPauseIcon />}
        defaultWheelDrag
        className="absolute bottom-2 left-1/2 flex h-10 -translate-x-1/2 items-center rounded-full px-3 outline-none hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500 data-pressing:bg-zinc-300/70"
        config={buttonProps.playPause}
        disabled={disabled}
        pressing={pressingButton === "playPause"}
        onPressEnd={() => setPressingButton(null)}
        onPress={onPlayPause}
      />
      <WheelButton
        name="select"
        defaultLabel="Select"
        defaultContent={null}
        className="absolute top-1/2 left-1/2 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-zinc-400 bg-gradient-to-br from-zinc-200 to-zinc-300 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-500/70 data-pressing:from-zinc-300 data-pressing:to-zinc-400"
        config={buttonProps.select}
        disabled={disabled}
        pressing={pressingButton === "select"}
        onPressEnd={() => setPressingButton(null)}
        onPress={onSelect}
      />
    </div>
  );
}

export type { ClickWheelDirection };

export default ClickWheel;
