/* eslint-disable no-unused-vars -- Base ESLint treats type-only callback parameters as runtime bindings. */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ImgHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useShutterSlider,
  type ShutterSliderChangeSource,
  type ShutterSliderDirection,
  type ShutterSliderTransition,
  type ShutterSliderValueChangeDetail,
} from "./useShutterSlider";

export type ShutterSliderOrientation = "horizontal" | "vertical";

export interface ShutterSliderImage {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  crossOrigin?: ImgHTMLAttributes<HTMLImageElement>["crossOrigin"];
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
  fit?: "contain" | "cover";
  position?: CSSProperties["objectPosition"];
}

interface ShutterSliderContextValue {
  slides: readonly ShutterSliderImage[];
  count: number;
  currentValue: number;
  transition: ShutterSliderTransition | null;
  isTransitionRunning: boolean;
  isDragging: boolean;
  loop: boolean;
  disabled: boolean;
  stripCount: number;
  orientation: ShutterSliderOrientation;
  transitionDuration: number;
  stagger: number;
  prefersReducedMotion: boolean;
  canNavigate: (direction: ShutterSliderDirection) => boolean;
  navigate: (
    direction: ShutterSliderDirection,
    source: ShutterSliderChangeSource,
  ) => boolean;
  goTo: (
    value: number,
    source: ShutterSliderChangeSource,
    direction?: ShutterSliderDirection,
  ) => boolean;
  completeTransition: ReturnType<typeof useShutterSlider>["completeTransition"];
  handlePointerDown: ReturnType<typeof useShutterSlider>["handlePointerDown"];
  handlePointerMove: ReturnType<typeof useShutterSlider>["handlePointerMove"];
  handlePointerEnd: ReturnType<typeof useShutterSlider>["handlePointerEnd"];
  handlePointerCancel: ReturnType<
    typeof useShutterSlider
  >["handlePointerCancel"];
  handleLostPointerCapture: ReturnType<
    typeof useShutterSlider
  >["handleLostPointerCapture"];
}

const ShutterSliderContext = createContext<ShutterSliderContextValue | null>(
  null,
);

function useShutterSliderContext(componentName: string) {
  const context = useContext(ShutterSliderContext);
  if (!context) {
    throw new Error(
      `${componentName} must be rendered inside ShutterSliderRoot.`,
    );
  }
  return context;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function getSlideState(
  index: number,
  currentValue: number,
  transition: ShutterSliderTransition | null,
) {
  if (transition?.to === index) return "incoming" as const;
  if (transition?.from === index) return "outgoing" as const;
  if (currentValue === index) return "active" as const;
  return "inactive" as const;
}

export interface ShutterSliderRootProps
  extends Omit<ComponentPropsWithRef<"section">, "defaultValue" | "onChange"> {
  slides: readonly ShutterSliderImage[];
  value?: number;
  defaultValue?: number;
  onValueChange?: (
    value: number,
    detail: ShutterSliderValueChangeDetail,
  ) => void;
  loop?: boolean;
  stripCount?: number;
  orientation?: ShutterSliderOrientation;
  transitionDuration?: number;
  stagger?: number;
  dragThreshold?: number;
  disabled?: boolean;
}

export function ShutterSliderRoot({
  slides,
  value,
  defaultValue,
  onValueChange,
  loop = true,
  stripCount = 5,
  orientation = "vertical",
  transitionDuration = 900,
  stagger = 0,
  dragThreshold,
  disabled = false,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: ShutterSliderRootProps) {
  const safeStripCount = clamp(
    Number.isFinite(stripCount) ? Math.trunc(stripCount) : 5,
    2,
    16,
  );
  const safeTransitionDuration = clamp(
    Number.isFinite(transitionDuration) ? transitionDuration : 900,
    0,
    5000,
  );
  const safeStagger = clamp(Number.isFinite(stagger) ? stagger : 0, 0, 500);
  const prefersReducedMotion = usePrefersReducedMotion();
  const slider = useShutterSlider({
    count: slides.length,
    value,
    defaultValue,
    onValueChange,
    loop,
    disabled,
    dragThreshold,
  });
  const [runningTransitionId, setRunningTransitionId] = useState<number | null>(
    null,
  );
  const completeTransitionRef = useRef(slider.completeTransition);
  completeTransitionRef.current = slider.completeTransition;
  const transitionId = slider.transition?.id ?? null;
  const totalTransitionDuration =
    safeTransitionDuration + safeStagger * (safeStripCount - 1);

  useEffect(() => {
    if (transitionId === null) {
      setRunningTransitionId(null);
      return;
    }

    if (prefersReducedMotion || safeTransitionDuration === 0) {
      completeTransitionRef.current(transitionId);
      return;
    }

    const requestFrame =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 16);
    const cancelFrame =
      typeof window.cancelAnimationFrame === "function"
        ? window.cancelAnimationFrame.bind(window)
        : window.clearTimeout.bind(window);
    let secondFrameId: number | null = null;
    const firstFrameId = requestFrame(() => {
      secondFrameId = requestFrame(() => {
        setRunningTransitionId(transitionId);
      });
    });
    const timeoutId = window.setTimeout(
      () => completeTransitionRef.current(transitionId),
      totalTransitionDuration + 100,
    );

    return () => {
      cancelFrame(firstFrameId);
      if (secondFrameId !== null) cancelFrame(secondFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [
    prefersReducedMotion,
    safeTransitionDuration,
    totalTransitionDuration,
    transitionId,
  ]);

  const contextValue = useMemo<ShutterSliderContextValue>(
    () => ({
      slides,
      count: slides.length,
      currentValue: slider.currentValue,
      transition: slider.transition,
      isTransitionRunning:
        slider.transition !== null &&
        runningTransitionId === slider.transition.id,
      isDragging: slider.isDragging,
      loop,
      disabled,
      stripCount: safeStripCount,
      orientation,
      transitionDuration: safeTransitionDuration,
      stagger: safeStagger,
      prefersReducedMotion,
      canNavigate: slider.canNavigate,
      navigate: slider.navigate,
      goTo: slider.goTo,
      completeTransition: slider.completeTransition,
      handlePointerDown: slider.handlePointerDown,
      handlePointerMove: slider.handlePointerMove,
      handlePointerEnd: slider.handlePointerEnd,
      handlePointerCancel: slider.handlePointerCancel,
      handleLostPointerCapture: slider.handleLostPointerCapture,
    }),
    [
      disabled,
      loop,
      orientation,
      prefersReducedMotion,
      runningTransitionId,
      safeStagger,
      safeStripCount,
      safeTransitionDuration,
      slider,
      slides,
    ],
  );

  return (
    <ShutterSliderContext.Provider value={contextValue}>
      <section
        {...props}
        aria-label={ariaLabelledby ? undefined : (ariaLabel ?? "Image slider")}
        aria-labelledby={ariaLabelledby}
        aria-roledescription="carousel"
        data-disabled={disabled ? "" : undefined}
        data-dragging={slider.isDragging ? "" : undefined}
        data-orientation={orientation}
        data-reduced-motion={prefersReducedMotion ? "" : undefined}
        data-slot="shutter-slider-root"
        data-state={
          slider.transition === null
            ? "idle"
            : runningTransitionId === slider.transition.id
              ? "animating"
              : "primed"
        }
        data-strip-count={safeStripCount}
        data-transitioning={slider.transition ? "" : undefined}
        className={twMerge(clsx("relative isolate w-full", className))}
      >
        {children}
      </section>
    </ShutterSliderContext.Provider>
  );
}

function SliderImage({
  image,
  className,
  dataSlot,
  style,
}: {
  image: ShutterSliderImage;
  className?: string;
  dataSlot?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.sizes}
      crossOrigin={image.crossOrigin}
      referrerPolicy={image.referrerPolicy}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading="eager"
      data-slot={dataSlot}
      className={twMerge(
        clsx(
          "pointer-events-none absolute max-w-none select-none",
          image.fit === "contain" ? "object-contain" : "object-cover",
          className,
        ),
      )}
      style={{ objectPosition: image.position, ...style }}
    />
  );
}

function ShutterStrips({
  image,
  transition,
}: {
  image: ShutterSliderImage;
  transition: ShutterSliderTransition;
}) {
  const context = useShutterSliderContext("ShutterStrips");
  const {
    isTransitionRunning,
    orientation,
    prefersReducedMotion,
    stagger,
    stripCount,
    transitionDuration,
  } = context;
  const strips = Array.from({ length: stripCount }, (_, index) => index);

  return (
    <div
      aria-hidden="true"
      data-direction={transition.direction}
      data-orientation={orientation}
      data-running={isTransitionRunning ? "" : undefined}
      data-slot="shutter-slider-strips"
      className="pointer-events-none absolute inset-0 z-10 grid overflow-hidden"
      style={
        orientation === "vertical"
          ? { gridTemplateColumns: `repeat(${stripCount}, minmax(0, 1fr))` }
          : { gridTemplateRows: `repeat(${stripCount}, minmax(0, 1fr))` }
      }
    >
      {strips.map((index) => {
        const orderedIndex =
          transition.direction === 1 ? index : stripCount - 1 - index;
        const delay = prefersReducedMotion ? 0 : orderedIndex * stagger;
        const alternatingDirection = index % 2 === 0 ? 1 : -1;
        const travel = 104 + (index % 3) * 12;
        const signedTravel =
          travel * alternatingDirection * transition.direction;
        const transform = isTransitionRunning
          ? orientation === "vertical"
            ? `translate3d(${signedTravel}%, 0, 0) scaleX(0.985)`
            : `translate3d(0, ${signedTravel}%, 0) scaleY(0.985)`
          : "translate3d(0, 0, 0) scale(1)";
        const imageStyle: CSSProperties =
          orientation === "vertical"
            ? {
                insetBlock: 0,
                left: `${-index * 100}%`,
                width: `${stripCount * 100}%`,
                height: "100%",
              }
            : {
                insetInline: 0,
                top: `${-index * 100}%`,
                width: "100%",
                height: `${stripCount * 100}%`,
              };

        return (
          <div
            key={index}
            data-delay={delay}
            data-direction={
              orientation === "vertical"
                ? signedTravel < 0
                  ? "left"
                  : "right"
                : signedTravel < 0
                  ? "up"
                  : "down"
            }
            data-index={index}
            data-slot="shutter-slider-strip"
            data-terminal={orderedIndex === stripCount - 1 ? "" : undefined}
            data-travel={signedTravel}
            className="relative min-h-0 min-w-0 overflow-hidden"
          >
            <div
              data-layer="outgoing"
              data-slot="shutter-slider-panel"
              className="absolute inset-0 overflow-hidden bg-slate-950 transition-[transform,opacity,filter] ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none"
              style={{
                transform,
                opacity: isTransitionRunning ? 0.08 : 1,
                filter: isTransitionRunning ? "brightness(0.72)" : "none",
                transitionDelay: `${delay}ms`,
                transitionDuration: `${prefersReducedMotion ? 0 : transitionDuration}ms`,
                willChange: context.transition
                  ? "transform, opacity"
                  : undefined,
              }}
              onTransitionEnd={(event) => {
                if (
                  orderedIndex === stripCount - 1 &&
                  event.currentTarget === event.target &&
                  event.propertyName === "transform"
                ) {
                  context.completeTransition(transition.id);
                }
              }}
            >
              <SliderImage
                image={image}
                dataSlot="shutter-slider-panel-image"
                style={imageStyle}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type ShutterSliderViewportProps = ComponentPropsWithRef<"div">;

export function ShutterSliderViewport({
  className,
  tabIndex,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onDragStart,
  role,
  children,
  ...props
}: ShutterSliderViewportProps) {
  const context = useShutterSliderContext("ShutterSliderViewport");
  const baseValue = context.transition?.to ?? context.currentValue;
  const outgoingImage = context.transition
    ? context.slides[context.transition.from]
    : undefined;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      context.disabled ||
      event.target !== event.currentTarget
    ) {
      return;
    }

    let didNavigate = false;
    if (event.key === "ArrowLeft") {
      didNavigate = context.navigate(-1, "keyboard");
    } else if (event.key === "ArrowRight") {
      didNavigate = context.navigate(1, "keyboard");
    } else if (event.key === "Home") {
      didNavigate = context.goTo(0, "keyboard", -1);
    } else if (event.key === "End") {
      didNavigate = context.goTo(context.count - 1, "keyboard", 1);
    }

    if (didNavigate) event.preventDefault();
  };

  return (
    <div
      {...props}
      role={role ?? "group"}
      aria-label={props["aria-label"] ?? "Slide navigation"}
      tabIndex={tabIndex ?? (context.disabled ? -1 : 0)}
      data-slot="shutter-slider-viewport"
      className={twMerge(
        clsx(
          "relative isolate [touch-action:pan-y] overflow-hidden bg-slate-950 outline-none select-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          context.disabled
            ? "cursor-not-allowed"
            : "cursor-grab active:cursor-grabbing",
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
        if (event.defaultPrevented) {
          context.handlePointerCancel(event);
        } else {
          context.handlePointerEnd(event);
        }
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        context.handlePointerCancel(event);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        context.handleLostPointerCapture(event);
      }}
      onDragStart={(event) => {
        onDragStart?.(event);
        if (!event.defaultPrevented) event.preventDefault();
      }}
    >
      <div
        aria-hidden="true"
        data-slot="shutter-slider-media"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-slate-950"
      >
        {context.slides.map((image, index) => {
          const isBase = index === baseValue;
          return (
            <SliderImage
              key={`${image.src}-${index}`}
              image={image}
              dataSlot="shutter-slider-base-image"
              className="inset-0 size-full transition-[opacity,transform] ease-[cubic-bezier(0.22,0.72,0.2,1)] motion-reduce:transition-none"
              style={{
                zIndex: isBase ? 1 : 0,
                opacity: isBase ? 1 : 0,
                transform:
                  isBase && context.transition && !context.isTransitionRunning
                    ? "scale(1.035)"
                    : "scale(1)",
                transitionDuration: `${context.prefersReducedMotion ? 0 : context.transitionDuration}ms`,
              }}
            />
          );
        })}
        {outgoingImage && context.transition && (
          <ShutterStrips
            image={outgoingImage}
            transition={context.transition}
          />
        )}
      </div>
      {children}
    </div>
  );
}

export interface ShutterSliderSlideProps extends ComponentPropsWithRef<"div"> {
  index: number;
}

export function ShutterSliderSlide({
  index,
  className,
  "aria-label": ariaLabel,
  style,
  ...props
}: ShutterSliderSlideProps) {
  const context = useShutterSliderContext("ShutterSliderSlide");
  const state = getSlideState(index, context.currentValue, context.transition);
  const isCurrent = index === context.currentValue;
  const isRunning = context.isTransitionRunning;
  const direction = context.transition?.direction ?? 1;
  const isVisible =
    state === "active" || state === "incoming" || state === "outgoing";
  const opacity =
    state === "active" ||
    (state === "outgoing" && !isRunning) ||
    (state === "incoming" && isRunning)
      ? 1
      : 0;
  const translate =
    state === "outgoing" && isRunning
      ? -24 * direction
      : state === "incoming" && !isRunning
        ? 24 * direction
        : 0;
  const contentDuration = context.prefersReducedMotion
    ? 0
    : Math.round(context.transitionDuration * 0.62);
  const contentDelay =
    state === "incoming" && isRunning && !context.prefersReducedMotion
      ? Math.round(context.transitionDuration * 0.22)
      : 0;

  return (
    <div
      {...props}
      role="group"
      aria-hidden={!isCurrent}
      aria-label={
        ariaLabel ??
        `${context.slides[index]?.alt || `Slide ${index + 1}`}, ${Math.min(index + 1, context.count)} of ${context.count}`
      }
      aria-roledescription="slide"
      inert={!isCurrent}
      data-active={isCurrent ? "" : undefined}
      data-index={index}
      data-state={state}
      data-slot="shutter-slider-slide"
      className={twMerge(
        clsx(
          "absolute inset-0 z-20 transition-[opacity,transform,filter] ease-[cubic-bezier(0.22,0.72,0.2,1)] motion-reduce:transition-none",
          !isVisible && "invisible",
          className,
        ),
      )}
      style={{
        opacity,
        transform: `translate3d(${translate}px, 0, 0)`,
        filter: state === "outgoing" && isRunning ? "blur(2px)" : "blur(0px)",
        transitionDelay: `${contentDelay}ms`,
        transitionDuration: `${contentDuration}ms`,
        pointerEvents:
          isCurrent && context.transition === null ? "auto" : "none",
        ...style,
      }}
    />
  );
}

export type ShutterSliderControlProps = ComponentPropsWithRef<"button">;

function ShutterSliderControl({
  direction,
  source,
  className,
  type,
  disabled,
  onClick,
  ...props
}: ShutterSliderControlProps & {
  direction: ShutterSliderDirection;
  source: "next" | "previous";
}) {
  const context = useShutterSliderContext("ShutterSliderControl");
  const isDisabled =
    disabled ||
    context.disabled ||
    context.transition !== null ||
    !context.canNavigate(direction);

  return (
    <button
      {...props}
      type={type ?? "button"}
      disabled={isDisabled}
      data-slot={`shutter-slider-${source}`}
      className={twMerge(
        clsx(
          "inline-flex min-h-11 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-35",
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

export function ShutterSliderPrevious(props: ShutterSliderControlProps) {
  return (
    <ShutterSliderControl
      aria-label="Previous slide"
      direction={-1}
      source="previous"
      {...props}
    />
  );
}

export function ShutterSliderNext(props: ShutterSliderControlProps) {
  return (
    <ShutterSliderControl
      aria-label="Next slide"
      direction={1}
      source="next"
      {...props}
    />
  );
}

export interface ShutterSliderPaginationProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  getLabel?: (index: number, slide: ShutterSliderImage) => string;
}

export function ShutterSliderPagination({
  className,
  getLabel,
  ...props
}: ShutterSliderPaginationProps) {
  const context = useShutterSliderContext("ShutterSliderPagination");
  const controlsDisabled = context.disabled || context.transition !== null;

  return (
    <div
      {...props}
      role="group"
      aria-label={props["aria-label"] ?? "Choose slide"}
      data-slot="shutter-slider-pagination"
      className={twMerge(clsx("flex items-center gap-2", className))}
    >
      {context.slides.map((slide, index) => {
        const isActive = index === context.currentValue;
        return (
          <button
            key={`${slide.src}-${index}`}
            type="button"
            aria-current={isActive ? "true" : undefined}
            aria-label={
              getLabel?.(index, slide) ??
              `Go to slide ${index + 1}: ${slide.alt}`
            }
            disabled={controlsDisabled || isActive}
            data-active={isActive ? "" : undefined}
            data-index={index}
            className={clsx(
              "h-1.5 rounded-full bg-current transition-[width,opacity] outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-default motion-reduce:transition-none",
              isActive ? "w-9 opacity-100" : "w-3 opacity-35 hover:opacity-75",
            )}
            onClick={() => {
              const direction: ShutterSliderDirection =
                index > context.currentValue ? 1 : -1;
              context.goTo(index, "pagination", direction);
            }}
          />
        );
      })}
    </div>
  );
}

export interface ShutterSliderStatusProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?:
    | ReactNode
    | ((state: {
        value: number;
        count: number;
        slide: ShutterSliderImage | undefined;
      }) => ReactNode);
}

export function ShutterSliderStatus({
  children,
  className,
  ...props
}: ShutterSliderStatusProps) {
  const context = useShutterSliderContext("ShutterSliderStatus");
  const state = {
    value: context.currentValue,
    count: context.count,
    slide: context.slides[context.currentValue],
  };
  const content =
    typeof children === "function"
      ? children(state)
      : (children ??
        (context.count === 0
          ? "0 of 0"
          : `${context.currentValue + 1} of ${context.count}`));

  return (
    <span
      {...props}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-slot="shutter-slider-status"
      className={twMerge(clsx("text-sm tabular-nums", className))}
    >
      {content}
    </span>
  );
}

export type {
  ShutterSliderChangeSource,
  ShutterSliderDirection,
  ShutterSliderTransition,
  ShutterSliderValueChangeDetail,
};
