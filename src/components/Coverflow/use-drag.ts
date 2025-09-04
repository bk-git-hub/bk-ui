import { useState, useEffect, useRef, useCallback } from "react";

const DRAG_SENSITIVITY = 0.4;
const DRAG_THRESHOLD = 3;

interface DragConfig {
  onDrag: (position: number) => void;
  onDragEnd: (position: number) => void; // ✅ 드래그 종료 시 호출할 함수 추가
  size: number;
  maxIndex: number;
}

export const useDrag = (config: DragConfig) => {
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);

  // ✅ 애니메이션 프레임과 마지막 위치를 추적하기 위한 ref
  const animationFrameRef = useRef<number | null>(null);
  const lastPositionRef = useRef(0);

  const gesture = useRef({
    startTime: 0,
    startPosition: { x: 0, initialScore: 0 },
    history: [] as { x: number; time: number }[],
  }).current;

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, initialPosition: number) => {
      // e.preventDefault()는 handleDragMove에서 조건부로 호출되도록 이동
      const startX = "touches" in e ? e.touches[0].clientX : e.clientX;

      gesture.startPosition = { x: startX, initialScore: initialPosition };
      lastPositionRef.current = initialPosition; // ✅ 초기 위치 설정
      gesture.startTime = Date.now();
      gesture.history = [{ x: startX, time: gesture.startTime }];

      setIsDragging(true);
      setDragMoved(false);
    },
    [gesture],
  );

  useEffect(() => {
    if (!isDragging) return;

    // ✅ 애니메이션 루프 함수
    const animationLoop = () => {
      configRef.current.onDrag(lastPositionRef.current);
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    };

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const { size, maxIndex } = configRef.current;
      const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;

      const deltaX = currentX - gesture.startPosition.x;
      if (!dragMoved && Math.abs(deltaX) > DRAG_THRESHOLD) {
        setDragMoved(true);
      }

      // ✅ Passive event listener를 위해 preventDefault를 조건부로 호출
      if (Math.abs(deltaX) > DRAG_THRESHOLD) {
        e.preventDefault();
      }

      const dragAmount = deltaX / (size * DRAG_SENSITIVITY);
      let newPosition = gesture.startPosition.initialScore - dragAmount;
      newPosition = Math.max(-0.4, Math.min(newPosition, maxIndex + 0.4));

      // ✅ 실제 위치 업데이트는 ref에만 저장
      lastPositionRef.current = newPosition;
    };

    const handleDragEnd = () => {
      // ✅ 애니메이션 프레임 루프를 여기서 중지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const { onDrag, onDragEnd, maxIndex } = configRef.current; // ✅ onDragEnd 사용

      const finalPosition = Math.max(
        0,
        Math.round(Math.min(lastPositionRef.current, maxIndex)),
      );
      onDrag(finalPosition);
      onDragEnd(finalPosition); // ✅ 최종 위치로 상태 업데이트

      setIsDragging(false);
      if (dragMoved) {
        setDragMoved(false);
      }
    };

    // ✅ 드래그 시작 시 애니메이션 루프 시작
    animationFrameRef.current = requestAnimationFrame(animationLoop);

    // ✅ passive: false 옵션으로 스크롤 방지 명시
    window.addEventListener("mousemove", handleDragMove, { passive: false });
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, dragMoved]); // ✅ dragMoved 의존성 추가

  return { isDragging, dragMoved, handleDragStart };
};
