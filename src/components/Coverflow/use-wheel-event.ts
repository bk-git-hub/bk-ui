import { useEffect, useRef } from "react";

interface WheelEventConfig {
  containerRef: React.RefObject<HTMLDivElement | null>;
  positionRef: React.RefObject<number>;
  onScroll: (position: number) => void; // 스크롤 중 DOM 업데이트
  onScrollEnd?: (index: number) => void; // 스크롤 끝났을 때 React state 업데이트
  size: number;
  maxIndex: number;
}

export const useWheelEvent = (config: WheelEventConfig) => {
  const {
    positionRef: scrollPosition,
    containerRef,
    onScroll,
    onScrollEnd,
    size,
    maxIndex,
  } = config;

  const scrollEndTimer = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }

      let scrollAmount = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        scrollAmount = e.deltaX / (size * 1.5);
      } else {
        scrollAmount = (e.deltaY * 1.5) / size;
      }

      scrollPosition.current += scrollAmount;
      scrollPosition.current = Math.max(
        -0.4,
        Math.min(scrollPosition.current, maxIndex + 0.4),
      );

      // ✅ 스크롤 중에는 DOM만 업데이트
      onScroll(scrollPosition.current);

      // ✅ 스크롤이 끝난 후 스냅 처리 (React state 업데이트)
      scrollEndTimer.current = window.setTimeout(() => {
        const snapped = Math.round(scrollPosition.current);
        const finalTarget = Math.max(0, Math.min(snapped, maxIndex));
        scrollPosition.current = finalTarget;

        if (onScrollEnd) {
          onScrollEnd(finalTarget);
        }
      }, 100); // 100ms 후 스냅
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [size, maxIndex, containerRef, onScroll, onScrollEnd, scrollPosition]);
};
