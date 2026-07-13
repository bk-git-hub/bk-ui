# Copy for AI: Shutter Slider

Status: `release-blocked` — use only the exact embedded source below for local verification. Do not claim that an npm package, GitHub permalink, ZIP release, or Registry command is publicly available.

Component version: `0.1.0`
Pinned source commit: `a4f7c1cdec909c9e09b2d18a3006c43f484f54f9`
React: `>=19.0.0 <20.0.0` (tested `19.2.7`)
Next.js tested: `16.2.10`

## Artifact integrity

- `public/downloads/shutter-slider-next.zip`: `26354f9de736914b18cef7c58976ff95abf41f498d44513e31a87ceb48b1f775`
- `public/downloads/shutter-slider-react.zip`: `94d65b50d26aa0ce13b4e1f8992320935f5a8a24b0a27ebb90d37702517ef447`
- `public/r/shutter-slider-tailwind-v3.json`: `1e9939fab0644a97e24607c59910dfacc0342048955f73eb7ed29d079f4bd34b`
- `public/r/shutter-slider.json`: `d2af0386f16faea519549fe3d9e4a77762843fd9c7fd9b38fdd4f20ccf3e37c6`

## Tailwind variants

### Tailwind 3

- Range: `>=3.4.0 <4.0.0`; tested: `3.4.17`
- Dependencies: `clsx@^2.1.1 tailwind-merge@2.6.0`
- Registry item: `shutter-slider-tailwind-v3`
- Source discovery: Add './components/ShutterSlider/**/*.{ts,tsx}' (or the equivalent installed path) to the content array in tailwind.config.js or tailwind.config.ts.

### Tailwind 4

- Range: `>=4.0.0 <4.2.0`; tested: `4.1.10`
- Dependencies: `clsx@^2.1.1 tailwind-merge@^3.3.1`
- Registry item: `shutter-slider`
- Source discovery: Files copied under the app source tree are detected automatically; for an external or ignored location, add a stylesheet-relative @source directive for './components/ShutterSlider' to the global Tailwind stylesheet.

## SSR and hydration constraints

- Do not require ssr: false: matchMedia, animation frames, and timers are read only after hydration in effects, event handlers, or cleanup.
- Import the Next.js entrypoint from components/ShutterSlider/client; it is the only Next-only file and re-exports the unchanged React core without next/* imports.
- Keep callbacks, refs, DOM event handlers, ShutterSliderPagination getLabel, and ShutterSliderStatus render-function children inside a Client Component; pass only serializable data from a Server Component.
- Keep slides, defaultValue, and rendered children deterministic between the server render and initial hydration.

## Accessibility constraints

- Do not remove the inactive slide inert and aria-hidden behavior or the polite ShutterSliderStatus live region.
- Give custom previous, next, and pagination controls descriptive accessible labels while preserving native button semantics.
- Keep ShutterSliderViewport keyboard-focusable so ArrowLeft, ArrowRight, Home, and End navigation remains available.
- Preserve the prefers-reduced-motion behavior and motion-reduce utilities when extending transition styles.
- Provide a meaningful alt string for every slide image and an accessible name for the ShutterSliderRoot.

## Canonical source

### @components/ShutterSlider/ShutterSlider.tsx

- Source: `src/components/ShutterSlider/ShutterSlider.tsx`
- SHA-256: `17d76843dfd1c64cb0da76e7c7e58331e8204183de29ae13f14bdb8e787363a4`

```tsx
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
```

### @components/ShutterSlider/client.ts

- Source: `src/components/ShutterSlider/client.ts`
- SHA-256: `2a179d7a0c52410c0c53e9e162e3ae3aeb084e38cb981117f78427294f757b61`

```ts
"use client";

export * from "./index";
```

### @components/ShutterSlider/index.ts

- Source: `src/components/ShutterSlider/index.ts`
- SHA-256: `955ab65b5ec826e293ec897a5d0cc69ca38902ac4d8001a1830897c8ce412904`

```ts
"use client";

export {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
  type ShutterSliderChangeSource,
  type ShutterSliderControlProps,
  type ShutterSliderDirection,
  type ShutterSliderImage,
  type ShutterSliderOrientation,
  type ShutterSliderPaginationProps,
  type ShutterSliderRootProps,
  type ShutterSliderSlideProps,
  type ShutterSliderStatusProps,
  type ShutterSliderTransition,
  type ShutterSliderValueChangeDetail,
  type ShutterSliderViewportProps,
} from "./ShutterSlider";

export {
  getShutterSliderTarget,
  normalizeShutterSliderValue,
  useShutterSlider,
  type ShutterSliderValueChangeHandler,
  type UseShutterSliderOptions,
} from "./useShutterSlider";
```

### @components/ShutterSlider/useShutterSlider.ts

- Source: `src/components/ShutterSlider/useShutterSlider.ts`
- SHA-256: `1d0e06e84f7c1a527b13898ca2e30453c421542f5204e041f9e73aeb5be0b934`

```ts
/* eslint-disable no-unused-vars -- Public callback parameter names document the hook contract. */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type ShutterSliderDirection = -1 | 1;

export type ShutterSliderChangeSource =
  | "keyboard"
  | "next"
  | "pagination"
  | "pointer"
  | "previous";

export interface ShutterSliderValueChangeDetail {
  previousValue: number;
  direction: ShutterSliderDirection;
  source: ShutterSliderChangeSource;
}

export interface ShutterSliderTransition
  extends ShutterSliderValueChangeDetail {
  id: number;
  from: number;
  to: number;
}

export type ShutterSliderValueChangeHandler = (
  value: number,
  detail: ShutterSliderValueChangeDetail,
) => void;

export interface UseShutterSliderOptions {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: ShutterSliderValueChangeHandler;
  loop?: boolean;
  disabled?: boolean;
  dragThreshold?: number;
}

type PointerAxis = "horizontal" | "pending" | "vertical";

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startX: number;
  startY: number;
  latestX: number;
  axis: PointerAxis;
}

interface TransitionTopology {
  count: number;
  loop: boolean;
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-shutter-slider-no-drag]";
const AXIS_LOCK_DISTANCE = 7;
const DEFAULT_DRAG_THRESHOLD = 48;

function getSafeCount(count: number) {
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function capturePointer(viewport: HTMLDivElement, pointerId: number) {
  if (typeof viewport.setPointerCapture !== "function") return;

  try {
    viewport.setPointerCapture(pointerId);
  } catch {
    return;
  }
}

function releasePointerCapture(session: PointerSession) {
  const { pointerId, viewport } = session;
  if (typeof viewport.releasePointerCapture !== "function") return;

  try {
    if (
      typeof viewport.hasPointerCapture === "function" &&
      !viewport.hasPointerCapture(pointerId)
    ) {
      return;
    }
    viewport.releasePointerCapture(pointerId);
  } catch {
    return;
  }
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR);
}

export function normalizeShutterSliderValue(
  value: number,
  count: number,
  loop: boolean,
) {
  const safeCount = getSafeCount(count);
  if (safeCount === 0) return 0;

  const integerValue = Number.isFinite(value) ? Math.trunc(value) : 0;
  if (!loop) return clamp(integerValue, 0, safeCount - 1);

  return ((integerValue % safeCount) + safeCount) % safeCount;
}

export function getShutterSliderTarget(
  value: number,
  direction: ShutterSliderDirection,
  count: number,
  loop: boolean,
) {
  return normalizeShutterSliderValue(value + direction, count, loop);
}

export function useShutterSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  disabled = false,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
}: UseShutterSliderOptions) {
  const safeCount = getSafeCount(count);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeShutterSliderValue(defaultValue, safeCount, loop),
  );
  const settledValue = normalizeShutterSliderValue(
    isControlled ? value : uncontrolledValue,
    safeCount,
    loop,
  );
  const [renderedValue, setRenderedValue] = useState(settledValue);
  const [transition, setTransition] = useState<ShutterSliderTransition | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const currentValueRef = useRef(renderedValue);
  const settledValueRef = useRef(settledValue);
  const transitionRef = useRef<ShutterSliderTransition | null>(null);
  const transitionTopologyRef = useRef<TransitionTopology | null>(null);
  const invalidatedTransitionIdRef = useRef<number | null>(null);
  const transitionIdRef = useRef(0);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const isControlledRef = useRef(isControlled);
  const onValueChangeRef = useRef(onValueChange);
  const optionsRef = useRef({
    count: safeCount,
    loop,
    disabled,
    dragThreshold,
  });

  const pendingTopology = transitionTopologyRef.current;
  const topologyChanged =
    transition !== null &&
    pendingTopology !== null &&
    (pendingTopology.count !== safeCount || pendingTopology.loop !== loop);
  const controlledValueChanged =
    isControlled && transition !== null && settledValue !== transition.from;
  const shouldCancelTransition = topologyChanged || controlledValueChanged;
  const visibleTransition = shouldCancelTransition ? null : transition;
  const currentValue =
    isControlled && visibleTransition === null
      ? settledValue
      : normalizeShutterSliderValue(renderedValue, safeCount, loop);

  currentValueRef.current = currentValue;
  invalidatedTransitionIdRef.current = shouldCancelTransition
    ? (transition?.id ?? null)
    : null;
  settledValueRef.current = settledValue;
  isControlledRef.current = isControlled;
  onValueChangeRef.current = onValueChange;
  optionsRef.current = {
    count: safeCount,
    loop,
    disabled,
    dragThreshold,
  };

  const releasePointerSession = useCallback((pointerId?: number) => {
    const session = pointerSessionRef.current;
    if (
      !session ||
      (pointerId !== undefined && session.pointerId !== pointerId)
    ) {
      return null;
    }

    pointerSessionRef.current = null;
    setIsDragging(false);
    releasePointerCapture(session);
    return session;
  }, []);

  useEffect(() => {
    if (
      isControlled ||
      transitionRef.current ||
      renderedValue === settledValue
    ) {
      return;
    }

    currentValueRef.current = settledValue;
    setRenderedValue(settledValue);
  }, [isControlled, renderedValue, settledValue]);

  useEffect(() => {
    if (!shouldCancelTransition || transition === null) return;

    if (transitionRef.current?.id === transition.id) {
      transitionRef.current = null;
      transitionTopologyRef.current = null;
      invalidatedTransitionIdRef.current = null;
    }
    setTransition((pending) =>
      pending?.id === transition.id ? null : pending,
    );
    const nextValue = isControlled
      ? settledValue
      : normalizeShutterSliderValue(renderedValue, safeCount, loop);
    currentValueRef.current = nextValue;
    setRenderedValue(nextValue);
    releasePointerSession();
  }, [
    isControlled,
    loop,
    releasePointerSession,
    renderedValue,
    safeCount,
    settledValue,
    shouldCancelTransition,
    transition,
  ]);

  useEffect(() => {
    if (isControlled) return;

    setUncontrolledValue((previousValue) => {
      const normalizedValue = normalizeShutterSliderValue(
        previousValue,
        safeCount,
        loop,
      );
      return normalizedValue === previousValue
        ? previousValue
        : normalizedValue;
    });
  }, [isControlled, loop, safeCount]);

  useEffect(() => {
    const pending = transitionRef.current;
    if (!pending) return;

    const fromIsValid =
      normalizeShutterSliderValue(pending.from, safeCount, loop) ===
      pending.from;
    const toIsValid =
      normalizeShutterSliderValue(pending.to, safeCount, loop) === pending.to;
    if (safeCount > 1 && fromIsValid && toIsValid) return;

    transitionRef.current = null;
    transitionTopologyRef.current = null;
    invalidatedTransitionIdRef.current = null;
    setTransition(null);
    currentValueRef.current = settledValue;
    setRenderedValue(settledValue);
  }, [loop, safeCount, settledValue]);

  useEffect(() => {
    if (!disabled && safeCount > 1) return;
    releasePointerSession();
  }, [disabled, releasePointerSession, safeCount]);

  useEffect(
    () => () => {
      const session = pointerSessionRef.current;
      pointerSessionRef.current = null;
      transitionRef.current = null;
      transitionTopologyRef.current = null;
      invalidatedTransitionIdRef.current = null;
      if (session) releasePointerCapture(session);
    },
    [],
  );

  const goTo = useCallback(
    (
      requestedValue: number,
      source: ShutterSliderChangeSource,
      requestedDirection?: ShutterSliderDirection,
    ) => {
      const latestOptions = optionsRef.current;
      if (
        latestOptions.disabled ||
        latestOptions.count <= 1 ||
        transitionRef.current ||
        pointerSessionRef.current
      ) {
        return false;
      }

      const from = currentValueRef.current;
      const to = normalizeShutterSliderValue(
        requestedValue,
        latestOptions.count,
        latestOptions.loop,
      );
      if (to === from) return false;

      const direction = requestedDirection ?? (to > from ? 1 : -1);
      const nextTransition: ShutterSliderTransition = {
        id: ++transitionIdRef.current,
        from,
        to,
        previousValue: from,
        direction,
        source,
      };

      transitionRef.current = nextTransition;
      transitionTopologyRef.current = {
        count: latestOptions.count,
        loop: latestOptions.loop,
      };
      invalidatedTransitionIdRef.current = null;
      setTransition(nextTransition);
      setIsDragging(false);
      return true;
    },
    [],
  );

  const navigate = useCallback(
    (direction: ShutterSliderDirection, source: ShutterSliderChangeSource) => {
      const latestOptions = optionsRef.current;
      return goTo(
        getShutterSliderTarget(
          currentValueRef.current,
          direction,
          latestOptions.count,
          latestOptions.loop,
        ),
        source,
        direction,
      );
    },
    [goTo],
  );

  const canNavigate = useCallback((direction: ShutterSliderDirection) => {
    const latestOptions = optionsRef.current;
    return (
      !latestOptions.disabled &&
      latestOptions.count > 1 &&
      transitionRef.current === null &&
      pointerSessionRef.current === null &&
      getShutterSliderTarget(
        currentValueRef.current,
        direction,
        latestOptions.count,
        latestOptions.loop,
      ) !== currentValueRef.current
    );
  }, []);

  const completeTransition = useCallback((transitionId: number) => {
    if (invalidatedTransitionIdRef.current === transitionId) return;

    const pending = transitionRef.current;
    if (!pending || pending.id !== transitionId) return;

    transitionRef.current = null;
    transitionTopologyRef.current = null;
    invalidatedTransitionIdRef.current = null;
    setTransition(null);
    const committedValue = isControlledRef.current
      ? settledValueRef.current
      : pending.to;
    currentValueRef.current = committedValue;
    setRenderedValue(committedValue);
    if (!isControlledRef.current) setUncontrolledValue(pending.to);
    onValueChangeRef.current?.(pending.to, {
      previousValue: pending.previousValue,
      direction: pending.direction,
      source: pending.source,
    });
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const latestOptions = optionsRef.current;
      if (
        latestOptions.disabled ||
        latestOptions.count <= 1 ||
        transitionRef.current ||
        pointerSessionRef.current ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      pointerSessionRef.current = {
        pointerId: event.pointerId,
        viewport: event.currentTarget,
        startX: event.clientX,
        startY: event.clientY,
        latestX: event.clientX,
        axis: "pending",
      };
      capturePointer(event.currentTarget, event.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      if (optionsRef.current.disabled || transitionRef.current) {
        releasePointerSession(event.pointerId);
        return;
      }

      const deltaX = event.clientX - session.startX;
      const deltaY = event.clientY - session.startY;
      session.latestX = event.clientX;

      if (
        session.axis === "pending" &&
        Math.hypot(deltaX, deltaY) >= AXIS_LOCK_DISTANCE
      ) {
        session.axis =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
        if (session.axis === "vertical") {
          releasePointerSession(event.pointerId);
          return;
        }
        setIsDragging(true);
      }

      if (session.axis === "horizontal") event.preventDefault();
    },
    [releasePointerSession],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = releasePointerSession(event.pointerId);
      if (!session || session.axis !== "horizontal") return;

      const eventX = Number.isFinite(event.clientX)
        ? event.clientX
        : session.latestX;
      const deltaX = eventX - session.startX;
      const configuredThreshold = optionsRef.current.dragThreshold;
      const threshold = Number.isFinite(configuredThreshold)
        ? Math.max(0, configuredThreshold)
        : DEFAULT_DRAG_THRESHOLD;
      if (Math.abs(deltaX) < threshold) return;

      navigate(deltaX < 0 ? 1 : -1, "pointer");
    },
    [navigate, releasePointerSession],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      releasePointerSession(event.pointerId);
    },
    [releasePointerSession],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      releasePointerSession(event.pointerId);
    },
    [releasePointerSession],
  );

  return {
    currentValue,
    transition: visibleTransition,
    isDragging,
    canNavigate,
    goTo,
    navigate,
    completeTransition,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handlePointerCancel,
    handleLostPointerCapture,
  };
}
```

## React/Vite example

```tsx
import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
} from "../components/ShutterSlider";

const stories = [
  {
    image: { src: "/images/river.webp", alt: "A river at sunset" },
    title: "Blue hour",
  },
  {
    image: { src: "/images/alley.webp", alt: "A rain-lit alley" },
    title: "After the rain",
  },
  {
    image: { src: "/images/platform.webp", alt: "A platform beside the sea" },
    title: "Last train",
  },
] as const;

export default function ShutterSliderExample() {
  return (
    <ShutterSliderRoot
      slides={stories.map((story) => story.image)}
      stripCount={5}
      transitionDuration={820}
      stagger={52}
      aria-label="Travel stories"
      className="overflow-hidden rounded-3xl bg-slate-950 text-white"
    >
      <ShutterSliderViewport className="aspect-video">
        {stories.map((story, index) => (
          <ShutterSliderSlide
            key={story.image.src}
            index={index}
            className="flex items-end p-8 pb-20"
          >
            <h2 className="text-4xl font-black">{story.title}</h2>
          </ShutterSliderSlide>
        ))}
      </ShutterSliderViewport>
      <ShutterSliderPrevious className="absolute left-4 top-1/2 z-30">
        Previous
      </ShutterSliderPrevious>
      <ShutterSliderNext className="absolute right-4 top-1/2 z-30">
        Next
      </ShutterSliderNext>
      <ShutterSliderPagination
        aria-label="Choose a travel story"
        className="absolute bottom-6 left-8 z-30"
      />
      <ShutterSliderStatus className="absolute bottom-6 right-8 z-30" />
    </ShutterSliderRoot>
  );
}
```

## Next.js App Router examples

```tsx
"use client";

import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
  type ShutterSliderImage,
} from "../components/ShutterSlider/client";

export interface ShutterSliderClientProps {
  stories: readonly { image: ShutterSliderImage; title: string }[];
}

export default function ShutterSliderClient({
  stories,
}: ShutterSliderClientProps) {
  return (
    <ShutterSliderRoot
      slides={stories.map((story) => story.image)}
      stripCount={5}
      transitionDuration={820}
      stagger={52}
      aria-label="Travel stories"
      className="overflow-hidden rounded-3xl bg-slate-950 text-white"
    >
      <ShutterSliderViewport className="aspect-video">
        {stories.map((story, index) => (
          <ShutterSliderSlide
            key={story.image.src}
            index={index}
            className="flex items-end p-8 pb-20"
          >
            <h2 className="text-4xl font-black">{story.title}</h2>
          </ShutterSliderSlide>
        ))}
      </ShutterSliderViewport>
      <ShutterSliderPrevious className="absolute left-4 top-1/2 z-30">
        Previous
      </ShutterSliderPrevious>
      <ShutterSliderNext className="absolute right-4 top-1/2 z-30">
        Next
      </ShutterSliderNext>
      <ShutterSliderPagination
        aria-label="Choose a travel story"
        className="absolute bottom-6 left-8 z-30"
      />
      <ShutterSliderStatus className="absolute bottom-6 right-8 z-30" />
    </ShutterSliderRoot>
  );
}
```

```tsx
import ShutterSliderClient from "./client-wrapper";

const stories = [
  {
    image: { src: "/images/river.webp", alt: "A river at sunset" },
    title: "Blue hour",
  },
  {
    image: { src: "/images/alley.webp", alt: "A rain-lit alley" },
    title: "After the rain",
  },
  {
    image: { src: "/images/platform.webp", alt: "A platform beside the sea" },
    title: "Last train",
  },
] as const;

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <ShutterSliderClient stories={stories} />
    </main>
  );
}
```

## Required verification

- Typecheck and production-build the consuming project.
- Confirm the selected Tailwind major emits the representative utilities from the manifest.
- For Next.js, render production HTML, hydrate without console errors, and exercise one interaction.
- Recompute every file and artifact SHA-256 before using the result.
