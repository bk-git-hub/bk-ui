import { useState, useEffect, useRef, useCallback } from "react";

// 스와이프로 간주할 최소 속도 (pixels per millisecond)
const VELOCITY_THRESHOLD = 0.4;

interface DragConfig {
  onDrag: (position: number) => void;
  onDragEnd: (finalPosition: number, momentum: number) => void;
  size: number;
}

export const useDrag = (config: DragConfig) => {
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [isDragging, setIsDragging] = useState(false);

  // 드래그 위치와 속도 계산을 위한 상세 정보 추적
  const gesture = useRef({
    startTime: 0,
    startPosition: { x: 0, initialScore: 0 },
    // 마지막 몇 개의 포인트를 저장하여 속도를 계산합니다.
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
    },
    [gesture],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const { size, onDrag } = configRef.current;
      const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;

      // 속도 계산을 위해 최근 움직임 기록
      gesture.history.push({ x: currentX, time: Date.now() });
      if (gesture.history.length > 2) {
        gesture.history.shift();
      }

      const deltaX = currentX - gesture.startPosition.x;
      const dragAmount = deltaX / size;
      const newPosition = gesture.startPosition.initialScore - dragAmount;
      onDrag(newPosition);
    };

    const handleDragEnd = () => {
      const { onDragEnd, size } = configRef.current;
      const { history, startPosition } = gesture;

      // 최종 속도 계산
      const endPoint = history[history.length - 1];
      const startPoint = history[0];
      const velocity =
        (endPoint.x - startPoint.x) / (endPoint.time - startPoint.time);

      const finalPosition =
        startPosition.initialScore - (endPoint.x - startPosition.x) / size;
      let momentum = 0;

      // 속도가 임계값보다 빠르면 '스와이프'로 간주하고 운동량을 적용
      if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
        momentum = velocity * -0.2; // 속도에 기반한 운동량
      }

      onDragEnd(finalPosition, momentum);
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

  return { isDragging, handleDragStart };
};
