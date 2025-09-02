import { useEffect, useRef } from "react";

interface WheelScrollConfig {
  onScroll: (delta: number) => void;
  onScrollEnd: (finalPosition: number, momentum: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  size: number;
  isEnabled: boolean;
}

export const useWheelScroll = (config: WheelScrollConfig) => {
  const { onScroll, onScrollEnd, containerRef, size, isEnabled } = config;
  const scrollEndTimer = useRef<number | null>(null);
  const lastScrollDelta = useRef(0);
  const scrollPosition = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isEnabled) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);

      let currentDelta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        currentDelta = e.deltaX / (size * 1.5);
      } else {
        currentDelta = (e.deltaY * 1.5) / size;
      }
      lastScrollDelta.current = currentDelta;
      scrollPosition.current += currentDelta;
      onScroll(scrollPosition.current);

      scrollEndTimer.current = window.setTimeout(() => {
        onScrollEnd(scrollPosition.current, lastScrollDelta.current);
      }, 50);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [containerRef, size, isEnabled, onScroll, onScrollEnd]);

  // Expose the internal position for synchronization
  return {
    setScrollPosition: (pos: number) => {
      scrollPosition.current = pos;
    },
  };
};
