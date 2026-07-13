import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const DRAG_SENSITIVITY = 0.3;
const DRAG_THRESHOLD = 2;
const REFERENCE_FRAME_MS = 1000 / 60;
const MAX_FRAME_MS = 50;
const VELOCITY_SAMPLE_WINDOW_MS = 100;
const RELEASE_VELOCITY_FADE_MS = 100;
const MOMENTUM_PROJECTION_SECONDS = 0.075;
const MAX_RELEASE_VELOCITY = 30;
const SPRING_ANGULAR_FREQUENCY = 18;
const SNAP_POSITION_EPSILON = 0.001;
const SNAP_VELOCITY_EPSILON = 0.01;
const OVERSCROLL_LIMIT = 0.8;
const BOUNDARY_VELOCITY_DAMPING = 0.35;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(value, maximum));

const getMonotonicTime = () =>
  typeof performance === "undefined" ? Date.now() : performance.now();

const getIdleVelocityWeight = (idleDurationMs: number) => {
  const progress = clamp(idleDurationMs / RELEASE_VELOCITY_FADE_MS, 0, 1);
  return 1 - progress * progress * (3 - 2 * progress);
};

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
  const lastFrameTimeRef = useRef<number | null>(null);
  const snapTargetRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const targetPositionRef = useRef(0);
  const velocityRef = useRef(0);
  const gestureRef = useRef({
    startPosition: { x: 0, initialScore: 0 },
    latestX: 0,
    history: [] as { position: number; time: number }[],
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
    lastFrameTimeRef.current = null;
    snapTargetRef.current = null;
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
      const gesture = gestureRef.current;
      gesture.startPosition = {
        x: gesture.latestX,
        initialScore: nextPosition,
      };
      gesture.history = [{ position: nextPosition, time: getMonotonicTime() }];
      config.onDrag(nextPosition);
    } else if (hadInertia || nextPosition !== previousPosition) {
      const finalPosition = Math.round(nextPosition);
      positionRef.current = finalPosition;
      targetPositionRef.current = finalPosition;
      config.onDragEnd(finalPosition);
    }
  });

  const finishAt = useCallback((finalPosition: number) => {
    const { onDrag, onDragEnd } = configRef.current;

    inertiaFrameRef.current = null;
    lastFrameTimeRef.current = null;
    snapTargetRef.current = null;
    velocityRef.current = 0;
    positionRef.current = finalPosition;
    targetPositionRef.current = finalPosition;
    onDrag(finalPosition);
    onDragEnd(finalPosition);
  }, []);

  const inertiaLoop = useCallback(
    (timestamp: number) => {
      const { onDrag, maxIndex } = configRef.current;
      const previousFrameTime = lastFrameTimeRef.current;
      const elapsedMs =
        previousFrameTime === null ||
        !Number.isFinite(timestamp) ||
        timestamp <= previousFrameTime
          ? REFERENCE_FRAME_MS
          : Math.min(timestamp - previousFrameTime, MAX_FRAME_MS);
      lastFrameTimeRef.current = Number.isFinite(timestamp)
        ? timestamp
        : (previousFrameTime ?? 0) + elapsedMs;

      const deltaSeconds = elapsedMs / 1000;
      const target =
        snapTargetRef.current ??
        clamp(
          Math.round(
            positionRef.current +
              velocityRef.current * MOMENTUM_PROJECTION_SECONDS,
          ),
          0,
          maxIndex,
        );
      snapTargetRef.current = target;

      const displacement = positionRef.current - target;
      if (
        Math.abs(displacement) <= SNAP_POSITION_EPSILON &&
        Math.abs(velocityRef.current) <= SNAP_VELOCITY_EPSILON
      ) {
        finishAt(target);
        return;
      }

      const spring =
        velocityRef.current + SPRING_ANGULAR_FREQUENCY * displacement;
      const decay = Math.exp(-SPRING_ANGULAR_FREQUENCY * deltaSeconds);
      const nextDisplacement = (displacement + spring * deltaSeconds) * decay;
      const nextVelocity =
        (velocityRef.current -
          SPRING_ANGULAR_FREQUENCY * spring * deltaSeconds) *
        decay;
      const nextPosition = target + nextDisplacement;
      const boundedPosition = clamp(
        nextPosition,
        -OVERSCROLL_LIMIT,
        maxIndex + OVERSCROLL_LIMIT,
      );

      positionRef.current = boundedPosition;
      velocityRef.current = boundedPosition === nextPosition ? nextVelocity : 0;
      onDrag(boundedPosition);

      if (
        Math.abs(boundedPosition - target) <= SNAP_POSITION_EPSILON &&
        Math.abs(velocityRef.current) <= SNAP_VELOCITY_EPSILON
      ) {
        finishAt(target);
        return;
      }

      inertiaFrameRef.current = requestAnimationFrame(inertiaLoop);
    },
    [finishAt],
  );

  const handleDragStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent, initialPosition: number) => {
      configRef.current.onDragStart?.();
      cancelFrame(dragFrameRef);
      cancelFrame(inertiaFrameRef);
      lastFrameTimeRef.current = null;
      snapTargetRef.current = null;

      const point = "touches" in event ? event.touches[0] : event;
      if (!point) return;

      const startedAt = getMonotonicTime();
      positionRef.current = initialPosition;
      targetPositionRef.current = initialPosition;
      velocityRef.current = 0;
      dragMovedRef.current = false;
      isDraggingRef.current = true;
      gestureRef.current = {
        startPosition: { x: point.clientX, initialScore: initialPosition },
        latestX: point.clientX,
        history: [{ position: initialPosition, time: startedAt }],
      };

      const dragLoop = () => {
        if (!isDraggingRef.current) {
          dragFrameRef.current = null;
          return;
        }

        const nextPosition = targetPositionRef.current;
        if (nextPosition !== positionRef.current) {
          positionRef.current = nextPosition;
          configRef.current.onDrag(nextPosition);
        }
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
      gesture.latestX = point.clientX;

      const deltaX = point.clientX - gesture.startPosition.x;
      if (Math.abs(deltaX) > DRAG_THRESHOLD) dragMovedRef.current = true;

      const dragAmount = deltaX / (size * DRAG_SENSITIVITY);
      const nextTarget = gesture.startPosition.initialScore - dragAmount;
      const boundedTarget = clamp(
        nextTarget,
        -OVERSCROLL_LIMIT,
        maxIndex + OVERSCROLL_LIMIT,
      );
      targetPositionRef.current = boundedTarget;

      const sampledAt = getMonotonicTime();
      gesture.history.push({ position: boundedTarget, time: sampledAt });
      const cutoff = sampledAt - VELOCITY_SAMPLE_WINDOW_MS;
      while (gesture.history.length > 2 && gesture.history[1]!.time < cutoff) {
        gesture.history.shift();
      }
      if (gesture.history.length > 12) gesture.history.shift();
    };

    const handleDragEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      cancelFrame(dragFrameRef);

      const releasePosition = targetPositionRef.current;
      if (releasePosition !== positionRef.current) {
        positionRef.current = releasePosition;
        configRef.current.onDrag(releasePosition);
      }

      const history = gestureRef.current.history;
      const last = history[history.length - 1];
      const first = history.find((sample) => sample.time < (last?.time ?? 0));
      const releasedAt = getMonotonicTime();
      const shouldReduceMotion =
        configRef.current.reducedMotionRef?.current ?? false;

      let releaseVelocity = 0;
      if (!shouldReduceMotion && first && last && last.time > first.time) {
        const sampledVelocity =
          (last.position - first.position) / ((last.time - first.time) / 1000);
        const idleDuration = Math.max(0, releasedAt - last.time);
        releaseVelocity =
          clamp(sampledVelocity, -MAX_RELEASE_VELOCITY, MAX_RELEASE_VELOCITY) *
          getIdleVelocityWeight(idleDuration);
      }

      velocityRef.current = clamp(
        releaseVelocity,
        -MAX_RELEASE_VELOCITY,
        MAX_RELEASE_VELOCITY,
      );
      if (releasePosition < 0 || releasePosition > configRef.current.maxIndex) {
        velocityRef.current *= BOUNDARY_VELOCITY_DAMPING;
      }

      const finalPosition = clamp(
        Math.round(
          releasePosition + velocityRef.current * MOMENTUM_PROJECTION_SECONDS,
        ),
        0,
        configRef.current.maxIndex,
      );
      snapTargetRef.current = finalPosition;
      lastFrameTimeRef.current = getMonotonicTime();

      if (shouldReduceMotion) {
        finishAt(
          clamp(Math.round(releasePosition), 0, configRef.current.maxIndex),
        );
        return;
      }

      inertiaFrameRef.current = requestAnimationFrame(inertiaLoop);
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
  }, [finishAt, inertiaLoop]);

  return { consumeDragClick, handleDragStart };
};
