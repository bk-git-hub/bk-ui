/* eslint-disable no-unused-vars -- Base ESLint treats TypeScript callback parameter names as runtime bindings. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useSlicerSlider,
  type SlicerSliderChangeSource,
  type SlicerSliderDirection,
  type SlicerSliderTransition,
  type SlicerSliderValueChangeDetail,
} from "./useSlicerSlider";

export interface SlicerSliderImage {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  objectPosition?: CSSProperties["objectPosition"];
}

interface SlicerSliderContextValue {
  slides: readonly SlicerSliderImage[];
  count: number;
  currentValue: number;
  plannedValue: number;
  transition: SlicerSliderTransition | null;
  transitions: readonly SlicerSliderTransition[];
  sliceCount: number;
  sliceDuration: number;
  staggerDelay: number;
  easing: string;
  exitDistance: number;
  loop: boolean;
  disabled: boolean;
  isDragging: boolean;
  isPointerActive: boolean;
  prefersReducedMotion: boolean;
  reserveWaveStart: () => number;
  canNavigate: (direction: SlicerSliderDirection) => boolean;
  navigate: (
    direction: SlicerSliderDirection,
    source: SlicerSliderChangeSource,
  ) => boolean;
  goTo: (
    value: number,
    source: SlicerSliderChangeSource,
    direction?: SlicerSliderDirection,
  ) => boolean;
  completeTransition: (transitionId: number) => boolean;
  handlePointerDown: ReturnType<typeof useSlicerSlider>["handlePointerDown"];
  handlePointerMove: ReturnType<typeof useSlicerSlider>["handlePointerMove"];
  handlePointerEnd: ReturnType<typeof useSlicerSlider>["handlePointerEnd"];
  handlePointerCancel: ReturnType<
    typeof useSlicerSlider
  >["handlePointerCancel"];
  handleLostPointerCapture: ReturnType<
    typeof useSlicerSlider
  >["handleLostPointerCapture"];
}

const SlicerSliderContext = createContext<SlicerSliderContextValue | null>(
  null,
);
const MINIMUM_WAVE_PHASE_MS = 90;

function useSlicerSliderContext(componentName: string) {
  const context = useContext(SlicerSliderContext);
  if (!context) {
    throw new Error(
      `${componentName} must be rendered inside SlicerSliderRoot.`,
    );
  }
  return context;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const preferenceRef = useRef(false);
  const getPreference = useCallback(() => preferenceRef.current, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (matches: boolean) => {
      preferenceRef.current = matches;
      setPrefersReducedMotion((current) =>
        current === matches ? current : matches,
      );
    };
    const handleChange = (event: MediaQueryListEvent) =>
      updatePreference(event.matches);

    preferenceRef.current = mediaQuery.matches;
    const frame = window.requestAnimationFrame(() =>
      updatePreference(mediaQuery.matches),
    );
    mediaQuery.addEventListener?.("change", handleChange);
    return () => {
      window.cancelAnimationFrame(frame);
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

  return [prefersReducedMotion, getPreference] as const;
}

function clampFinite(
  value: number,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  const finiteValue = Number.isFinite(value) ? value : fallback;
  return Math.min(Math.max(minimum, finiteValue), maximum);
}

export interface SlicerSliderRootProps
  extends Omit<ComponentPropsWithRef<"section">, "defaultValue" | "onChange"> {
  slides: readonly SlicerSliderImage[];
  value?: number;
  defaultValue?: number;
  onValueChange?: (
    value: number,
    detail: SlicerSliderValueChangeDetail,
  ) => void;
  loop?: boolean;
  sliceCount?: number;
  sliceDuration?: number;
  staggerDelay?: number;
  easing?: string;
  exitDistance?: number;
  dragThreshold?: number;
  disabled?: boolean;
}

export function SlicerSliderRoot({
  slides,
  value,
  defaultValue,
  onValueChange,
  loop = true,
  sliceCount = 10,
  sliceDuration = 680,
  staggerDelay = 42,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  exitDistance = 112,
  dragThreshold,
  disabled = false,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: SlicerSliderRootProps) {
  const safeSliceCount = Math.trunc(clampFinite(sliceCount, 2, 32, 10));
  const safeSliceDuration = clampFinite(sliceDuration, 160, 2400, 680);
  const safeStaggerDelay = clampFinite(staggerDelay, 0, 180, 42);
  const safeExitDistance = clampFinite(exitDistance, 70, 180, 112);
  const [prefersReducedMotion, getPrefersReducedMotion] =
    usePrefersReducedMotion();
  const nextWaveStartAtRef = useRef(0);
  const reserveWaveStart = useCallback(() => {
    const now = window.performance?.now?.() ?? Date.now();
    const startAt = Math.max(now, nextWaveStartAtRef.current);
    nextWaveStartAtRef.current = startAt + MINIMUM_WAVE_PHASE_MS;
    return Math.max(0, startAt - now);
  }, []);
  const {
    currentValue,
    plannedValue,
    transition,
    transitions,
    isDragging,
    isPointerActive,
    canNavigate,
    navigate,
    goTo,
    completeTransition,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handlePointerCancel,
    handleLostPointerCapture,
  } = useSlicerSlider({
    count: slides.length,
    value,
    defaultValue,
    onValueChange,
    loop,
    disabled,
    dragThreshold,
    reducedMotion: prefersReducedMotion,
    getReducedMotion: getPrefersReducedMotion,
  });

  useEffect(() => {
    if (transitions.length === 0) nextWaveStartAtRef.current = 0;
  }, [transitions.length]);

  const contextValue = useMemo<SlicerSliderContextValue>(
    () => ({
      slides,
      count: slides.length,
      currentValue,
      plannedValue,
      transition,
      transitions,
      sliceCount: safeSliceCount,
      sliceDuration: safeSliceDuration,
      staggerDelay: safeStaggerDelay,
      easing,
      exitDistance: safeExitDistance,
      loop,
      disabled,
      isDragging,
      isPointerActive,
      prefersReducedMotion,
      reserveWaveStart,
      canNavigate,
      navigate,
      goTo,
      completeTransition,
      handlePointerDown,
      handlePointerMove,
      handlePointerEnd,
      handlePointerCancel,
      handleLostPointerCapture,
    }),
    [
      disabled,
      easing,
      canNavigate,
      completeTransition,
      currentValue,
      goTo,
      handleLostPointerCapture,
      handlePointerCancel,
      handlePointerDown,
      handlePointerEnd,
      handlePointerMove,
      isDragging,
      isPointerActive,
      loop,
      navigate,
      plannedValue,
      prefersReducedMotion,
      reserveWaveStart,
      safeExitDistance,
      safeSliceCount,
      safeSliceDuration,
      safeStaggerDelay,
      slides,
      transition,
      transitions,
    ],
  );

  return (
    <SlicerSliderContext.Provider value={contextValue}>
      <section
        {...props}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabelledby ? undefined : (ariaLabel ?? "Slicer slider")}
        aria-labelledby={ariaLabelledby}
        data-slot="slicer-slider-root"
        data-state={transitions.length > 0 ? "animating" : "idle"}
        data-dragging={isDragging || undefined}
        data-disabled={disabled || undefined}
        data-reduced-motion={prefersReducedMotion || undefined}
        className={twMerge(clsx("relative", className))}
      >
        {children}
      </section>
    </SlicerSliderContext.Provider>
  );
}

export type SlicerSliderViewportProps = ComponentPropsWithRef<"div">;

export function SlicerSliderViewport({
  className,
  children,
  tabIndex,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...props
}: SlicerSliderViewportProps) {
  const context = useSlicerSliderContext("SlicerSliderViewport");

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || context.disabled) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        context.navigate(-1, "keyboard");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        context.navigate(1, "keyboard");
      } else if (event.key === "Home") {
        event.preventDefault();
        context.goTo(0, "keyboard", -1);
      } else if (event.key === "End") {
        event.preventDefault();
        context.goTo(context.count - 1, "keyboard", 1);
      }
    },
    [context, onKeyDown],
  );

  return (
    <div
      {...props}
      tabIndex={tabIndex ?? (context.disabled || context.count === 0 ? -1 : 0)}
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
        if (!event.defaultPrevented) context.handlePointerEnd(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        context.handlePointerCancel(event);
      }}
      onLostPointerCapture={(event) => {
        context.handleLostPointerCapture(event);
        onLostPointerCapture?.(event);
      }}
      data-slot="slicer-slider-viewport"
      data-state={context.transitions.length > 0 ? "animating" : "idle"}
      data-dragging={context.isDragging || undefined}
      className={twMerge(
        clsx(
          "relative isolate [touch-action:pan-y] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset",
          context.isPointerActive && "cursor-grabbing select-none",
          className,
        ),
      )}
    >
      {children}
      <SlicerSliderSliceLayer />
    </div>
  );
}

export interface SlicerSliderSlideProps extends ComponentPropsWithRef<"div"> {
  index: number;
  imageClassName?: string;
}

export function SlicerSliderSlide({
  index,
  imageClassName,
  className,
  children,
  style,
  "aria-label": ariaLabel,
  ...props
}: SlicerSliderSlideProps) {
  const context = useSlicerSliderContext("SlicerSliderSlide");
  const image = context.slides[index];
  const visualValue =
    context.transitions.length > 0
      ? context.plannedValue
      : context.currentValue;
  const isVisible = visualValue === index;
  const isOutgoing = context.transitions.some(
    (transition) => transition.from === index,
  );
  const state = isVisible
    ? context.transitions.length > 0
      ? "incoming"
      : "active"
    : isOutgoing
      ? "outgoing"
      : "inactive";
  const isCurrent = context.currentValue === index;

  return (
    <div
      {...props}
      role="group"
      aria-roledescription="slide"
      aria-label={
        ariaLabel ??
        (image
          ? `${index + 1} of ${context.count}: ${image.alt}`
          : `${index + 1} of ${context.count}`)
      }
      aria-hidden={!isVisible}
      inert={!isVisible}
      data-slot="slicer-slider-slide"
      data-index={index}
      data-state={state}
      data-active={isCurrent || undefined}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? style?.pointerEvents : "none",
        zIndex: isVisible ? 1 : 0,
      }}
      className={twMerge(clsx("absolute inset-0 overflow-hidden", className))}
    >
      {image && (
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.sizes}
          alt={image.alt}
          loading={
            index === context.currentValue ||
            index === context.plannedValue ||
            index === (context.currentValue + 1) % Math.max(1, context.count)
              ? "eager"
              : "lazy"
          }
          draggable={false}
          data-slot="slicer-slider-media"
          className={twMerge(
            clsx(
              "absolute inset-0 h-full w-full object-cover select-none",
              imageClassName,
            ),
          )}
          style={{ objectPosition: image.objectPosition }}
        />
      )}
      {children}
    </div>
  );
}

function SlicerSliderSliceLayer() {
  const context = useSlicerSliderContext("SlicerSliderSliceLayer");
  if (context.prefersReducedMotion) return null;

  return (
    <>
      {context.transitions.map((transition, index) => {
        const image = context.slides[transition.from];
        if (!image) return null;

        return (
          <SlicerSliderWave
            key={transition.id}
            transition={transition}
            image={image}
            sliceCount={context.sliceCount}
            sliceDuration={context.sliceDuration}
            staggerDelay={context.staggerDelay}
            easing={context.easing}
            exitDistance={context.exitDistance}
            zIndex={20 + context.transitions.length - index}
            reserveStart={context.reserveWaveStart}
            onComplete={context.completeTransition}
          />
        );
      })}
    </>
  );
}

interface SlicerSliderWaveProps {
  transition: SlicerSliderTransition;
  image: SlicerSliderImage;
  sliceCount: number;
  sliceDuration: number;
  staggerDelay: number;
  easing: string;
  exitDistance: number;
  zIndex: number;
  reserveStart: () => number;
  onComplete: (transitionId: number) => boolean;
}

function SlicerSliderWave({
  transition,
  image,
  sliceCount,
  sliceDuration,
  staggerDelay,
  easing,
  exitDistance,
  zIndex,
  reserveStart,
  onComplete,
}: SlicerSliderWaveProps) {
  const [snapshot] = useState(() => ({
    transition,
    image,
    sliceCount,
    sliceDuration,
    staggerDelay,
    easing,
    exitDistance,
  }));
  const [isActive, setIsActive] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const startDelayRef = useRef<number | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const startDelay = startDelayRef.current ?? reserveStart();
    startDelayRef.current = startDelay;
    let startTimeout = 0;
    let firstFrame = 0;
    let secondFrame = 0;
    const startAnimation = () => {
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => setIsActive(true));
      });
    };
    if (startDelay > 0) {
      startTimeout = window.setTimeout(startAnimation, startDelay);
    } else {
      startAnimation();
    }

    const totalDuration =
      snapshot.sliceDuration +
      snapshot.staggerDelay * (snapshot.sliceCount - 1) +
      160;
    const timeout = window.setTimeout(
      () => onCompleteRef.current(snapshot.transition.id),
      startDelay + totalDuration,
    );
    return () => {
      if (startTimeout) window.clearTimeout(startTimeout);
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(timeout);
    };
  }, [reserveStart, snapshot]);

  return (
    <div
      aria-hidden="true"
      data-slot="slicer-slider-slices"
      data-transition-id={snapshot.transition.id}
      data-from={snapshot.transition.from}
      data-to={snapshot.transition.to}
      data-direction={snapshot.transition.direction === 1 ? "next" : "previous"}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex }}
    >
      {Array.from({ length: snapshot.sliceCount }, (_, index) => {
        const delayOrder =
          snapshot.transition.direction === 1
            ? index
            : snapshot.sliceCount - index - 1;
        const isLast = delayOrder === snapshot.sliceCount - 1;
        const verticalDirection = index % 2 === 0 ? -1 : 1;
        const horizontalDistance =
          snapshot.transition.direction * (5 + (index % 3) * 2);
        const rotation =
          snapshot.transition.direction * (index % 2 === 0 ? 3.5 : -3.5);
        const sliceStart = (index / snapshot.sliceCount) * 100;
        const sliceEnd = ((index + 1) / snapshot.sliceCount) * 100;
        const exitTransform = `translate3d(${horizontalDistance}%, ${verticalDirection * snapshot.exitDistance}%, 0) rotate(${rotation}deg) scale(0.96)`;

        return (
          <div
            key={`${snapshot.transition.id}-${index}`}
            aria-hidden="true"
            data-slot="slicer-slider-slice"
            data-index={index}
            data-last={isLast || undefined}
            onTransitionEnd={(event: TransitionEvent<HTMLDivElement>) => {
              if (
                isLast &&
                event.target === event.currentTarget &&
                event.propertyName === "transform"
              ) {
                onCompleteRef.current(snapshot.transition.id);
              }
            }}
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{
              clipPath: `inset(0 ${100 - sliceEnd}% 0 ${sliceStart}%)`,
              opacity: isActive ? 0 : 1,
              transform: isActive
                ? exitTransform
                : "translate3d(0, 0, 0) rotate(0deg) scale(1)",
              transformOrigin: `${(sliceStart + sliceEnd) / 2}% 50%`,
              transitionProperty: "transform, opacity",
              transitionDuration: `${snapshot.sliceDuration}ms`,
              transitionDelay: `${delayOrder * snapshot.staggerDelay}ms`,
              transitionTimingFunction: snapshot.easing,
              willChange: "transform, opacity",
            }}
          >
            <img
              src={snapshot.image.src}
              srcSet={snapshot.image.srcSet}
              sizes={snapshot.image.sizes}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover select-none"
              style={{ objectPosition: snapshot.image.objectPosition }}
            />
          </div>
        );
      })}
    </div>
  );
}

export type SlicerSliderControlProps = ComponentPropsWithRef<"button">;

function SlicerSliderControl({
  direction,
  className,
  children,
  onClick,
  "aria-label": ariaLabel,
  ...props
}: SlicerSliderControlProps & { direction: SlicerSliderDirection }) {
  const context = useSlicerSliderContext("SlicerSliderControl");
  const isPrevious = direction === -1;
  const canNavigate = context.canNavigate(direction);

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={ariaLabel ?? (isPrevious ? "Previous slide" : "Next slide")}
      disabled={props.disabled || !canNavigate}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          context.navigate(direction, isPrevious ? "previous" : "next");
        }
      }}
      data-slot={isPrevious ? "slicer-slider-previous" : "slicer-slider-next"}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-current disabled:cursor-not-allowed disabled:opacity-40",
          className,
        ),
      )}
    >
      {children ?? (isPrevious ? "Previous" : "Next")}
    </button>
  );
}

export function SlicerSliderPrevious(props: SlicerSliderControlProps) {
  return <SlicerSliderControl {...props} direction={-1} />;
}

export function SlicerSliderNext(props: SlicerSliderControlProps) {
  return <SlicerSliderControl {...props} direction={1} />;
}

export interface SlicerSliderPaginationProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  getItemLabel?: (index: number, slide: SlicerSliderImage) => string;
  renderItem?: (state: {
    index: number;
    slide: SlicerSliderImage;
    isActive: boolean;
  }) => ReactNode;
}

export function SlicerSliderPagination({
  className,
  getItemLabel,
  renderItem,
  ...props
}: SlicerSliderPaginationProps) {
  const context = useSlicerSliderContext("SlicerSliderPagination");
  const activeValue = context.plannedValue;

  return (
    <div
      {...props}
      role="group"
      aria-label={props["aria-label"] ?? "Choose slide"}
      data-slot="slicer-slider-pagination"
      className={twMerge(clsx("flex items-center gap-2", className))}
    >
      {context.slides.map((slide, index) => {
        const isActive = activeValue === index;
        return (
          <button
            key={`${slide.src}-${index}`}
            type="button"
            aria-label={
              getItemLabel?.(index, slide) ??
              `Go to slide ${index + 1}: ${slide.alt}`
            }
            aria-current={isActive ? "true" : undefined}
            disabled={context.disabled}
            onClick={() => context.goTo(index, "pagination")}
            data-slot="slicer-slider-pagination-item"
            data-active={isActive || undefined}
            className="grid size-5 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            {renderItem ? (
              renderItem({ index, slide, isActive })
            ) : (
              <span
                aria-hidden="true"
                className={twMerge(
                  clsx(
                    "block size-1.5 rounded-full bg-current opacity-35 transition-[transform,opacity]",
                    isActive && "scale-150 opacity-100",
                  ),
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface SlicerSliderStatusProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?:
    | ReactNode
    | ((state: {
        value: number;
        count: number;
        slide: SlicerSliderImage | undefined;
        isAnimating: boolean;
      }) => ReactNode);
}

export function SlicerSliderStatus({
  className,
  children,
  ...props
}: SlicerSliderStatusProps) {
  const context = useSlicerSliderContext("SlicerSliderStatus");
  const announcedValue = context.currentValue;
  const state = {
    value: announcedValue,
    count: context.count,
    slide: context.slides[announcedValue],
    isAnimating: context.transition !== null,
  };
  const content =
    typeof children === "function"
      ? children(state)
      : (children ??
        (context.count === 0
          ? "0 of 0"
          : `${announcedValue + 1} of ${context.count}`));

  return (
    <span
      {...props}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-slot="slicer-slider-status"
      className={twMerge(clsx("text-sm tabular-nums", className))}
    >
      {content}
    </span>
  );
}

export type {
  SlicerSliderChangeSource,
  SlicerSliderDirection,
  SlicerSliderValueChangeDetail,
};
