import { useEffect } from "react";

interface KeyboardNavConfig {
  onNavigate: (newTarget: number) => void;
  target: number;
  maxIndex: number;
  isEnabled: boolean;
}

export const useKeyboardNavigation = (config: KeyboardNavConfig) => {
  const { onNavigate, target, maxIndex, isEnabled } = config;

  useEffect(() => {
    if (!isEnabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      let newTarget = Math.round(target);
      if (e.key === "ArrowRight") {
        newTarget = Math.min(newTarget + 1, maxIndex);
      } else if (e.key === "ArrowLeft") {
        newTarget = Math.max(newTarget - 1, 0);
      }
      if (newTarget !== target) {
        onNavigate(newTarget);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [target, maxIndex, isEnabled, onNavigate]);
};
