# Copy for AI: Cards Stack Slider

Status: `release-blocked` — use only the exact embedded source below for local verification. Do not claim that an npm package, GitHub permalink, ZIP release, or Registry command is publicly available.

Component version: `1.0.0`
Pinned source commit: `fecaf6502f823c379eedfbeb3e1b3e256040ff5e`
React: `>=19.0.0 <20` (tested `19.2.7`)
Next.js tested: `16.2.10`

## Artifact integrity

- `public/downloads/cards-stack-slider-next.zip`: `bd051aeb4707652519da4c09ee035b2712bff27c79401b6ee6e79b2e04ddf206`
- `public/downloads/cards-stack-slider-react.zip`: `a332e694ae97d9f3622b1dbe9b9376fbcffbdb2e037671000713ce5d6e0d931d`
- `public/r/cards-stack-slider-tailwind-v3.json`: `698f7a34552ae1be715d09f402f217ed922d7219896eef35e585b331b0a94e6d`
- `public/r/cards-stack-slider.json`: `16d31a6089de3aeb6d1a8fcfd57c1af441b440709e9ababb079144fb85315803`

## Tailwind variants

### Tailwind 3

- Range: `>=3.4.0 <4`; tested: `3.4.19`
- Dependencies: `clsx@^2.1.1 tailwind-merge@2.6.0`
- Registry item: `cards-stack-slider-tailwind-v3`
- Source discovery: Add "./components/**/*.{js,ts,jsx,tsx}" to tailwind.config content after copying the component.

### Tailwind 4

- Range: `>=4.0.0 <5`; tested: `4.3.2`
- Dependencies: `clsx@^2.1.1 tailwind-merge@^3.3.1`
- Registry item: `cards-stack-slider`
- Source discovery: Keep components/CardsStackSlider under a locally scanned source tree; otherwise add a stylesheet-relative @source directive for that directory.

## SSR and hydration constraints

- Browser APIs are accessed only from effects or pointer and transition event handlers; do not invoke interaction handlers during server render.
- Keep onValueChange, DOM event handlers, and function-valued CardsStackStatus children inside the Next.js Client Component boundary; pass only serializable card data from Server Components.
- Render output is deterministic for the same count, initial value, card order, orientation, and options and does not require ssr: false.
- Use the same count, card order, orientation, and initial value for the server render and first hydration render.

## Accessibility constraints

- Give CardsStackRoot a localized accessible label that identifies the carousel.
- Keep CardsStackViewport keyboard-focusable and preserve its visible focus ring and orientation-aware Arrow key navigation.
- Keep inactive cards aria-hidden and inert so assistive technology and keyboard users interact only with the active card.
- Preserve CardsStackPrevious and CardsStackNext as native-button alternatives to pointer dragging.
- Preserve motion-reduce transition handling and add data-cards-stack-no-drag to interactive descendants that must not initiate a drag.

## Canonical source

### @components/CardsStackSlider/CardsStackSlider.tsx

- Source: `src/components/CardsStackSlider/CardsStackSlider.tsx`
- SHA-256: `635488ad4e14dab80a6841a069ad8f8c3bcf75d56e0be12d5495085b0500a022`

```tsx
import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  getCardsStackRelativeProgress,
  useCardsStackSlider,
  type CardsStackDirection,
  type CardsStackOrientation,
  type CardsStackValueChangeDetail,
  type CardsStackValueChangeHandler,
} from "./useCardsStackSlider";

type CardsStackSliderApi = ReturnType<typeof useCardsStackSlider>;

type CardsStackContextValue = Pick<
  CardsStackSliderApi,
  | "canNavigate"
  | "currentValue"
  | "handleLostPointerCapture"
  | "handlePointerDown"
  | "handlePointerEnd"
  | "handlePointerMove"
  | "handleTransitionEnd"
  | "isAnimating"
  | "isDragging"
  | "motionProgress"
  | "navigate"
  | "topLayerValue"
  | "transitionDuration"
> & {
  count: number;
  loop: boolean;
  orientation: CardsStackOrientation;
  sideOffset: number;
  visibleCount: number;
  disabled: boolean;
};

const CardsStackContext = createContext<CardsStackContextValue | null>(null);

function useCardsStackContext(componentName: string) {
  const context = useContext(CardsStackContext);
  if (!context) {
    throw new Error(`${componentName} must be rendered inside CardsStackRoot.`);
  }
  return context;
}

export interface CardsStackRootProps
  extends Omit<ComponentPropsWithRef<"section">, "defaultValue" | "onChange"> {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: CardsStackValueChangeHandler;
  loop?: boolean;
  orientation?: CardsStackOrientation;
  /** Distance from the active card to the first side card, as a percentage of the card size. */
  sideOffset?: number;
  visibleCount?: number;
  dragThreshold?: number;
  velocityThreshold?: number;
  touchRatio?: number;
  transitionDuration?: number;
  disabled?: boolean;
}

export function CardsStackRoot({
  count,
  value,
  defaultValue,
  onValueChange,
  loop = true,
  orientation = "horizontal",
  sideOffset = 64,
  visibleCount = 4,
  dragThreshold,
  velocityThreshold,
  touchRatio,
  transitionDuration,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: CardsStackRootProps) {
  const safeCount = Math.max(0, Math.trunc(count));
  const effectiveLoop = loop && safeCount > 2;
  const slider = useCardsStackSlider({
    count,
    value,
    defaultValue,
    onValueChange,
    loop: effectiveLoop,
    orientation,
    dragThreshold,
    velocityThreshold,
    touchRatio,
    transitionDuration,
    disabled,
  });
  const safeVisibleCount = Math.max(1, Math.trunc(visibleCount));
  const safeSideOffset = Number.isFinite(sideOffset)
    ? Math.max(0, sideOffset)
    : 64;
  const contextValue = useMemo<CardsStackContextValue>(
    () => ({
      count: safeCount,
      currentValue: slider.currentValue,
      motionProgress: slider.motionProgress,
      topLayerValue: slider.topLayerValue,
      isDragging: slider.isDragging,
      isAnimating: slider.isAnimating,
      loop: effectiveLoop,
      orientation,
      sideOffset: safeSideOffset,
      visibleCount: safeVisibleCount,
      disabled,
      transitionDuration: slider.transitionDuration,
      canNavigate: slider.canNavigate,
      navigate: slider.navigate,
      handlePointerDown: slider.handlePointerDown,
      handlePointerMove: slider.handlePointerMove,
      handlePointerEnd: slider.handlePointerEnd,
      handleLostPointerCapture: slider.handleLostPointerCapture,
      handleTransitionEnd: slider.handleTransitionEnd,
    }),
    [
      disabled,
      effectiveLoop,
      orientation,
      safeCount,
      safeSideOffset,
      safeVisibleCount,
      slider,
    ],
  );

  return (
    <CardsStackContext.Provider value={contextValue}>
      <section
        {...props}
        aria-label={ariaLabelledby ? ariaLabel : (ariaLabel ?? "Card stack")}
        aria-labelledby={ariaLabelledby}
        aria-roledescription="carousel"
        data-disabled={disabled ? "" : undefined}
        data-orientation={orientation}
        data-slot="cards-stack-root"
        className={twMerge(
          clsx("flex w-full flex-col items-center gap-5", className),
        )}
      />
    </CardsStackContext.Provider>
  );
}

export type CardsStackViewportProps = ComponentPropsWithRef<"div">;

export function CardsStackViewport({
  className,
  tabIndex,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...props
}: CardsStackViewportProps) {
  const context = useCardsStackContext("CardsStackViewport");

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.target !== event.currentTarget ||
      context.disabled ||
      context.isDragging ||
      context.isAnimating
    ) {
      return;
    }

    const previousKey =
      context.orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    const nextKey =
      context.orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    if (event.key === previousKey) {
      event.preventDefault();
      context.navigate(-1, "keyboard");
    } else if (event.key === nextKey) {
      event.preventDefault();
      context.navigate(1, "keyboard");
    }
  };

  return (
    <div
      {...props}
      role="group"
      aria-label={props["aria-label"] ?? "Card navigation"}
      ref={props.ref}
      tabIndex={tabIndex ?? 0}
      data-dragging={context.isDragging ? "" : undefined}
      data-orientation={context.orientation}
      data-slot="cards-stack-viewport"
      className={twMerge(
        clsx(
          "relative isolate aspect-[19/12] w-full max-w-[380px] overflow-visible outline-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-4",
          context.orientation === "horizontal"
            ? "cursor-grab [touch-action:pan-y] active:cursor-grabbing"
            : "cursor-ns-resize [touch-action:pan-x]",
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
        context.handlePointerEnd(event);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        context.handleLostPointerCapture(event);
      }}
    />
  );
}

function getSlideTransform(
  progress: number,
  orientation: CardsStackOrientation,
  sideOffset: number,
  visibleCount: number,
  count: number,
  loop: boolean,
  isTopLayer: boolean,
) {
  const absoluteProgress = Math.abs(progress);
  const clampedProgress = Math.min(absoluteProgress, visibleCount + 1);
  const firstStepProgress = Math.min(clampedProgress, 1);
  const trailProgress = Math.max(clampedProgress - 1, 0);
  const direction = progress < 0 ? -1 : 1;
  const axisOffset =
    direction *
    (firstStepProgress * sideOffset + trailProgress * sideOffset * 0.16);
  const depth = -(firstStepProgress * 72 + trailProgress * 42);
  const scale = Math.max(
    0.72,
    1 - firstStepProgress * 0.12 - trailProgress * 0.045,
  );
  let transform: string;

  if (progress >= 0) {
    const angle = firstStepProgress * 14 + trailProgress * 5;
    const tilt = Math.min(clampedProgress, visibleCount) * 1.2;
    transform =
      orientation === "horizontal"
        ? `translate3d(${axisOffset}%, ${trailProgress * 5}px, ${depth}px) rotateY(${-angle}deg) rotateZ(${tilt}deg) scale(${scale})`
        : `translate3d(${trailProgress * 5}px, ${axisOffset}%, ${depth}px) rotateX(${angle}deg) rotateZ(${-tilt}deg) scale(${scale})`;
  } else {
    const flip = firstStepProgress * 180 + trailProgress * 4;
    const tilt = Math.min(clampedProgress, visibleCount) * 1.2;
    transform =
      orientation === "horizontal"
        ? `translate3d(${axisOffset}%, ${-trailProgress * 5}px, ${depth}px) rotateY(${flip}deg) rotateZ(${-tilt}deg) scale(${scale})`
        : `translate3d(${-trailProgress * 5}px, ${axisOffset}%, ${depth}px) rotateX(${-flip}deg) rotateZ(${tilt}deg) scale(${scale})`;
  }

  return {
    transform,
    opacity:
      absoluteProgress > visibleCount + 0.65
        ? 0
        : loop
          ? Math.min(Math.max((count / 2 - absoluteProgress) / 0.35, 0), 1)
          : 1,
    zIndex: isTopLayer ? 2000 : 1000 - Math.ceil(absoluteProgress * 10),
  };
}

export interface CardsStackItemProps extends ComponentPropsWithRef<"div"> {
  index: number;
}

export function CardsStackItem({
  index,
  className,
  "aria-label": ariaLabel,
  ...props
}: CardsStackItemProps) {
  const context = useCardsStackContext("CardsStackItem");
  const isCurrent = index === context.currentValue;
  const isTopLayer = index === context.topLayerValue;
  const progress = getCardsStackRelativeProgress(
    index,
    context.currentValue,
    context.count,
    context.loop,
    context.motionProgress,
  );
  const slideStyle = getSlideTransform(
    progress,
    context.orientation,
    context.sideOffset,
    context.visibleCount,
    context.count,
    context.loop,
    isTopLayer,
  );
  const state = isCurrent ? "active" : progress < 0 ? "previous" : "next";

  return (
    <div
      role="group"
      aria-hidden={!isCurrent}
      aria-label={
        ariaLabel ??
        `Card ${Math.min(index + 1, context.count)} of ${context.count}`
      }
      aria-roledescription="slide"
      inert={!isCurrent}
      data-active={isCurrent ? "" : undefined}
      data-index={index}
      data-slot="cards-stack-item-positioner"
      data-state={state}
      className={twMerge(
        clsx(
          "absolute inset-0 [transition-property:transform,opacity] [transform-style:preserve-3d] motion-reduce:transition-none",
          !context.isDragging &&
            "ease-[cubic-bezier(0.22,0.75,0.18,1)] will-change-transform",
        ),
      )}
      style={{
        ...slideStyle,
        transitionDuration: context.isDragging
          ? "0ms"
          : `${context.transitionDuration}ms`,
        pointerEvents: isCurrent ? "auto" : "none",
      }}
      onTransitionEnd={
        isCurrent && context.isAnimating
          ? context.handleTransitionEnd
          : undefined
      }
    >
      <div
        {...props}
        aria-label={undefined}
        data-slot="cards-stack-item"
        className={twMerge(
          clsx(
            "relative h-full w-full rounded-3xl [transform-style:preserve-3d]",
            className,
          ),
        )}
      />
      <div
        aria-hidden="true"
        data-slot="cards-stack-shadow"
        className="pointer-events-none absolute inset-0 rounded-3xl bg-black transition-opacity motion-reduce:transition-none"
        style={{
          opacity: Math.min(
            Math.max((Math.abs(progress) - 0.45) / 1.4, 0),
            0.42,
          ),
          transitionDuration: `${context.transitionDuration}ms`,
        }}
      />
    </div>
  );
}

export type CardsStackFaceProps = ComponentPropsWithRef<"div">;

export function CardsStackFront({ className, ...props }: CardsStackFaceProps) {
  return (
    <div
      {...props}
      data-slot="cards-stack-front"
      className={twMerge(
        clsx(
          "absolute inset-0 overflow-hidden rounded-3xl [backface-visibility:hidden]",
          className,
        ),
      )}
    />
  );
}

export function CardsStackBack({
  className,
  style,
  "aria-hidden": ariaHidden = true,
  inert = true,
  ...props
}: CardsStackFaceProps) {
  const { orientation } = useCardsStackContext("CardsStackBack");
  return (
    <div
      {...props}
      aria-hidden={ariaHidden}
      inert={inert}
      data-slot="cards-stack-back"
      className={twMerge(
        clsx(
          "absolute inset-0 overflow-hidden rounded-3xl [backface-visibility:hidden]",
          className,
        ),
      )}
      style={{
        transform:
          orientation === "horizontal" ? "rotateY(180deg)" : "rotateX(180deg)",
        ...style,
      }}
    />
  );
}

export type CardsStackControlProps = ComponentPropsWithRef<"button">;

function CardsStackControl({
  direction,
  source,
  className,
  type,
  disabled,
  onClick,
  ...props
}: CardsStackControlProps & {
  direction: CardsStackDirection;
  source: "next" | "previous";
}) {
  const context = useCardsStackContext("CardsStackControl");
  const isDisabled =
    disabled ||
    context.disabled ||
    context.isDragging ||
    context.isAnimating ||
    !context.canNavigate(direction);

  return (
    <button
      {...props}
      type={type ?? "button"}
      disabled={isDisabled}
      data-slot={`cards-stack-${source}`}
      className={twMerge(
        clsx(
          "inline-flex min-h-11 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
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

export function CardsStackPrevious(props: CardsStackControlProps) {
  return (
    <CardsStackControl
      aria-label="Previous card"
      direction={-1}
      source="previous"
      {...props}
    />
  );
}

export function CardsStackNext(props: CardsStackControlProps) {
  return (
    <CardsStackControl
      aria-label="Next card"
      direction={1}
      source="next"
      {...props}
    />
  );
}

// eslint-disable-next-line no-unused-vars
export type CardsStackStatusRenderer = (state: {
  value: number;
  count: number;
}) => ReactNode;

export interface CardsStackStatusProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?: ReactNode | CardsStackStatusRenderer;
}

export function CardsStackStatus({
  children,
  className,
  ...props
}: CardsStackStatusProps) {
  const { currentValue, count } = useCardsStackContext("CardsStackStatus");
  const content =
    typeof children === "function"
      ? children({ value: currentValue, count })
      : (children ?? `${count === 0 ? 0 : currentValue + 1} of ${count}`);

  return (
    <span
      {...props}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-slot="cards-stack-status"
      className={twMerge(clsx("text-sm tabular-nums", className))}
    >
      {content}
    </span>
  );
}

export type { CardsStackOrientation, CardsStackValueChangeDetail };
```

### @components/CardsStackSlider/client.ts

- Source: `src/components/CardsStackSlider/client.ts`
- SHA-256: `2a179d7a0c52410c0c53e9e162e3ae3aeb084e38cb981117f78427294f757b61`

```ts
"use client";

export * from "./index";
```

### @components/CardsStackSlider/index.ts

- Source: `src/components/CardsStackSlider/index.ts`
- SHA-256: `54bacaceed9b561eeba4d2f5fd10fb2431ffc1675dde01514bda287854184407`

```ts
export {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
  type CardsStackControlProps,
  type CardsStackFaceProps,
  type CardsStackItemProps,
  type CardsStackRootProps,
  type CardsStackStatusProps,
  type CardsStackStatusRenderer,
  type CardsStackValueChangeDetail,
  type CardsStackViewportProps,
} from "./CardsStackSlider";
export {
  getCardsStackRelativeProgress,
  normalizeCardsStackValue,
  useCardsStackSlider,
  type CardsStackChangeSource,
  type CardsStackDirection,
  type CardsStackOrientation,
  type CardsStackValueChangeArgs,
  type CardsStackValueChangeHandler,
  type UseCardsStackSliderOptions,
} from "./useCardsStackSlider";
```

### @components/CardsStackSlider/useCardsStackSlider.ts

- Source: `src/components/CardsStackSlider/useCardsStackSlider.ts`
- SHA-256: `cb1243d2f996c4c62c7726655458cb13a22a2b6cd55a583325659fa0dae4d018`

```ts
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";

export type CardsStackOrientation = "horizontal" | "vertical";
export type CardsStackDirection = -1 | 1;
export type CardsStackChangeSource =
  | "keyboard"
  | "next"
  | "pointer"
  | "previous";

export interface CardsStackValueChangeDetail {
  previousValue: number;
  direction: CardsStackDirection;
  source: CardsStackChangeSource;
}

export type CardsStackValueChangeArgs = [
  value: number,
  detail: CardsStackValueChangeDetail,
];
export type CardsStackValueChangeHandler = (
  // eslint-disable-next-line no-unused-vars
  ...args: CardsStackValueChangeArgs
) => void;

export interface UseCardsStackSliderOptions {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: CardsStackValueChangeHandler;
  loop?: boolean;
  orientation?: CardsStackOrientation;
  dragThreshold?: number;
  velocityThreshold?: number;
  touchRatio?: number;
  transitionDuration?: number;
  disabled?: boolean;
}

interface PointerSample {
  axis: number;
  time: number;
}

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startAxis: number;
  startCrossAxis: number;
  latestAxis: number;
  latestCrossAxis: number;
  extent: number;
  axisLocked: boolean;
  samples: PointerSample[];
}

interface PendingNavigation {
  from: number;
  to: number;
  direction: CardsStackDirection;
  source: CardsStackChangeSource;
}

interface MotionState {
  progress: number;
  isDragging: boolean;
  isAnimating: boolean;
  layerValue: number;
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-cards-stack-no-drag]";
const AXIS_LOCK_DISTANCE = 6;
const VELOCITY_SAMPLE_WINDOW_MS = 100;
const PROJECTED_MOTION_MS = 180;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function normalizeCardsStackValue(
  value: number,
  count: number,
  loop: boolean,
) {
  if (count <= 0) return 0;
  const integerValue = Number.isFinite(value) ? Math.trunc(value) : 0;

  if (!loop) return clamp(integerValue, 0, count - 1);
  return ((integerValue % count) + count) % count;
}

export function getCardsStackRelativeProgress(
  itemIndex: number,
  currentIndex: number,
  count: number,
  loop: boolean,
  motionProgress = 0,
) {
  if (count <= 0) return 0;
  const virtualPosition = currentIndex - motionProgress;
  let distance = itemIndex - virtualPosition;

  if (loop && count > 1) {
    const halfCount = count / 2;
    const originalDistance = distance;
    distance = ((((distance + halfCount) % count) + count) % count) - halfCount;
    if (distance === -halfCount && originalDistance > 0) {
      distance = halfCount;
    }
  }

  return distance;
}

function getCardsStackLayerValue(
  currentValue: number,
  progress: number,
  count: number,
  loop: boolean,
) {
  return normalizeCardsStackValue(
    Math.floor(currentValue - progress),
    count,
    loop,
  );
}

function getCardsStackSnapDelta(progress: number) {
  const slides = -progress;
  if (slides === 0) return 0;
  return Math.sign(slides) * Math.floor(Math.abs(slides) + 0.5);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getEventTime(event: ReactPointerEvent<HTMLDivElement>) {
  return event.timeStamp || performance.now();
}

export function useCardsStackSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  orientation = "horizontal",
  dragThreshold = 0.18,
  velocityThreshold = 0.45,
  touchRatio = 1.15,
  transitionDuration = 420,
  disabled = false,
}: UseCardsStackSliderOptions) {
  const safeCount = Math.max(0, Math.trunc(count));
  const effectiveLoop = loop && safeCount > 2;
  const isControlled = value !== undefined;
  const wasControlledRef = useRef(isControlled);
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeCardsStackValue(defaultValue, safeCount, effectiveLoop),
  );
  const currentValue = normalizeCardsStackValue(
    isControlled ? value : uncontrolledValue,
    safeCount,
    effectiveLoop,
  );
  const [motion, setMotion] = useState<MotionState>({
    progress: 0,
    isDragging: false,
    isAnimating: false,
    layerValue: currentValue,
  });

  const currentValueRef = useRef(currentValue);
  const optionsRef = useRef({
    count: safeCount,
    loop: effectiveLoop,
    orientation,
    dragThreshold,
    velocityThreshold,
    touchRatio,
    transitionDuration,
    disabled,
  });
  const onValueChangeRef = useRef(onValueChange);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const pendingProgressRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  currentValueRef.current = currentValue;
  optionsRef.current = {
    count: safeCount,
    loop: effectiveLoop,
    orientation,
    dragThreshold,
    velocityThreshold,
    touchRatio,
    transitionDuration,
    disabled,
  };
  onValueChangeRef.current = onValueChange;

  useEffect(() => {
    if (wasControlledRef.current !== isControlled) {
      console.warn(
        "CardsStackRoot should not switch between controlled and uncontrolled modes.",
      );
    }
  }, [isControlled]);

  useEffect(() => {
    if (isControlled) return;
    setUncontrolledValue((previousValue) =>
      normalizeCardsStackValue(previousValue, safeCount, effectiveLoop),
    );
  }, [effectiveLoop, isControlled, safeCount]);

  const cancelFrame = useCallback(() => {
    if (frameRef.current === null) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current === null) return;
    window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }, []);

  const completeNavigation = useCallback(() => {
    const pendingNavigation = pendingNavigationRef.current;
    if (!pendingNavigation) return;

    pendingNavigationRef.current = null;
    clearFallbackTimer();
    if (!wasControlledRef.current) {
      setUncontrolledValue(pendingNavigation.to);
    }
    setMotion({
      progress: 0,
      isDragging: false,
      isAnimating: false,
      layerValue: pendingNavigation.to,
    });
    if (pendingNavigation.to !== pendingNavigation.from) {
      onValueChangeRef.current?.(pendingNavigation.to, {
        previousValue: pendingNavigation.from,
        direction: pendingNavigation.direction,
        source: pendingNavigation.source,
      });
    }
  }, [clearFallbackTimer]);

  const canNavigate = useCallback((direction: CardsStackDirection) => {
    const {
      count: latestCount,
      loop: latestLoop,
      disabled: isDisabled,
    } = optionsRef.current;
    if (isDisabled || latestCount <= 1) return false;
    if (latestLoop) return true;

    const latestValue = currentValueRef.current;
    return direction === 1 ? latestValue < latestCount - 1 : latestValue > 0;
  }, []);

  const navigateBy = useCallback(
    (
      delta: number,
      source: CardsStackChangeSource,
      layerValue = currentValueRef.current,
    ) => {
      const integerDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
      if (integerDelta === 0) return false;
      const direction: CardsStackDirection = integerDelta > 0 ? 1 : -1;
      if (
        pointerSessionRef.current ||
        pendingNavigationRef.current ||
        !canNavigate(direction)
      ) {
        return false;
      }

      const {
        count: latestCount,
        loop: latestLoop,
        transitionDuration: latestDuration,
      } = optionsRef.current;
      const from = currentValueRef.current;
      const boundedDelta = latestLoop
        ? integerDelta
        : clamp(integerDelta, -from, latestCount - 1 - from);
      if (boundedDelta === 0) return false;
      const to = normalizeCardsStackValue(
        from + boundedDelta,
        latestCount,
        latestLoop,
      );
      pendingNavigationRef.current = { from, to, direction, source };
      setMotion({
        progress: -boundedDelta,
        isDragging: false,
        isAnimating: true,
        layerValue,
      });

      if (prefersReducedMotion()) {
        queueMicrotask(completeNavigation);
      } else {
        fallbackTimerRef.current = window.setTimeout(
          completeNavigation,
          latestDuration + 80,
        );
      }
      return true;
    },
    [canNavigate, completeNavigation],
  );

  const navigate = useCallback(
    (direction: CardsStackDirection, source: CardsStackChangeSource) =>
      navigateBy(direction, source),
    [navigateBy],
  );

  const snapBack = useCallback(() => {
    cancelFrame();
    pendingProgressRef.current = 0;
    setMotion({
      progress: 0,
      isDragging: false,
      isAnimating: false,
      layerValue: currentValueRef.current,
    });
  }, [cancelFrame]);

  const commitPendingProgress = useCallback(() => {
    frameRef.current = null;
    const { count: latestCount, loop: latestLoop } = optionsRef.current;
    setMotion({
      progress: pendingProgressRef.current,
      isDragging: true,
      isAnimating: false,
      layerValue: getCardsStackLayerValue(
        currentValueRef.current,
        pendingProgressRef.current,
        latestCount,
        latestLoop,
      ),
    });
  }, []);

  const scheduleProgress = useCallback(
    (progress: number) => {
      pendingProgressRef.current = progress;
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(commitPendingProgress);
    },
    [commitPendingProgress],
  );

  const releasePointerCapture = useCallback((session: PointerSession) => {
    if (
      typeof session.viewport.hasPointerCapture === "function" &&
      session.viewport.hasPointerCapture(session.pointerId)
    ) {
      session.viewport.releasePointerCapture(session.pointerId);
    }
  }, []);

  const cancelPointerSession = useCallback(
    (shouldSnapBack = true) => {
      const session = pointerSessionRef.current;
      pointerSessionRef.current = null;
      if (session) releasePointerCapture(session);
      if (shouldSnapBack) snapBack();
    },
    [releasePointerCapture, snapBack],
  );

  const getAxisValues = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) =>
      optionsRef.current.orientation === "horizontal"
        ? { axis: event.clientX, crossAxis: event.clientY }
        : { axis: event.clientY, crossAxis: event.clientX },
    [],
  );

  const getDragProgress = useCallback((session: PointerSession) => {
    const { loop: latestLoop, touchRatio: latestTouchRatio } =
      optionsRef.current;
    let progress =
      ((session.latestAxis - session.startAxis) / session.extent) *
      latestTouchRatio;

    if (!latestLoop) {
      const latestValue = currentValueRef.current;
      const minimumProgress = -(optionsRef.current.count - 1 - latestValue);
      const maximumProgress = latestValue;
      if (progress < minimumProgress) {
        progress =
          minimumProgress +
          clamp((progress - minimumProgress) * 0.28, -0.45, 0.45);
      } else if (progress > maximumProgress) {
        progress =
          maximumProgress +
          clamp((progress - maximumProgress) * 0.28, -0.45, 0.45);
      }
    }

    return progress;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target;
      if (
        optionsRef.current.disabled ||
        optionsRef.current.count <= 1 ||
        pendingNavigationRef.current ||
        pointerSessionRef.current ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        (target instanceof Element && target.closest(INTERACTIVE_SELECTOR))
      ) {
        return;
      }

      const { axis, crossAxis } = getAxisValues(event);
      const rect = event.currentTarget.getBoundingClientRect();
      const extent = Math.max(
        optionsRef.current.orientation === "horizontal"
          ? rect.width || event.currentTarget.clientWidth
          : rect.height || event.currentTarget.clientHeight,
        1,
      );
      const startTime = getEventTime(event);
      pointerSessionRef.current = {
        pointerId: event.pointerId,
        viewport: event.currentTarget,
        startAxis: axis,
        startCrossAxis: crossAxis,
        latestAxis: axis,
        latestCrossAxis: crossAxis,
        extent,
        axisLocked: false,
        samples: [{ axis, time: startTime }],
      };

      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      setMotion({
        progress: 0,
        isDragging: true,
        isAnimating: false,
        layerValue: currentValueRef.current,
      });
    },
    [getAxisValues],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const { axis, crossAxis } = getAxisValues(event);
      session.latestAxis = axis;
      session.latestCrossAxis = crossAxis;
      const axisDistance = Math.abs(axis - session.startAxis);
      const crossAxisDistance = Math.abs(crossAxis - session.startCrossAxis);

      if (!session.axisLocked) {
        if (Math.max(axisDistance, crossAxisDistance) < AXIS_LOCK_DISTANCE) {
          return;
        }
        if (crossAxisDistance > axisDistance) {
          cancelPointerSession();
          return;
        }
        session.axisLocked = true;
      }

      event.preventDefault();
      const sampleTime = getEventTime(event);
      session.samples.push({ axis, time: sampleTime });
      session.samples = session.samples.filter(
        (sample) => sampleTime - sample.time <= VELOCITY_SAMPLE_WINDOW_MS,
      );
      scheduleProgress(getDragProgress(session));
    },
    [cancelPointerSession, getAxisValues, getDragProgress, scheduleProgress],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const { axis, crossAxis } = getAxisValues(event);
      session.latestAxis = axis;
      session.latestCrossAxis = crossAxis;
      pointerSessionRef.current = null;
      releasePointerCapture(session);
      cancelFrame();

      if (event.type === "pointercancel" || !session.axisLocked) {
        snapBack();
        return;
      }

      const endTime = getEventTime(event);
      session.samples.push({ axis, time: endTime });
      const oldestSample =
        session.samples.find(
          (sample) => endTime - sample.time <= VELOCITY_SAMPLE_WINDOW_MS,
        ) ?? session.samples[0];
      const elapsed = Math.max(endTime - oldestSample.time, 1);
      const velocity = (axis - oldestSample.axis) / elapsed;
      const delta = axis - session.startAxis;
      const projectedDelta = delta + velocity * PROJECTED_MOTION_MS;
      const hasDistance =
        Math.abs(delta) >= session.extent * optionsRef.current.dragThreshold;
      const hasVelocity =
        Math.abs(velocity) >= optionsRef.current.velocityThreshold;
      const dragProgress = getDragProgress(session);
      const velocityProgress =
        (velocity / session.extent) *
        optionsRef.current.touchRatio *
        PROJECTED_MOTION_MS;
      const projectedProgress = dragProgress + clamp(velocityProgress, -1, 1);
      let navigationDelta = getCardsStackSnapDelta(projectedProgress);
      if (navigationDelta === 0 && (hasDistance || hasVelocity)) {
        navigationDelta = projectedDelta < 0 ? 1 : -1;
      }
      const layerValue = getCardsStackLayerValue(
        currentValueRef.current,
        dragProgress,
        optionsRef.current.count,
        optionsRef.current.loop,
      );

      if (
        (hasDistance || hasVelocity) &&
        navigateBy(navigationDelta, "pointer", layerValue)
      ) {
        return;
      }
      snapBack();
    },
    [
      cancelFrame,
      getAxisValues,
      getDragProgress,
      navigateBy,
      releasePointerCapture,
      snapBack,
    ],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (pointerSessionRef.current?.pointerId === event.pointerId) {
        cancelPointerSession();
      }
    },
    [cancelPointerSession],
  );

  const handleTransitionEnd = useCallback(
    (event: ReactTransitionEvent<HTMLDivElement>) => {
      if (
        event.currentTarget === event.target &&
        event.propertyName === "transform"
      ) {
        completeNavigation();
      }
    },
    [completeNavigation],
  );

  const topologyRef = useRef({
    currentValue,
    count: safeCount,
    loop: effectiveLoop,
    orientation,
  });

  useEffect(() => {
    const previousTopology = topologyRef.current;
    const topologyChanged =
      previousTopology.currentValue !== currentValue ||
      previousTopology.count !== safeCount ||
      previousTopology.loop !== effectiveLoop ||
      previousTopology.orientation !== orientation;
    topologyRef.current = {
      currentValue,
      count: safeCount,
      loop: effectiveLoop,
      orientation,
    };

    if (
      !topologyChanged ||
      (!pendingNavigationRef.current && !pointerSessionRef.current)
    ) {
      return;
    }

    pendingNavigationRef.current = null;
    clearFallbackTimer();
    cancelPointerSession(false);
    cancelFrame();
    pendingProgressRef.current = 0;
    setMotion({
      progress: 0,
      isDragging: false,
      isAnimating: false,
      layerValue: currentValue,
    });
  }, [
    cancelFrame,
    cancelPointerSession,
    clearFallbackTimer,
    currentValue,
    effectiveLoop,
    orientation,
    safeCount,
  ]);

  useEffect(() => {
    return () => {
      cancelFrame();
      clearFallbackTimer();
      pointerSessionRef.current = null;
      pendingNavigationRef.current = null;
    };
  }, [cancelFrame, clearFallbackTimer]);

  return {
    currentValue,
    motionProgress: motion.progress,
    isDragging: motion.isDragging,
    isAnimating: motion.isAnimating,
    topLayerValue:
      motion.isDragging || motion.isAnimating
        ? motion.layerValue
        : currentValue,
    canNavigate,
    navigate,
    transitionDuration,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleLostPointerCapture,
    handleTransitionEnd,
  };
}
```

## React/Vite example

```tsx
import {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
} from "../components/CardsStackSlider";

const cards = [
  { id: "aurora", title: "Aurora", details: "Northern lights over the coast." },
  { id: "forest", title: "Forest", details: "A quiet trail through old pines." },
  { id: "ocean", title: "Ocean", details: "Evening waves beneath a clear sky." },
] as const;

export default function CardsStackSliderExample() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <CardsStackRoot count={cards.length} aria-label="Featured destinations">
        <CardsStackViewport>
          {cards.map((card, index) => (
            <CardsStackItem
              key={card.id}
              index={index}
              aria-label={`${card.title}: ${card.details}`}
            >
              <CardsStackFront className="grid place-items-center bg-slate-950 p-8 text-white">
                <h2 className="text-3xl font-semibold">{card.title}</h2>
              </CardsStackFront>
              <CardsStackBack className="grid place-items-center bg-indigo-700 p-8 text-white">
                <p>{card.details}</p>
              </CardsStackBack>
            </CardsStackItem>
          ))}
        </CardsStackViewport>
        <div className="flex items-center gap-4">
          <CardsStackPrevious className="border border-slate-300 bg-white px-4">Previous</CardsStackPrevious>
          <CardsStackStatus className="min-w-14 text-center" />
          <CardsStackNext className="border border-slate-300 bg-white px-4">Next</CardsStackNext>
        </div>
      </CardsStackRoot>
    </main>
  );
}
```

## Next.js App Router examples

```tsx
"use client";

import { useState } from "react";
import {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
} from "../components/CardsStackSlider/client";

export interface SerializableCard {
  id: string;
  title: string;
  details: string;
}

export interface CardsStackGalleryProps {
  cards: readonly SerializableCard[];
}

export function CardsStackGallery({ cards }: CardsStackGalleryProps) {
  const [value, setValue] = useState(0);

  return (
    <CardsStackRoot
      count={cards.length}
      value={value}
      onValueChange={(nextValue) => setValue(nextValue)}
      aria-label="Featured destinations"
    >
      <CardsStackViewport>
        {cards.map((card, index) => (
          <CardsStackItem
            key={card.id}
            index={index}
            aria-label={`${card.title}: ${card.details}`}
          >
            <CardsStackFront className="grid place-items-center bg-slate-950 p-8 text-white">
              <h2 className="text-3xl font-semibold">{card.title}</h2>
            </CardsStackFront>
            <CardsStackBack className="grid place-items-center bg-indigo-700 p-8 text-white">
              <p>{card.details}</p>
            </CardsStackBack>
          </CardsStackItem>
        ))}
      </CardsStackViewport>
      <div className="flex items-center gap-4">
        <CardsStackPrevious className="border border-slate-300 bg-white px-4">Previous</CardsStackPrevious>
        <CardsStackStatus className="min-w-14 text-center" />
        <CardsStackNext className="border border-slate-300 bg-white px-4">Next</CardsStackNext>
      </div>
    </CardsStackRoot>
  );
}
```

```tsx
import {
  CardsStackGallery,
  type SerializableCard,
} from "./client-wrapper";

const cards: readonly SerializableCard[] = [
  { id: "aurora", title: "Aurora", details: "Northern lights over the coast." },
  { id: "forest", title: "Forest", details: "A quiet trail through old pines." },
  { id: "ocean", title: "Ocean", details: "Evening waves beneath a clear sky." },
];

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <CardsStackGallery cards={cards} />
    </main>
  );
}
```

## Required verification

- Typecheck and production-build the consuming project.
- Confirm the selected Tailwind major emits the representative utilities from the manifest.
- For Next.js, render production HTML, hydrate without console errors, and exercise one interaction.
- Recompute every file and artifact SHA-256 before using the result.
