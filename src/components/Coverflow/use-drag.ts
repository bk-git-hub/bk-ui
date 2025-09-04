// src/components/Coverflow/use-drag.ts

import { useState, useEffect, useRef, useCallback } from "react";

// --- 설정 상수 ---
const DRAG_SENSITIVITY = 0.25; // 드래그 민감도
const DRAG_THRESHOLD = 3; // 드래그 시작으로 간주하는 최소 이동 거리 (px)
const INERTIA_MULTIPLIER = 4; // 관성 강도 계수
const FRICTION = 0.96; // 마찰 계수 (1에 가까울수록 오래 미끄러짐)
const MIN_VELOCITY = 0.01; // 애니메이션 중지 속도 임계값

interface DragConfig {
  onDrag: (position: number) => void;
  onDragEnd: (position: number) => void;
  size: number;
  maxIndex: number;
}

export const useDrag = (config: DragConfig) => {
  // config를 ref로 관리하여 리렌더링 방지
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);

  // 애니메이션 프레임과 실시간 위치/속도 추적을 위한 ref
  const animationFrameRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const velocityRef = useRef(0);

  // 제스처 관련 데이터
  const gesture = useRef({
    startTime: 0,
    startPosition: { x: 0, initialScore: 0 },
    history: [] as { x: number; time: number }[],
  }).current;

  // 드래그 시작 핸들러
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, initialPosition: number) => {
      // 기존 관성 애니메이션이 있다면 중지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startX = "touches" in e ? e.touches[0].clientX : e.clientX;

      gesture.startPosition = { x: startX, initialScore: initialPosition };
      positionRef.current = initialPosition;
      gesture.startTime = Date.now();
      // 속도 계산을 위해 제스처 기록 초기화
      gesture.history = [{ x: startX, time: gesture.startTime }];

      setIsDragging(true);
      setDragMoved(false);
      velocityRef.current = 0;
    },
    [gesture],
  );

  // 관성 스크롤 애니메이션 루프
  const inertiaLoop = useCallback(() => {
    const { onDrag, onDragEnd, maxIndex } = configRef.current;

    // 속도가 임계값보다 낮아지면 애니메이션 종료
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

    // 위치 업데이트 및 경계 처리
    const newPosition = positionRef.current + velocityRef.current;
    if (newPosition < 0 || newPosition > maxIndex) {
      velocityRef.current *= 0.5; // 경계에 닿으면 속도 급감
    }
    positionRef.current += velocityRef.current;

    // 마찰력 적용하여 속도 감속
    velocityRef.current *= FRICTION;

    onDrag(positionRef.current);
    animationFrameRef.current = requestAnimationFrame(inertiaLoop);
  }, []);

  // 드래그 중/후 이벤트 핸들러
  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      // Passive event listener를 위해 스크롤 방지를 조건부로 호출
      if (e.cancelable) e.preventDefault();

      const { size, maxIndex } = configRef.current;
      const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const currentTime = Date.now();

      // 제스처 기록 (최신 4개만 유지)
      gesture.history.push({ x: currentX, time: currentTime });
      if (gesture.history.length > 4) {
        gesture.history.shift();
      }

      const deltaX = currentX - gesture.startPosition.x;
      if (!dragMoved && Math.abs(deltaX) > DRAG_THRESHOLD) {
        setDragMoved(true);
      }

      const dragAmount = deltaX / (size * DRAG_SENSITIVITY);
      let newPosition = gesture.startPosition.initialScore - dragAmount;
      // 경계에서 약간의 여유를 줌 (0.4 -> 0.8로 증가)
      newPosition = Math.max(-0.8, Math.min(newPosition, maxIndex + 0.8));

      positionRef.current = newPosition;
      configRef.current.onDrag(positionRef.current); // 실시간 DOM 업데이트
    };

    const handleDragEnd = () => {
      setIsDragging(false);

      // 마지막 두 기록으로 속도 계산
      const last = gesture.history[gesture.history.length - 1];
      const secondLast =
        gesture.history[gesture.history.length - 2] || gesture.history[0];

      const timeDiff = last.time - secondLast.time;
      const posDiff = last.x - secondLast.x;

      if (timeDiff > 0) {
        const speed = (posDiff / timeDiff) * INERTIA_MULTIPLIER;
        // 드래그 방향과 반대이므로 속도를 뒤집어 줌
        velocityRef.current =
          (-speed / configRef.current.size) * DRAG_SENSITIVITY * 10;
      } else {
        velocityRef.current = 0;
      }

      // 관성 애니메이션 시작
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
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, dragMoved, gesture, inertiaLoop]);

  return { isDragging, dragMoved, handleDragStart };
};
