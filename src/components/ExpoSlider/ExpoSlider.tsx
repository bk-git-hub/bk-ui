/* eslint-disable no-unused-vars -- Public renderer parameter names document the component contract. */

import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  getExpoSliderRelativeProgress,
  useExpoSlider,
  type ExpoSliderOrientation,
  type ExpoSliderValueChangeHandler,
} from "./useExpoSlider";

type ExpoSliderApi = ReturnType<typeof useExpoSlider>;

interface ExpoSliderContextValue
  extends Pick<
    ExpoSliderApi,
    | "canNavigate"
    | "completeAnimation"
    | "currentValue"
    | "goTo"
    | "handleLostPointerCapture"
    | "handlePointerCancel"
    | "handlePointerDown"
    | "handlePointerEnd"
    | "handlePointerLeave"
    | "handlePointerMove"
    | "isAnimating"
    | "isDragging"
    | "motionProgress"
    | "navigate"
    | "transitionDuration"
  > {
  count: number;
  disabled: boolean;
  gap: number;
  grayscale: boolean;
  loop: boolean;
  mediaScaleFactor: number;
  orientation: ExpoSliderOrientation;
  parallax: number;
  rotation: number;
  scaleFactor: number;
  slidesPerView: number;
}

interface ExpoSliderSlideContextValue {
  isCurrent: boolean;
  progress: number;
}

const ExpoSliderContext = createContext<ExpoSliderContextValue | null>(null);
const ExpoSliderSlideContext =
  createContext<ExpoSliderSlideContextValue | null>(null);

function useExpoSliderContext(componentName: string) {
  const context = useContext(ExpoSliderContext);
  if (!context) {
    throw new Error(`${componentName} must be rendered inside ExpoSliderRoot.`);
  }
  return context;
}

function useExpoSliderSlideContext(componentName: string) {
  const context = useContext(ExpoSliderSlideContext);
  if (!context) {
    throw new Error(
      `${componentName} must be rendered inside ExpoSliderSlide.`,
    );
  }
  return context;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getFiniteValue(
  value: number,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  return Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback;
}

export interface ExpoSliderRootProps
  extends Omit<ComponentPropsWithRef<"section">, "defaultValue" | "onChange"> {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: ExpoSliderValueChangeHandler;
  loop?: boolean;
  orientation?: ExpoSliderOrientation;
  slidesPerView?: number;
  gap?: number;
  scaleFactor?: number;
  mediaScaleFactor?: number;
  parallax?: number;
  rotation?: number;
  grayscale?: boolean;
  dragThreshold?: number;
  velocityThreshold?: number;
  transitionDuration?: number;
  disabled?: boolean;
}

export function ExpoSliderRoot({
  count,
  value,
  defaultValue,
  onValueChange,
  loop = true,
  orientation = "horizontal",
  slidesPerView = 1.5,
  gap = 24,
  scaleFactor = 1.25,
  mediaScaleFactor = 1.125,
  parallax = 50,
  rotation = 0,
  grayscale = true,
  dragThreshold,
  velocityThreshold,
  transitionDuration,
  disabled = false,
  className,
  "aria-disabled": ariaDisabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: ExpoSliderRootProps) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  const effectiveLoop = loop && safeCount > 1;
  const safeSlidesPerView = getFiniteValue(slidesPerView, 1.5, 1, 3);
  const safeGap = getFiniteValue(gap, 24, 0, 160);
  const safeScaleFactor = getFiniteValue(scaleFactor, 1.25, 1, 1.75);
  const safeMediaScaleFactor = getFiniteValue(mediaScaleFactor, 1.125, 1, 1.5);
  const safeParallax = getFiniteValue(parallax, 50, 0, 100);
  const safeRotation = getFiniteValue(rotation, 0, -45, 45);
  const slider = useExpoSlider({
    count: safeCount,
    value,
    defaultValue,
    onValueChange,
    loop: effectiveLoop,
    orientation,
    dragThreshold,
    velocityThreshold,
    transitionDuration,
    disabled,
  });
  const contextValue = useMemo<ExpoSliderContextValue>(
    () => ({
      count: safeCount,
      currentValue: slider.currentValue,
      motionProgress: slider.motionProgress,
      isDragging: slider.isDragging,
      isAnimating: slider.isAnimating,
      transitionDuration: slider.transitionDuration,
      canNavigate: slider.canNavigate,
      navigate: slider.navigate,
      goTo: slider.goTo,
      completeAnimation: slider.completeAnimation,
      handlePointerDown: slider.handlePointerDown,
      handlePointerMove: slider.handlePointerMove,
      handlePointerEnd: slider.handlePointerEnd,
      handlePointerLeave: slider.handlePointerLeave,
      handlePointerCancel: slider.handlePointerCancel,
      handleLostPointerCapture: slider.handleLostPointerCapture,
      loop: effectiveLoop,
      orientation,
      slidesPerView: safeSlidesPerView,
      gap: safeGap,
      scaleFactor: safeScaleFactor,
      mediaScaleFactor: safeMediaScaleFactor,
      parallax: safeParallax,
      rotation: safeRotation,
      grayscale,
      disabled,
    }),
    [
      disabled,
      effectiveLoop,
      grayscale,
      orientation,
      safeCount,
      safeGap,
      safeMediaScaleFactor,
      safeParallax,
      safeRotation,
      safeScaleFactor,
      safeSlidesPerView,
      slider.canNavigate,
      slider.completeAnimation,
      slider.currentValue,
      slider.goTo,
      slider.handleLostPointerCapture,
      slider.handlePointerCancel,
      slider.handlePointerDown,
      slider.handlePointerEnd,
      slider.handlePointerLeave,
      slider.handlePointerMove,
      slider.isAnimating,
      slider.isDragging,
      slider.motionProgress,
      slider.navigate,
      slider.transitionDuration,
    ],
  );

  return (
    <ExpoSliderContext.Provider value={contextValue}>
      <section
        {...props}
        aria-disabled={disabled ? true : ariaDisabled}
        aria-label={ariaLabelledby ? ariaLabel : (ariaLabel ?? "Expo gallery")}
        aria-labelledby={ariaLabelledby}
        aria-roledescription="carousel"
        data-animating={slider.isAnimating ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-dragging={slider.isDragging ? "" : undefined}
        data-orientation={orientation}
        data-slot="expo-slider-root"
        className={twMerge(
          clsx("flex w-full flex-col items-center gap-5", className),
        )}
      />
    </ExpoSliderContext.Provider>
  );
}

export type ExpoSliderViewportProps = ComponentPropsWithRef<"div">;

export function ExpoSliderViewport({
  className,
  tabIndex,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerLeave,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...props
}: ExpoSliderViewportProps) {
  const context = useExpoSliderContext("ExpoSliderViewport");

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
    } else if (event.key === "Home") {
      event.preventDefault();
      context.goTo(0, "keyboard");
    } else if (event.key === "End") {
      event.preventDefault();
      context.goTo(context.count - 1, "keyboard");
    }
  };

  return (
    <div
      {...props}
      role="group"
      aria-disabled={context.disabled ? true : props["aria-disabled"]}
      aria-label={props["aria-label"] ?? "Slide navigation"}
      tabIndex={context.disabled ? -1 : (tabIndex ?? 0)}
      data-dragging={context.isDragging ? "" : undefined}
      data-orientation={context.orientation}
      data-slot="expo-slider-viewport"
      className={twMerge(
        clsx(
          "relative isolate aspect-[16/10] w-full overflow-hidden outline-none select-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
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
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        context.handlePointerLeave(event);
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

export interface ExpoSliderSlideProps extends ComponentPropsWithRef<"div"> {
  index: number;
}

export function ExpoSliderSlide({
  index,
  className,
  style,
  onTransitionEnd,
  "aria-label": ariaLabel,
  ...props
}: ExpoSliderSlideProps) {
  const context = useExpoSliderContext("ExpoSliderSlide");
  const safeIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  const isCurrent = safeIndex === context.currentValue;
  const progress = getExpoSliderRelativeProgress(
    safeIndex,
    context.currentValue,
    context.count,
    context.loop,
    context.motionProgress,
  );
  const visibleProgress = clamp(progress, -3, 3);
  const axisSize = 100 / context.slidesPerView;
  const positionTransform =
    context.orientation === "horizontal"
      ? `translate(-50%, -50%) translateX(calc(${visibleProgress * 100}% + ${visibleProgress * context.gap}px))`
      : `translate(-50%, -50%) translateY(calc(${visibleProgress * 100}% + ${visibleProgress * context.gap}px))`;
  const slideStyle: CSSProperties = {
    ...style,
    width: context.orientation === "horizontal" ? `${axisSize}%` : style?.width,
    height: context.orientation === "vertical" ? `${axisSize}%` : style?.height,
    opacity: Math.abs(progress) > 2.5 ? 0 : 1,
    pointerEvents: isCurrent ? "auto" : "none",
    transform: positionTransform,
    transitionDuration: context.isDragging
      ? "0ms"
      : `${context.transitionDuration}ms`,
    zIndex: 100 - Math.round(Math.abs(progress) * 10),
  };
  const slideContextValue = useMemo<ExpoSliderSlideContextValue>(
    () => ({ isCurrent, progress }),
    [isCurrent, progress],
  );

  return (
    <ExpoSliderSlideContext.Provider value={slideContextValue}>
      <div
        {...props}
        role="group"
        aria-hidden={!isCurrent}
        aria-label={
          ariaLabel ??
          `Slide ${Math.min(Math.max(safeIndex + 1, 1), context.count)} of ${context.count}`
        }
        aria-roledescription="slide"
        inert={!isCurrent}
        data-active={isCurrent ? "" : undefined}
        data-index={safeIndex}
        data-progress={progress.toFixed(3)}
        data-slot="expo-slider-slide"
        data-state={isCurrent ? "active" : progress < 0 ? "previous" : "next"}
        className={twMerge(
          clsx(
            "absolute top-1/2 left-1/2 [transition-property:transform,opacity] motion-reduce:transition-none",
            context.orientation === "horizontal" ? "h-auto" : "w-auto",
            !context.isDragging &&
              "ease-[cubic-bezier(0.22,0.75,0.18,1)] will-change-transform",
            className,
          ),
        )}
        style={slideStyle}
        onTransitionEnd={(event) => {
          onTransitionEnd?.(event);
          if (
            !event.defaultPrevented &&
            isCurrent &&
            event.currentTarget === event.target &&
            event.propertyName === "transform"
          ) {
            context.completeAnimation();
          }
        }}
      />
    </ExpoSliderSlideContext.Provider>
  );
}

export type ExpoSliderFrameProps = ComponentPropsWithRef<"div">;

export function ExpoSliderFrame({
  className,
  style,
  ...props
}: ExpoSliderFrameProps) {
  const context = useExpoSliderContext("ExpoSliderFrame");
  const { progress } = useExpoSliderSlideContext("ExpoSliderFrame");
  const effectProgress = clamp(progress, -1, 1);
  const distance = Math.abs(effectProgress);
  const scale = 1 + (context.scaleFactor - 1) * distance;
  const rotation = -context.rotation * effectProgress;
  const transformOrigin =
    effectProgress < 0
      ? context.orientation === "horizontal"
        ? "right center"
        : "center bottom"
      : effectProgress > 0
        ? context.orientation === "horizontal"
          ? "left center"
          : "center top"
        : "center center";
  const transform =
    context.orientation === "horizontal"
      ? `scale(${scale}) rotateY(${rotation}deg)`
      : `scale(${scale}) rotateX(${-rotation}deg)`;

  return (
    <div
      {...props}
      data-slot="expo-slider-frame"
      className={twMerge(
        clsx(
          "relative overflow-hidden rounded-2xl bg-neutral-900 [transition-property:transform] [transform-style:preserve-3d] motion-reduce:transition-none sm:rounded-3xl",
          context.orientation === "horizontal"
            ? "aspect-video w-full"
            : "aspect-[9/16] h-full",
          !context.isDragging &&
            "ease-[cubic-bezier(0.22,0.75,0.18,1)] will-change-transform",
          className,
        ),
      )}
      style={{
        ...style,
        transform,
        transformOrigin,
        transitionDuration: context.isDragging
          ? "0ms"
          : `${context.transitionDuration}ms`,
      }}
    />
  );
}

export interface ExpoSliderImageProps
  extends Omit<ComponentPropsWithRef<"img">, "alt"> {
  alt: string;
  parallax?: number;
  scaleFactor?: number;
  grayscale?: boolean;
}

export function ExpoSliderImage({
  alt,
  parallax,
  scaleFactor,
  grayscale,
  className,
  style,
  draggable,
  ...props
}: ExpoSliderImageProps) {
  const context = useExpoSliderContext("ExpoSliderImage");
  const { progress } = useExpoSliderSlideContext("ExpoSliderImage");
  const effectProgress = clamp(progress, -1, 1);
  const distance = Math.abs(effectProgress);
  const safeParallax = getFiniteValue(
    parallax ?? context.parallax,
    context.parallax,
    0,
    100,
  );
  const safeScaleFactor = getFiniteValue(
    scaleFactor ?? context.mediaScaleFactor,
    context.mediaScaleFactor,
    1,
    1.5,
  );
  const parallaxOffset = -effectProgress * (safeParallax / 4);
  const mediaScale = 1 + (safeScaleFactor - 1) * distance;
  const shouldGrayscale = grayscale ?? context.grayscale;
  const transform =
    context.orientation === "horizontal"
      ? `translate3d(${parallaxOffset}%, 0, 0) scale(${mediaScale})`
      : `translate3d(0, ${parallaxOffset}%, 0) scale(${mediaScale})`;

  return (
    <span
      data-slot="expo-slider-image-effect"
      className={twMerge(
        clsx(
          "pointer-events-none absolute block [transition-property:transform,filter] select-none motion-reduce:transition-none",
          context.orientation === "horizontal"
            ? "top-0 -left-[12.5%] h-full w-[125%]"
            : "-top-[12.5%] left-0 h-[125%] w-full",
          !context.isDragging &&
            "ease-[cubic-bezier(0.22,0.75,0.18,1)] will-change-transform",
        ),
      )}
      style={{
        filter: shouldGrayscale
          ? `grayscale(${Math.round(distance * 100)}%)`
          : undefined,
        transform,
        transitionDuration: context.isDragging
          ? "0ms"
          : `${context.transitionDuration}ms`,
      }}
    >
      <img
        {...props}
        alt={alt}
        draggable={draggable ?? false}
        data-slot="expo-slider-image"
        className={twMerge(
          clsx(
            "pointer-events-none h-full w-full max-w-none object-cover select-none",
            className,
          ),
        )}
        style={style}
      />
    </span>
  );
}

export interface ExpoSliderContentProps extends ComponentPropsWithRef<"div"> {
  parallax?: number;
}

export function ExpoSliderContent({
  parallax = 100,
  className,
  style,
  ...props
}: ExpoSliderContentProps) {
  const context = useExpoSliderContext("ExpoSliderContent");
  const { progress } = useExpoSliderSlideContext("ExpoSliderContent");
  const effectProgress = clamp(progress, -1, 1);
  const safeParallax = getFiniteValue(parallax, 100, 0, 160);
  const translation = -effectProgress * safeParallax;
  const transform =
    context.orientation === "horizontal"
      ? `translate3d(${translation}%, 0, 0)`
      : `translate3d(0, ${translation}%, 0)`;

  return (
    <div
      {...props}
      data-slot="expo-slider-content"
      className={twMerge(
        clsx(
          "absolute inset-0 [transition-property:transform,opacity] motion-reduce:transition-none",
          !context.isDragging &&
            "ease-[cubic-bezier(0.22,0.75,0.18,1)] will-change-transform",
          className,
        ),
      )}
      style={{
        ...style,
        opacity: Math.max(0, 1 - Math.abs(effectProgress) * 2),
        transform,
        transitionDuration: context.isDragging
          ? "0ms"
          : `${context.transitionDuration}ms`,
      }}
    />
  );
}

export type ExpoSliderControlProps = ComponentPropsWithRef<"button">;

export function ExpoSliderPrevious({
  className,
  disabled,
  type = "button",
  onClick,
  ...props
}: ExpoSliderControlProps) {
  const context = useExpoSliderContext("ExpoSliderPrevious");
  const isDisabled =
    disabled ||
    context.disabled ||
    context.isAnimating ||
    !context.canNavigate(-1);

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      data-slot="expo-slider-previous"
      className={twMerge(
        clsx("disabled:pointer-events-none disabled:opacity-40", className),
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.navigate(-1, "previous");
      }}
    />
  );
}

export function ExpoSliderNext({
  className,
  disabled,
  type = "button",
  onClick,
  ...props
}: ExpoSliderControlProps) {
  const context = useExpoSliderContext("ExpoSliderNext");
  const isDisabled =
    disabled ||
    context.disabled ||
    context.isAnimating ||
    !context.canNavigate(1);

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      data-slot="expo-slider-next"
      className={twMerge(
        clsx("disabled:pointer-events-none disabled:opacity-40", className),
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.navigate(1, "next");
      }}
    />
  );
}

export interface ExpoSliderPaginationRenderArgs {
  index: number;
  isActive: boolean;
}

export type ExpoSliderPaginationRenderer = (
  args: ExpoSliderPaginationRenderArgs,
) => ReactNode;

export interface ExpoSliderPaginationProps
  extends ComponentPropsWithRef<"div"> {
  buttonClassName?: string;
  activeButtonClassName?: string;
  getItemLabel?: (index: number) => string;
  renderItem?: ExpoSliderPaginationRenderer;
}

export function ExpoSliderPagination({
  buttonClassName,
  activeButtonClassName,
  getItemLabel,
  renderItem,
  className,
  ...props
}: ExpoSliderPaginationProps) {
  const context = useExpoSliderContext("ExpoSliderPagination");

  return (
    <div
      {...props}
      role="group"
      aria-label={props["aria-label"] ?? "Choose a slide"}
      data-slot="expo-slider-pagination"
      className={twMerge(clsx("flex items-center gap-2", className))}
    >
      {Array.from({ length: context.count }, (_, index) => {
        const isActive = index === context.currentValue;
        return (
          <button
            key={index}
            type="button"
            aria-current={isActive ? "true" : undefined}
            aria-label={
              getItemLabel?.(index) ??
              `Go to slide ${index + 1} of ${context.count}`
            }
            disabled={context.disabled || context.isAnimating || isActive}
            data-active={isActive ? "" : undefined}
            data-index={index}
            data-slot="expo-slider-pagination-item"
            className={twMerge(
              clsx(
                "size-2.5 rounded-full bg-current opacity-35 transition-[width,opacity] disabled:cursor-default motion-reduce:transition-none",
                isActive && "w-8 opacity-100",
                buttonClassName,
                isActive && activeButtonClassName,
              ),
            )}
            onClick={() => context.goTo(index, "pagination")}
          >
            {renderItem?.({ index, isActive })}
          </button>
        );
      })}
    </div>
  );
}

export type ExpoSliderStatusRenderer = (args: {
  current: number;
  count: number;
}) => ReactNode;

export interface ExpoSliderStatusProps
  extends Omit<ComponentPropsWithRef<"p">, "children"> {
  children?: ReactNode | ExpoSliderStatusRenderer;
}

export function ExpoSliderStatus({
  children,
  className,
  ...props
}: ExpoSliderStatusProps) {
  const context = useExpoSliderContext("ExpoSliderStatus");
  const current = context.count === 0 ? 0 : context.currentValue + 1;
  const content =
    typeof children === "function"
      ? children({ current, count: context.count })
      : (children ??
        `${String(current).padStart(2, "0")} / ${String(context.count).padStart(2, "0")}`);

  return (
    <p
      {...props}
      aria-live="polite"
      aria-atomic="true"
      data-slot="expo-slider-status"
      className={twMerge(clsx("tabular-nums", className))}
    >
      {content}
    </p>
  );
}
