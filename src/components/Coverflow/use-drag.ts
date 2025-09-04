import { useState, useEffect, useRef, useCallback } from "react";

const DRAG_SENSITIVITY = 0.4;
// 드래그로 간주할 최소 이동 거리(px)
const DRAG_THRESHOLD = 2;

interface DragConfig {
  onDrag: (position: number) => void;
  size: number;
  maxIndex: number;
}

export const useDrag = (config: DragConfig) => {
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false); // ✅ 클릭 차단 여부 플래그

  const gesture = useRef({
    startTime: 0,
    startPosition: { x: 0, initialScore: 0 },
    history: [] as { x: number; time: number }[],
  }).current;

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, initialPosition: number) => {
      e.preventDefault();
      const startX = "touches" in e ? e.touches[0].clientX : e.clientX;

      gesture.startPosition = { x: startX, initialScore: initialPosition };
      gesture.startTime = Date.now();
      gesture.history = [{ x: startX, time: gesture.startTime }];

      setIsDragging(true);
      setDragMoved(false); // 시작 시 리셋
    },
    [gesture],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const { size, onDrag, maxIndex } = configRef.current;
      const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;

      gesture.history.push({ x: currentX, time: Date.now() });
      if (gesture.history.length > 2) {
        gesture.history.shift();
      }

      const deltaX = currentX - gesture.startPosition.x;

      // ✅ 최소 이동 거리 넘었을 때만 드래그로 인정
      if (Math.abs(deltaX) > DRAG_THRESHOLD) {
        setDragMoved(true);
      }

      const dragAmount = deltaX / (size * DRAG_SENSITIVITY);
      let newPosition = gesture.startPosition.initialScore - dragAmount;
      newPosition = Math.max(-0.4, Math.min(newPosition, maxIndex + 0.4));
      onDrag(newPosition);
    };

    const handleDragEnd = () => {
      const { onDrag, size, maxIndex } = configRef.current;
      const { history, startPosition } = gesture;

      const endPoint = history[history.length - 1];

      let finalPosition =
        startPosition.initialScore -
        (endPoint.x - startPosition.x) / (size * DRAG_SENSITIVITY);

      finalPosition = Math.max(
        0,
        Math.round(Math.min(finalPosition, maxIndex)),
      );

      onDrag(finalPosition);
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

  // ✅ 외부에서 클릭 막을 수 있도록 플래그 반환
  return { isDragging, dragMoved, handleDragStart };
};
