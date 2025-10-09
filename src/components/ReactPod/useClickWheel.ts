import { useRef, useState, useEffect } from "react";
import { useReactPod } from "./ReactPodContext";

const SENSITIVITY = 15;

interface UseClickWheelOptions {
  setValue: any;
}

export function useClickWheel({ setValue }: UseClickWheelOptions) {
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

    updateCenter();
    const resizeObserver = new ResizeObserver(updateCenter);
    resizeObserver.observe(wheelElement);

    window.addEventListener("scroll", updateCenter, true);

    window.addEventListener("resize", updateCenter);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateCenter, true);
      window.removeEventListener("resize", updateCenter);
    };
  }, []);

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
        setValue((prev) => prev + 1);
      } else {
        setValue((prev) => prev - 1);
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
