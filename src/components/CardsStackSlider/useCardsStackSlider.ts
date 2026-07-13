import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";

export type CardsStackOrientation = "horizontal" | "vertical";
export type CardsStackDirection = -1 | 1;
export type CardsStackChangeSource =
  | "keyboard"
  | "next"
  | "pointer"
  | "previous";

export interface CardsStackValueChangeDetail {
  previousValue: number;
  direction: CardsStackDirection;
  source: CardsStackChangeSource;
}

export type CardsStackValueChangeArgs = [
  value: number,
  detail: CardsStackValueChangeDetail,
];
export type CardsStackValueChangeHandler = (
  // eslint-disable-next-line no-unused-vars
  ...args: CardsStackValueChangeArgs
) => void;

export interface UseCardsStackSliderOptions {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: CardsStackValueChangeHandler;
  loop?: boolean;
  orientation?: CardsStackOrientation;
  dragThreshold?: number;
  velocityThreshold?: number;
  touchRatio?: number;
  transitionDuration?: number;
  disabled?: boolean;
}

interface PointerSample {
  axis: number;
  time: number;
}

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startAxis: number;
  startCrossAxis: number;
  latestAxis: number;
  latestCrossAxis: number;
  extent: number;
  axisLocked: boolean;
  samples: PointerSample[];
}

interface PendingNavigation {
  from: number;
  to: number;
  direction: CardsStackDirection;
  source: CardsStackChangeSource;
}

interface MotionState {
  progress: number;
  isDragging: boolean;
  isAnimating: boolean;
  layerValue: number;
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-cards-stack-no-drag]";
const AXIS_LOCK_DISTANCE = 6;
const VELOCITY_SAMPLE_WINDOW_MS = 100;
const PROJECTED_MOTION_MS = 180;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function normalizeCardsStackValue(
  value: number,
  count: number,
  loop: boolean,
) {
  if (count <= 0) return 0;
  const integerValue = Number.isFinite(value) ? Math.trunc(value) : 0;

  if (!loop) return clamp(integerValue, 0, count - 1);
  return ((integerValue % count) + count) % count;
}

export function getCardsStackRelativeProgress(
  itemIndex: number,
  currentIndex: number,
  count: number,
  loop: boolean,
  motionProgress = 0,
) {
  if (count <= 0) return 0;
  const virtualPosition = currentIndex - motionProgress;
  let distance = itemIndex - virtualPosition;

  if (loop && count > 1) {
    const halfCount = count / 2;
    const originalDistance = distance;
    distance = ((((distance + halfCount) % count) + count) % count) - halfCount;
    if (distance === -halfCount && originalDistance > 0) {
      distance = halfCount;
    }
  }

  return distance;
}

function getCardsStackLayerValue(
  currentValue: number,
  progress: number,
  count: number,
  loop: boolean,
) {
  return normalizeCardsStackValue(
    Math.floor(currentValue - progress),
    count,
    loop,
  );
}

function getCardsStackSnapDelta(progress: number) {
  const slides = -progress;
  if (slides === 0) return 0;
  return Math.sign(slides) * Math.floor(Math.abs(slides) + 0.5);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getEventTime(event: ReactPointerEvent<HTMLDivElement>) {
  return event.timeStamp || performance.now();
}

export function useCardsStackSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  orientation = "horizontal",
  dragThreshold = 0.18,
  velocityThreshold = 0.45,
  touchRatio = 1.15,
  transitionDuration = 420,
  disabled = false,
}: UseCardsStackSliderOptions) {
  const safeCount = Math.max(0, Math.trunc(count));
  const effectiveLoop = loop && safeCount > 2;
  const isControlled = value !== undefined;
  const wasControlledRef = useRef(isControlled);
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeCardsStackValue(defaultValue, safeCount, effectiveLoop),
  );
  const currentValue = normalizeCardsStackValue(
    isControlled ? value : uncontrolledValue,
    safeCount,
    effectiveLoop,
  );
  const [motion, setMotion] = useState<MotionState>({
    progress: 0,
    isDragging: false,
    isAnimating: false,
    layerValue: currentValue,
  });

  const currentValueRef = useRef(currentValue);
  const optionsRef = useRef({
    count: safeCount,
    loop: effectiveLoop,
    orientation,
    dragThreshold,
    velocityThreshold,
    touchRatio,
    transitionDuration,
    disabled,
  });
  const onValueChangeRef = useRef(onValueChange);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const pendingProgressRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  currentValueRef.current = currentValue;
  optionsRef.current = {
    count: safeCount,
    loop: effectiveLoop,
    orientation,
    dragThreshold,
    velocityThreshold,
    touchRatio,
    transitionDuration,
    disabled,
  };
  onValueChangeRef.current = onValueChange;

  useEffect(() => {
    if (import.meta.env.DEV && wasControlledRef.current !== isControlled) {
      console.warn(
        "CardsStackRoot should not switch between controlled and uncontrolled modes.",
      );
    }
  }, [isControlled]);

  useEffect(() => {
    if (isControlled) return;
    setUncontrolledValue((previousValue) =>
      normalizeCardsStackValue(previousValue, safeCount, effectiveLoop),
    );
  }, [effectiveLoop, isControlled, safeCount]);

  const cancelFrame = useCallback(() => {
    if (frameRef.current === null) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current === null) return;
    window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }, []);

  const completeNavigation = useCallback(() => {
    const pendingNavigation = pendingNavigationRef.current;
    if (!pendingNavigation) return;

    pendingNavigationRef.current = null;
    clearFallbackTimer();
    if (!wasControlledRef.current) {
      setUncontrolledValue(pendingNavigation.to);
    }
    setMotion({
      progress: 0,
      isDragging: false,
      isAnimating: false,
      layerValue: pendingNavigation.to,
    });
    if (pendingNavigation.to !== pendingNavigation.from) {
      onValueChangeRef.current?.(pendingNavigation.to, {
        previousValue: pendingNavigation.from,
        direction: pendingNavigation.direction,
        source: pendingNavigation.source,
      });
    }
  }, [clearFallbackTimer]);

  const canNavigate = useCallback((direction: CardsStackDirection) => {
    const {
      count: latestCount,
      loop: latestLoop,
      disabled: isDisabled,
    } = optionsRef.current;
    if (isDisabled || latestCount <= 1) return false;
    if (latestLoop) return true;

    const latestValue = currentValueRef.current;
    return direction === 1 ? latestValue < latestCount - 1 : latestValue > 0;
  }, []);

  const navigateBy = useCallback(
    (
      delta: number,
      source: CardsStackChangeSource,
      layerValue = currentValueRef.current,
    ) => {
      const integerDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
      if (integerDelta === 0) return false;
      const direction: CardsStackDirection = integerDelta > 0 ? 1 : -1;
      if (
        pointerSessionRef.current ||
        pendingNavigationRef.current ||
        !canNavigate(direction)
      ) {
        return false;
      }

      const {
        count: latestCount,
        loop: latestLoop,
        transitionDuration: latestDuration,
      } = optionsRef.current;
      const from = currentValueRef.current;
      const boundedDelta = latestLoop
        ? integerDelta
        : clamp(integerDelta, -from, latestCount - 1 - from);
      if (boundedDelta === 0) return false;
      const to = normalizeCardsStackValue(
        from + boundedDelta,
        latestCount,
        latestLoop,
      );
      pendingNavigationRef.current = { from, to, direction, source };
      setMotion({
        progress: -boundedDelta,
        isDragging: false,
        isAnimating: true,
        layerValue,
      });

      if (prefersReducedMotion()) {
        queueMicrotask(completeNavigation);
      } else {
        fallbackTimerRef.current = window.setTimeout(
          completeNavigation,
          latestDuration + 80,
        );
      }
      return true;
    },
    [canNavigate, completeNavigation],
  );

  const navigate = useCallback(
    (direction: CardsStackDirection, source: CardsStackChangeSource) =>
      navigateBy(direction, source),
    [navigateBy],
  );

  const snapBack = useCallback(() => {
    cancelFrame();
    pendingProgressRef.current = 0;
    setMotion({
      progress: 0,
      isDragging: false,
      isAnimating: false,
      layerValue: currentValueRef.current,
    });
  }, [cancelFrame]);

  const commitPendingProgress = useCallback(() => {
    frameRef.current = null;
    const { count: latestCount, loop: latestLoop } = optionsRef.current;
    setMotion({
      progress: pendingProgressRef.current,
      isDragging: true,
      isAnimating: false,
      layerValue: getCardsStackLayerValue(
        currentValueRef.current,
        pendingProgressRef.current,
        latestCount,
        latestLoop,
      ),
    });
  }, []);

  const scheduleProgress = useCallback(
    (progress: number) => {
      pendingProgressRef.current = progress;
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(commitPendingProgress);
    },
    [commitPendingProgress],
  );

  const releasePointerCapture = useCallback((session: PointerSession) => {
    if (
      typeof session.viewport.hasPointerCapture === "function" &&
      session.viewport.hasPointerCapture(session.pointerId)
    ) {
      session.viewport.releasePointerCapture(session.pointerId);
    }
  }, []);

  const cancelPointerSession = useCallback(
    (shouldSnapBack = true) => {
      const session = pointerSessionRef.current;
      pointerSessionRef.current = null;
      if (session) releasePointerCapture(session);
      if (shouldSnapBack) snapBack();
    },
    [releasePointerCapture, snapBack],
  );

  const getAxisValues = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) =>
      optionsRef.current.orientation === "horizontal"
        ? { axis: event.clientX, crossAxis: event.clientY }
        : { axis: event.clientY, crossAxis: event.clientX },
    [],
  );

  const getDragProgress = useCallback((session: PointerSession) => {
    const { loop: latestLoop, touchRatio: latestTouchRatio } =
      optionsRef.current;
    let progress =
      ((session.latestAxis - session.startAxis) / session.extent) *
      latestTouchRatio;

    if (!latestLoop) {
      const latestValue = currentValueRef.current;
      const minimumProgress = -(optionsRef.current.count - 1 - latestValue);
      const maximumProgress = latestValue;
      if (progress < minimumProgress) {
        progress =
          minimumProgress +
          clamp((progress - minimumProgress) * 0.28, -0.45, 0.45);
      } else if (progress > maximumProgress) {
        progress =
          maximumProgress +
          clamp((progress - maximumProgress) * 0.28, -0.45, 0.45);
      }
    }

    return progress;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target;
      if (
        optionsRef.current.disabled ||
        optionsRef.current.count <= 1 ||
        pendingNavigationRef.current ||
        pointerSessionRef.current ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        (target instanceof Element && target.closest(INTERACTIVE_SELECTOR))
      ) {
        return;
      }

      const { axis, crossAxis } = getAxisValues(event);
      const rect = event.currentTarget.getBoundingClientRect();
      const extent = Math.max(
        optionsRef.current.orientation === "horizontal"
          ? rect.width || event.currentTarget.clientWidth
          : rect.height || event.currentTarget.clientHeight,
        1,
      );
      const startTime = getEventTime(event);
      pointerSessionRef.current = {
        pointerId: event.pointerId,
        viewport: event.currentTarget,
        startAxis: axis,
        startCrossAxis: crossAxis,
        latestAxis: axis,
        latestCrossAxis: crossAxis,
        extent,
        axisLocked: false,
        samples: [{ axis, time: startTime }],
      };

      if (typeof event.currentTarget.setPointerCapture === "function") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      setMotion({
        progress: 0,
        isDragging: true,
        isAnimating: false,
        layerValue: currentValueRef.current,
      });
    },
    [getAxisValues],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const { axis, crossAxis } = getAxisValues(event);
      session.latestAxis = axis;
      session.latestCrossAxis = crossAxis;
      const axisDistance = Math.abs(axis - session.startAxis);
      const crossAxisDistance = Math.abs(crossAxis - session.startCrossAxis);

      if (!session.axisLocked) {
        if (Math.max(axisDistance, crossAxisDistance) < AXIS_LOCK_DISTANCE) {
          return;
        }
        if (crossAxisDistance > axisDistance) {
          cancelPointerSession();
          return;
        }
        session.axisLocked = true;
      }

      event.preventDefault();
      const sampleTime = getEventTime(event);
      session.samples.push({ axis, time: sampleTime });
      session.samples = session.samples.filter(
        (sample) => sampleTime - sample.time <= VELOCITY_SAMPLE_WINDOW_MS,
      );
      scheduleProgress(getDragProgress(session));
    },
    [cancelPointerSession, getAxisValues, getDragProgress, scheduleProgress],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const { axis, crossAxis } = getAxisValues(event);
      session.latestAxis = axis;
      session.latestCrossAxis = crossAxis;
      pointerSessionRef.current = null;
      releasePointerCapture(session);
      cancelFrame();

      if (event.type === "pointercancel" || !session.axisLocked) {
        snapBack();
        return;
      }

      const endTime = getEventTime(event);
      session.samples.push({ axis, time: endTime });
      const oldestSample =
        session.samples.find(
          (sample) => endTime - sample.time <= VELOCITY_SAMPLE_WINDOW_MS,
        ) ?? session.samples[0];
      const elapsed = Math.max(endTime - oldestSample.time, 1);
      const velocity = (axis - oldestSample.axis) / elapsed;
      const delta = axis - session.startAxis;
      const projectedDelta = delta + velocity * PROJECTED_MOTION_MS;
      const hasDistance =
        Math.abs(delta) >= session.extent * optionsRef.current.dragThreshold;
      const hasVelocity =
        Math.abs(velocity) >= optionsRef.current.velocityThreshold;
      const dragProgress = getDragProgress(session);
      const velocityProgress =
        (velocity / session.extent) *
        optionsRef.current.touchRatio *
        PROJECTED_MOTION_MS;
      const projectedProgress = dragProgress + clamp(velocityProgress, -1, 1);
      let navigationDelta = getCardsStackSnapDelta(projectedProgress);
      if (navigationDelta === 0 && (hasDistance || hasVelocity)) {
        navigationDelta = projectedDelta < 0 ? 1 : -1;
      }
      const layerValue = getCardsStackLayerValue(
        currentValueRef.current,
        dragProgress,
        optionsRef.current.count,
        optionsRef.current.loop,
      );

      if (
        (hasDistance || hasVelocity) &&
        navigateBy(navigationDelta, "pointer", layerValue)
      ) {
        return;
      }
      snapBack();
    },
    [
      cancelFrame,
      getAxisValues,
      getDragProgress,
      navigateBy,
      releasePointerCapture,
      snapBack,
    ],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (pointerSessionRef.current?.pointerId === event.pointerId) {
        cancelPointerSession();
      }
    },
    [cancelPointerSession],
  );

  const handleTransitionEnd = useCallback(
    (event: ReactTransitionEvent<HTMLDivElement>) => {
      if (
        event.currentTarget === event.target &&
        event.propertyName === "transform"
      ) {
        completeNavigation();
      }
    },
    [completeNavigation],
  );

  const topologyRef = useRef({
    currentValue,
    count: safeCount,
    loop: effectiveLoop,
    orientation,
  });

  useEffect(() => {
    const previousTopology = topologyRef.current;
    const topologyChanged =
      previousTopology.currentValue !== currentValue ||
      previousTopology.count !== safeCount ||
      previousTopology.loop !== effectiveLoop ||
      previousTopology.orientation !== orientation;
    topologyRef.current = {
      currentValue,
      count: safeCount,
      loop: effectiveLoop,
      orientation,
    };

    if (
      !topologyChanged ||
      (!pendingNavigationRef.current && !pointerSessionRef.current)
    ) {
      return;
    }

    pendingNavigationRef.current = null;
    clearFallbackTimer();
    cancelPointerSession(false);
    cancelFrame();
    pendingProgressRef.current = 0;
    setMotion({
      progress: 0,
      isDragging: false,
      isAnimating: false,
      layerValue: currentValue,
    });
  }, [
    cancelFrame,
    cancelPointerSession,
    clearFallbackTimer,
    currentValue,
    effectiveLoop,
    orientation,
    safeCount,
  ]);

  useEffect(() => {
    return () => {
      cancelFrame();
      clearFallbackTimer();
      pointerSessionRef.current = null;
      pendingNavigationRef.current = null;
    };
  }, [cancelFrame, clearFallbackTimer]);

  return {
    currentValue,
    motionProgress: motion.progress,
    isDragging: motion.isDragging,
    isAnimating: motion.isAnimating,
    topLayerValue:
      motion.isDragging || motion.isAnimating
        ? motion.layerValue
        : currentValue,
    canNavigate,
    navigate,
    transitionDuration,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleLostPointerCapture,
    handleTransitionEnd,
  };
}
