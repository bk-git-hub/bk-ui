/* eslint-disable no-unused-vars -- Public callback parameter names document the hook contract. */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type ExpoSliderOrientation = "horizontal" | "vertical";
export type ExpoSliderDirection = -1 | 1;
type ExpoSliderMotionDirection = ExpoSliderDirection | 0;

export type ExpoSliderChangeSource =
  | "keyboard"
  | "next"
  | "pagination"
  | "pointer"
  | "previous"
  | "programmatic";

export interface ExpoSliderValueChangeDetail {
  previousValue: number;
  direction: ExpoSliderDirection;
  source: ExpoSliderChangeSource;
}

export type ExpoSliderValueChangeHandler = (
  value: number,
  detail: ExpoSliderValueChangeDetail,
) => void;

export interface UseExpoSliderOptions {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: ExpoSliderValueChangeHandler;
  loop?: boolean;
  orientation?: ExpoSliderOrientation;
  disabled?: boolean;
  /** @deprecated Expo Slider now uses threshold-free, distance-based dragging. */
  dragThreshold?: number;
  velocityThreshold?: number;
  transitionDuration?: number;
}

interface PointerSample {
  axis: number;
  time: number;
}

type PointerAxis = "cross" | "pending" | "primary";

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startAxis: number;
  startCrossAxis: number;
  latestAxis: number;
  latestCrossAxis: number;
  extent: number;
  baseProgress: number;
  baseIntentProgress: number;
  axis: PointerAxis;
  captured: boolean;
  interruptedAnimation: boolean;
  samples: PointerSample[];
}

interface PendingNavigation {
  kind: "navigation";
  from: number;
  to: number;
  distance: number;
  direction: ExpoSliderDirection;
  source: ExpoSliderChangeSource;
  count: number;
  loop: boolean;
  startedAt: number | null;
  duration: number;
}

interface PendingSnapBack {
  kind: "snap-back";
  startedAt: number | null;
  duration: number;
}

type PendingAnimation = PendingNavigation | PendingSnapBack;

interface ExpectedCommittedValue {
  value: number;
  wrapDirection: ExpoSliderDirection;
}

interface MotionState {
  progress: number;
  wrapDirection: ExpoSliderMotionDirection;
  isDragging: boolean;
  isAnimating: boolean;
  shouldTransition: boolean;
}

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='slider']",
  "[role='switch']",
  "[data-expo-slider-no-drag]",
].join(", ");

const AXIS_LOCK_DISTANCE = 7;
const VELOCITY_SAMPLE_WINDOW_MS = 120;
const PROJECTED_MOTION_MS = 180;
const ANIMATION_FALLBACK_BUFFER_MS = 100;
const DEFAULT_VELOCITY_THRESHOLD = 0.45;
const DEFAULT_TRANSITION_DURATION = 650;
const EDGE_RESISTANCE = 0.28;
const MAX_EDGE_OVERSHOOT = 0.35;
const MAX_TRANSITION_END_TOLERANCE_MS = 16;
const LOOP_TIE_EPSILON = 0.0001;

function getCubicBezierCoordinate(
  progress: number,
  controlPoint1: number,
  controlPoint2: number,
) {
  const inverseProgress = 1 - progress;
  return (
    3 * inverseProgress * inverseProgress * progress * controlPoint1 +
    3 * inverseProgress * progress * progress * controlPoint2 +
    progress * progress * progress
  );
}

function getExpoAnimationProgress(progress: number) {
  const safeProgress = clamp(progress, 0, 1);
  if (safeProgress === 0 || safeProgress === 1) return safeProgress;
  let lowerBound = 0;
  let upperBound = 1;

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const parameter = (lowerBound + upperBound) / 2;
    const x = getCubicBezierCoordinate(parameter, 0.22, 0.18);
    if (x < safeProgress) lowerBound = parameter;
    else upperBound = parameter;
  }

  return getCubicBezierCoordinate((lowerBound + upperBound) / 2, 0.75, 1);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getSafeCount(count: number) {
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
}

function getFiniteNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function getMotionDirection(value: number): ExpoSliderMotionDirection {
  if (!Number.isFinite(value) || value === 0) return 0;
  return value < 0 ? -1 : 1;
}

function getCurrentTime() {
  if (typeof performance !== "undefined") return performance.now();
  return Date.now();
}

function getWrappedDistance(
  distance: number,
  count: number,
  preferredDirection = 0,
) {
  if (count <= 1) return distance;

  const halfCount = count / 2;
  let wrappedDistance =
    ((((distance + halfCount) % count) + count) % count) - halfCount;

  // Resolve an even-count tie toward the active motion, then the raw distance.
  if (Math.abs(wrappedDistance) === halfCount) {
    const tieDirection = preferredDirection || distance;
    wrappedDistance = tieDirection < 0 ? -halfCount : halfCount;
  }

  return wrappedDistance;
}

function getLoopDistanceNearProgress(
  distance: number,
  count: number,
  progress: number,
  preferredDirection = progress,
) {
  return (
    progress +
    getWrappedDistance(distance - progress, count, preferredDirection)
  );
}

function getEventTime(event: ReactPointerEvent<HTMLDivElement>) {
  if (Number.isFinite(event.timeStamp) && event.timeStamp > 0) {
    return event.timeStamp;
  }
  if (typeof performance !== "undefined") return performance.now();
  return Date.now();
}

function getAxisValues(
  event: ReactPointerEvent<HTMLDivElement>,
  orientation: ExpoSliderOrientation,
) {
  return orientation === "horizontal"
    ? { axis: event.clientX, crossAxis: event.clientY }
    : { axis: event.clientY, crossAxis: event.clientX };
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR);
}

function capturePointer(session: PointerSession) {
  if (
    session.captured ||
    typeof session.viewport.setPointerCapture !== "function"
  ) {
    return;
  }

  try {
    session.viewport.setPointerCapture(session.pointerId);
    session.captured = true;
  } catch {
    session.captured = false;
  }
}

function releasePointerCapture(session: PointerSession) {
  if (
    !session.captured ||
    typeof session.viewport.releasePointerCapture !== "function"
  ) {
    return;
  }

  try {
    if (
      typeof session.viewport.hasPointerCapture === "function" &&
      !session.viewport.hasPointerCapture(session.pointerId)
    ) {
      return;
    }
    session.viewport.releasePointerCapture(session.pointerId);
  } catch {
    return;
  }
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function canNavigateFromValue(
  currentValue: number,
  direction: ExpoSliderDirection,
  count: number,
  loop: boolean,
  disabled: boolean,
) {
  if (disabled || count <= 1) return false;
  return (
    normalizeExpoSliderValue(currentValue + direction, count, loop) !==
    currentValue
  );
}

export function normalizeExpoSliderValue(
  value: number,
  count: number,
  loop: boolean,
) {
  const safeCount = getSafeCount(count);
  if (safeCount === 0) return 0;

  const integerValue = Number.isFinite(value) ? Math.trunc(value) : 0;
  if (!loop) return clamp(integerValue, 0, safeCount - 1);
  return ((integerValue % safeCount) + safeCount) % safeCount;
}

export function getExpoSliderRelativeProgress(
  index: number,
  currentIndex: number,
  count: number,
  loop: boolean,
  motionProgress = 0,
  preferredDirection = motionProgress,
) {
  const safeCount = getSafeCount(count);
  if (safeCount === 0) return 0;

  const safeIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  const safeCurrentIndex = Number.isFinite(currentIndex)
    ? Math.trunc(currentIndex)
    : 0;
  const safeMotionProgress = Number.isFinite(motionProgress)
    ? motionProgress
    : 0;
  const safePreferredDirection = Number.isFinite(preferredDirection)
    ? preferredDirection
    : safeMotionProgress;
  const distance = safeIndex - safeCurrentIndex;
  const relativeDistance = distance - safeMotionProgress;
  const tieDirection =
    Math.abs(safeMotionProgress) > LOOP_TIE_EPSILON
      ? relativeDistance
      : safePreferredDirection || relativeDistance;
  return loop
    ? getWrappedDistance(relativeDistance, safeCount, tieDirection)
    : relativeDistance;
}

export function useExpoSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  orientation = "horizontal",
  disabled = false,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
  transitionDuration = DEFAULT_TRANSITION_DURATION,
}: UseExpoSliderOptions) {
  const safeCount = getSafeCount(count);
  const effectiveLoop = loop && safeCount > 1;
  const resolvedVelocityThreshold = Math.max(
    0,
    getFiniteNumber(velocityThreshold, DEFAULT_VELOCITY_THRESHOLD),
  );
  const resolvedTransitionDuration = Math.max(
    0,
    getFiniteNumber(transitionDuration, DEFAULT_TRANSITION_DURATION),
  );
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeExpoSliderValue(defaultValue, safeCount, effectiveLoop),
  );
  const currentValue = normalizeExpoSliderValue(
    isControlled ? value : uncontrolledValue,
    safeCount,
    effectiveLoop,
  );
  const [motion, setMotion] = useState<MotionState>({
    progress: 0,
    wrapDirection: 0,
    isDragging: false,
    isAnimating: false,
    shouldTransition: true,
  });
  const [navigationValue, setNavigationValue] = useState(currentValue);

  const currentValueRef = useRef(currentValue);
  const isControlledRef = useRef(isControlled);
  const onValueChangeRef = useRef(onValueChange);
  const optionsRef = useRef({
    count: safeCount,
    loop: effectiveLoop,
    orientation,
    disabled,
    velocityThreshold: resolvedVelocityThreshold,
    transitionDuration: resolvedTransitionDuration,
  });
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const pendingAnimationRef = useRef<PendingAnimation | null>(null);
  const expectedCommittedValueRef = useRef<ExpectedCommittedValue | null>(null);
  const pendingProgressRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const transitionRestoreFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    currentValueRef.current = currentValue;
    isControlledRef.current = isControlled;
    onValueChangeRef.current = onValueChange;
    optionsRef.current = {
      count: safeCount,
      loop: effectiveLoop,
      orientation,
      disabled,
      velocityThreshold: resolvedVelocityThreshold,
      transitionDuration: resolvedTransitionDuration,
    };
  }, [
    currentValue,
    disabled,
    effectiveLoop,
    isControlled,
    onValueChange,
    orientation,
    resolvedVelocityThreshold,
    resolvedTransitionDuration,
    safeCount,
  ]);

  const cancelFrame = useCallback(() => {
    if (frameRef.current === null) return;
    if (typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = null;
  }, []);

  const cancelTransitionRestore = useCallback(() => {
    if (transitionRestoreFrameRef.current === null) return;
    if (typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(transitionRestoreFrameRef.current);
    }
    transitionRestoreFrameRef.current = null;
  }, []);

  const scheduleTransitionRestore = useCallback(() => {
    cancelTransitionRestore();
    if (typeof requestAnimationFrame !== "function") {
      setMotion((previousMotion) => ({
        ...previousMotion,
        shouldTransition: true,
      }));
      return;
    }

    transitionRestoreFrameRef.current = requestAnimationFrame(() => {
      transitionRestoreFrameRef.current = requestAnimationFrame(() => {
        transitionRestoreFrameRef.current = null;
        if (pointerSessionRef.current || pendingAnimationRef.current) return;

        setMotion((previousMotion) =>
          previousMotion.isDragging ||
          previousMotion.isAnimating ||
          previousMotion.shouldTransition
            ? previousMotion
            : { ...previousMotion, shouldTransition: true },
        );
      });
    });
  }, [cancelTransitionRestore]);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current === null) return;
    clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }, []);

  const detachPointerSession = useCallback(
    (pointerId?: number, shouldReleaseCapture = true) => {
      const session = pointerSessionRef.current;
      if (
        !session ||
        (pointerId !== undefined && session.pointerId !== pointerId)
      ) {
        return null;
      }

      pointerSessionRef.current = null;
      if (shouldReleaseCapture) releasePointerCapture(session);
      return session;
    },
    [],
  );

  const resetMotion = useCallback(() => {
    cancelTransitionRestore();
    pendingProgressRef.current = 0;
    setMotion({
      progress: 0,
      wrapDirection: 0,
      isDragging: false,
      isAnimating: false,
      shouldTransition: true,
    });
  }, [cancelTransitionRestore]);

  const resetMotionWithoutTransition = useCallback(() => {
    cancelTransitionRestore();
    pendingProgressRef.current = 0;
    setMotion({
      progress: 0,
      wrapDirection: 0,
      isDragging: false,
      isAnimating: false,
      shouldTransition: false,
    });
    scheduleTransitionRestore();
  }, [cancelTransitionRestore, scheduleTransitionRestore]);

  const completeAnimation = useCallback(
    (fromTransition = false) => {
      const pendingAnimation = pendingAnimationRef.current;
      if (!pendingAnimation) return false;
      if (fromTransition) {
        if (pendingAnimation.startedAt === null) return false;
        const tolerance = Math.min(
          MAX_TRANSITION_END_TOLERANCE_MS,
          pendingAnimation.duration * 0.2,
        );
        const minimumElapsed = Math.max(
          0,
          pendingAnimation.duration - tolerance,
        );
        if (getCurrentTime() - pendingAnimation.startedAt < minimumElapsed) {
          return false;
        }
      }

      pendingAnimationRef.current = null;
      cancelFrame();
      cancelTransitionRestore();
      clearFallbackTimer();
      pendingProgressRef.current = 0;
      const restingWrapDirection =
        pendingAnimation.kind === "navigation" && !isControlledRef.current
          ? (-pendingAnimation.direction as ExpoSliderDirection)
          : 0;
      setMotion({
        progress: 0,
        wrapDirection: restingWrapDirection,
        isDragging: false,
        isAnimating: false,
        shouldTransition: false,
      });
      scheduleTransitionRestore();

      if (pendingAnimation.kind === "snap-back") {
        setNavigationValue(currentValueRef.current);
        return true;
      }

      const latestOptions = optionsRef.current;
      const topologyChanged =
        pendingAnimation.count !== latestOptions.count ||
        pendingAnimation.loop !== latestOptions.loop;
      const controlledValueChanged =
        isControlledRef.current &&
        currentValueRef.current !== pendingAnimation.from;
      if (topologyChanged || controlledValueChanged) {
        setNavigationValue(currentValueRef.current);
        return false;
      }

      const valueChanged = pendingAnimation.to !== pendingAnimation.from;
      expectedCommittedValueRef.current = valueChanged
        ? {
            value: pendingAnimation.to,
            wrapDirection: -pendingAnimation.direction as ExpoSliderDirection,
          }
        : null;
      setNavigationValue(
        isControlledRef.current ? currentValueRef.current : pendingAnimation.to,
      );
      if (!isControlledRef.current && valueChanged) {
        currentValueRef.current = pendingAnimation.to;
        setUncontrolledValue(pendingAnimation.to);
      }
      if (valueChanged) {
        onValueChangeRef.current?.(pendingAnimation.to, {
          previousValue: pendingAnimation.from,
          direction: pendingAnimation.direction,
          source: pendingAnimation.source,
        });
      }
      return true;
    },
    [
      cancelFrame,
      cancelTransitionRestore,
      clearFallbackTimer,
      scheduleTransitionRestore,
    ],
  );

  const scheduleAnimationFallback = useCallback(() => {
    clearFallbackTimer();
    const duration = optionsRef.current.transitionDuration;
    fallbackTimerRef.current = setTimeout(
      completeAnimation,
      duration + ANIMATION_FALLBACK_BUFFER_MS,
    );
  }, [clearFallbackTimer, completeAnimation]);

  const animateToProgress = useCallback(
    (
      pendingAnimation: PendingAnimation,
      startProgress: number,
      targetProgress: number,
      direction: ExpoSliderMotionDirection,
    ) => {
      cancelFrame();
      cancelTransitionRestore();
      clearFallbackTimer();

      const duration = optionsRef.current.transitionDuration;
      pendingAnimation.duration = duration;
      pendingAnimation.startedAt = getCurrentTime();
      pendingProgressRef.current = startProgress;
      setMotion({
        progress: startProgress,
        wrapDirection: direction,
        isDragging: false,
        isAnimating: true,
        shouldTransition: false,
      });

      const finishImmediately =
        duration === 0 ||
        prefersReducedMotion() ||
        Math.abs(targetProgress - startProgress) <= LOOP_TIE_EPSILON ||
        typeof requestAnimationFrame !== "function";
      if (finishImmediately) {
        pendingProgressRef.current = targetProgress;
        setMotion({
          progress: targetProgress,
          wrapDirection: direction,
          isDragging: false,
          isAnimating: true,
          shouldTransition: false,
        });
        queueMicrotask(completeAnimation);
        return;
      }

      const startedAt = pendingAnimation.startedAt;
      const runAnimationFrame = (time: number) => {
        frameRef.current = null;
        if (pendingAnimationRef.current !== pendingAnimation) return;

        const elapsed = Math.max(0, time - startedAt);
        const linearProgress = clamp(elapsed / duration, 0, 1);
        const easedProgress = getExpoAnimationProgress(linearProgress);
        const progress =
          startProgress + (targetProgress - startProgress) * easedProgress;
        pendingProgressRef.current = progress;
        setMotion({
          progress,
          wrapDirection: direction,
          isDragging: false,
          isAnimating: true,
          shouldTransition: false,
        });

        if (linearProgress >= 1) {
          completeAnimation();
          return;
        }
        frameRef.current = requestAnimationFrame(runAnimationFrame);
      };

      frameRef.current = requestAnimationFrame(runAnimationFrame);
      scheduleAnimationFallback();
    },
    [
      cancelFrame,
      cancelTransitionRestore,
      clearFallbackTimer,
      completeAnimation,
      scheduleAnimationFallback,
    ],
  );

  const beginNavigation = useCallback(
    (
      requestedValue: number,
      source: ExpoSliderChangeSource,
      requestedDirection?: ExpoSliderDirection,
      requestedDistance?: number,
    ) => {
      const latestOptions = optionsRef.current;
      if (
        latestOptions.disabled ||
        latestOptions.count <= 1 ||
        pointerSessionRef.current
      ) {
        return false;
      }

      expectedCommittedValueRef.current = null;

      if (pendingAnimationRef.current?.kind === "snap-back") {
        pendingAnimationRef.current = null;
      }

      const previousNavigation =
        pendingAnimationRef.current?.kind === "navigation"
          ? pendingAnimationRef.current
          : null;
      const from = previousNavigation?.from ?? currentValueRef.current;
      const to = normalizeExpoSliderValue(
        requestedValue,
        latestOptions.count,
        latestOptions.loop,
      );

      const directDistance = to - from;
      const referenceProgress = previousNavigation?.distance ?? 0;
      let navigationDistance = latestOptions.loop
        ? requestedDistance === undefined
          ? getLoopDistanceNearProgress(
              directDistance,
              latestOptions.count,
              referenceProgress,
              requestedDirection ?? referenceProgress,
            )
          : Math.trunc(getFiniteNumber(requestedDistance, directDistance))
        : directDistance;
      if (
        latestOptions.loop &&
        normalizeExpoSliderValue(
          from + navigationDistance,
          latestOptions.count,
          true,
        ) !== to
      ) {
        navigationDistance = getLoopDistanceNearProgress(
          directDistance,
          latestOptions.count,
          referenceProgress,
          requestedDirection ?? referenceProgress,
        );
      }
      if (
        (!previousNavigation && navigationDistance === 0) ||
        (previousNavigation?.to === to &&
          previousNavigation.distance === navigationDistance)
      ) {
        return false;
      }

      const startProgress = pendingProgressRef.current;
      const motionDirection =
        getMotionDirection(navigationDistance - startProgress) ||
        getMotionDirection(navigationDistance) ||
        requestedDirection ||
        1;
      const direction =
        getMotionDirection(navigationDistance) || motionDirection;
      const pendingNavigation: PendingNavigation = {
        kind: "navigation",
        from,
        to,
        distance: navigationDistance,
        direction,
        source,
        count: latestOptions.count,
        loop: latestOptions.loop,
        startedAt: null,
        duration: latestOptions.transitionDuration,
      };
      pendingAnimationRef.current = pendingNavigation;
      setNavigationValue(to);
      animateToProgress(
        pendingNavigation,
        startProgress,
        navigationDistance,
        motionDirection,
      );
      return true;
    },
    [animateToProgress],
  );

  const canNavigate = useCallback(
    (direction: ExpoSliderDirection) => {
      const pendingNavigation =
        pendingAnimationRef.current?.kind === "navigation"
          ? pendingAnimationRef.current
          : null;
      return (
        !motion.isDragging &&
        canNavigateFromValue(
          pendingNavigation?.to ?? currentValueRef.current,
          direction,
          optionsRef.current.count,
          optionsRef.current.loop,
          optionsRef.current.disabled,
        )
      );
    },
    [motion.isDragging],
  );

  const navigate = useCallback(
    (
      direction: ExpoSliderDirection,
      source: ExpoSliderChangeSource = "programmatic",
    ) => {
      const pendingNavigation =
        pendingAnimationRef.current?.kind === "navigation"
          ? pendingAnimationRef.current
          : null;
      const targetValue = pendingNavigation?.to ?? currentValueRef.current;
      const targetDistance = (pendingNavigation?.distance ?? 0) + direction;
      return beginNavigation(
        targetValue + direction,
        source,
        direction,
        targetDistance,
      );
    },
    [beginNavigation],
  );

  const goTo = useCallback(
    (index: number, source: ExpoSliderChangeSource = "programmatic") => {
      const latestOptions = optionsRef.current;
      const pendingNavigation =
        pendingAnimationRef.current?.kind === "navigation"
          ? pendingAnimationRef.current
          : null;
      const from = pendingNavigation?.from ?? currentValueRef.current;
      const target = normalizeExpoSliderValue(
        index,
        latestOptions.count,
        latestOptions.loop,
      );
      const referenceProgress = pendingNavigation?.distance ?? 0;
      const targetDelta =
        target - (pendingNavigation?.to ?? currentValueRef.current);
      const preferredDirection = latestOptions.loop
        ? getMotionDirection(
            getWrappedDistance(targetDelta, latestOptions.count),
          )
        : getMotionDirection(targetDelta);
      const directDistance = target - from;
      const targetDistance = latestOptions.loop
        ? getLoopDistanceNearProgress(
            directDistance,
            latestOptions.count,
            referenceProgress,
            preferredDirection || referenceProgress,
          )
        : directDistance;
      const direction =
        getMotionDirection(targetDistance - referenceProgress) ||
        getMotionDirection(targetDistance) ||
        undefined;
      return beginNavigation(index, source, direction, targetDistance);
    },
    [beginNavigation],
  );

  const beginSnapBack = useCallback(() => {
    cancelFrame();
    const startProgress = pendingProgressRef.current;
    const hasVisibleProgress = Math.abs(startProgress) > 0.001;
    const wrapDirection = getMotionDirection(startProgress);

    if (!hasVisibleProgress) {
      pendingAnimationRef.current = null;
      clearFallbackTimer();
      setNavigationValue(currentValueRef.current);
      resetMotion();
      return;
    }

    const pendingSnapBack: PendingSnapBack = {
      kind: "snap-back",
      startedAt: null,
      duration: optionsRef.current.transitionDuration,
    };
    pendingAnimationRef.current = pendingSnapBack;
    setNavigationValue(currentValueRef.current);
    animateToProgress(pendingSnapBack, startProgress, 0, wrapDirection);
  }, [animateToProgress, cancelFrame, clearFallbackTimer, resetMotion]);

  const getDragProgress = useCallback((session: PointerSession) => {
    const latestOptions = optionsRef.current;
    let progress =
      session.baseProgress -
      (session.latestAxis - session.startAxis) / session.extent;

    if (!latestOptions.loop) {
      const latestValue = currentValueRef.current;
      const minimumProgress = -latestValue;
      const maximumProgress = latestOptions.count - 1 - latestValue;
      if (progress < minimumProgress) {
        progress =
          minimumProgress +
          clamp(
            (progress - minimumProgress) * EDGE_RESISTANCE,
            -MAX_EDGE_OVERSHOOT,
            0,
          );
      } else if (progress > maximumProgress) {
        progress =
          maximumProgress +
          clamp(
            (progress - maximumProgress) * EDGE_RESISTANCE,
            0,
            MAX_EDGE_OVERSHOOT,
          );
      }
    }

    return progress;
  }, []);

  const commitDragProgress = useCallback(() => {
    frameRef.current = null;
    setMotion({
      progress: pendingProgressRef.current,
      wrapDirection: getMotionDirection(pendingProgressRef.current),
      isDragging: true,
      isAnimating: false,
      shouldTransition: false,
    });
  }, []);

  const scheduleDragProgress = useCallback(
    (progress: number) => {
      pendingProgressRef.current = progress;
      if (frameRef.current !== null) return;

      if (typeof requestAnimationFrame !== "function") {
        commitDragProgress();
        return;
      }
      frameRef.current = requestAnimationFrame(commitDragProgress);
    },
    [commitDragProgress],
  );

  const beginPointerDrag = useCallback(
    (session: PointerSession) => {
      const interruptedAnimation = pendingAnimationRef.current;
      session.baseProgress = pendingProgressRef.current;
      session.baseIntentProgress =
        interruptedAnimation?.kind === "navigation"
          ? interruptedAnimation.distance
          : 0;
      session.interruptedAnimation = interruptedAnimation !== null;

      if (interruptedAnimation) {
        pendingAnimationRef.current = null;
        cancelFrame();
        clearFallbackTimer();
      }
      cancelTransitionRestore();
      setNavigationValue(currentValueRef.current);
    },
    [cancelFrame, cancelTransitionRestore, clearFallbackTimer],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const initialOptions = optionsRef.current;
      if (
        initialOptions.disabled ||
        initialOptions.count <= 1 ||
        pointerSessionRef.current ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      const latestOptions = optionsRef.current;
      if (
        latestOptions.disabled ||
        latestOptions.count <= 1 ||
        pointerSessionRef.current ||
        !event.currentTarget.isConnected
      ) {
        return;
      }

      const { axis, crossAxis } = getAxisValues(
        event,
        latestOptions.orientation,
      );
      const bounds = event.currentTarget.getBoundingClientRect();
      const extent = Math.max(
        latestOptions.orientation === "horizontal"
          ? bounds.width || event.currentTarget.clientWidth
          : bounds.height || event.currentTarget.clientHeight,
        1,
      );
      const session: PointerSession = {
        pointerId: event.pointerId,
        viewport: event.currentTarget,
        startAxis: axis,
        startCrossAxis: crossAxis,
        latestAxis: axis,
        latestCrossAxis: crossAxis,
        extent,
        baseProgress: 0,
        baseIntentProgress: 0,
        axis: "pending",
        captured: false,
        interruptedAnimation: false,
        samples: [{ axis, time: getEventTime(event) }],
      };
      pointerSessionRef.current = session;
      capturePointer(session);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      if (optionsRef.current.disabled) {
        detachPointerSession(event.pointerId);
        if (session.interruptedAnimation) beginSnapBack();
        return;
      }

      const { axis, crossAxis } = getAxisValues(
        event,
        optionsRef.current.orientation,
      );
      session.latestAxis = axis;
      session.latestCrossAxis = crossAxis;
      const axisDistance = Math.abs(axis - session.startAxis);
      const crossAxisDistance = Math.abs(crossAxis - session.startCrossAxis);

      if (session.axis === "pending") {
        if (Math.max(axisDistance, crossAxisDistance) < AXIS_LOCK_DISTANCE) {
          return;
        }

        session.axis = crossAxisDistance > axisDistance ? "cross" : "primary";
        if (session.axis === "cross") {
          detachPointerSession(event.pointerId);
          scheduleTransitionRestore();
          return;
        }
        beginPointerDrag(session);
        capturePointer(session);
      }

      if (session.axis !== "primary") return;
      event.preventDefault();
      const sampleTime = getEventTime(event);
      session.samples.push({ axis, time: sampleTime });
      session.samples = session.samples.filter(
        (sample) => sampleTime - sample.time <= VELOCITY_SAMPLE_WINDOW_MS,
      );
      scheduleDragProgress(getDragProgress(session));
    },
    [
      beginPointerDrag,
      beginSnapBack,
      detachPointerSession,
      getDragProgress,
      scheduleDragProgress,
      scheduleTransitionRestore,
    ],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const { axis, crossAxis } = getAxisValues(
        event,
        optionsRef.current.orientation,
      );
      session.latestAxis = Number.isFinite(axis) ? axis : session.latestAxis;
      session.latestCrossAxis = Number.isFinite(crossAxis)
        ? crossAxis
        : session.latestCrossAxis;
      const endTime = getEventTime(event);
      if (session.axis === "primary") {
        session.samples.push({ axis: session.latestAxis, time: endTime });
        session.samples = session.samples.filter(
          (sample) => endTime - sample.time <= VELOCITY_SAMPLE_WINDOW_MS,
        );
      }

      detachPointerSession(event.pointerId);
      if (session.axis !== "primary") {
        scheduleTransitionRestore();
        return;
      }
      cancelFrame();

      const dragProgress = getDragProgress(session);
      pendingProgressRef.current = dragProgress;
      const delta = session.latestAxis - session.startAxis;
      const oldestSample = session.samples[0];
      const elapsed = oldestSample
        ? Math.max(endTime - oldestSample.time, 1)
        : 1;
      const velocity = oldestSample
        ? (session.latestAxis - oldestSample.axis) / elapsed
        : 0;
      const latestOptions = optionsRef.current;
      const pointerProgress = -delta / session.extent;
      const rawVelocityProgress =
        -(velocity * PROJECTED_MOTION_MS) / session.extent;
      const velocityProgress =
        Math.abs(velocity) >= latestOptions.velocityThreshold &&
        getMotionDirection(rawVelocityProgress) ===
          getMotionDirection(pointerProgress)
          ? clamp(rawVelocityProgress, -1, 1)
          : 0;
      const pointerIntent = pointerProgress + velocityProgress;
      const direction = getMotionDirection(pointerIntent);

      if (!direction) {
        beginSnapBack();
        return;
      }

      const pointerSteps =
        direction * Math.max(1, Math.round(Math.abs(pointerIntent)));
      let navigationDistance = session.baseIntentProgress + pointerSteps;
      if (!latestOptions.loop) {
        navigationDistance = clamp(
          navigationDistance,
          -currentValueRef.current,
          latestOptions.count - 1 - currentValueRef.current,
        );
      }

      if (
        navigationDistance !== 0 &&
        beginNavigation(
          currentValueRef.current + navigationDistance,
          "pointer",
          direction,
          navigationDistance,
        )
      ) {
        return;
      }
      beginSnapBack();
    },
    [
      beginNavigation,
      beginSnapBack,
      cancelFrame,
      detachPointerSession,
      getDragProgress,
      scheduleTransitionRestore,
    ],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = detachPointerSession(event.pointerId);
      if (!session) return;
      if (session.axis !== "primary") {
        scheduleTransitionRestore();
        return;
      }
      cancelFrame();
      pendingProgressRef.current = getDragProgress(session);
      beginSnapBack();
    },
    [
      beginSnapBack,
      cancelFrame,
      detachPointerSession,
      getDragProgress,
      scheduleTransitionRestore,
    ],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = detachPointerSession(event.pointerId, false);
      if (!session) return;
      if (session.axis !== "primary") {
        scheduleTransitionRestore();
        return;
      }
      cancelFrame();
      pendingProgressRef.current = getDragProgress(session);
      beginSnapBack();
    },
    [
      beginSnapBack,
      cancelFrame,
      detachPointerSession,
      getDragProgress,
      scheduleTransitionRestore,
    ],
  );

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (
        !session ||
        session.pointerId !== event.pointerId ||
        session.captured
      ) {
        return;
      }

      const detachedSession = detachPointerSession(event.pointerId, false);
      if (detachedSession?.axis === "primary") {
        cancelFrame();
        pendingProgressRef.current = getDragProgress(detachedSession);
        beginSnapBack();
      } else {
        scheduleTransitionRestore();
      }
    },
    [
      beginSnapBack,
      cancelFrame,
      detachPointerSession,
      getDragProgress,
      scheduleTransitionRestore,
    ],
  );

  const cancelActiveInteraction = useCallback(() => {
    detachPointerSession();
    pendingAnimationRef.current = null;
    expectedCommittedValueRef.current = null;
    cancelFrame();
    clearFallbackTimer();
    setNavigationValue(currentValueRef.current);
    resetMotionWithoutTransition();
  }, [
    cancelFrame,
    clearFallbackTimer,
    detachPointerSession,
    resetMotionWithoutTransition,
  ]);

  useEffect(() => {
    if (isControlled) return;
    setUncontrolledValue((previousValue) =>
      normalizeExpoSliderValue(previousValue, safeCount, effectiveLoop),
    );
  }, [effectiveLoop, isControlled, safeCount]);

  const topologyRef = useRef({
    currentValue,
    count: safeCount,
    loop: effectiveLoop,
    orientation,
    disabled,
  });

  useLayoutEffect(() => {
    const previousTopology = topologyRef.current;
    const valueChanged = previousTopology.currentValue !== currentValue;
    const structureChanged =
      previousTopology.count !== safeCount ||
      previousTopology.loop !== effectiveLoop ||
      previousTopology.orientation !== orientation ||
      previousTopology.disabled !== disabled;
    topologyRef.current = {
      currentValue,
      count: safeCount,
      loop: effectiveLoop,
      orientation,
      disabled,
    };

    if (valueChanged || structureChanged) {
      const expectedCommittedValue = expectedCommittedValueRef.current;
      const acceptsExpectedCommit =
        valueChanged &&
        !structureChanged &&
        expectedCommittedValue?.value === currentValue;
      expectedCommittedValueRef.current = null;
      setNavigationValue(currentValue);
      if (acceptsExpectedCommit) {
        cancelTransitionRestore();
        pendingProgressRef.current = 0;
        setMotion({
          progress: 0,
          wrapDirection: expectedCommittedValue.wrapDirection,
          isDragging: false,
          isAnimating: false,
          shouldTransition: false,
        });
        scheduleTransitionRestore();
      } else if (pointerSessionRef.current || pendingAnimationRef.current) {
        cancelActiveInteraction();
      } else {
        resetMotionWithoutTransition();
      }
    }
  }, [
    cancelActiveInteraction,
    cancelTransitionRestore,
    currentValue,
    disabled,
    effectiveLoop,
    orientation,
    resetMotionWithoutTransition,
    safeCount,
    scheduleTransitionRestore,
  ]);

  useEffect(
    () => () => {
      cancelFrame();
      cancelTransitionRestore();
      clearFallbackTimer();
      const session = pointerSessionRef.current;
      pointerSessionRef.current = null;
      pendingAnimationRef.current = null;
      if (session) releasePointerCapture(session);
    },
    [cancelFrame, cancelTransitionRestore, clearFallbackTimer],
  );

  return {
    currentValue,
    navigationValue,
    motionProgress: motion.progress,
    wrapDirection: motion.wrapDirection,
    isDragging: motion.isDragging,
    isAnimating: motion.isAnimating,
    shouldTransition: motion.shouldTransition,
    transitionDuration: resolvedTransitionDuration,
    canNavigate,
    navigate,
    goTo,
    completeAnimation,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handlePointerCancel,
    handleLostPointerCapture,
    handlePointerLeave,
  };
}
