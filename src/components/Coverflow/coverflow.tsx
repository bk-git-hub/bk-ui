import React, {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { twMerge } from "tailwind-merge";
import { Util as CoverUtil } from "./coverflow.util";
import { CoverflowInteractionContext } from "./coverflow-context";
import { useWheelEvent } from "./use-wheel-event";
import { useKeyNavigation } from "./use-key-navigation";
import { useDrag } from "./use-drag";

const RENDER_RADIUS = 8;
const WINDOW_SIZE = RENDER_RADIUS * 2 + 1;
const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

const getWindowStart = (position: number, itemCount: number) =>
  Math.min(
    Math.max(Math.round(position) - RENDER_RADIUS, 0),
    Math.max(0, itemCount - WINDOW_SIZE),
  );

const getChildKey = (child: React.ReactNode, index: number) =>
  React.isValidElement(child) && child.key !== null
    ? child.key
    : `coverflow-${index}`;

export const Coverflow = ({
  children,
  className,
  ...props
}: CoverflowProps) => {
  const [size, setSize] = useState(200);
  const [index, setIndex] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const [flippedKey, setFlippedKey] = useState<React.Key | null>(null);
  const positionRef = useRef(0);
  const windowStartRef = useRef(0);
  const pendingAnimationRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<number, HTMLDivElement>());

  const childrenArray = useMemo(() => Children.toArray(children), [children]);
  const itemCount = childrenArray.length;
  const maxIndex = Math.max(0, itemCount - 1);
  const activeChild = childrenArray[index];
  const activeKey =
    activeChild === undefined ? null : getChildKey(activeChild, index);

  const coverUtil = useMemo(() => new CoverUtil(size), [size]);

  const updateTransforms = useCallback(
    (animate = false, duration = 0.3) => {
      const position = positionRef.current;
      const transition =
        animate && !reducedMotionRef.current
          ? `transform ${duration}s ease-out`
          : "none";

      for (const [itemIndex, item] of itemRefs.current) {
        const display =
          Math.abs(position - itemIndex) <= RENDER_RADIUS ? "block" : "none";
        if (item.style.display !== display) {
          item.style.display = display;
        }

        const willChange = display === "block" ? "transform" : "auto";
        if (item.style.willChange !== willChange) {
          item.style.willChange = willChange;
        }
        if (display === "none") continue;

        const transform = coverUtil.getTransform(
          itemIndex - position,
        ).transform;
        const zIndex = String(
          itemCount - Math.abs(Math.round(position) - itemIndex),
        );

        if (item.style.transition !== transition) {
          item.style.transition = transition;
        }
        if (item.style.transform !== transform) {
          item.style.transform = transform;
        }
        if (item.style.zIndex !== zIndex) item.style.zIndex = zIndex;
      }
    },
    [coverUtil, itemCount],
  );

  const syncWindow = useCallback(
    (position: number, animate: boolean) => {
      const nextWindowStart = getWindowStart(position, itemCount);
      if (nextWindowStart === windowStartRef.current) return false;

      windowStartRef.current = nextWindowStart;
      pendingAnimationRef.current = animate;
      setWindowStart(nextWindowStart);
      return true;
    },
    [itemCount],
  );

  const applyPosition = useCallback(
    (position: number, animate = false) => {
      positionRef.current = position;
      syncWindow(position, animate);
      updateTransforms(animate);
    },
    [syncWindow, updateTransforms],
  );

  const navigateTo = useCallback(
    (target: number) => {
      const nextIndex = Math.max(0, Math.min(Math.round(target), maxIndex));
      applyPosition(nextIndex, true);
      setIndex(nextIndex);
    },
    [applyPosition, maxIndex],
  );

  const registerItem = useCallback(
    (itemIndex: number, item: HTMLDivElement | null) => {
      if (!item) {
        itemRefs.current.delete(itemIndex);
        return;
      }

      itemRefs.current.set(itemIndex, item);
      item.style.display =
        Math.abs(positionRef.current - itemIndex) <= RENDER_RADIUS
          ? "block"
          : "none";
      item.style.willChange =
        item.style.display === "block" ? "transform" : "auto";
      item.style.transition = "none";
      item.style.transform = coverUtil.getTransform(
        itemIndex - positionRef.current,
      ).transform;
      item.style.zIndex = String(
        itemCount - Math.abs(Math.round(positionRef.current) - itemIndex),
      );
    },
    [coverUtil, itemCount],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      reducedMotionRef.current = mediaQuery.matches;
    };
    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const nextSize = getSize(entries[0].contentRect.width);
      setSize((currentSize) =>
        currentSize === nextSize ? currentSize : nextSize,
      );
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setFlippedKey((currentKey) =>
      currentKey !== null && currentKey !== activeKey ? null : currentKey,
    );
  }, [activeKey]);

  useLayoutEffect(() => {
    updateTransforms(pendingAnimationRef.current);
    pendingAnimationRef.current = false;
  }, [size, updateTransforms, windowStart]);

  useLayoutEffect(() => {
    const nextIndex = Math.min(index, maxIndex);
    if (nextIndex !== index) {
      setFlippedKey(null);
      navigateTo(nextIndex);
      return;
    }

    const nextWindowStart = getWindowStart(positionRef.current, itemCount);
    if (nextWindowStart !== windowStartRef.current) {
      windowStartRef.current = nextWindowStart;
      setWindowStart(nextWindowStart);
    }
  }, [index, itemCount, maxIndex, navigateTo]);

  const cancelWheel = useWheelEvent({
    containerRef,
    positionRef,
    size,
    maxIndex,
    onScroll: (position) => {
      setFlippedKey(null);
      applyPosition(position);
    },
    onScrollEnd: navigateTo,
  });

  const { consumeDragClick, handleDragStart } = useDrag({
    size,
    reducedMotionRef,
    maxIndex,
    onDragStart: cancelWheel,
    onDrag: (position) => {
      if (position !== positionRef.current) setFlippedKey(null);
      applyPosition(position);
    },
    onDragEnd: navigateTo,
  });

  const activateItem = useCallback(
    (itemIndex: number, itemKey: React.Key) => {
      cancelWheel();
      const currentIndex = Math.max(
        0,
        Math.min(Math.round(positionRef.current), maxIndex),
      );
      if (itemIndex !== currentIndex) {
        setFlippedKey(null);
        navigateTo(itemIndex);
        return;
      }

      navigateTo(itemIndex);
      setFlippedKey((currentKey) => (currentKey === itemKey ? null : itemKey));
    },
    [cancelWheel, maxIndex, navigateTo],
  );

  const centerItem = useCallback(
    (itemIndex: number) => {
      if (consumeDragClick()) return;

      cancelWheel();
      const currentIndex = Math.max(
        0,
        Math.min(Math.round(positionRef.current), maxIndex),
      );
      if (itemIndex !== currentIndex) setFlippedKey(null);
      navigateTo(itemIndex);
    },
    [cancelWheel, consumeDragClick, maxIndex, navigateTo],
  );

  const setKeyboardTarget = useCallback(
    (target: React.SetStateAction<number>) => {
      const nextTarget =
        typeof target === "function" ? target(positionRef.current) : target;
      cancelWheel();
      setFlippedKey(null);
      navigateTo(nextTarget);
      requestAnimationFrame(() => {
        itemRefs.current
          .get(nextTarget)
          ?.querySelector<HTMLButtonElement>(
            '[data-slot="coverflow-flip-trigger"]',
          )
          ?.focus();
      });
    },
    [cancelWheel, navigateTo],
  );

  useKeyNavigation({
    containerRef,
    setTarget: setKeyboardTarget,
    target: index,
    maxIndex,
  });

  const visibleItems = useMemo(
    () =>
      childrenArray
        .slice(windowStart, windowStart + WINDOW_SIZE)
        .map((child, offset) => ({
          child,
          itemIndex: windowStart + offset,
        })),
    [childrenArray, windowStart],
  );

  return (
    <div
      {...props}
      ref={containerRef}
      data-slot="coverflow"
      role={props.role ?? "region"}
      aria-roledescription={props["aria-roledescription"] ?? "carousel"}
      aria-label={props["aria-label"] ?? "Coverflow"}
      className={twMerge("w-full", className)}
    >
      <div
        data-slot="coverflow-viewport"
        role="group"
        aria-label="Coverflow navigation"
        tabIndex={0}
        className="relative mx-auto touch-none outline-none focus-visible:ring-4 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        style={{ height: size, width: size, perspective: "600px" }}
        onMouseDown={(event) => handleDragStart(event, positionRef.current)}
        onTouchStart={(event) => handleDragStart(event, positionRef.current)}
      >
        {visibleItems.map(({ child, itemIndex }) => {
          const itemKey = getChildKey(child, itemIndex);
          const isActive = itemIndex === index;
          const isFlipped = isActive && flippedKey === itemKey;

          return (
            <CoverflowInteractionContext.Provider
              key={itemKey}
              value={{
                isActive,
                isFlipped,
                activate: () => activateItem(itemIndex, itemKey),
                deactivate: () =>
                  setFlippedKey((currentKey) =>
                    currentKey === itemKey ? null : currentKey,
                  ),
                consumePendingClick: consumeDragClick,
              }}
            >
              <div
                data-slot="coverflow-card"
                data-active={isActive}
                data-flipped={isFlipped}
                ref={(item) => registerItem(itemIndex, item)}
                className="absolute top-0 left-0 cursor-pointer"
                style={{
                  width: size,
                  height: size,
                }}
                onClick={() => centerItem(itemIndex)}
              >
                {child}
              </div>
            </CoverflowInteractionContext.Provider>
          );
        })}
      </div>
    </div>
  );
};

export interface CoverflowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: React.ReactNode;
}
