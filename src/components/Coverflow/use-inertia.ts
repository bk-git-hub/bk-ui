// src/coverflow/use-inertia.ts

import { useState, useEffect, useRef } from "react";

// --- 물리 상수 (임계 감쇠 튜닝) ---
// 탄성을 약간 낮추고, 마찰력을 매우 높여 바운스를 완전히 제거합니다.
// 이 설정이 'ease-out' 베지어 곡선과 가장 유사한 느낌을 줍니다.
const STIFFNESS = 0.17;
const DAMPING = 0.96; // 1에 매우 가깝게 설정하여 흔들림을 없앰
const PRECISION = 0.01;

export const useInertia = (
  targetValue: number,
  config = { stiffness: STIFFNESS, damping: DAMPING }, // 기본 설정을 여기서 사용
) => {
  const [currentValue, setCurrentValue] = useState(targetValue);

  const position = useRef(targetValue);
  const velocity = useRef(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    // 이제 config prop을 통해 외부에서 물리 값을 받아올 수 있습니다.
    const { stiffness, damping } = config;

    const animate = () => {
      const springForce = (targetValue - position.current) * stiffness;
      velocity.current += springForce;
      velocity.current *= damping;
      position.current += velocity.current;

      if (
        Math.abs(position.current - targetValue) < PRECISION &&
        Math.abs(velocity.current) < PRECISION
      ) {
        position.current = targetValue;
        velocity.current = 0;
        setCurrentValue(targetValue);

        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
          animationFrame.current = null;
        }
        return;
      }

      setCurrentValue(position.current);
      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [targetValue, config]);

  return currentValue;
};
