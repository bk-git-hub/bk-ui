import { useEffect, useRef } from "react";

const STIFFNESS = 0.17;
const DAMPING = 0.1;
const PRECISION = 0.01;

export const useInertia = (
  onUpdate: (value: number) => void, // Callback to update the parent's state
  config = { stiffness: STIFFNESS, damping: DAMPING },
) => {
  const position = useRef(0);
  const velocity = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const startTime = useRef(Date.now());
  const target = useRef(0);

  const startAnimation = (newTarget: number) => {
    target.current = newTarget;
    startTime.current = Date.now();

    const animate = () => {
      const springForce =
        (target.current - position.current) * config.stiffness;
      velocity.current += springForce;
      velocity.current *= config.damping;
      position.current += velocity.current;

      if (
        Math.abs(position.current - target.current) < PRECISION &&
        Math.abs(velocity.current) < PRECISION
      ) {
        position.current = target.current;
        velocity.current = 0;
        onUpdate(target.current);
        if (animationFrame.current)
          cancelAnimationFrame(animationFrame.current);
        return;
      }

      onUpdate(position.current);
      animationFrame.current = requestAnimationFrame(animate);
    };

    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    animate();
  };

  // Expose a way to set the position instantly, without animation
  const setPosition = (newPosition: number) => {
    position.current = newPosition;
    target.current = newPosition;
    onUpdate(newPosition);
  };

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    },
    [],
  );

  return { startAnimation, setPosition };
};
