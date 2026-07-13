import React, {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";
import { useWheelEvent } from "./use-wheel-event";
import { useKeyNavigation } from "./use-key-navigation.ts";
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

export const Coverflow = ({ children }: CoverflowProps) => {
  const [size, setSize] = useState(200);
  const [index, setIndex] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const positionRef = useRef(0);
  const windowStartRef = useRef(0);
  const pendingAnimationRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<number, HTMLDivElement>());

  const childrenArray = useMemo(() => Children.toArray(children), [children]);
  const itemCount = childrenArray.length;
  const maxIndex = Math.max(0, itemCount - 1);
  const coverUtil = useMemo(() => new CoverUtil(size), [size]);

  const updateTransforms = useCallback(
    (animate = false, duration = 0.3) => {
      const position = positionRef.current;
      const transition = animate ? `transform ${duration}s ease-out` : "none";

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
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const nextSize = getSize(entries[0].contentRect.width);
      setSize((currentSize) =>
        currentSize === nextSize ? currentSize : nextSize,
      );
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    updateTransforms(pendingAnimationRef.current);
    pendingAnimationRef.current = false;
  }, [size, updateTransforms, windowStart]);

  useLayoutEffect(() => {
    const nextIndex = Math.min(index, maxIndex);
    if (nextIndex !== index) {
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
    onScroll: (position) => applyPosition(position),
    onScrollEnd: navigateTo,
  });

  const { consumeDragClick, handleDragStart } = useDrag({
    size,
    maxIndex,
    onDragStart: cancelWheel,
    onDrag: (position) => applyPosition(position),
    onDragEnd: navigateTo,
  });

  const setKeyboardTarget = useCallback(
    (target: React.SetStateAction<number>) => {
      cancelWheel();
      navigateTo(
        typeof target === "function" ? target(positionRef.current) : target,
      );
    },
    [cancelWheel, navigateTo],
  );

  useKeyNavigation({
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
    <div ref={containerRef} className="w-full">
      <div
        className="relative mx-auto touch-none"
        style={{ height: size, width: size, perspective: "600px" }}
        onMouseDown={(event) => handleDragStart(event, positionRef.current)}
        onTouchStart={(event) => handleDragStart(event, positionRef.current)}
      >
        {visibleItems.map(({ child, itemIndex }) => (
          <div
            key={getChildKey(child, itemIndex)}
            ref={(item) => registerItem(itemIndex, item)}
            className="absolute top-0 left-0 cursor-pointer"
            style={{
              width: size,
              height: size,
            }}
            onClick={() => {
              if (consumeDragClick()) return;
              cancelWheel();
              navigateTo(itemIndex);
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

interface CoverflowProps {
  children: React.ReactNode;
}
