import { useState, useEffect, useRef } from "react";

// --- Physics Constants ---
const STIFFNESS = 0.1;
const DAMPING = 0.8;
const PRECISION = 0.01;

export const useInertia = (targetValue: number) => {
  const [currentValue, setCurrentValue] = useState(targetValue);

  const position = useRef(targetValue);
  const velocity = useRef(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      const springForce = (targetValue - position.current) * STIFFNESS;
      velocity.current += springForce;
      velocity.current *= DAMPING;
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
  }, [targetValue]);

  return currentValue;
};
