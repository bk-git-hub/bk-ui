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
    const flip = firstStepProgress * 180 + trailProgress * 4;
    const tilt = Math.min(clampedProgress, visibleCount) * 1.2;
    transform =
      orientation === "horizontal"
        ? `translate3d(${axisOffset}%, ${trailProgress * 5}px, ${depth}px) rotateY(${flip}deg) rotateZ(${tilt}deg) scale(${scale})`
        : `translate3d(${trailProgress * 5}px, ${axisOffset}%, ${depth}px) rotateX(${-flip}deg) rotateZ(${-tilt}deg) scale(${scale})`;
  } else {
    const angle = firstStepProgress * 14 + trailProgress * 5;
    const tilt = Math.min(clampedProgress, visibleCount) * 1.2;
    transform =
      orientation === "horizontal"
        ? `translate3d(${axisOffset}%, ${-trailProgress * 5}px, ${depth}px) rotateY(${angle}deg) rotateZ(${-tilt}deg) scale(${scale})`
        : `translate3d(${-trailProgress * 5}px, ${axisOffset}%, ${depth}px) rotateX(${-angle}deg) rotateZ(${tilt}deg) scale(${scale})`;
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
        isTopLayer && context.isAnimating
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
