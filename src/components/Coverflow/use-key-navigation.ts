import { useEffect } from "react";

interface KeyNavigationConfig {
  setTarget: (updater: number | ((prev: number) => number)) => void;
  target: number;
  maxIndex: number;
}

export const useKeyNavigation = (config: KeyNavigationConfig) => {
  const { setTarget, target, maxIndex } = config;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 현재 target 값을 반올림하여 정수 인덱스에서 시작하도록 보장합니다.
      let newTarget = Math.round(target);

      if (e.key === "ArrowRight") {
        newTarget = Math.min(newTarget + 1, maxIndex);
      } else if (e.key === "ArrowLeft") {
        newTarget = Math.max(newTarget - 1, 0);
      } else {
        // 좌우 화살표 키가 아니면 아무것도 하지 않습니다.
        return;
      }

      // 실제 target이 변경되었을 때만 상태 업데이트를 호출합니다.
      if (newTarget !== target) {
        setTarget(newTarget);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [target, maxIndex, setTarget]); // 의존성 배열에 필요한 모든 값을 명시합니다.
};
