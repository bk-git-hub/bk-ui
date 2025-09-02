import { useEffect, useRef } from "react";

interface WheelEventConfig {
  containerRef: React.RefObject<HTMLDivElement | null>;
  setTarget: (updater: number | ((prev: number) => number)) => void;
  size: number;
  maxIndex: number;
}

export const useWheelEvent = (config: WheelEventConfig) => {
  const { containerRef, setTarget, size, maxIndex } = config;

  // 이 훅은 스크롤 위치와 관련된 상태를 내부적으로 모두 관리합니다.
  const scrollPosition = useRef(0);
  const scrollEndTimer = useRef<number | null>(null);
  const lastScrollDelta = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }

      let currentDelta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const scrollAmount = e.deltaX / (size * 1.5);
        scrollPosition.current += scrollAmount;
        currentDelta = scrollAmount;
      } else {
        const scrollAmount = (e.deltaY * 1.5) / size;
        scrollPosition.current += scrollAmount;
        currentDelta = scrollAmount;
      }

      lastScrollDelta.current = currentDelta;
      scrollPosition.current = Math.max(
        -0.4,
        Math.min(scrollPosition.current, maxIndex + 0.4),
      );

      // 부모 컴포넌트의 target 상태를 업데이트합니다.
      setTarget(scrollPosition.current);

      if (scrollPosition.current < 0 || scrollPosition.current > maxIndex) {
        setTarget(scrollPosition.current < 0 ? 0 : maxIndex);
        return;
      }

      scrollEndTimer.current = window.setTimeout(() => {
        const position = scrollPosition.current;
        const snappedTarget = Math.round(position);
        const finalTarget = Math.max(0, Math.min(snappedTarget, maxIndex));
        scrollPosition.current = finalTarget;
        setTarget(finalTarget);
      }, 20);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [size, maxIndex, containerRef, setTarget]);
};
