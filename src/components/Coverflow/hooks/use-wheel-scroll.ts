import { useEffect, useRef } from "react";

interface WheelScrollConfig {
  onScroll: (delta: number) => void;
  onScrollEnd: (finalPosition: number, momentum: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  size: number;
  isEnabled: boolean;
  // 상한선을 설정하기 위한 maxIndex 파라미터 추가
  maxIndex: number;
}

export const useWheelScroll = (config: WheelScrollConfig) => {
  const { onScroll, onScrollEnd, containerRef, size, isEnabled, maxIndex } =
    config;
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

      const newPosition = scrollPosition.current + currentDelta;

      // **수정된 부분:** 스크롤 위치가 0과 maxIndex 사이를 벗어나지 않도록 제한합니다.
      scrollPosition.current = Math.max(0, Math.min(newPosition, maxIndex));

      onScroll(scrollPosition.current);

      scrollEndTimer.current = window.setTimeout(() => {
        onScrollEnd(scrollPosition.current, lastScrollDelta.current);
      }, 50);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
    // 의존성 배열에 maxIndex 추가
  }, [containerRef, size, isEnabled, onScroll, onScrollEnd, maxIndex]);

  return {
    setScrollPosition: (pos: number) => {
      scrollPosition.current = pos;
    },
  };
};
