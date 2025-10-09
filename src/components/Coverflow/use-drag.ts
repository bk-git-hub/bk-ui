// src/components/Coverflow/use-drag.ts

import { useState, useEffect, useRef, useCallback } from "react";

// --- 설정 상수 ---
const DRAG_SENSITIVITY = 0.3; // 드래그 민감도
const DRAG_THRESHOLD = 2; // 드래그 시작으로 간주하는 최소 이동 거리 (px)

// ✅ 물리 효과 관련 상수
const LERP_FACTOR = 0.1; // 드래그 따라오는 부드러움 (0.1 ~ 0.2 추천)
const INERTIA_MULTIPLIER = 6; // 스와이프 관성 강도
const FRICTION = 0.96; // 마찰 계수
const MIN_VELOCITY = 0.01; // 애니메이션 중지 속도 임계값

interface DragConfig {
  onDrag: (position: number) => void;
  onDragEnd: (position: number) => void;
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

  const animationFrameRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const velocityRef = useRef(0);
  // ✅ 손가락의 목표 위치를 저장할 ref 추가
  const targetPositionRef = useRef(0);

  const gesture = useRef({
    startTime: 0,
    startPosition: { x: 0, initialScore: 0 },
    history: [] as { x: number; time: number }[],
  }).current;

  // 드래그 시작 핸들러
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, initialPosition: number) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      const startX = "touches" in e ? e.touches[0].clientX : e.clientX;

      // ✅ 위치 초기화
      positionRef.current = initialPosition;
      targetPositionRef.current = initialPosition; // 목표 위치도 함께 초기화
      velocityRef.current = 0;

      gesture.startPosition = { x: startX, initialScore: initialPosition };
      gesture.startTime = Date.now();
      gesture.history = [{ x: startX, time: gesture.startTime }];

      setIsDragging(true);
      setDragMoved(false);
    },
    [gesture],
  );

  // 관성 스크롤 애니메이션 루프 (기존 코드와 거의 동일)
  const inertiaLoop = useCallback(() => {
    const { onDrag, onDragEnd, maxIndex } = configRef.current;

    if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      const finalPosition = Math.max(
        0,
        Math.min(Math.round(positionRef.current), maxIndex),
      );
      onDragEnd(finalPosition);
      return;
    }

    const newPosition = positionRef.current + velocityRef.current;
    if (newPosition < 0 || newPosition > maxIndex) {
      velocityRef.current *= 0.5;
    }
    positionRef.current += velocityRef.current;
    velocityRef.current *= FRICTION;

    onDrag(positionRef.current);
    animationFrameRef.current = requestAnimationFrame(inertiaLoop);
  }, []);

  // 드래그 중/후 이벤트 핸들러
  useEffect(() => {
    if (!isDragging) return;

    // ✅ 드래그 중에만 실행되는 '탄성' 효과를 위한 루프
    let dragFrame: number;
    const dragLoop = () => {
      // 목표 위치와 현재 위치의 차이를 계산해서 부드럽게 따라가도록 함
      const distance = targetPositionRef.current - positionRef.current;
      positionRef.current += distance * LERP_FACTOR;
      configRef.current.onDrag(positionRef.current);
      dragFrame = requestAnimationFrame(dragLoop);
    };
    dragLoop(); // 드래그 시작 시 루프 실행

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const { size, maxIndex } = configRef.current;
      const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;

      gesture.history.push({ x: currentX, time: Date.now() });
      if (gesture.history.length > 4) gesture.history.shift();

      const deltaX = currentX - gesture.startPosition.x;
      if (!dragMoved && Math.abs(deltaX) > DRAG_THRESHOLD) {
        setDragMoved(true);
      }

      // ✅ 중요: 실제 위치(positionRef) 대신 목표 위치(targetPositionRef)만 업데이트
      const dragAmount = deltaX / (size * DRAG_SENSITIVITY);
      let newTarget = gesture.startPosition.initialScore - dragAmount;
      newTarget = Math.max(-0.8, Math.min(newTarget, maxIndex + 0.8));
      targetPositionRef.current = newTarget;
    };

    const handleDragEnd = () => {
      setIsDragging(false);

      // ✅ handleDragEnd가 호출되면 dragLoop는 자연스럽게 멈춤 (아래 return에서)

      // 마지막 두 기록으로 속도 계산 (기존 로직과 동일)
      const last = gesture.history[gesture.history.length - 1];
      const secondLast =
        gesture.history[gesture.history.length - 2] || gesture.history[0];
      const timeDiff = last.time - secondLast.time;
      const posDiff = last.x - secondLast.x;

      if (timeDiff > 0) {
        const speed = (posDiff / timeDiff) * INERTIA_MULTIPLIER;
        velocityRef.current =
          (-speed / configRef.current.size) * DRAG_SENSITIVITY * 10;
      } else {
        velocityRef.current = 0;
      }

      // 관성 애니메이션 시작 (기존 로직과 동일)
      inertiaLoop();

      if (dragMoved) {
        setTimeout(() => setDragMoved(false), 0);
      }
    };

    window.addEventListener("mousemove", handleDragMove, { passive: false });
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      // ✅ 드래그가 끝나면 '탄성' 루프를 반드시 정리
      cancelAnimationFrame(dragFrame);
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, dragMoved, gesture, inertiaLoop]);

  return { isDragging, dragMoved, handleDragStart };
};
