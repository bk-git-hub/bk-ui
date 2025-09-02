import { useState, useEffect, useRef } from "react";

// Default physics configuration
const DEFAULT_CONFIG = {
  stiffness: 0.1,
  damping: 0.8,
};
const PRECISION = 0.01;

// The hook now accepts an optional config object
export const useInertia = (targetValue: number, config = DEFAULT_CONFIG) => {
  const [currentValue, setCurrentValue] = useState(targetValue);

  const position = useRef(targetValue);
  const velocity = useRef(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    // Use the passed-in config or the default
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
  }, [targetValue, config]); // Re-run effect if the config changes

  return currentValue;
};
