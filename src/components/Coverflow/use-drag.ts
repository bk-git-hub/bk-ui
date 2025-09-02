import { useState, useEffect, useRef, useCallback } from "react";

interface DragConfig {
  onDragEnd: (finalPosition: number, momentum: number) => void;
  size: number;
}

export const useDrag = (config: DragConfig) => {
  // We memoize the config to prevent the useEffect from re-running unnecessarily
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [isDragging, setIsDragging] = useState(false);
  const position = useRef(0);
  const startPosition = useRef({ x: 0, initialScore: 0 });
  const lastDelta = useRef(0);
  const [, forceRender] = useState(0);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, initialPosition: number) => {
      e.preventDefault();
      const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
      startPosition.current = { x: startX, initialScore: initialPosition };
      position.current = initialPosition;
      lastDelta.current = 0;
      setIsDragging(true);
    },
    [],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const { size } = configRef.current;
      const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const deltaX = currentX - startPosition.current.x;
      const dragAmount = deltaX / size;

      lastDelta.current = -dragAmount * 0.1;
      position.current = startPosition.current.initialScore - dragAmount;

      forceRender((p) => p + 1);
    };

    const handleDragEnd = () => {
      // This function now has access to the latest position.current
      // because it's defined inside the same effect scope.
      const { onDragEnd } = configRef.current;
      onDragEnd(position.current, lastDelta.current);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("touchmove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging]); // The effect now only depends on the isDragging state

  return {
    isDragging,
    dragPosition: position.current,
    handleDragStart,
  };
};
