"use client";

/* eslint-disable no-unused-vars -- Callback parameter names document the public API. */
import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  getStorySliderGroupPosition,
  useStorySlider,
  type StorySliderChangeSource,
  type StorySliderDirection,
  type StorySliderPlaybackEndDetail,
  type StorySliderValue,
  type StorySliderValueChangeHandler,
} from "./useStorySlider";

type StorySliderApi = ReturnType<typeof useStorySlider>;

interface StorySliderContextValue
  extends Pick<
    StorySliderApi,
    | "canNavigate"
    | "currentValue"
    | "dragOffset"
    | "goTo"
    | "groupCounts"
    | "handleLostPointerCapture"
    | "handlePointerCancel"
    | "handlePointerDown"
    | "handlePointerEnd"
    | "handlePointerMove"
    | "isDragging"
    | "isManuallyPaused"
    | "isPaused"
    | "loop"
    | "navigate"
    | "setTransientPause"
    | "togglePlayback"
  > {
  disabled: boolean;
  playableGroupCount: number;
  transitionDuration: number;
}

const StorySliderContext = createContext<StorySliderContextValue | null>(null);
const StorySliderGroupContext = createContext<number | null>(null);
const StorySliderProgressContext = createContext<number | null>(null);

function useStorySliderContext(componentName: string) {
  const context = useContext(StorySliderContext);
  if (!context) {
    throw new Error(
      `${componentName} must be rendered inside StorySliderRoot.`,
    );
  }
  return context;
}

function useStorySliderGroupContext(componentName: string) {
  const groupIndex = useContext(StorySliderGroupContext);
  if (groupIndex === null) {
    throw new Error(
      `${componentName} must be rendered inside StorySliderGroup.`,
    );
  }
  return groupIndex;
}

function useStorySliderProgressContext(componentName: string) {
  const progress = useContext(StorySliderProgressContext);
  if (progress === null) {
    throw new Error(
      `${componentName} must be rendered inside StorySliderRoot.`,
    );
  }
  return progress;
}

export interface StorySliderRootProps
  extends Omit<ComponentPropsWithRef<"section">, "defaultValue" | "onChange"> {
  groupCounts: readonly number[];
  value?: StorySliderValue;
  defaultValue?: StorySliderValue;
  onValueChange?: StorySliderValueChangeHandler;
  onPlaybackEnd?: (detail: StorySliderPlaybackEndDetail) => void;
  duration?: number | ((value: StorySliderValue) => number);
  autoplay?: boolean;
  loop?: boolean;
  disabled?: boolean;
  swipeThreshold?: number;
  tapPreviousRatio?: number;
  longPressDelay?: number;
  transitionDuration?: number;
}

export function StorySliderRoot({
  groupCounts,
  value,
  defaultValue,
  onValueChange,
  onPlaybackEnd,
  duration,
  autoplay = true,
  loop = false,
  disabled = false,
  swipeThreshold,
  tapPreviousRatio,
  longPressDelay,
  transitionDuration = 480,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  onPointerEnter,
  onPointerLeave,
  onFocusCapture,
  ...props
}: StorySliderRootProps) {
  const slider = useStorySlider({
    groupCounts,
    value,
    defaultValue,
    onValueChange,
    onPlaybackEnd,
    duration,
    autoplay,
    loop,
    disabled,
    swipeThreshold,
    tapPreviousRatio,
    longPressDelay,
  });
  const playableGroupCount = useMemo(
    () => slider.groupCounts.filter((count) => count > 0).length,
    [slider.groupCounts],
  );
  const contextValue = useMemo<StorySliderContextValue>(
    () => ({
      canNavigate: slider.canNavigate,
      currentValue: slider.currentValue,
      disabled,
      dragOffset: slider.dragOffset,
      goTo: slider.goTo,
      groupCounts: slider.groupCounts,
      handleLostPointerCapture: slider.handleLostPointerCapture,
      handlePointerCancel: slider.handlePointerCancel,
      handlePointerDown: slider.handlePointerDown,
      handlePointerEnd: slider.handlePointerEnd,
      handlePointerMove: slider.handlePointerMove,
      isDragging: slider.isDragging,
      isManuallyPaused: slider.isManuallyPaused,
      isPaused: slider.isPaused,
      loop: slider.loop,
      navigate: slider.navigate,
      playableGroupCount,
      setTransientPause: slider.setTransientPause,
      togglePlayback: slider.togglePlayback,
      transitionDuration: Math.max(0, transitionDuration),
    }),
    [
      disabled,
      playableGroupCount,
      slider.canNavigate,
      slider.currentValue,
      slider.dragOffset,
      slider.goTo,
      slider.groupCounts,
      slider.handleLostPointerCapture,
      slider.handlePointerCancel,
      slider.handlePointerDown,
      slider.handlePointerEnd,
      slider.handlePointerMove,
      slider.isDragging,
      slider.isManuallyPaused,
      slider.isPaused,
      slider.loop,
      slider.navigate,
      slider.setTransientPause,
      slider.togglePlayback,
      transitionDuration,
    ],
  );

  const handleFocusCapture = (event: FocusEvent<HTMLElement>) => {
    onFocusCapture?.(event);
    if (
      !event.defaultPrevented &&
      !(
        event.target instanceof Element &&
        event.target.closest("[data-story-slider-playback]") !== null
      )
    ) {
      slider.pause();
    }
  };

  return (
    <StorySliderContext.Provider value={contextValue}>
      <StorySliderProgressContext.Provider value={slider.progress}>
        <section
          {...props}
          ref={props.ref}
          aria-label={ariaLabelledby ? ariaLabel : (ariaLabel ?? "Stories")}
          aria-labelledby={ariaLabelledby}
          aria-roledescription="carousel"
          data-disabled={disabled ? "" : undefined}
          data-dragging={slider.isDragging ? "" : undefined}
          data-paused={slider.isPaused ? "" : undefined}
          data-slot="story-slider-root"
          className={twMerge(clsx("relative", className))}
          onFocusCapture={handleFocusCapture}
          onPointerEnter={(event) => {
            onPointerEnter?.(event);
            if (!event.defaultPrevented && event.pointerType === "mouse") {
              slider.setTransientPause("hover", true);
            }
          }}
          onPointerLeave={(event) => {
            onPointerLeave?.(event);
            if (!event.defaultPrevented && event.pointerType === "mouse") {
              slider.setTransientPause("hover", false);
            }
          }}
        />
      </StorySliderProgressContext.Provider>
    </StorySliderContext.Provider>
  );
}

export type StorySliderViewportProps = ComponentPropsWithRef<"div">;

export function StorySliderViewport({
  className,
  tabIndex,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...props
}: StorySliderViewportProps) {
  const context = useStorySliderContext("StorySliderViewport");

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.target !== event.currentTarget ||
      context.disabled
    ) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      context.navigate(-1, "keyboard");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      context.navigate(1, "keyboard");
    } else if (event.key === "Home") {
      event.preventDefault();
      context.goTo({ ...context.currentValue, itemIndex: 0 }, "keyboard", -1);
    } else if (event.key === "End") {
      event.preventDefault();
      context.goTo(
        {
          ...context.currentValue,
          itemIndex: Math.max(
            0,
            (context.groupCounts[context.currentValue.groupIndex] ?? 1) - 1,
          ),
        },
        "keyboard",
        1,
      );
    } else if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      context.togglePlayback();
    }
  };

  return (
    <div
      {...props}
      ref={props.ref}
      role="group"
      aria-label={props["aria-label"] ?? "Story player"}
      aria-live={context.isPaused ? "polite" : "off"}
      tabIndex={tabIndex ?? (context.disabled ? -1 : 0)}
      data-dragging={context.isDragging ? "" : undefined}
      data-slot="story-slider-viewport"
      className={twMerge(
        clsx(
          "relative isolate aspect-[9/16] w-full max-w-sm touch-pan-y overflow-visible outline-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950",
          className,
        ),
      )}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) context.handlePointerDown(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) context.handlePointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        context.handlePointerEnd(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        context.handlePointerCancel(event);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        context.handleLostPointerCapture(event);
      }}
    />
  );
}

export interface StorySliderGroupProps extends ComponentPropsWithRef<"div"> {
  index: number;
}

export function StorySliderGroup({
  index,
  className,
  style,
  "aria-label": ariaLabel,
  ...props
}: StorySliderGroupProps) {
  const context = useStorySliderContext("StorySliderGroup");
  const isActive = index === context.currentValue.groupIndex;
  const calculatedPosition = useMemo(
    () =>
      getStorySliderGroupPosition(
        index,
        context.currentValue.groupIndex,
        context.groupCounts,
        context.loop,
      ),
    [context.currentValue.groupIndex, context.groupCounts, context.loop, index],
  );
  const isTwoGroupLoop = context.loop && context.playableGroupCount === 2;
  const isStackedInactive = isTwoGroupLoop && !isActive && !context.isDragging;
  const basePosition =
    isTwoGroupLoop && !isActive
      ? context.isDragging && Math.abs(context.dragOffset) > 0.001
        ? context.dragOffset < 0
          ? 1
          : -1
        : 0
      : calculatedPosition;
  const position = basePosition + context.dragOffset;
  const absolutePosition = Math.abs(position);
  const visiblePosition = Math.min(
    isStackedInactive ? 0.9 : absolutePosition,
    1.2,
  );
  const translate = isStackedInactive ? 0 : position * 96;
  const depth = -visiblePosition * 120;
  const scale = 1 - Math.min(visiblePosition, 1) * 0.11;
  const rotate = isStackedInactive ? 0 : clamp(position * -5, -8, 8);
  const state = isActive ? "active" : position < 0 ? "previous" : "next";

  return (
    <StorySliderGroupContext.Provider value={index}>
      <div
        {...props}
        ref={props.ref}
        role="group"
        aria-hidden={!isActive}
        aria-label={
          ariaLabel ??
          `Story group ${Math.min(index + 1, context.groupCounts.length)} of ${context.groupCounts.length}`
        }
        aria-roledescription="story group"
        inert={!isActive}
        data-active={isActive ? "" : undefined}
        data-index={index}
        data-slot="story-slider-group"
        data-state={state}
        className={twMerge(
          clsx(
            "absolute inset-0 overflow-hidden rounded-[inherit] [transition-property:transform,opacity,filter] [backface-visibility:hidden] [transform-style:preserve-3d] motion-reduce:transition-none",
            !context.isDragging &&
              "ease-[cubic-bezier(0.22,0.72,0.16,1)] will-change-transform",
            className,
          ),
        )}
        style={{
          opacity:
            !isStackedInactive && absolutePosition > 1.25
              ? 0
              : 1 - visiblePosition * 0.38,
          pointerEvents: isActive ? "auto" : "none",
          transform: `translate3d(${translate}%, 0, ${depth}px) rotateY(${rotate}deg) scale(${scale})`,
          transitionDuration: context.isDragging
            ? "0ms"
            : `${context.transitionDuration}ms`,
          zIndex: isActive ? 20 : Math.max(0, 10 - Math.ceil(absolutePosition)),
          ...style,
        }}
      />
    </StorySliderGroupContext.Provider>
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export interface StorySliderItemRenderState {
  active: boolean;
  paused: boolean;
  progress: number;
}

export type StorySliderItemRenderer = (
  state: StorySliderItemRenderState,
) => ReactNode;

function StorySliderActiveItemContent({
  renderer,
  paused,
}: {
  renderer: StorySliderItemRenderer;
  paused: boolean;
}) {
  const progress = useStorySliderProgressContext("StorySliderItem");
  return renderer({ active: true, paused, progress });
}

export interface StorySliderItemProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  index: number;
  children?: ReactNode | StorySliderItemRenderer;
}

export function StorySliderItem({
  index,
  children,
  className,
  "aria-label": ariaLabel,
  ...props
}: StorySliderItemProps) {
  const context = useStorySliderContext("StorySliderItem");
  const groupIndex = useStorySliderGroupContext("StorySliderItem");
  const isActiveGroup = groupIndex === context.currentValue.groupIndex;
  const visibleItemIndex = isActiveGroup ? context.currentValue.itemIndex : 0;
  const isActive = isActiveGroup && index === visibleItemIndex;
  const isVisible = index === visibleItemIndex;
  const itemCount = context.groupCounts[groupIndex] ?? 0;
  let content: ReactNode;
  if (typeof children === "function") {
    content = isActive ? (
      <StorySliderActiveItemContent
        renderer={children}
        paused={context.isPaused}
      />
    ) : (
      children({ active: false, paused: context.isPaused, progress: 0 })
    );
  } else {
    content = children;
  }

  return (
    <div
      role="group"
      aria-hidden={!isActive}
      aria-label={
        ariaLabel ?? `Story ${Math.min(index + 1, itemCount)} of ${itemCount}`
      }
      aria-roledescription="slide"
      inert={!isActive}
      data-active={isActive ? "" : undefined}
      data-index={index}
      data-slot="story-slider-item-positioner"
      data-state={
        isActive ? "active" : index < visibleItemIndex ? "past" : "upcoming"
      }
      className="absolute inset-0 [transition-property:opacity,transform] motion-reduce:transition-none"
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
        transform: isVisible ? "scale(1)" : "scale(1.025)",
        transitionDuration: `${Math.min(context.transitionDuration, 360)}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 0.72, 0.16, 1)",
        zIndex: isVisible ? 2 : 1,
      }}
    >
      <div
        {...props}
        ref={props.ref}
        aria-label={undefined}
        data-slot="story-slider-item"
        className={twMerge(clsx("relative h-full w-full", className))}
      >
        {content}
      </div>
    </div>
  );
}

export interface StorySliderProgressProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  trackClassName?: string;
  indicatorClassName?: string;
}

export function StorySliderProgress({
  className,
  trackClassName,
  indicatorClassName,
  ...props
}: StorySliderProgressProps) {
  const context = useStorySliderContext("StorySliderProgress");
  const progress = useStorySliderProgressContext("StorySliderProgress");
  const itemCount = context.groupCounts[context.currentValue.groupIndex] ?? 0;
  const value = itemCount === 0 ? 0 : context.currentValue.itemIndex + progress;

  return (
    <div
      {...props}
      ref={props.ref}
      role="progressbar"
      aria-label={props["aria-label"] ?? "Story progress"}
      aria-valuemin={0}
      aria-valuemax={itemCount}
      aria-valuenow={Number(value.toFixed(2))}
      aria-valuetext={
        itemCount === 0
          ? "No stories"
          : `Story ${context.currentValue.itemIndex + 1} of ${itemCount}`
      }
      data-paused={context.isPaused ? "" : undefined}
      data-slot="story-slider-progress"
      className={twMerge(clsx("flex w-full gap-1", className))}
    >
      {Array.from({ length: itemCount }, (_, index) => {
        const segmentProgress =
          index < context.currentValue.itemIndex
            ? 1
            : index > context.currentValue.itemIndex
              ? 0
              : progress;
        const state =
          index < context.currentValue.itemIndex
            ? "complete"
            : index === context.currentValue.itemIndex
              ? "active"
              : "pending";
        return (
          <span
            key={index}
            aria-hidden="true"
            data-slot="story-slider-progress-track"
            data-state={state}
            className={twMerge(
              clsx(
                "h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/30 shadow-sm",
                trackClassName,
              ),
            )}
          >
            <span
              data-slot="story-slider-progress-indicator"
              className={twMerge(
                clsx(
                  "block h-full w-full origin-left rounded-full bg-white will-change-transform",
                  indicatorClassName,
                ),
              )}
              style={{
                transform: `scaleX(${clamp(segmentProgress, 0, 1)})`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

export type StorySliderControlProps = ComponentPropsWithRef<"button">;

function StorySliderControl({
  direction,
  source,
  className,
  type,
  disabled,
  onClick,
  ...props
}: StorySliderControlProps & {
  direction: StorySliderDirection;
  source: Extract<StorySliderChangeSource, "next" | "previous">;
}) {
  const context = useStorySliderContext("StorySliderControl");
  const isDisabled =
    disabled || context.disabled || !context.canNavigate(direction);

  return (
    <button
      {...props}
      ref={props.ref}
      type={type ?? "button"}
      disabled={isDisabled}
      data-slot={`story-slider-${source}`}
      className={twMerge(
        clsx(
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-35",
          className,
        ),
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.navigate(direction, source);
      }}
    />
  );
}

export function StorySliderPrevious(props: StorySliderControlProps) {
  return (
    <StorySliderControl
      aria-label="Previous story"
      direction={-1}
      source="previous"
      {...props}
    />
  );
}

export function StorySliderNext(props: StorySliderControlProps) {
  return (
    <StorySliderControl
      aria-label="Next story"
      direction={1}
      source="next"
      {...props}
    />
  );
}

export interface StorySliderPlaybackRenderState {
  paused: boolean;
}

export type StorySliderPlaybackRenderer = (
  state: StorySliderPlaybackRenderState,
) => ReactNode;

export interface StorySliderPlaybackProps
  extends Omit<ComponentPropsWithRef<"button">, "children"> {
  children?: ReactNode | StorySliderPlaybackRenderer;
}

export function StorySliderPlayback({
  children,
  className,
  type,
  disabled,
  onClick,
  ...props
}: StorySliderPlaybackProps) {
  const context = useStorySliderContext("StorySliderPlayback");
  const content =
    typeof children === "function"
      ? children({ paused: context.isManuallyPaused })
      : children;

  return (
    <button
      {...props}
      ref={props.ref}
      type={type ?? "button"}
      disabled={disabled || context.disabled}
      aria-label={
        props["aria-label"] ??
        (context.isManuallyPaused ? "Play stories" : "Pause stories")
      }
      data-story-slider-playback=""
      data-slot="story-slider-playback"
      className={twMerge(
        clsx(
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-35",
          className,
        ),
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.togglePlayback();
      }}
    >
      {content}
    </button>
  );
}

export interface StorySliderStatusRenderState {
  value: StorySliderValue;
  groupCount: number;
  itemCount: number;
  paused: boolean;
}

export type StorySliderStatusRenderer = (
  state: StorySliderStatusRenderState,
) => ReactNode;

export interface StorySliderStatusProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?: ReactNode | StorySliderStatusRenderer;
}

export function StorySliderStatus({
  children,
  className,
  ...props
}: StorySliderStatusProps) {
  const context = useStorySliderContext("StorySliderStatus");
  const itemCount = context.groupCounts[context.currentValue.groupIndex] ?? 0;
  const content =
    typeof children === "function"
      ? children({
          value: context.currentValue,
          groupCount: context.groupCounts.length,
          itemCount,
          paused: context.isPaused,
        })
      : (children ??
        `Group ${context.currentValue.groupIndex + 1} of ${context.groupCounts.length}, story ${itemCount === 0 ? 0 : context.currentValue.itemIndex + 1} of ${itemCount}`);

  return (
    <span
      {...props}
      ref={props.ref}
      role="status"
      aria-live={context.isPaused ? "polite" : "off"}
      aria-atomic="true"
      data-slot="story-slider-status"
      className={twMerge(clsx("text-sm tabular-nums", className))}
    >
      {content}
    </span>
  );
}

export type { StorySliderPlaybackEndDetail, StorySliderValueChangeHandler };
