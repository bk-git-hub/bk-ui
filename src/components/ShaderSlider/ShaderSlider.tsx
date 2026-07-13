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
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type SetStateAction,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  createShaderSliderRenderer,
  type ShaderSliderRenderer,
} from "./shader-slider-renderer";
import type {
  ShaderSliderDirection,
  ShaderSliderEffect,
  ShaderSliderImage,
  ShaderSliderRendererMode,
} from "./shader-slider-types";
import {
  useShaderSlider,
  type ShaderSliderChangeSource,
  type ShaderSliderTransition,
  type ShaderSliderValueChangeDetail,
} from "./useShaderSlider";

interface ShaderSliderContextValue {
  slides: readonly ShaderSliderImage[];
  count: number;
  currentValue: number;
  transition: ShaderSliderTransition | null;
  isDragging: boolean;
  loop: boolean;
  disabled: boolean;
  transitionDuration: number;
  effect: ShaderSliderEffect;
  intensity: number;
  frequency: number;
  dprCap: number;
  prefersReducedMotion: boolean;
  rendererMode: ShaderSliderRendererMode;
  setRendererMode: Dispatch<SetStateAction<ShaderSliderRendererMode>>;
  canNavigate: (direction: ShaderSliderDirection) => boolean;
  navigate: (
    direction: ShaderSliderDirection,
    source: ShaderSliderChangeSource,
  ) => boolean;
  goTo: (
    value: number,
    source: ShaderSliderChangeSource,
    direction?: ShaderSliderDirection,
  ) => boolean;
  completeTransition: (transitionId: number) => void;
  handlePointerDown: ReturnType<typeof useShaderSlider>["handlePointerDown"];
  handlePointerMove: ReturnType<typeof useShaderSlider>["handlePointerMove"];
  handlePointerEnd: ReturnType<typeof useShaderSlider>["handlePointerEnd"];
  handlePointerCancel: ReturnType<
    typeof useShaderSlider
  >["handlePointerCancel"];
  handleLostPointerCapture: ReturnType<
    typeof useShaderSlider
  >["handleLostPointerCapture"];
}

const ShaderSliderContext = createContext<ShaderSliderContextValue | null>(
  null,
);

function useShaderSliderContext(componentName: string) {
  const context = useContext(ShaderSliderContext);
  if (!context) {
    throw new Error(
      `${componentName} must be rendered inside ShaderSliderRoot.`,
    );
  }
  return context;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window === "undefined" || typeof window.matchMedia !== "function"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

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

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function getVisualState(
  index: number,
  currentValue: number,
  transition: ShaderSliderTransition | null,
) {
  if (transition?.to === index) return "incoming" as const;
  if (transition?.from === index) return "outgoing" as const;
  if (currentValue === index) return "active" as const;
  return "inactive" as const;
}

export interface ShaderSliderRootProps
  extends Omit<ComponentPropsWithRef<"section">, "defaultValue" | "onChange"> {
  slides: readonly ShaderSliderImage[];
  value?: number;
  defaultValue?: number;
  onValueChange?: (
    value: number,
    detail: ShaderSliderValueChangeDetail,
  ) => void;
  loop?: boolean;
  effect?: ShaderSliderEffect;
  transitionDuration?: number;
  intensity?: number;
  frequency?: number;
  dprCap?: number;
  dragThreshold?: number;
  disabled?: boolean;
}

export function ShaderSliderRoot({
  slides,
  value,
  defaultValue,
  onValueChange,
  loop = true,
  effect = "wave",
  transitionDuration = 950,
  intensity = 0.9,
  frequency = 2.75,
  dprCap = 2,
  dragThreshold,
  disabled = false,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: ShaderSliderRootProps) {
  const safeTransitionDuration = Math.min(
    Math.max(0, transitionDuration),
    5000,
  );
  const safeIntensity = Math.min(Math.max(0, intensity), 2);
  const safeFrequency = Math.min(Math.max(0.5, frequency), 12);
  const safeDprCap = Math.min(Math.max(1, dprCap), 3);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [rendererMode, setRendererMode] =
    useState<ShaderSliderRendererMode>("loading");
  const slider = useShaderSlider({
    count: slides.length,
    value,
    defaultValue,
    onValueChange,
    loop,
    disabled,
    dragThreshold,
  });
  const contextValue = useMemo<ShaderSliderContextValue>(
    () => ({
      slides,
      count: slides.length,
      currentValue: slider.currentValue,
      transition: slider.transition,
      isDragging: slider.isDragging,
      loop,
      disabled,
      transitionDuration: safeTransitionDuration,
      effect,
      intensity: safeIntensity,
      frequency: safeFrequency,
      dprCap: safeDprCap,
      prefersReducedMotion,
      rendererMode,
      setRendererMode,
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
      effect,
      loop,
      prefersReducedMotion,
      rendererMode,
      safeDprCap,
      safeFrequency,
      safeIntensity,
      safeTransitionDuration,
      slider,
      slides,
    ],
  );

  return (
    <ShaderSliderContext.Provider value={contextValue}>
      <section
        {...props}
        aria-label={ariaLabelledby ? ariaLabel : (ariaLabel ?? "Image slider")}
        aria-labelledby={ariaLabelledby}
        aria-roledescription="carousel"
        data-disabled={disabled ? "" : undefined}
        data-dragging={slider.isDragging ? "" : undefined}
        data-effect={effect}
        data-reduced-motion={prefersReducedMotion ? "" : undefined}
        data-renderer={rendererMode}
        data-slot="shader-slider-root"
        className={twMerge(clsx("relative isolate w-full", className))}
      >
        {children}
      </section>
    </ShaderSliderContext.Provider>
  );
}

export type ShaderSliderViewportProps = ComponentPropsWithRef<"div">;

export function ShaderSliderViewport({
  className,
  tabIndex,
  ref,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onDragStart,
  children,
  ...props
}: ShaderSliderViewportProps) {
  const context = useShaderSliderContext("ShaderSliderViewport");
  const {
    slides,
    currentValue,
    transition,
    transitionDuration,
    effect,
    intensity,
    frequency,
    dprCap,
    prefersReducedMotion,
    rendererMode,
    setRendererMode,
    completeTransition,
  } = context;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ShaderSliderRenderer | null>(null);
  const frameOptionsRef = useRef({ effect, intensity, frequency });
  const currentValueRef = useRef(currentValue);
  const slidesRef = useRef(slides);
  const [rendererGeneration, setRendererGeneration] = useState(0);
  const slidesSignature = useMemo(
    () =>
      slides
        .map(
          (slide) =>
            `${slide.src}\u0000${slide.crossOrigin ?? "anonymous"}\u0000${slide.fit ?? "cover"}`,
        )
        .join("\u0001"),
    [slides],
  );
  currentValueRef.current = currentValue;
  slidesRef.current = slides;
  frameOptionsRef.current = { effect, intensity, frequency };

  const setViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport || slidesRef.current.length === 0) {
      setRendererMode("fallback");
      return;
    }

    setRendererMode("loading");
    const renderer = createShaderSliderRenderer(canvas);
    if (!renderer) {
      setRendererMode("fallback");
      return;
    }

    let active = true;
    let ready = false;
    rendererRef.current = renderer;
    const resize = () => {
      const canDraw = renderer.resize(
        viewport.clientWidth,
        viewport.clientHeight,
        window.devicePixelRatio || 1,
        dprCap,
      );
      if (canDraw && ready && !renderer.draw(currentValueRef.current)) {
        setRendererMode("fallback");
      }
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(viewport);
    window.addEventListener("resize", resize, { passive: true });
    resize();

    void renderer
      .prepare(slidesRef.current)
      .then(() => {
        if (!active) return;
        ready = true;
        resize();
        if (!renderer.draw(currentValueRef.current)) {
          throw new Error("WebGL could not draw the prepared slider frame.");
        }
        setRendererMode("webgl");
      })
      .catch(() => {
        if (!active) return;
        setRendererMode("fallback");
      });

    return () => {
      active = false;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      renderer.destroy();
      if (rendererRef.current === renderer) rendererRef.current = null;
    };
  }, [dprCap, rendererGeneration, setRendererMode, slidesSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      rendererRef.current?.destroy();
      rendererRef.current = null;
      setRendererMode("fallback");
    };
    const handleContextRestored = () => {
      setRendererGeneration((generation) => generation + 1);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [setRendererMode]);

  useEffect(() => {
    if (rendererMode !== "webgl" || transition) return;
    const viewport = viewportRef.current;
    const renderer = rendererRef.current;
    if (!viewport || !renderer) return;

    renderer.resize(
      viewport.clientWidth,
      viewport.clientHeight,
      window.devicePixelRatio || 1,
      dprCap,
    );
    if (!renderer.draw(currentValue)) {
      setRendererMode("fallback");
    }
  }, [currentValue, dprCap, rendererMode, setRendererMode, transition]);

  useEffect(() => {
    if (!transition) return;

    let frameId: number | null = null;
    let timeoutId: number | null = null;
    let cancelled = false;
    const duration = prefersReducedMotion ? 0 : transitionDuration;
    const complete = () => {
      if (!cancelled) completeTransition(transition.id);
    };
    timeoutId = window.setTimeout(complete, duration);

    if (
      duration > 0 &&
      rendererMode === "webgl" &&
      rendererRef.current &&
      typeof window.requestAnimationFrame === "function"
    ) {
      const renderer = rendererRef.current;
      let startTime: number | null = null;
      const renderFrame = (time: number) => {
        if (cancelled) return;
        startTime ??= time;
        const progress = Math.min((time - startTime) / duration, 1);
        const frameOptions = frameOptionsRef.current;
        const didDraw = renderer.drawTransition(
          transition.from,
          transition.to,
          progress,
          {
            direction: transition.direction,
            effect: frameOptions.effect,
            intensity: frameOptions.intensity,
            frequency: frameOptions.frequency,
          },
        );
        if (!didDraw) {
          setRendererMode("fallback");
          return;
        }

        if (progress < 1) {
          frameId = window.requestAnimationFrame(renderFrame);
        }
      };
      frameId = window.requestAnimationFrame(renderFrame);
    }

    return () => {
      cancelled = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [
    completeTransition,
    prefersReducedMotion,
    rendererMode,
    setRendererMode,
    transition,
    transitionDuration,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.target !== event.currentTarget ||
      context.disabled ||
      context.transition
    ) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      context.navigate(-1, "keyboard");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      context.navigate(1, "keyboard");
    } else if (event.key === "Home" && context.count > 0) {
      event.preventDefault();
      context.goTo(0, "keyboard", -1);
    } else if (event.key === "End" && context.count > 0) {
      event.preventDefault();
      context.goTo(context.count - 1, "keyboard", 1);
    }
  };

  const visualDuration = context.prefersReducedMotion
    ? 0
    : context.transitionDuration;

  return (
    <div
      {...props}
      ref={setViewportRef}
      role="group"
      aria-label={props["aria-label"] ?? "Slide navigation"}
      tabIndex={tabIndex ?? 0}
      data-dragging={context.isDragging ? "" : undefined}
      data-renderer={context.rendererMode}
      data-slot="shader-slider-viewport"
      className={twMerge(
        clsx(
          "relative isolate [touch-action:pan-y] overflow-hidden bg-slate-950 outline-none select-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
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
        if (!event.defaultPrevented) context.handlePointerEnd(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        if (!event.defaultPrevented) context.handlePointerCancel(event);
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        if (!event.defaultPrevented) {
          context.handleLostPointerCapture(event);
        }
      }}
      onDragStart={(event) => {
        onDragStart?.(event);
        event.preventDefault();
      }}
    >
      <div
        data-slot="shader-slider-fallback"
        className="absolute inset-0 z-0 overflow-hidden bg-slate-950"
      >
        {context.slides.map((slide, index) => {
          const state = getVisualState(
            index,
            context.currentValue,
            context.transition,
          );
          const isCurrent = index === context.currentValue;
          return (
            <img
              key={`${slide.src}-${index}`}
              src={slide.src}
              alt={isCurrent ? slide.alt : ""}
              aria-hidden={!isCurrent}
              crossOrigin={slide.crossOrigin ?? undefined}
              draggable={false}
              loading="eager"
              data-state={state}
              className={clsx(
                "absolute inset-0 size-full transition-[opacity,transform] ease-[cubic-bezier(0.22,0.72,0.2,1)] select-none motion-reduce:transition-none",
                slide.fit === "contain" ? "object-contain" : "object-cover",
                state === "active" && "scale-100 opacity-100",
                state === "incoming" && "scale-100 opacity-100",
                state === "outgoing" && "scale-[0.985] opacity-0",
                state === "inactive" && "scale-[1.025] opacity-0",
              )}
              style={{
                transitionDuration: `${visualDuration}ms`,
                zIndex: isCurrent ? 2 : state === "incoming" ? 1 : 0,
              }}
            />
          );
        })}
      </div>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-slot="shader-slider-canvas"
        className={clsx(
          "pointer-events-none absolute inset-0 z-10 size-full transition-opacity duration-300 motion-reduce:transition-none",
          context.rendererMode === "webgl" ? "opacity-100" : "opacity-0",
        )}
      />
      {children}
    </div>
  );
}

export interface ShaderSliderSlideProps extends ComponentPropsWithRef<"div"> {
  index: number;
}

export function ShaderSliderSlide({
  index,
  className,
  "aria-label": ariaLabel,
  style,
  ...props
}: ShaderSliderSlideProps) {
  const context = useShaderSliderContext("ShaderSliderSlide");
  const isCurrent = index === context.currentValue;
  const state = getVisualState(index, context.currentValue, context.transition);
  const visualDuration = context.prefersReducedMotion
    ? 0
    : context.transitionDuration;

  return (
    <div
      {...props}
      role="group"
      aria-hidden={!isCurrent}
      aria-label={
        ariaLabel ??
        `Slide ${Math.min(index + 1, context.count)} of ${context.count}`
      }
      aria-roledescription="slide"
      inert={!isCurrent}
      data-active={isCurrent ? "" : undefined}
      data-index={index}
      data-state={state}
      data-slot="shader-slider-slide"
      className={twMerge(
        clsx(
          "absolute inset-0 z-20 transition-[opacity,transform,filter] ease-[cubic-bezier(0.22,0.72,0.2,1)] motion-reduce:transition-none",
          state === "active" && "scale-100 opacity-100 blur-none",
          state === "incoming" && "scale-100 opacity-100 blur-none",
          state === "outgoing" && "scale-[0.985] opacity-0 blur-[2px]",
          state === "inactive" && "scale-[1.02] opacity-0 blur-[2px]",
          className,
        ),
      )}
      style={{
        transitionDuration: `${Math.round(visualDuration * 0.72)}ms`,
        pointerEvents:
          isCurrent && context.transition === null ? "auto" : "none",
        ...style,
      }}
    />
  );
}

export type ShaderSliderControlProps = ComponentPropsWithRef<"button">;

function ShaderSliderControl({
  direction,
  source,
  className,
  type,
  disabled,
  onClick,
  ...props
}: ShaderSliderControlProps & {
  direction: ShaderSliderDirection;
  source: "next" | "previous";
}) {
  const context = useShaderSliderContext("ShaderSliderControl");
  const isDisabled =
    disabled ||
    context.disabled ||
    context.rendererMode === "loading" ||
    context.transition !== null ||
    !context.canNavigate(direction);

  return (
    <button
      {...props}
      type={type ?? "button"}
      disabled={isDisabled}
      data-slot={`shader-slider-${source}`}
      className={twMerge(
        clsx(
          "inline-flex min-h-11 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-35",
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

export function ShaderSliderPrevious(props: ShaderSliderControlProps) {
  return (
    <ShaderSliderControl
      aria-label="Previous slide"
      direction={-1}
      source="previous"
      {...props}
    />
  );
}

export function ShaderSliderNext(props: ShaderSliderControlProps) {
  return (
    <ShaderSliderControl
      aria-label="Next slide"
      direction={1}
      source="next"
      {...props}
    />
  );
}

export interface ShaderSliderPaginationProps
  extends Omit<ComponentPropsWithRef<"div">, "children"> {
  getLabel?: (index: number, slide: ShaderSliderImage) => string;
}

export function ShaderSliderPagination({
  className,
  getLabel,
  ...props
}: ShaderSliderPaginationProps) {
  const context = useShaderSliderContext("ShaderSliderPagination");
  const controlsDisabled =
    context.disabled ||
    context.rendererMode === "loading" ||
    context.transition !== null;

  return (
    <div
      {...props}
      role="group"
      aria-label={props["aria-label"] ?? "Choose slide"}
      data-slot="shader-slider-pagination"
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
              "h-2 rounded-full bg-current transition-[width,opacity] outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-default motion-reduce:transition-none",
              isActive ? "w-8 opacity-100" : "w-2 opacity-35 hover:opacity-75",
            )}
            onClick={() => {
              const direction: ShaderSliderDirection =
                index > context.currentValue ? 1 : -1;
              context.goTo(index, "pagination", direction);
            }}
          />
        );
      })}
    </div>
  );
}

export interface ShaderSliderStatusProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?:
    | ReactNode
    | ((state: {
        value: number;
        count: number;
        slide: ShaderSliderImage | undefined;
      }) => ReactNode);
}

export function ShaderSliderStatus({
  children,
  className,
  ...props
}: ShaderSliderStatusProps) {
  const context = useShaderSliderContext("ShaderSliderStatus");
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
      data-slot="shader-slider-status"
      className={twMerge(clsx("text-sm tabular-nums", className))}
    >
      {content}
    </span>
  );
}

export interface ShaderSliderRendererStatusProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?:
    | ReactNode
    | ((state: {
        renderer: ShaderSliderRendererMode;
        prefersReducedMotion: boolean;
      }) => ReactNode);
}

export function ShaderSliderRendererStatus({
  children,
  className,
  ...props
}: ShaderSliderRendererStatusProps) {
  const context = useShaderSliderContext("ShaderSliderRendererStatus");
  const content =
    typeof children === "function"
      ? children({
          renderer: context.rendererMode,
          prefersReducedMotion: context.prefersReducedMotion,
        })
      : (children ?? context.rendererMode);

  return (
    <span
      {...props}
      data-renderer={context.rendererMode}
      data-slot="shader-slider-renderer-status"
      className={twMerge(clsx("text-xs", className))}
    >
      {content}
    </span>
  );
}

export type {
  ShaderSliderDirection,
  ShaderSliderEffect,
  ShaderSliderImage,
  ShaderSliderRendererMode,
  ShaderSliderValueChangeDetail,
};
