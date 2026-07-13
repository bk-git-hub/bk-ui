# Copy for AI: Story Slider

Status: `release-blocked` — use only the exact embedded source below for local verification. Do not claim that an npm package, GitHub permalink, ZIP release, or Registry command is publicly available.

Component version: `1.0.0`
Pinned source commit: `25febb424babdbbe6b4dc0a16e32ff7a347790b5`
React: `>=19.0.0 <20` (tested `19.2.7`)
Next.js tested: `16.2.10`

## Artifact integrity

- `public/downloads/story-slider-next.zip`: `23d84483f03ef5ffa504ce4848b8e4688c0fbfc00740b9f5048fd693bce1e467`
- `public/downloads/story-slider-react.zip`: `5e9b9f66f1dec19a722fe27d38898ab1259f7a1f9e2cd9bead60b3828c8dca31`
- `public/r/story-slider-tailwind-v3.json`: `d1c7ee29dcd46f4433924a995c9427e0d51cfd3b87144b65e66b20c71fc07125`
- `public/r/story-slider.json`: `212eb9490a2c808853d0c0890739acc08a1fc18f8214bee87e041351a9016ef6`

## Tailwind variants

### Tailwind 3

- Range: `>=3.4.0 <4.0.0`; tested: `3.4.17`
- Dependencies: `clsx@^2.1.1 tailwind-merge@2.6.0`
- Registry item: `story-slider-tailwind-v3`
- Source discovery: Add './src/components/StorySlider/**/*.{js,ts,jsx,tsx}' (or the equivalent installed path) to the content array in tailwind.config.js or tailwind.config.ts.

### Tailwind 4

- Range: `>=4.0.0 <5.0.0`; tested: `4.3.2`
- Dependencies: `clsx@^2.1.1 tailwind-merge@^3.3.1`
- Registry item: `story-slider`
- Source discovery: Keep components/StorySlider under a locally scanned source tree; otherwise add a stylesheet-relative @source directive for that directory.

## SSR and hydration constraints

- Import the Next.js entrypoint from components/StorySlider/client; it is the only Next-only file and re-exports the unchanged React core without next/* imports.
- Keep callbacks, refs, DOM event handlers, function-valued duration, and StorySliderItem, StorySliderPlayback, or StorySliderStatus render-function children inside a Client Component; pass only serializable data from a Server Component.
- Keep groupCounts, value or defaultValue, ordered groups, and rendered story content deterministic between the server render and the first hydration render.
- Reduced-motion and document-visibility effects may pause playback after hydration without changing the deterministic first render.
- The core does not read window or document during render; matchMedia, document visibility, animation frames, performance timing, and pointer APIs are accessed only after hydration in effects or interaction handlers, so ssr: false is not required.

## Accessibility constraints

- Do not remove the inactive group and item inert and aria-hidden behavior or the StorySliderStatus live region.
- Keep StorySliderViewport keyboard-focusable so ArrowLeft, ArrowRight, Home, End, and Space navigation and visible focus styles remain available.
- Preserve the prefers-reduced-motion auto-pause behavior and motion-reduce transition utilities when extending styles.
- Provide StorySliderPlayback whenever autoplay is enabled so users can pause or resume stories, and keep previous and next controls as native buttons with descriptive labels.
- Provide a meaningful accessible name for StorySliderRoot through aria-label or aria-labelledby and meaningful text or image alternative text for every story.

## Canonical source

### @components/StorySlider/StorySlider.tsx

- Source: `src/components/StorySlider/StorySlider.tsx`
- SHA-256: `ae3a2805ad553881fc3e4131de2fe7ae632d374b1c2b562ba8b1d235a85f62bc`

```tsx
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
```

### @components/StorySlider/client.ts

- Source: `src/components/StorySlider/client.ts`
- SHA-256: `2a179d7a0c52410c0c53e9e162e3ae3aeb084e38cb981117f78427294f757b61`

```ts
"use client";

export * from "./index";
```

### @components/StorySlider/index.ts

- Source: `src/components/StorySlider/index.ts`
- SHA-256: `ffe2018d034ee362669119abf9df69f1ac00fb88ed2de349bb8c56eaff5d1fbc`

```ts
"use client";

export {
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
  StorySliderViewport,
  type StorySliderControlProps,
  type StorySliderGroupProps,
  type StorySliderItemProps,
  type StorySliderItemRenderer,
  type StorySliderItemRenderState,
  type StorySliderPlaybackProps,
  type StorySliderPlaybackRenderer,
  type StorySliderPlaybackRenderState,
  type StorySliderProgressProps,
  type StorySliderRootProps,
  type StorySliderStatusProps,
  type StorySliderStatusRenderer,
  type StorySliderStatusRenderState,
  type StorySliderViewportProps,
} from "./StorySlider";
export {
  getStorySliderGroupPosition,
  getStorySliderStep,
  normalizeStorySliderValue,
  useStorySlider,
  type StorySliderChangeSource,
  type StorySliderDirection,
  type StorySliderPlaybackEndDetail,
  type StorySliderValue,
  type StorySliderValueChangeDetail,
  type StorySliderValueChangeHandler,
  type UseStorySliderOptions,
} from "./useStorySlider";
```

### @components/StorySlider/useStorySlider.ts

- Source: `src/components/StorySlider/useStorySlider.ts`
- SHA-256: `74a5bd94a53fd9cf0560b5421ce9fa14cd2a5259f7aab00a7ddd5a855f1630cf`

```ts
"use client";

/* eslint-disable no-unused-vars -- Callback parameter names document the public API. */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type StorySliderDirection = -1 | 1;

export interface StorySliderValue {
  groupIndex: number;
  itemIndex: number;
}

export type StorySliderChangeSource =
  | "autoplay"
  | "keyboard"
  | "next"
  | "pointer"
  | "previous"
  | "programmatic"
  | "tap";

export interface StorySliderValueChangeDetail {
  previousValue: StorySliderValue;
  direction: StorySliderDirection;
  source: StorySliderChangeSource;
}

export type StorySliderValueChangeHandler = (
  value: StorySliderValue,
  detail: StorySliderValueChangeDetail,
) => void;

export interface StorySliderPlaybackEndDetail {
  value: StorySliderValue;
}

export interface UseStorySliderOptions {
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
}

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startX: number;
  startY: number;
  latestX: number;
  latestY: number;
  width: number;
  left: number;
  startedAt: number;
  axis: "pending" | "horizontal" | "vertical";
  captured: boolean;
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-story-slider-no-navigation]";
const AXIS_LOCK_DISTANCE = 7;
const DEFAULT_DURATION = 5000;
const MAX_FRAME_DELTA = 100;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function sanitizeGroupCounts(groupCounts: readonly number[]) {
  return groupCounts.map((count) =>
    Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0,
  );
}

function getPlayableGroups(groupCounts: readonly number[]) {
  return groupCounts
    .map((count, index) => (count > 0 ? index : -1))
    .filter((index) => index >= 0);
}

function valuesEqual(left: StorySliderValue, right: StorySliderValue) {
  return (
    left.groupIndex === right.groupIndex && left.itemIndex === right.itemIndex
  );
}

function getNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function getAdjacentPlayableGroup(
  groupIndex: number,
  direction: StorySliderDirection,
  groupCounts: readonly number[],
  loop: boolean,
) {
  const playableGroups = getPlayableGroups(groupCounts);
  if (playableGroups.length <= 1) return groupIndex;

  const currentPosition = playableGroups.indexOf(groupIndex);
  if (currentPosition < 0) return playableGroups[0] ?? 0;

  const requestedPosition = currentPosition + direction;
  if (loop) {
    return (
      playableGroups[
        (requestedPosition + playableGroups.length) % playableGroups.length
      ] ?? groupIndex
    );
  }

  return playableGroups[requestedPosition] ?? groupIndex;
}

export function normalizeStorySliderValue(
  value: StorySliderValue,
  groupCounts: readonly number[],
) {
  const safeCounts = sanitizeGroupCounts(groupCounts);
  const playableGroups = getPlayableGroups(safeCounts);
  if (playableGroups.length === 0) {
    return { groupIndex: 0, itemIndex: 0 };
  }

  const requestedGroup = Number.isFinite(value.groupIndex)
    ? Math.trunc(value.groupIndex)
    : playableGroups[0];
  const exactGroup = safeCounts[requestedGroup] ? requestedGroup : undefined;
  const groupIndex =
    exactGroup ??
    playableGroups.find((index) => index >= requestedGroup) ??
    playableGroups[playableGroups.length - 1] ??
    0;
  const itemCount = safeCounts[groupIndex] ?? 0;
  const requestedItem = Number.isFinite(value.itemIndex)
    ? Math.trunc(value.itemIndex)
    : 0;

  return {
    groupIndex,
    itemIndex: clamp(requestedItem, 0, Math.max(0, itemCount - 1)),
  };
}

export function getStorySliderStep(
  value: StorySliderValue,
  direction: StorySliderDirection,
  groupCounts: readonly number[],
  loop: boolean,
) {
  const safeCounts = sanitizeGroupCounts(groupCounts);
  const currentValue = normalizeStorySliderValue(value, safeCounts);
  const itemCount = safeCounts[currentValue.groupIndex] ?? 0;

  if (direction === 1 && currentValue.itemIndex < itemCount - 1) {
    return { ...currentValue, itemIndex: currentValue.itemIndex + 1 };
  }
  if (direction === -1 && currentValue.itemIndex > 0) {
    return { ...currentValue, itemIndex: currentValue.itemIndex - 1 };
  }

  const groupIndex = getAdjacentPlayableGroup(
    currentValue.groupIndex,
    direction,
    safeCounts,
    loop,
  );
  if (groupIndex === currentValue.groupIndex) {
    if (loop && itemCount > 1) {
      return {
        groupIndex,
        itemIndex: direction === 1 ? 0 : itemCount - 1,
      };
    }
    return currentValue;
  }

  return {
    groupIndex,
    itemIndex:
      direction === -1 ? Math.max(0, (safeCounts[groupIndex] ?? 1) - 1) : 0,
  };
}

export function getStorySliderGroupPosition(
  groupIndex: number,
  currentGroupIndex: number,
  groupCounts: readonly number[],
  loop: boolean,
) {
  const playableGroups = getPlayableGroups(groupCounts);
  const groupPosition = playableGroups.indexOf(groupIndex);
  const currentPosition = playableGroups.indexOf(currentGroupIndex);
  if (groupPosition < 0 || currentPosition < 0) {
    return groupIndex - currentGroupIndex;
  }

  let distance = groupPosition - currentPosition;
  const playableCount = playableGroups.length;
  if (!loop || playableCount <= 2) return distance;

  const half = playableCount / 2;
  distance =
    ((((distance + half) % playableCount) + playableCount) % playableCount) -
    half;
  return distance;
}

function resolveDuration(
  duration: UseStorySliderOptions["duration"],
  value: StorySliderValue,
) {
  const resolved = typeof duration === "function" ? duration(value) : duration;
  return Number.isFinite(resolved)
    ? Math.max(100, Number(resolved))
    : DEFAULT_DURATION;
}

export function useStorySlider({
  groupCounts,
  value,
  defaultValue = { groupIndex: 0, itemIndex: 0 },
  onValueChange,
  onPlaybackEnd,
  duration = DEFAULT_DURATION,
  autoplay = true,
  loop = false,
  disabled = false,
  swipeThreshold = 0.18,
  tapPreviousRatio = 0.35,
  longPressDelay = 200,
}: UseStorySliderOptions) {
  const groupCountsKey = groupCounts
    .map((count) =>
      Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0,
    )
    .join(",");
  const safeGroupCounts = useMemo(
    () =>
      groupCountsKey === ""
        ? []
        : groupCountsKey.split(",").map((count) => Number(count)),
    [groupCountsKey],
  );
  const isControlled = value !== undefined;
  const wasControlledRef = useRef(isControlled);
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeStorySliderValue(defaultValue, safeGroupCounts),
  );
  const candidateGroupIndex = (value ?? uncontrolledValue).groupIndex;
  const candidateItemIndex = (value ?? uncontrolledValue).itemIndex;
  const currentValue = useMemo(
    () =>
      normalizeStorySliderValue(
        {
          groupIndex: candidateGroupIndex,
          itemIndex: candidateItemIndex,
        },
        safeGroupCounts,
      ),
    [candidateGroupIndex, candidateItemIndex, safeGroupCounts],
  );
  const currentValueRef = useRef(currentValue);
  const groupCountsRef = useRef(safeGroupCounts);
  const loopRef = useRef(loop);
  const onValueChangeRef = useRef(onValueChange);
  const onPlaybackEndRef = useRef(onPlaybackEnd);

  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const [isManuallyPaused, setIsManuallyPaused] = useState(() => !autoplay);
  const transientPauseReasonsRef = useRef(new Set<string>());
  const [transientPauseCount, setTransientPauseCount] = useState(0);

  const pointerSessionRef = useRef<PointerSession | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingDragOffsetRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  currentValueRef.current = currentValue;
  groupCountsRef.current = safeGroupCounts;
  loopRef.current = loop;
  onValueChangeRef.current = onValueChange;
  onPlaybackEndRef.current = onPlaybackEnd;

  const resolvedDuration = resolveDuration(duration, currentValue);
  const isPaused = disabled || isManuallyPaused || transientPauseCount > 0;

  useEffect(() => {
    if (wasControlledRef.current !== isControlled) {
      console.warn(
        "StorySliderRoot should not switch between controlled and uncontrolled modes.",
      );
    }
  }, [isControlled]);

  useEffect(() => {
    if (isControlled) return;
    setUncontrolledValue((previousValue) =>
      normalizeStorySliderValue(previousValue, safeGroupCounts),
    );
    // A primitive key avoids resetting when consumers create the counts array inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupCountsKey, isControlled]);

  useEffect(() => {
    if (!autoplay) setIsManuallyPaused(true);
  }, [autoplay]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) setIsManuallyPaused(true);
    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsManuallyPaused(true);
    };
    motionQuery.addEventListener?.("change", handleMotionChange);
    return () =>
      motionQuery.removeEventListener?.("change", handleMotionChange);
  }, []);

  const setTransientPause = useCallback((reason: string, paused: boolean) => {
    const reasons = transientPauseReasonsRef.current;
    const hadReason = reasons.has(reason);
    if (paused === hadReason) return;

    if (paused) reasons.add(reason);
    else reasons.delete(reason);
    setTransientPauseCount(reasons.size);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const pauseReasons = transientPauseReasonsRef.current;
    const handleVisibilityChange = () =>
      setTransientPause("visibility", document.hidden);
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pauseReasons.delete("visibility");
    };
  }, [setTransientPause]);

  const resetPlaybackClock = useCallback(() => {
    elapsedRef.current = 0;
    lastFrameTimeRef.current = null;
    progressRef.current = 0;
    setProgress(0);
  }, []);

  const goTo = useCallback(
    (
      requestedValue: StorySliderValue,
      source: StorySliderChangeSource = "programmatic",
      requestedDirection?: StorySliderDirection,
    ) => {
      if (disabled) return false;
      const previousValue = currentValueRef.current;
      const nextValue = normalizeStorySliderValue(
        requestedValue,
        groupCountsRef.current,
      );
      if (valuesEqual(previousValue, nextValue)) return false;

      const direction =
        requestedDirection ??
        (nextValue.groupIndex > previousValue.groupIndex ||
        (nextValue.groupIndex === previousValue.groupIndex &&
          nextValue.itemIndex > previousValue.itemIndex)
          ? 1
          : -1);

      resetPlaybackClock();
      if (!wasControlledRef.current) setUncontrolledValue(nextValue);
      onValueChangeRef.current?.(nextValue, {
        previousValue,
        direction,
        source,
      });
      return true;
    },
    [disabled, resetPlaybackClock],
  );

  const getTarget = useCallback((direction: StorySliderDirection) => {
    return getStorySliderStep(
      currentValueRef.current,
      direction,
      groupCountsRef.current,
      loopRef.current,
    );
  }, []);

  const canNavigate = useCallback(
    (direction: StorySliderDirection) =>
      !disabled && !valuesEqual(currentValueRef.current, getTarget(direction)),
    [disabled, getTarget],
  );

  const navigate = useCallback(
    (direction: StorySliderDirection, source: StorySliderChangeSource) =>
      goTo(getTarget(direction), source, direction),
    [getTarget, goTo],
  );

  const getGroupTarget = useCallback((direction: StorySliderDirection) => {
    const previousValue = currentValueRef.current;
    const groupIndex = getAdjacentPlayableGroup(
      previousValue.groupIndex,
      direction,
      groupCountsRef.current,
      loopRef.current,
    );
    return { groupIndex, itemIndex: 0 };
  }, []);

  const canNavigateGroup = useCallback(
    (direction: StorySliderDirection) =>
      !disabled &&
      !valuesEqual(currentValueRef.current, getGroupTarget(direction)),
    [disabled, getGroupTarget],
  );

  const navigateGroup = useCallback(
    (direction: StorySliderDirection, source: StorySliderChangeSource) =>
      goTo(getGroupTarget(direction), source, direction),
    [getGroupTarget, goTo],
  );

  const pause = useCallback(() => setIsManuallyPaused(true), []);
  const play = useCallback(() => {
    if (progressRef.current >= 1) resetPlaybackClock();
    setIsManuallyPaused(false);
  }, [resetPlaybackClock]);
  const togglePlayback = useCallback(() => {
    if (isManuallyPaused) play();
    else pause();
  }, [isManuallyPaused, pause, play]);

  useEffect(() => {
    resetPlaybackClock();
  }, [
    currentValue.groupIndex,
    currentValue.itemIndex,
    resetPlaybackClock,
    resolvedDuration,
  ]);

  useEffect(() => {
    if (playbackFrameRef.current !== null) {
      cancelAnimationFrame(playbackFrameRef.current);
      playbackFrameRef.current = null;
    }
    lastFrameTimeRef.current = null;

    if (
      isPaused ||
      getPlayableGroups(safeGroupCounts).length === 0 ||
      resolvedDuration <= 0
    ) {
      return;
    }

    const runFrame = (timestamp: number) => {
      const lastFrameTime = lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      if (lastFrameTime !== null) {
        elapsedRef.current += Math.min(
          Math.max(0, timestamp - lastFrameTime),
          MAX_FRAME_DELTA,
        );
      }

      const nextProgress = clamp(elapsedRef.current / resolvedDuration, 0, 1);
      progressRef.current = nextProgress;
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        playbackFrameRef.current = null;
        if (!navigate(1, "autoplay")) {
          setIsManuallyPaused(true);
          onPlaybackEndRef.current?.({ value: currentValueRef.current });
        }
        return;
      }

      playbackFrameRef.current = requestAnimationFrame(runFrame);
    };

    playbackFrameRef.current = requestAnimationFrame(runFrame);
    return () => {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }
      lastFrameTimeRef.current = null;
    };
    // A primitive key keeps inline groupCounts arrays from restarting playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentValue.groupIndex,
    currentValue.itemIndex,
    groupCountsKey,
    isPaused,
    navigate,
    resolvedDuration,
  ]);

  const flushDragOffset = useCallback(() => {
    dragFrameRef.current = null;
    setDragOffset(pendingDragOffsetRef.current);
  }, []);

  const scheduleDragOffset = useCallback(
    (nextOffset: number) => {
      pendingDragOffsetRef.current = nextOffset;
      if (dragFrameRef.current !== null) return;
      if (typeof requestAnimationFrame !== "function") {
        flushDragOffset();
        return;
      }
      dragFrameRef.current = requestAnimationFrame(flushDragOffset);
    },
    [flushDragOffset],
  );

  const clearPointerSession = useCallback(
    (releaseCapture = true) => {
      const session = pointerSessionRef.current;
      pointerSessionRef.current = null;
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
      pendingDragOffsetRef.current = 0;
      setDragOffset(0);
      setIsDragging(false);
      setTransientPause("interaction", false);

      if (
        releaseCapture &&
        session?.captured &&
        session.viewport.hasPointerCapture?.(session.pointerId)
      ) {
        session.viewport.releasePointerCapture?.(session.pointerId);
      }
    },
    [setTransientPause],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0 || pointerSessionRef.current) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(INTERACTIVE_SELECTOR) !== null
      ) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const pointerSession: PointerSession = {
        pointerId: event.pointerId,
        viewport: event.currentTarget,
        startX: event.clientX,
        startY: event.clientY,
        latestX: event.clientX,
        latestY: event.clientY,
        width: Math.max(1, bounds.width),
        left: bounds.left,
        startedAt: getNow(),
        axis: "pending",
        captured: false,
      };
      pointerSessionRef.current = pointerSession;
      setTransientPause("interaction", true);
      if (event.pointerType === "mouse") {
        event.preventDefault();
        if (typeof event.currentTarget.setPointerCapture === "function") {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointerSession.captured = true;
        }
      }
    },
    [disabled, setTransientPause],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      session.latestX = event.clientX;
      session.latestY = event.clientY;
      const deltaX = session.latestX - session.startX;
      const deltaY = session.latestY - session.startY;

      if (session.axis === "pending") {
        if (
          Math.abs(deltaX) < AXIS_LOCK_DISTANCE &&
          Math.abs(deltaY) < AXIS_LOCK_DISTANCE
        ) {
          return;
        }

        session.axis =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
        if (session.axis === "vertical") {
          clearPointerSession(false);
          return;
        }

        if (typeof event.currentTarget.setPointerCapture === "function") {
          event.currentTarget.setPointerCapture(event.pointerId);
          session.captured = true;
        }
        setIsDragging(true);
      }

      if (session.axis !== "horizontal") return;
      event.preventDefault();
      let nextOffset = clamp(deltaX / session.width, -1, 1);
      const direction: StorySliderDirection = nextOffset > 0 ? -1 : 1;
      if (!canNavigateGroup(direction)) nextOffset *= 0.28;
      scheduleDragOffset(nextOffset);
    },
    [canNavigateGroup, clearPointerSession, scheduleDragOffset],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - session.startX;
      const offset = clamp(deltaX / session.width, -1, 1);
      const heldFor = getNow() - session.startedAt;
      const wasHorizontalDrag = session.axis === "horizontal";

      if (wasHorizontalDrag && Math.abs(offset) >= swipeThreshold) {
        navigateGroup(offset > 0 ? -1 : 1, "pointer");
      } else if (
        session.axis === "pending" &&
        heldFor < Math.max(0, longPressDelay)
      ) {
        const relativeX = clamp(
          (session.startX - session.left) / session.width,
          0,
          1,
        );
        navigate(relativeX < clamp(tapPreviousRatio, 0.1, 0.9) ? -1 : 1, "tap");
      }

      clearPointerSession();
    },
    [
      clearPointerSession,
      longPressDelay,
      navigate,
      navigateGroup,
      swipeThreshold,
      tapPreviousRatio,
    ],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      clearPointerSession();
    },
    [clearPointerSession],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      clearPointerSession(false);
    },
    [clearPointerSession],
  );

  useEffect(
    () => () => {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
      }
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
      }
    },
    [],
  );

  return {
    canNavigate,
    canNavigateGroup,
    currentValue,
    dragOffset,
    goTo,
    groupCounts: safeGroupCounts,
    handleLostPointerCapture,
    handlePointerCancel,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    isDragging,
    isManuallyPaused,
    isPaused,
    loop,
    navigate,
    navigateGroup,
    pause,
    play,
    progress,
    resolvedDuration,
    setTransientPause,
    togglePlayback,
  };
}
```

## React/Vite example

```tsx
import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
  StorySliderViewport,
} from "../components/StorySlider";

const groups = [
  {
    id: "city",
    label: "City",
    stories: [
      { id: "dawn", title: "First light", className: "bg-amber-600" },
      { id: "night", title: "Neon walk", className: "bg-violet-700" },
    ],
  },
  {
    id: "coast",
    label: "Coast",
    stories: [
      { id: "tide", title: "Low tide", className: "bg-sky-700" },
    ],
  },
] as const;

export default function StorySliderExample() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
      <StorySliderRoot
        groupCounts={groups.map((group) => group.stories.length)}
        duration={4500}
        loop
        aria-label="Travel stories"
        className="w-full max-w-sm"
      >
        <StorySliderViewport className="rounded-3xl bg-slate-900 shadow-2xl">
          {groups.map((group, groupIndex) => (
            <StorySliderGroup
              key={group.id}
              index={groupIndex}
              aria-label={group.label + " stories"}
              className="rounded-3xl"
            >
              {group.stories.map((story, itemIndex) => (
                <StorySliderItem
                  key={story.id}
                  index={itemIndex}
                  className={"flex items-end rounded-3xl p-8 " + story.className}
                >
                  <h2 className="text-4xl font-black">{story.title}</h2>
                </StorySliderItem>
              ))}
            </StorySliderGroup>
          ))}
          <StorySliderProgress className="absolute inset-x-0 top-0 z-30 m-4 w-auto" />
          <StorySliderPlayback className="absolute right-4 top-8 z-40 bg-black/55 px-3 text-sm">
            {({ paused }) => (paused ? "Play" : "Pause")}
          </StorySliderPlayback>
        </StorySliderViewport>
        <div className="mt-4 flex items-center justify-between gap-3">
          <StorySliderPrevious className="bg-white/10 px-4">Previous</StorySliderPrevious>
          <StorySliderStatus className="text-white/75" />
          <StorySliderNext className="bg-white/10 px-4">Next</StorySliderNext>
        </div>
      </StorySliderRoot>
    </main>
  );
}
```

## Next.js App Router examples

```tsx
"use client";

import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
  StorySliderViewport,
} from "../components/StorySlider/client";

export interface SerializableStory {
  id: string;
  title: string;
  tone: "amber" | "violet" | "sky";
}

export interface SerializableStoryGroup {
  id: string;
  label: string;
  stories: readonly SerializableStory[];
}

export interface StorySliderClientProps {
  groups: readonly SerializableStoryGroup[];
}

const toneClassNames: Record<SerializableStory["tone"], string> = {
  amber: "bg-amber-600",
  violet: "bg-violet-700",
  sky: "bg-sky-700",
};

export default function StorySliderClient({ groups }: StorySliderClientProps) {
  return (
    <StorySliderRoot
      groupCounts={groups.map((group) => group.stories.length)}
      duration={4500}
      loop
      aria-label="Travel stories"
      className="w-full max-w-sm"
    >
      <StorySliderViewport className="rounded-3xl bg-slate-900 text-white shadow-2xl">
        {groups.map((group, groupIndex) => (
          <StorySliderGroup
            key={group.id}
            index={groupIndex}
            aria-label={group.label + " stories"}
            className="rounded-3xl"
          >
            {group.stories.map((story, itemIndex) => (
              <StorySliderItem
                key={story.id}
                index={itemIndex}
                className={"flex items-end rounded-3xl p-8 " + toneClassNames[story.tone]}
              >
                <h2 className="text-4xl font-black">{story.title}</h2>
              </StorySliderItem>
            ))}
          </StorySliderGroup>
        ))}
        <StorySliderProgress className="absolute inset-x-0 top-0 z-30 m-4 w-auto" />
        <StorySliderPlayback className="absolute right-4 top-8 z-40 bg-black/55 px-3 text-sm">
          {({ paused }) => (paused ? "Play" : "Pause")}
        </StorySliderPlayback>
      </StorySliderViewport>
      <div className="mt-4 flex items-center justify-between gap-3 text-white">
        <StorySliderPrevious className="bg-white/10 px-4">Previous</StorySliderPrevious>
        <StorySliderStatus className="text-white/75" />
        <StorySliderNext className="bg-white/10 px-4">Next</StorySliderNext>
      </div>
    </StorySliderRoot>
  );
}
```

```tsx
import StorySliderClient, {
  type SerializableStoryGroup,
} from "./client-wrapper";

const groups = [
  {
    id: "city",
    label: "City",
    stories: [
      { id: "dawn", title: "First light", tone: "amber" },
      { id: "night", title: "Neon walk", tone: "violet" },
    ],
  },
  {
    id: "coast",
    label: "Coast",
    stories: [{ id: "tide", title: "Low tide", tone: "sky" }],
  },
] satisfies readonly SerializableStoryGroup[];

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
      <StorySliderClient groups={groups} />
    </main>
  );
}
```

## Required verification

- Typecheck and production-build the consuming project.
- Confirm the selected Tailwind major emits the representative utilities from the manifest.
- For Next.js, render production HTML, hydrate without console errors, and exercise one interaction.
- Recompute every file and artifact SHA-256 before using the result.
