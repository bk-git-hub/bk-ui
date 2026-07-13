import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const DRAG_SENSITIVITY = 0.3;
const DRAG_THRESHOLD = 2;
const LERP_FACTOR = 0.1;
const INERTIA_MULTIPLIER = 6;
const FRICTION = 0.96;
const MIN_VELOCITY = 0.01;

const cancelFrame = (frameRef: { current: number | null }) => {
  if (frameRef.current === null) return;
  cancelAnimationFrame(frameRef.current);
  frameRef.current = null;
};

interface DragConfig {
  reducedMotionRef?: React.RefObject<boolean>;
  onDragStart?(): void;
  onDrag: React.Dispatch<number>;
  onDragEnd: React.Dispatch<number>;
  size: number;
  maxIndex: number;
}

export const useDrag = (config: DragConfig) => {
  const configRef = useRef(config);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragFrameRef = useRef<number | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const targetPositionRef = useRef(0);
  const velocityRef = useRef(0);
  const gestureRef = useRef({
    startPosition: { x: 0, initialScore: 0 },
    history: [] as { x: number; time: number }[],
  });

  useLayoutEffect(() => {
    const previousMaxIndex = configRef.current.maxIndex;
    configRef.current = config;
    if (previousMaxIndex === config.maxIndex) return;

    const previousPosition = positionRef.current;
    const nextPosition = Math.max(
      0,
      Math.min(previousPosition, config.maxIndex),
    );
    const hadInertia = inertiaFrameRef.current !== null;

    cancelFrame(inertiaFrameRef);
    velocityRef.current = 0;
    positionRef.current = nextPosition;
    targetPositionRef.current = Math.max(
      0,
      Math.min(targetPositionRef.current, config.maxIndex),
    );
    gestureRef.current.startPosition.initialScore = Math.max(
      0,
      Math.min(gestureRef.current.startPosition.initialScore, config.maxIndex),
    );

    if (isDraggingRef.current) {
      config.onDrag(nextPosition);
    } else if (hadInertia || nextPosition !== previousPosition) {
      const finalPosition = Math.round(nextPosition);
      positionRef.current = finalPosition;
      targetPositionRef.current = finalPosition;
      config.onDragEnd(finalPosition);
    }
  });

  const inertiaLoop = useCallback(() => {
    const { onDrag, onDragEnd, maxIndex } = configRef.current;

    if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
      inertiaFrameRef.current = null;
      const finalPosition = Math.max(
        0,
        Math.min(Math.round(positionRef.current), maxIndex),
      );
      positionRef.current = finalPosition;
      onDragEnd(finalPosition);
      return;
    }

    const nextPosition = positionRef.current + velocityRef.current;
    if (nextPosition < 0 || nextPosition > maxIndex) {
      velocityRef.current *= 0.5;
    }
    positionRef.current = Math.max(
      -0.8,
      Math.min(nextPosition, maxIndex + 0.8),
    );
    velocityRef.current *= FRICTION;
    onDrag(positionRef.current);
    inertiaFrameRef.current = requestAnimationFrame(inertiaLoop);
  }, []);

  const handleDragStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent, initialPosition: number) => {
      configRef.current.onDragStart?.();
      cancelFrame(dragFrameRef);
      cancelFrame(inertiaFrameRef);

      const point = "touches" in event ? event.touches[0] : event;
      if (!point) return;

      const startedAt = Date.now();
      positionRef.current = initialPosition;
      targetPositionRef.current = initialPosition;
      velocityRef.current = 0;
      dragMovedRef.current = false;
      isDraggingRef.current = true;
      gestureRef.current = {
        startPosition: { x: point.clientX, initialScore: initialPosition },
        history: [{ x: point.clientX, time: startedAt }],
      };

      const dragLoop = () => {
        if (!isDraggingRef.current) {
          dragFrameRef.current = null;
          return;
        }

        const distance = targetPositionRef.current - positionRef.current;
        positionRef.current += distance * LERP_FACTOR;
        configRef.current.onDrag(positionRef.current);
        dragFrameRef.current = requestAnimationFrame(dragLoop);
      };

      dragFrameRef.current = requestAnimationFrame(dragLoop);
    },
    [],
  );

  const consumeDragClick = useCallback(() => {
    if (!dragMovedRef.current) return false;
    dragMovedRef.current = false;
    return true;
  }, []);

  useEffect(() => {
    const handleDragMove = (event: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (event.cancelable) event.preventDefault();

      const point = "touches" in event ? event.touches[0] : event;
      if (!point) return;

      const { size, maxIndex } = configRef.current;
      const gesture = gestureRef.current;
      gesture.history.push({ x: point.clientX, time: Date.now() });
      if (gesture.history.length > 4) gesture.history.shift();

      const deltaX = point.clientX - gesture.startPosition.x;
      if (Math.abs(deltaX) > DRAG_THRESHOLD) dragMovedRef.current = true;

      const dragAmount = deltaX / (size * DRAG_SENSITIVITY);
      const nextTarget = gesture.startPosition.initialScore - dragAmount;
      targetPositionRef.current = Math.max(
        -0.8,
        Math.min(nextTarget, maxIndex + 0.8),
      );
    };

    const handleDragEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      cancelFrame(dragFrameRef);

      const history = gestureRef.current.history;
      const last = history[history.length - 1];
      const previous = history[history.length - 2] ?? history[0];
      if (configRef.current.reducedMotionRef?.current) {
        velocityRef.current = 0;
      } else if (last && previous && last.time > previous.time) {
        const speed =
          ((last.x - previous.x) / (last.time - previous.time)) *
          INERTIA_MULTIPLIER;
        velocityRef.current =
          (-speed / configRef.current.size) * DRAG_SENSITIVITY * 10;
      } else {
        velocityRef.current = 0;
      }

      inertiaLoop();
    };

    window.addEventListener("mousemove", handleDragMove, { passive: false });
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);
    window.addEventListener("touchcancel", handleDragEnd);

    return () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
      window.removeEventListener("touchcancel", handleDragEnd);
      cancelFrame(dragFrameRef);
      cancelFrame(inertiaFrameRef);
    };
  }, [inertiaLoop]);

  return { consumeDragClick, handleDragStart };
};
