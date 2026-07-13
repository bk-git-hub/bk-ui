# Copy for AI: Shader Slider

Status: `release-blocked` — use only the exact embedded source below for local verification. Do not claim that an npm package, GitHub permalink, ZIP release, or Registry command is publicly available.

Component version: `0.1.0`
Pinned source commit: `9abab5bafae37adc13716b6072b6280c8b82f4f4`
React: `>=19 <20` (tested `19.2.7`)
Next.js tested: `16.2.10`

## Artifact integrity

- `public/downloads/shader-slider-next.zip`: `2d18f039dfb8e74e256be82a0487dfeb863aa9da2063ddc64585d4da99fbea71`
- `public/downloads/shader-slider-react.zip`: `37d7bd6a9728a06a2bd7669c0af284d735e61ae9db97e983ef2562e028c380e1`
- `public/r/shader-slider-tailwind-v3.json`: `2a7aa55481198fa4ce2f1dbeaf0c5fe4535b1673253033966526f0317f24c86e`
- `public/r/shader-slider.json`: `86711b5b6f2c97c04fb68fd74d75a4b707219d8b5477519fdd02a48c7c29ed9d`

## Tailwind variants

### Tailwind 3

- Range: `>=3.4 <4`; tested: `3.4.19`
- Dependencies: `clsx@^2.1.1 tailwind-merge@2.6.0`
- Registry item: `shader-slider-tailwind-v3`
- Source discovery: Include the installed directory in Tailwind content, for example './src/components/ShaderSlider/**/*.{js,ts,jsx,tsx}' or './components/ShaderSlider/**/*.{js,ts,jsx,tsx}'.

### Tailwind 4

- Range: `>=4 <5`; tested: `4.3.2`
- Dependencies: `clsx@^2.1.1 tailwind-merge@^3.3.1`
- Registry item: `shader-slider`
- Source discovery: Keep components/ShaderSlider under a locally scanned source tree; otherwise add a stylesheet-relative @source directive for that directory.

## SSR and hydration constraints

- Do not require ssr: false; the mounted placeholder is deterministic and browser rendering begins after hydration.
- Import the Next.js entrypoint from components/ShaderSlider/client; it is the only Next-only file and re-exports the unchanged React core without next/* imports.
- Keep onValueChange, children, refs, and DOM event handlers inside a Client Component; pass only the declared serializable data and primitive options from a Server Component.
- The mounted Next.js wrapper server-renders a placeholder instead of slide content; provide a separate static image when no-JavaScript image content is required.
- Use same-origin texture URLs or CORS headers compatible with each slide crossOrigin value; failed WebGL texture loading falls back to the accessible DOM images.
- Use the included mount-gated Client Component wrapper so the server markup and first hydration markup match before the core reads matchMedia and initializes WebGL or ResizeObserver.

## Accessibility constraints

- Do not remove the inactive slide inert and aria-hidden behavior, the aria-hidden canvas, or the polite ShaderSliderStatus live region.
- Increase pagination button hit areas in product styling when the target-size policy exceeds the default 0.5rem visual dots.
- Keep ShaderSliderViewport keyboard-focusable so ArrowLeft, ArrowRight, Home, and End navigation and visible focus styles remain available.
- Preserve prefers-reduced-motion behavior and motion-reduce utilities when extending transition styles.
- Provide a meaningful non-empty alt string for every slide and an accessible name through aria-label or aria-labelledby on ShaderSliderRoot.
- Use semantic interactive elements or data-shader-slider-no-drag for custom slide controls so pointer gestures do not intercept their interaction.

## Canonical source

### @components/ShaderSlider/ShaderSlider.tsx

- Source: `src/components/ShaderSlider/ShaderSlider.tsx`
- SHA-256: `c057f2caf28bf8e73bfd98a6090dd7da2f86de85ecff41f0c2affe23d85fb4d0`

```tsx
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
```

### @components/ShaderSlider/client.ts

- Source: `src/components/ShaderSlider/client.ts`
- SHA-256: `692ee7017e87c1e5d96d95ffdfcc5deae1e0ee7a26a810d4c4977e45cd24d658`

```ts
'use client';

export * from "./index";
```

### @components/ShaderSlider/index.ts

- Source: `src/components/ShaderSlider/index.ts`
- SHA-256: `8b22539fe7f4836cd8b69ba68bdcafcc1fc90f8b82d040a2c6403a32a284fc53`

```ts
export {
  ShaderSliderNext,
  ShaderSliderPagination,
  ShaderSliderPrevious,
  ShaderSliderRendererStatus,
  ShaderSliderRoot,
  ShaderSliderSlide,
  ShaderSliderStatus,
  ShaderSliderViewport,
  type ShaderSliderControlProps,
  type ShaderSliderDirection,
  type ShaderSliderEffect,
  type ShaderSliderImage,
  type ShaderSliderPaginationProps,
  type ShaderSliderRendererMode,
  type ShaderSliderRendererStatusProps,
  type ShaderSliderRootProps,
  type ShaderSliderSlideProps,
  type ShaderSliderStatusProps,
  type ShaderSliderValueChangeDetail,
  type ShaderSliderViewportProps,
} from "./ShaderSlider";
export {
  getShaderSliderCanvasMetrics,
  getShaderSliderUvScale,
  type ShaderSliderCanvasMetrics,
  type ShaderSliderFrameOptions,
  type ShaderSliderRenderer,
} from "./shader-slider-renderer";
export {
  getShaderSliderTarget,
  normalizeShaderSliderValue,
  useShaderSlider,
  type ShaderSliderChangeSource,
  type ShaderSliderTransition,
  type UseShaderSliderOptions,
} from "./useShaderSlider";
```

### @components/ShaderSlider/shader-slider-renderer.ts

- Source: `src/components/ShaderSlider/shader-slider-renderer.ts`
- SHA-256: `bde87ffc50c3c01519833811c22bf9de5d3f0394d65538af80117f2a28ef03a9`

```ts
/* eslint-disable no-unused-vars -- Base ESLint treats TypeScript interface parameter names as runtime bindings. */
import type {
  ShaderSliderDirection,
  ShaderSliderEffect,
  ShaderSliderFit,
  ShaderSliderImage,
} from "./shader-slider-types";

type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

interface TextureRecord {
  texture: WebGLTexture;
  width: number;
  height: number;
  fit: ShaderSliderFit;
}

interface ProgramLocations {
  position: number;
  fromTexture: WebGLUniformLocation;
  toTexture: WebGLUniformLocation;
  progress: WebGLUniformLocation;
  direction: WebGLUniformLocation;
  effect: WebGLUniformLocation;
  intensity: WebGLUniformLocation;
  frequency: WebGLUniformLocation;
  resolution: WebGLUniformLocation;
  fromScale: WebGLUniformLocation;
  toScale: WebGLUniformLocation;
  fromContain: WebGLUniformLocation;
  toContain: WebGLUniformLocation;
  background: WebGLUniformLocation;
}

export interface ShaderSliderFrameOptions {
  direction: ShaderSliderDirection;
  effect: ShaderSliderEffect;
  intensity: number;
  frequency: number;
}

export interface ShaderSliderRenderer {
  prepare(images: readonly ShaderSliderImage[]): Promise<void>;
  resize(
    cssWidth: number,
    cssHeight: number,
    devicePixelRatio: number,
    dprCap: number,
  ): boolean;
  draw(index: number): boolean;
  drawTransition(
    fromIndex: number,
    toIndex: number,
    progress: number,
    options: ShaderSliderFrameOptions,
  ): boolean;
  destroy(): void;
}

export interface ShaderSliderCanvasMetrics {
  width: number;
  height: number;
  pixelRatio: number;
}

const VERTEX_SHADER_WEBGL_1 = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const VERTEX_SHADER_WEBGL_2 = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

function getFragmentShaderSource(isWebGL2: boolean) {
  const version = isWebGL2 ? "#version 300 es\n" : "";
  const varying = isWebGL2 ? "in vec2 vUv;" : "varying vec2 vUv;";
  const outputDeclaration = isWebGL2 ? "out vec4 fragmentColor;" : "";
  const textureSample = isWebGL2 ? "texture" : "texture2D";
  const output = isWebGL2
    ? "fragmentColor = mix(fromColor, toColor, blend);"
    : "gl_FragColor = mix(fromColor, toColor, blend);";

  return `${version}precision mediump float;

${varying}
${outputDeclaration}

uniform sampler2D uFromTexture;
uniform sampler2D uToTexture;
uniform float uProgress;
uniform float uDirection;
uniform float uEffect;
uniform float uIntensity;
uniform float uFrequency;
uniform vec2 uResolution;
uniform vec2 uFromScale;
uniform vec2 uToScale;
uniform float uFromContain;
uniform float uToContain;
uniform vec4 uBackground;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

float random2d(vec2 value) {
  return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
}

float insideUnitSquare(vec2 uv) {
  return step(0.0, uv.x) * step(uv.x, 1.0) *
    step(0.0, uv.y) * step(uv.y, 1.0);
}

vec4 readImage(
  sampler2D imageTexture,
  vec2 screenUv,
  vec2 scale,
  float contain
) {
  vec2 imageUv = (screenUv - 0.5) * scale + 0.5;
  float mask = mix(1.0, insideUnitSquare(imageUv), contain);
  vec4 color = ${textureSample}(imageTexture, clamp(imageUv, 0.001, 0.999));
  return mix(uBackground, color, mask);
}

void main() {
  float progress = clamp(uProgress, 0.0, 1.0);
  float easedProgress = progress * progress * (3.0 - 2.0 * progress);
  float envelope = 4.0 * progress * (1.0 - progress);
  float safeIntensity = clamp(uIntensity, 0.0, 2.0);
  vec2 fromUv = vUv;
  vec2 toUv = vUv;
  float blend = easedProgress;

  if (uEffect < 0.5) {
    float wave = sin(
      (vUv.y * max(uFrequency, 0.5) + progress * uDirection * 1.5) *
        TWO_PI
    );
    vec2 offset = vec2(
      wave * 0.035 * safeIntensity * envelope * uDirection,
      0.0
    );
    fromUv += offset * progress;
    toUv -= offset * (1.0 - progress);
    blend = clamp(easedProgress + wave * 0.035 * envelope, 0.0, 1.0);
  } else if (uEffect < 1.5) {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 centered = (vUv - 0.5) * vec2(aspect, 1.0);
    float radius = length(centered);
    vec2 radial = normalize(centered + vec2(0.0001)) / vec2(aspect, 1.0);
    float ripple = sin(radius * 38.0 - progress * 11.0 * uDirection) *
      0.02 * safeIntensity * envelope;
    fromUv += radial * ripple * progress;
    toUv -= radial * ripple * (1.0 - progress);
  } else {
    float pixelAmount = clamp(envelope * safeIntensity, 0.0, 1.0);
    float columns = mix(220.0, 30.0, pixelAmount);
    vec2 grid = vec2(
      columns,
      max(2.0, columns * uResolution.y / max(uResolution.x, 1.0))
    );
    vec2 pixelUv = (floor(vUv * grid) + 0.5) / grid;
    fromUv = mix(vUv, pixelUv, pixelAmount * 0.92);
    toUv = fromUv;
    float threshold = random2d(floor(vUv * grid * 0.45));
    blend = smoothstep(threshold - 0.12, threshold + 0.12, progress);
  }

  vec4 fromColor = readImage(
    uFromTexture,
    fromUv,
    uFromScale,
    uFromContain
  );
  vec4 toColor = readImage(
    uToTexture,
    toUv,
    uToScale,
    uToContain
  );
  ${output}
}
`;
}

const QUAD_VERTICES = new Float32Array([
  -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
]);

const EFFECT_VALUES: Record<ShaderSliderEffect, number> = {
  wave: 0,
  ripple: 1,
  pixel: 2,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function getShaderSliderUvScale(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  fit: ShaderSliderFit,
): readonly [number, number] {
  if (
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return [1, 1];
  }

  const relativeAspect =
    imageWidth / imageHeight / (viewportWidth / viewportHeight);
  if (fit === "contain") {
    return relativeAspect > 1 ? [1, relativeAspect] : [1 / relativeAspect, 1];
  }

  return relativeAspect > 1 ? [1 / relativeAspect, 1] : [1, relativeAspect];
}

export function getShaderSliderCanvasMetrics(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  dprCap: number,
  maxWidth = Number.POSITIVE_INFINITY,
  maxHeight = Number.POSITIVE_INFINITY,
): ShaderSliderCanvasMetrics {
  const safeWidth = Math.max(0, cssWidth);
  const safeHeight = Math.max(0, cssHeight);
  const requestedPixelRatio = clamp(
    Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1,
    1,
    Math.max(1, dprCap),
  );
  const widthLimit = safeWidth > 0 ? maxWidth / safeWidth : 1;
  const heightLimit = safeHeight > 0 ? maxHeight / safeHeight : 1;
  const pixelRatio = Math.max(
    0.1,
    Math.min(requestedPixelRatio, widthLimit, heightLimit),
  );

  return {
    width: Math.round(safeWidth * pixelRatio),
    height: Math.round(safeHeight * pixelRatio),
    pixelRatio,
  };
}

function compileShader(gl: GLContext, shaderType: number, source: string) {
  const shader = gl.createShader(shaderType);
  if (!shader) throw new Error("Unable to create a WebGL shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Shader compilation failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: GLContext, isWebGL2: boolean) {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    isWebGL2 ? VERTEX_SHADER_WEBGL_2 : VERTEX_SHADER_WEBGL_1,
  );
  let fragmentShader: WebGLShader;
  try {
    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      getFragmentShaderSource(isWebGL2),
    );
  } catch (error) {
    gl.deleteShader(vertexShader);
    throw error;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Unable to create a WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Shader linking failed.";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function requireUniform(gl: GLContext, program: WebGLProgram, name: string) {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error(`Missing WebGL uniform: ${name}`);
  return location;
}

function getLocations(gl: GLContext, program: WebGLProgram): ProgramLocations {
  const position = gl.getAttribLocation(program, "aPosition");
  if (position < 0) throw new Error("Missing WebGL position attribute.");

  return {
    position,
    fromTexture: requireUniform(gl, program, "uFromTexture"),
    toTexture: requireUniform(gl, program, "uToTexture"),
    progress: requireUniform(gl, program, "uProgress"),
    direction: requireUniform(gl, program, "uDirection"),
    effect: requireUniform(gl, program, "uEffect"),
    intensity: requireUniform(gl, program, "uIntensity"),
    frequency: requireUniform(gl, program, "uFrequency"),
    resolution: requireUniform(gl, program, "uResolution"),
    fromScale: requireUniform(gl, program, "uFromScale"),
    toScale: requireUniform(gl, program, "uToScale"),
    fromContain: requireUniform(gl, program, "uFromContain"),
    toContain: requireUniform(gl, program, "uToContain"),
    background: requireUniform(gl, program, "uBackground"),
  };
}

class WebGLShaderSliderRenderer implements ShaderSliderRenderer {
  private readonly gl: GLContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly locations: ProgramLocations;
  private readonly maxTextureSize: number;
  private readonly maxViewportWidth: number;
  private readonly maxViewportHeight: number;
  private readonly textureInternalFormat: number;
  private textures: TextureRecord[] = [];
  private pendingLoadCancellations = new Set<() => void>();
  private preparationEpoch = 0;
  private cssWidth = 0;
  private cssHeight = 0;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement, gl: GLContext, isWebGL2: boolean) {
    this.canvas = canvas;
    this.gl = gl;
    this.program = createProgram(gl, isWebGL2);
    try {
      this.locations = getLocations(gl, this.program);
    } catch (error) {
      gl.deleteProgram(this.program);
      throw error;
    }
    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(this.program);
      throw new Error("Unable to create a WebGL vertex buffer.");
    }
    this.buffer = buffer;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    this.maxViewportWidth = maxViewport[0] ?? this.maxTextureSize;
    this.maxViewportHeight = maxViewport[1] ?? this.maxTextureSize;
    this.textureInternalFormat = isWebGL2
      ? (gl as WebGL2RenderingContext).RGBA8
      : gl.RGBA;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.clearColor(0.02, 0.025, 0.035, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);
  }

  private cancelPendingLoads() {
    for (const cancel of this.pendingLoadCancellations) cancel();
    this.pendingLoadCancellations.clear();
  }

  private loadImage(source: ShaderSliderImage) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      let settled = false;

      const finish = (
        callback: (value: HTMLImageElement) => void,
        value: HTMLImageElement,
      ) => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        this.pendingLoadCancellations.delete(cancel);
        callback(value);
      };
      const cancel = () => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        reject(new Error("Image loading was cancelled."));
      };

      image.decoding = "async";
      if (source.crossOrigin !== null) {
        image.crossOrigin = source.crossOrigin ?? "anonymous";
      }
      image.onload = () => finish(resolve, image);
      image.onerror = () => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        this.pendingLoadCancellations.delete(cancel);
        reject(new Error(`Unable to load slider image: ${source.src}`));
      };
      this.pendingLoadCancellations.add(cancel);
      image.src = source.src;

      if (image.complete && image.naturalWidth > 0) {
        queueMicrotask(() => finish(resolve, image));
      }
    });
  }

  private uploadTexture(
    image: HTMLImageElement,
    source: ShaderSliderImage,
  ): TextureRecord {
    if (
      image.naturalWidth > this.maxTextureSize ||
      image.naturalHeight > this.maxTextureSize
    ) {
      throw new Error("Slider image exceeds the GPU texture size limit.");
    }

    const { gl } = this;
    const texture = gl.createTexture();
    if (!texture) throw new Error("Unable to create a WebGL texture.");

    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (gl.getError() === gl.NO_ERROR) break;
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const bindingError = gl.getError();
      if (bindingError !== gl.NO_ERROR) {
        throw new Error(
          `WebGL texture binding failed with code ${bindingError}.`,
        );
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const parameterError = gl.getError();
      if (parameterError !== gl.NO_ERROR) {
        throw new Error(
          `WebGL texture parameters failed with code ${parameterError}.`,
        );
      }
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        this.textureInternalFormat,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      const uploadError = gl.getError();
      if (uploadError !== gl.NO_ERROR) {
        throw new Error(
          `WebGL texture upload failed with code ${uploadError}.`,
        );
      }
    } catch (error) {
      gl.deleteTexture(texture);
      throw error;
    }

    return {
      texture,
      width: image.naturalWidth,
      height: image.naturalHeight,
      fit: source.fit ?? "cover",
    };
  }

  async prepare(images: readonly ShaderSliderImage[]) {
    const epoch = ++this.preparationEpoch;
    this.cancelPendingLoads();

    let loadedImages: HTMLImageElement[];
    try {
      loadedImages = await Promise.all(
        images.map((image) => this.loadImage(image)),
      );
    } catch (error) {
      this.cancelPendingLoads();
      throw error;
    }

    if (this.destroyed || epoch !== this.preparationEpoch) {
      throw new Error("Slider image preparation was superseded.");
    }

    const nextTextures: TextureRecord[] = [];
    try {
      for (let index = 0; index < loadedImages.length; index += 1) {
        const image = loadedImages[index];
        const source = images[index];
        if (!image || !source) continue;
        nextTextures.push(this.uploadTexture(image, source));
      }
    } catch (error) {
      for (const record of nextTextures) this.gl.deleteTexture(record.texture);
      throw error;
    }

    if (nextTextures.length !== images.length) {
      for (const record of nextTextures) this.gl.deleteTexture(record.texture);
      throw new Error("Not all slider textures could be prepared.");
    }

    for (const record of this.textures) this.gl.deleteTexture(record.texture);
    this.textures = nextTextures;
  }

  resize(
    cssWidth: number,
    cssHeight: number,
    devicePixelRatio: number,
    dprCap: number,
  ) {
    this.cssWidth = Math.max(0, cssWidth);
    this.cssHeight = Math.max(0, cssHeight);
    if (this.cssWidth === 0 || this.cssHeight === 0) return false;

    const metrics = getShaderSliderCanvasMetrics(
      this.cssWidth,
      this.cssHeight,
      devicePixelRatio,
      dprCap,
      this.maxViewportWidth,
      this.maxViewportHeight,
    );
    if (
      this.canvas.width !== metrics.width ||
      this.canvas.height !== metrics.height
    ) {
      this.canvas.width = metrics.width;
      this.canvas.height = metrics.height;
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    return true;
  }

  draw(index: number) {
    return this.drawTransition(index, index, 0, {
      direction: 1,
      effect: "wave",
      intensity: 0,
      frequency: 3,
    });
  }

  drawTransition(
    fromIndex: number,
    toIndex: number,
    progress: number,
    options: ShaderSliderFrameOptions,
  ) {
    if (
      this.destroyed ||
      this.cssWidth === 0 ||
      this.cssHeight === 0 ||
      this.gl.isContextLost?.()
    ) {
      return false;
    }

    const from = this.textures[fromIndex];
    const to = this.textures[toIndex];
    if (!from || !to) return false;

    const { gl, locations } = this;
    const fromScale = getShaderSliderUvScale(
      this.cssWidth,
      this.cssHeight,
      from.width,
      from.height,
      from.fit,
    );
    const toScale = getShaderSliderUvScale(
      this.cssWidth,
      this.cssHeight,
      to.width,
      to.height,
      to.fit,
    );

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.texture);
    gl.uniform1i(locations.fromTexture, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, to.texture);
    gl.uniform1i(locations.toTexture, 1);

    gl.uniform1f(locations.progress, clamp(progress, 0, 1));
    gl.uniform1f(locations.direction, options.direction);
    gl.uniform1f(locations.effect, EFFECT_VALUES[options.effect]);
    gl.uniform1f(locations.intensity, clamp(options.intensity, 0, 2));
    gl.uniform1f(locations.frequency, clamp(options.frequency, 0.5, 12));
    gl.uniform2f(locations.resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(locations.fromScale, fromScale[0], fromScale[1]);
    gl.uniform2f(locations.toScale, toScale[0], toScale[1]);
    gl.uniform1f(locations.fromContain, from.fit === "contain" ? 1 : 0);
    gl.uniform1f(locations.toContain, to.fit === "contain" ? 1 : 0);
    gl.uniform4f(locations.background, 0.02, 0.025, 0.035, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return true;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.preparationEpoch += 1;
    this.cancelPendingLoads();

    if (!this.gl.isContextLost?.()) {
      for (const record of this.textures) {
        this.gl.deleteTexture(record.texture);
      }
      this.gl.deleteBuffer(this.buffer);
      this.gl.deleteProgram(this.program);
    }
    this.textures = [];
  }
}

export function createShaderSliderRenderer(
  canvas: HTMLCanvasElement,
): ShaderSliderRenderer | null {
  const attributes: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  };

  let gl: GLContext | null = null;
  let isWebGL2 = false;
  try {
    gl = canvas.getContext("webgl2", attributes);
    isWebGL2 = gl !== null;
    if (!gl) gl = canvas.getContext("webgl", attributes);
  } catch {
    return null;
  }
  if (!gl) return null;

  try {
    return new WebGLShaderSliderRenderer(canvas, gl, isWebGL2);
  } catch {
    return null;
  }
}
```

### @components/ShaderSlider/shader-slider-types.ts

- Source: `src/components/ShaderSlider/shader-slider-types.ts`
- SHA-256: `0d5233a943b919dcf8f38300bb38b8353ac59a53fb477e08eacf66cd2a0e020a`

```ts
export type ShaderSliderDirection = -1 | 1;

export type ShaderSliderEffect = "wave" | "ripple" | "pixel";

export type ShaderSliderFit = "cover" | "contain";

export type ShaderSliderRendererMode = "loading" | "webgl" | "fallback";

export interface ShaderSliderImage {
  src: string;
  alt: string;
  fit?: ShaderSliderFit;
  crossOrigin?: "anonymous" | "use-credentials" | null;
}
```

### @components/ShaderSlider/useShaderSlider.ts

- Source: `src/components/ShaderSlider/useShaderSlider.ts`
- SHA-256: `fe8ef577745eebe379929510e72a94a0adb4cd995ccccb4ad21e3eff14078b9d`

```ts
/* eslint-disable no-unused-vars -- Base ESLint treats TypeScript callback parameter names as runtime bindings. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ShaderSliderDirection } from "./shader-slider-types";

export type ShaderSliderChangeSource =
  | "keyboard"
  | "next"
  | "pagination"
  | "pointer"
  | "previous";

export interface ShaderSliderValueChangeDetail {
  previousValue: number;
  direction: ShaderSliderDirection;
  source: ShaderSliderChangeSource;
}

export interface ShaderSliderTransition extends ShaderSliderValueChangeDetail {
  id: number;
  from: number;
  to: number;
}

export interface UseShaderSliderOptions {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (
    value: number,
    detail: ShaderSliderValueChangeDetail,
  ) => void;
  loop?: boolean;
  disabled?: boolean;
  dragThreshold?: number;
}

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startX: number;
  startY: number;
  latestX: number;
  axis: "pending" | "horizontal" | "vertical";
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-shader-slider-no-drag]";
const AXIS_LOCK_DISTANCE = 7;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function normalizeShaderSliderValue(
  value: number,
  count: number,
  loop: boolean,
) {
  const safeCount = Math.max(0, Math.trunc(count));
  if (safeCount === 0) return 0;

  const integerValue = Number.isFinite(value) ? Math.trunc(value) : 0;
  if (!loop) return clamp(integerValue, 0, safeCount - 1);
  return ((integerValue % safeCount) + safeCount) % safeCount;
}

export function getShaderSliderTarget(
  value: number,
  direction: ShaderSliderDirection,
  count: number,
  loop: boolean,
) {
  return normalizeShaderSliderValue(value + direction, count, loop);
}

export function useShaderSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  disabled = false,
  dragThreshold = 48,
}: UseShaderSliderOptions) {
  const safeCount = Math.max(0, Math.trunc(count));
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeShaderSliderValue(defaultValue, safeCount, loop),
  );
  const settledValue = normalizeShaderSliderValue(
    isControlled ? value : uncontrolledValue,
    safeCount,
    loop,
  );
  const [renderedValue, setRenderedValue] = useState(settledValue);
  const [transition, setTransition] = useState<ShaderSliderTransition | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const transitionRef = useRef<ShaderSliderTransition | null>(null);
  const transitionIdRef = useRef(0);
  const pointerSessionRef = useRef<PointerSession | null>(null);

  useEffect(() => {
    if (transitionRef.current) return;
    setRenderedValue((currentValue) =>
      currentValue === settledValue ? currentValue : settledValue,
    );
  }, [renderedValue, settledValue]);

  useEffect(() => {
    const pending = transitionRef.current;
    if (!pending || (pending.from < safeCount && pending.to < safeCount)) {
      return;
    }

    transitionRef.current = null;
    setTransition(null);
    setRenderedValue(settledValue);
  }, [safeCount, settledValue]);

  const goTo = useCallback(
    (
      requestedValue: number,
      source: ShaderSliderChangeSource,
      requestedDirection?: ShaderSliderDirection,
    ) => {
      if (disabled || safeCount <= 1 || transitionRef.current !== null) {
        return false;
      }

      const targetValue = normalizeShaderSliderValue(
        requestedValue,
        safeCount,
        loop,
      );
      if (targetValue === renderedValue) return false;

      const direction =
        requestedDirection ?? (targetValue > renderedValue ? 1 : -1);
      const nextTransition: ShaderSliderTransition = {
        id: ++transitionIdRef.current,
        from: renderedValue,
        to: targetValue,
        previousValue: renderedValue,
        direction,
        source,
      };

      transitionRef.current = nextTransition;
      setTransition(nextTransition);
      setIsDragging(false);
      return true;
    },
    [disabled, loop, renderedValue, safeCount],
  );

  const navigate = useCallback(
    (direction: ShaderSliderDirection, source: ShaderSliderChangeSource) =>
      goTo(
        getShaderSliderTarget(renderedValue, direction, safeCount, loop),
        source,
        direction,
      ),
    [goTo, loop, renderedValue, safeCount],
  );

  const canNavigate = useCallback(
    (direction: ShaderSliderDirection) =>
      !disabled &&
      transitionRef.current === null &&
      safeCount > 1 &&
      getShaderSliderTarget(renderedValue, direction, safeCount, loop) !==
        renderedValue,
    [disabled, loop, renderedValue, safeCount],
  );

  const completeTransition = useCallback(
    (transitionId: number) => {
      const pending = transitionRef.current;
      if (!pending || pending.id !== transitionId) return;

      transitionRef.current = null;
      setTransition(null);
      setRenderedValue(pending.to);
      if (!isControlled) setUncontrolledValue(pending.to);
      onValueChange?.(pending.to, {
        previousValue: pending.previousValue,
        direction: pending.direction,
        source: pending.source,
      });
    },
    [isControlled, onValueChange],
  );

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
    if (
      session.viewport.hasPointerCapture?.(session.pointerId) &&
      session.viewport.releasePointerCapture
    ) {
      session.viewport.releasePointerCapture(session.pointerId);
    }
    return session;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        disabled ||
        safeCount <= 1 ||
        transitionRef.current ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      const target = event.target;
      if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
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
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [disabled, safeCount],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - session.startX;
      const deltaY = event.clientY - session.startY;
      session.latestX = event.clientX;

      if (
        session.axis === "pending" &&
        Math.hypot(deltaX, deltaY) >= AXIS_LOCK_DISTANCE
      ) {
        session.axis =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
        if (session.axis === "horizontal") {
          setIsDragging(true);
        } else {
          releasePointerSession(event.pointerId);
          return;
        }
      }

      if (session.axis === "horizontal") event.preventDefault();
    },
    [releasePointerSession],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = releasePointerSession(event.pointerId);
      if (!session || session.axis !== "horizontal") return;

      const deltaX = event.clientX - session.startX;
      if (Math.abs(deltaX) < Math.max(0, dragThreshold)) return;
      navigate(deltaX < 0 ? 1 : -1, "pointer");
    },
    [dragThreshold, navigate, releasePointerSession],
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
    currentValue: renderedValue,
    transition,
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
  ShaderSliderNext,
  ShaderSliderPagination,
  ShaderSliderPrevious,
  ShaderSliderRoot,
  ShaderSliderSlide,
  ShaderSliderStatus,
  ShaderSliderViewport,
  type ShaderSliderImage,
} from "../components/ShaderSlider";

interface ShaderSliderStory extends ShaderSliderImage {
  title: string;
}

const stories: readonly ShaderSliderStory[] = [
  {
    src: "/images/tidal-glass.webp",
    alt: "Teal glass waves beneath a warm sun",
    title: "Tidal Glass",
  },
  {
    src: "/images/electric-bloom.webp",
    alt: "Luminous magenta petals over a violet sky",
    title: "Electric Bloom",
  },
];

export default function ShaderSliderExample() {
  return (
    <ShaderSliderRoot
      slides={stories}
      effect="wave"
      transitionDuration={950}
      intensity={0.9}
      frequency={2.75}
      dprCap={2}
      loop
      aria-label="Visual stories"
      className="relative overflow-hidden rounded-3xl bg-slate-950 text-white"
    >
      <ShaderSliderViewport className="aspect-video">
        {stories.map((story, index) => (
          <ShaderSliderSlide
            key={story.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/80 to-transparent p-8 pb-20"
          >
            <h2 className="text-4xl font-black">{story.title}</h2>
          </ShaderSliderSlide>
        ))}
      </ShaderSliderViewport>
      <ShaderSliderPrevious className="absolute left-4 top-1/2 z-30 -translate-y-1/2 bg-black/55 px-4 py-3">
        Previous
      </ShaderSliderPrevious>
      <ShaderSliderNext className="absolute right-4 top-1/2 z-30 -translate-y-1/2 bg-black/55 px-4 py-3">
        Next
      </ShaderSliderNext>
      <ShaderSliderPagination
        aria-label="Choose a visual story"
        className="absolute bottom-6 left-8 z-30 [&>button]:h-6 [&>button]:min-w-6"
      />
      <ShaderSliderStatus className="absolute bottom-6 right-8 z-30" />
    </ShaderSliderRoot>
  );
}
```

## Next.js App Router examples

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  ShaderSliderNext,
  ShaderSliderPagination,
  ShaderSliderPrevious,
  ShaderSliderRoot,
  ShaderSliderSlide,
  ShaderSliderStatus,
  ShaderSliderViewport,
  type ShaderSliderImage,
} from "../components/ShaderSlider/client";

export interface ShaderSliderStory extends ShaderSliderImage {
  title: string;
}

export interface ShaderSliderClientProps {
  stories: readonly ShaderSliderStory[];
}

export default function ShaderSliderClient({
  stories,
}: ShaderSliderClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="aspect-video w-full rounded-3xl bg-slate-950"
      />
    );
  }

  return (
    <ShaderSliderRoot
      slides={stories}
      effect="wave"
      transitionDuration={950}
      intensity={0.9}
      frequency={2.75}
      dprCap={2}
      loop
      aria-label="Visual stories"
      className="relative overflow-hidden rounded-3xl bg-slate-950 text-white"
    >
      <ShaderSliderViewport className="aspect-video">
        {stories.map((story, index) => (
          <ShaderSliderSlide
            key={story.src}
            index={index}
            className="flex items-end bg-gradient-to-t from-black/80 to-transparent p-8 pb-20"
          >
            <h2 className="text-4xl font-black">{story.title}</h2>
          </ShaderSliderSlide>
        ))}
      </ShaderSliderViewport>
      <ShaderSliderPrevious className="absolute left-4 top-1/2 z-30 -translate-y-1/2 bg-black/55 px-4 py-3">
        Previous
      </ShaderSliderPrevious>
      <ShaderSliderNext className="absolute right-4 top-1/2 z-30 -translate-y-1/2 bg-black/55 px-4 py-3">
        Next
      </ShaderSliderNext>
      <ShaderSliderPagination
        aria-label="Choose a visual story"
        className="absolute bottom-6 left-8 z-30 [&>button]:h-6 [&>button]:min-w-6"
      />
      <ShaderSliderStatus className="absolute bottom-6 right-8 z-30" />
    </ShaderSliderRoot>
  );
}
```

```tsx
import ShaderSliderClient, {
  type ShaderSliderStory,
} from "./client-wrapper";

const stories = [
  {
    src: "/images/tidal-glass.webp",
    alt: "Teal glass waves beneath a warm sun",
    title: "Tidal Glass",
  },
  {
    src: "/images/electric-bloom.webp",
    alt: "Luminous magenta petals over a violet sky",
    title: "Electric Bloom",
  },
] satisfies readonly ShaderSliderStory[];

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <ShaderSliderClient stories={stories} />
    </main>
  );
}
```

## Required verification

- Typecheck and production-build the consuming project.
- Confirm the selected Tailwind major emits the representative utilities from the manifest.
- For Next.js, render production HTML, hydrate without console errors, and exercise one interaction.
- Recompute every file and artifact SHA-256 before using the result.
