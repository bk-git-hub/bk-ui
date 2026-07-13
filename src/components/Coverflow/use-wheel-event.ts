import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface WheelEventConfig {
  containerRef: React.RefObject<HTMLDivElement | null>;
  positionRef: React.RefObject<number>;
  onScroll: React.Dispatch<number>;
  onScrollEnd?: React.Dispatch<number>;
  size: number;
  maxIndex: number;
}

export const useWheelEvent = (config: WheelEventConfig) => {
  const configRef = useRef(config);
  const containerRef = config.containerRef;
  const cancelPendingRef = useRef<() => void>(() => undefined);
  const cancelPending = useCallback(() => cancelPendingRef.current(), []);

  useLayoutEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pendingDelta = 0;
    let animationFrame: number | null = null;
    let scrollEndTimer: number | null = null;
    const cancelCurrentScroll = () => {
      pendingDelta = 0;
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      if (scrollEndTimer !== null) {
        clearTimeout(scrollEndTimer);
        scrollEndTimer = null;
      }
    };
    cancelPendingRef.current = cancelCurrentScroll;

    const flushPendingScroll = () => {
      animationFrame = null;
      if (pendingDelta === 0) return;

      const { positionRef, maxIndex, onScroll } = configRef.current;
      positionRef.current = Math.max(
        -0.4,
        Math.min(positionRef.current + pendingDelta, maxIndex + 0.4),
      );
      pendingDelta = 0;
      onScroll(positionRef.current);
    };

    const scheduleScroll = () => {
      if (animationFrame !== null) return;
      animationFrame = requestAnimationFrame(flushPendingScroll);
    };

    const finishScroll = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        flushPendingScroll();
      }

      const { positionRef, maxIndex, onScrollEnd } = configRef.current;
      const finalTarget = Math.max(
        0,
        Math.min(Math.round(positionRef.current), maxIndex),
      );
      positionRef.current = finalTarget;
      onScrollEnd?.(finalTarget);
      scrollEndTimer = null;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { size } = configRef.current;
      pendingDelta +=
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX / (size * 1.5)
          : (event.deltaY * 1.5) / size;
      scheduleScroll();

      if (scrollEndTimer !== null) clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(finishScroll, 100);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      cancelCurrentScroll();
      cancelPendingRef.current = () => undefined;
    };
  }, [containerRef]);
  return cancelPending;
};
