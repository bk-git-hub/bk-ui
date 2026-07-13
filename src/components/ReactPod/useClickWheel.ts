import {
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

const SENSITIVITY = 15;
const DRAG_THRESHOLD = 4;
type RotationDirection = -1 | 1;
// The base ESLint rule cannot distinguish type-only function parameters.
// eslint-disable-next-line no-unused-vars
type RotateHandler = (direction: RotationDirection) => void;

interface UseClickWheelOptions {
  onRotate: RotateHandler;
}

export function useClickWheel({ onRotate }: UseClickWheelOptions) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const activePointerId = useRef<number | null>(null);
  const lastAngle = useRef<number>(0);
  const accumulatedAngle = useRef<number>(0);
  const travelledAngle = useRef<number>(0);
  const didDrag = useRef(false);
  const suppressClick = useRef(false);
  const dragOriginButton = useRef<HTMLButtonElement | null>(null);
  const suppressedButton = useRef<HTMLButtonElement | null>(null);
  const clickResetTimer = useRef<number | null>(null);
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
      if (clickResetTimer.current !== null) {
        window.clearTimeout(clickResetTimer.current);
      }
    };
  }, []);

  const getAngle = (event: ReactPointerEvent<HTMLDivElement>): number => {
    return (
      Math.atan2(
        event.clientY - center.current.y,
        event.clientX - center.current.x,
      ) *
      (180 / Math.PI)
    );
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    const targetButton =
      target instanceof Element ? target.closest("button") : null;
    if (
      (event.pointerType === "mouse" && event.button !== 0) ||
      activePointerId.current !== null ||
      (targetButton instanceof HTMLButtonElement &&
        !targetButton.hasAttribute("data-wheel-drag"))
    ) {
      return;
    }

    if (clickResetTimer.current !== null) {
      window.clearTimeout(clickResetTimer.current);
      clickResetTimer.current = null;
    }
    suppressClick.current = false;
    suppressedButton.current = null;
    dragOriginButton.current =
      targetButton instanceof HTMLButtonElement ? targetButton : null;

    isDragging.current = true;
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const rect = event.currentTarget.getBoundingClientRect();
    center.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const angle = getAngle(event);
    lastAngle.current = angle;
    accumulatedAngle.current = 0;
    travelledAngle.current = 0;
    didDrag.current = false;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || activePointerId.current !== event.pointerId) {
      return;
    }

    const currentAngle = getAngle(event);
    let delta = currentAngle - lastAngle.current;
    lastAngle.current = currentAngle;

    if (Math.abs(delta) > 180) {
      delta = delta > 0 ? delta - 360 : delta + 360;
    }
    travelledAngle.current += Math.abs(delta);
    if (travelledAngle.current >= DRAG_THRESHOLD) {
      didDrag.current = true;
      event.preventDefault();
    }
    accumulatedAngle.current += delta;

    while (Math.abs(accumulatedAngle.current) >= SENSITIVITY) {
      const direction: RotationDirection =
        accumulatedAngle.current > 0 ? 1 : -1;
      onRotate(direction);
      accumulatedAngle.current -= direction * SENSITIVITY;
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    if (didDrag.current && dragOriginButton.current) {
      suppressClick.current = true;
      suppressedButton.current = dragOriginButton.current;
      clickResetTimer.current = window.setTimeout(() => {
        suppressClick.current = false;
        suppressedButton.current = null;
        clickResetTimer.current = null;
      }, 0);
    }

    isDragging.current = false;
    activePointerId.current = null;
    accumulatedAngle.current = 0;
    travelledAngle.current = 0;
    didDrag.current = false;
    dragOriginButton.current = null;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  const onLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    isDragging.current = false;
    activePointerId.current = null;
    accumulatedAngle.current = 0;
    travelledAngle.current = 0;
    didDrag.current = false;
    dragOriginButton.current = null;
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    isDragging.current = false;
    activePointerId.current = null;
    accumulatedAngle.current = 0;
    travelledAngle.current = 0;
    didDrag.current = false;
    dragOriginButton.current = null;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      !suppressClick.current ||
      !(target instanceof Node) ||
      !suppressedButton.current?.contains(target)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
    suppressedButton.current = null;
    if (clickResetTimer.current !== null) {
      window.clearTimeout(clickResetTimer.current);
      clickResetTimer.current = null;
    }
  };

  return {
    wheelRef,
    wheelProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel,
      onLostPointerCapture,
      onClickCapture,
    },
  };
}
