import { useEffect, useLayoutEffect, useRef } from "react";

interface KeyNavigationConfig {
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
    const handleKeyDown = (event: KeyboardEvent) => {
      const { target, maxIndex, setTarget } = configRef.current;
      let nextTarget = Math.round(target);

      if (event.key === "ArrowRight") {
        nextTarget = Math.min(nextTarget + 1, maxIndex);
      } else if (event.key === "ArrowLeft") {
        nextTarget = Math.max(nextTarget - 1, 0);
      } else {
        return;
      }

      if (nextTarget !== target) setTarget(nextTarget);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
};
