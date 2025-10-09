import { useRef, useState } from "react";
import { useReactPod } from "./ReactPodContext";

const SENSITIVITY = 15;

export function useClickWheel() {
  const { setIndex } = useReactPod();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastAngle = useRef<number>(0);
  const accumulatedAngle = useRef<number>(0);

  const getAngle = (event: React.PointerEvent<HTMLDivElement>): number => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return (
      Math.atan2(event.clientY - centerY, event.clientX - centerX) *
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
