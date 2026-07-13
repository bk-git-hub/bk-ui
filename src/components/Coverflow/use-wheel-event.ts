import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const REFERENCE_FRAME_MS = 1000 / 60;
const MAX_FRAME_MS = 50;
const WHEEL_IDLE_MS = 80;
const WHEEL_RESPONSE_RATE = 44;
const MAX_RESPONSE_MULTIPLIER = 2;
const PIXELS_PER_STEP = 100;
const LINES_PER_STEP = 3;
const MAX_EVENT_STEPS = 4;
const OVERSCROLL_LIMIT = 0.4;
const SETTLE_EPSILON = 0.001;

const DOM_DELTA_PIXEL = 0;
const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(value, maximum));

const normalizeWheelDelta = (event: WheelEvent) => {
  const dominantDelta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;

  let steps: number;
  switch (event.deltaMode) {
    case DOM_DELTA_LINE:
      steps = dominantDelta / LINES_PER_STEP;
      break;
    case DOM_DELTA_PAGE:
      steps = dominantDelta;
      break;
    case DOM_DELTA_PIXEL:
    default:
      steps = dominantDelta / PIXELS_PER_STEP;
      break;
  }

  return clamp(steps, -MAX_EVENT_STEPS, MAX_EVENT_STEPS);
};

interface WheelEventConfig {
  containerRef: React.RefObject<HTMLDivElement | null>;
  positionRef: React.RefObject<number>;
  reducedMotionRef?: React.RefObject<boolean>;
  onScrollStart?(): void;
  onScroll: React.Dispatch<number>;
  onScrollEnd?: React.Dispatch<number>;
  maxIndex: number;
}

export const useWheelEvent = (config: WheelEventConfig) => {
  const configRef = useRef(config);
  const containerRef = config.containerRef;
  const cancelPendingRef = useRef<() => void>(() => undefined);
  const cancelPending = useCallback(() => cancelPendingRef.current(), []);

  useLayoutEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pendingDelta = 0;
    let targetPosition = configRef.current.positionRef.current;
    let animationFrame: number | null = null;
    let scrollEndTimer: number | null = null;
    let lastFrameTime: number | null = null;
    let isInputActive = false;
    let shouldNotifyScrollEnd = false;

    const cancelFrame = () => {
      if (animationFrame === null) return;
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };

    const cancelScrollEndTimer = () => {
      if (scrollEndTimer === null) return;
      clearTimeout(scrollEndTimer);
      scrollEndTimer = null;
    };

    const applyPendingDelta = () => {
      if (pendingDelta === 0) return;

      const { maxIndex } = configRef.current;
      targetPosition = clamp(
        targetPosition + pendingDelta,
        -OVERSCROLL_LIMIT,
        maxIndex + OVERSCROLL_LIMIT,
      );
      pendingDelta = 0;
    };

    const notifyPosition = (position: number) => {
      const { positionRef, onScroll } = configRef.current;
      positionRef.current = position;
      onScroll(position);
    };

    const notifyScrollEnd = () => {
      const { positionRef, maxIndex, onScrollEnd } = configRef.current;
      const finalPosition = clamp(Math.round(targetPosition), 0, maxIndex);

      targetPosition = finalPosition;
      if (positionRef.current !== finalPosition) {
        notifyPosition(finalPosition);
      }

      animationFrame = null;
      lastFrameTime = null;
      shouldNotifyScrollEnd = false;
      onScrollEnd?.(finalPosition);
    };

    const scheduleFrame = () => {
      if (animationFrame !== null) return;
      animationFrame = requestAnimationFrame(animateFrame);
    };

    function animateFrame(timestamp: number) {
      animationFrame = null;
      applyPendingDelta();

      const { positionRef, reducedMotionRef } = configRef.current;
      const shouldReduceMotion = reducedMotionRef?.current ?? false;
      if (shouldReduceMotion) {
        if (positionRef.current !== targetPosition) {
          notifyPosition(targetPosition);
        }
        lastFrameTime = null;
        if (!isInputActive && shouldNotifyScrollEnd) notifyScrollEnd();
        return;
      }

      const elapsedMs =
        lastFrameTime === null ||
        !Number.isFinite(timestamp) ||
        timestamp <= lastFrameTime
          ? REFERENCE_FRAME_MS
          : Math.min(timestamp - lastFrameTime, MAX_FRAME_MS);
      lastFrameTime = Number.isFinite(timestamp) ? timestamp : null;

      const currentPosition = positionRef.current;
      const distance = targetPosition - currentPosition;
      if (Math.abs(distance) <= SETTLE_EPSILON) {
        if (currentPosition !== targetPosition) notifyPosition(targetPosition);
        lastFrameTime = null;
        if (!isInputActive && shouldNotifyScrollEnd) notifyScrollEnd();
        return;
      }

      const responseMultiplier = clamp(
        Math.abs(distance),
        1,
        MAX_RESPONSE_MULTIPLIER,
      );
      const progress =
        1 -
        Math.exp(
          -(WHEEL_RESPONSE_RATE * responseMultiplier * elapsedMs) / 1000,
        );
      const nextPosition = currentPosition + distance * progress;
      notifyPosition(
        Math.abs(targetPosition - nextPosition) <= SETTLE_EPSILON
          ? targetPosition
          : nextPosition,
      );

      if (
        configRef.current.positionRef.current === targetPosition &&
        !isInputActive &&
        shouldNotifyScrollEnd
      ) {
        notifyScrollEnd();
        return;
      }

      if (configRef.current.positionRef.current !== targetPosition) {
        scheduleFrame();
      } else {
        lastFrameTime = null;
      }
    }

    const finishScroll = () => {
      scrollEndTimer = null;
      isInputActive = false;
      applyPendingDelta();

      const { maxIndex, reducedMotionRef } = configRef.current;
      targetPosition = clamp(Math.round(targetPosition), 0, maxIndex);
      shouldNotifyScrollEnd = true;

      if (reducedMotionRef?.current) {
        cancelFrame();
        notifyScrollEnd();
        return;
      }

      scheduleFrame();
    };

    const cancelCurrentScroll = () => {
      pendingDelta = 0;
      isInputActive = false;
      shouldNotifyScrollEnd = false;
      targetPosition = configRef.current.positionRef.current;
      lastFrameTime = null;
      cancelFrame();
      cancelScrollEndTimer();
    };
    cancelPendingRef.current = cancelCurrentScroll;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = normalizeWheelDelta(event);
      if (delta === 0) return;

      if (!isInputActive && !shouldNotifyScrollEnd) {
        targetPosition = configRef.current.positionRef.current;
      }
      configRef.current.onScrollStart?.();
      isInputActive = true;
      shouldNotifyScrollEnd = false;
      pendingDelta += delta;
      scheduleFrame();

      cancelScrollEndTimer();
      scrollEndTimer = window.setTimeout(finishScroll, WHEEL_IDLE_MS);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      cancelCurrentScroll();
      cancelPendingRef.current = () => undefined;
    };
  }, [containerRef]);

  return cancelPending;
};
