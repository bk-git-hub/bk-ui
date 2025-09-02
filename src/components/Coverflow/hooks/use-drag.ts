import { useState, useEffect, useRef, useCallback } from "react";

interface DragConfig {
  onDragEnd: (finalPosition: number, momentum: number) => void;
  onDrag: (position: number) => void;
  size: number;
}

export const useDrag = (config: DragConfig) => {
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [isDragging, setIsDragging] = useState(false);
  const position = useRef(0);
  const startPosition = useRef({ x: 0, initialScore: 0 });
  const lastDelta = useRef(0);

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
      const { size, onDrag } = configRef.current;
      const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const deltaX = currentX - startPosition.current.x;
      const dragAmount = deltaX / size;

      lastDelta.current = -dragAmount * 0.1;
      position.current = startPosition.current.initialScore - dragAmount;
      onDrag(position.current);
    };

    const handleDragEnd = () => {
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
  }, [isDragging]);

  return { isDragging, dragPosition: position.current, handleDragStart };
};
