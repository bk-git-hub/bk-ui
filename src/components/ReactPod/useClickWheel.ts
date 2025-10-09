import { useRef, useState, useEffect } from "react";
import { useReactPod } from "./ReactPodContext";

const SENSITIVITY = 15;

export function useClickWheel() {
  const { setIndex } = useReactPod();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastAngle = useRef<number>(0);
  const accumulatedAngle = useRef<number>(0);
  const center = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    const wheelElement = wheelRef.current;
    if (!wheelElement) return;

    const updateCenter = () => {
      const rect = wheelElement.getBoundingClientRect();
      center.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    updateCenter(); // 최초 실행

    // --- 위치/크기 변경 감지 로직 ---
    // 1. 요소 자체의 크기 변경 감지
    const resizeObserver = new ResizeObserver(updateCenter);
    resizeObserver.observe(wheelElement);

    // 2. 창 스크롤 감지
    window.addEventListener("scroll", updateCenter, true);

    // 3. 창 크기 재조정 감지 (추가된 부분)
    window.addEventListener("resize", updateCenter);

    // --- 클린업 함수 ---
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateCenter, true);
      window.removeEventListener("resize", updateCenter); // 리스너 제거
    };
  }, []); // 의존성 배열이 비어있으므로, 최초 1회만 실행됨

  // ... (getAngle, onPointerDown, onPointerMove 등 나머지 코드는 동일)
  const getAngle = (event: React.PointerEvent<HTMLDivElement>): number => {
    return (
      Math.atan2(
        event.clientY - center.current.y,
        event.clientX - center.current.x,
      ) *
      (180 / Math.PI)
    );
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const angle = getAngle(e);
    lastAngle.current = angle;
    accumulatedAngle.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentAngle = getAngle(e);
    let delta = currentAngle - lastAngle.current;
    lastAngle.current = currentAngle;

    if (Math.abs(delta) > 180) {
      delta = delta > 0 ? delta - 360 : delta + 360;
    }
    accumulatedAngle.current += delta;

    if (Math.abs(accumulatedAngle.current) >= SENSITIVITY) {
      if (accumulatedAngle.current > 0) {
        setIndex((prev) => prev + 1); // Context의 setIndex 직접 호출
      } else {
        setIndex((prev) => prev - 1); // Context의 setIndex 직접 호출
      }
      accumulatedAngle.current = 0;
    }
  };

  const onPointerUpOrLeave = () => setIsDragging(false);

  return {
    wheelRef,
    wheelProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerUpOrLeave,
      onPointerLeave: onPointerUpOrLeave,
    },
  };
}
