import { useEffect, useLayoutEffect, useRef } from "react";

interface KeyNavigationConfig {
  containerRef: React.RefObject<HTMLDivElement | null>;
  setTarget: React.Dispatch<React.SetStateAction<number>>;
  target: number;
  maxIndex: number;
}

export const useKeyNavigation = (config: KeyNavigationConfig) => {
  const configRef = useRef(config);

  useLayoutEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    const container = config.containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { target, maxIndex, setTarget } = configRef.current;
      const eventTarget = event.target;
      const isCarouselTarget =
        eventTarget instanceof Element &&
        (eventTarget.matches('[data-slot="coverflow-viewport"]') ||
          eventTarget.closest('[data-slot="coverflow-flip-trigger"]') !== null);
      if (event.defaultPrevented || !isCarouselTarget) return;

      let nextTarget = Math.round(target);

      if (event.key === "ArrowRight") {
        nextTarget = Math.min(nextTarget + 1, maxIndex);
      } else if (event.key === "ArrowLeft") {
        nextTarget = Math.max(nextTarget - 1, 0);
      } else {
        return;
      }

      event.preventDefault();
      if (nextTarget !== target) setTarget(nextTarget);
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [config.containerRef]);
};
