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
  axis: PointerAxis;
  captured: boolean;
  samples: PointerSample[];
  expectedValueAfterInterrupt?: number;
}

interface PendingNavigation {
  kind: "navigation";
  from: number;
  to: number;
  direction: ExpoSliderDirection;
  source: ExpoSliderChangeSource;
  count: number;
  loop: boolean;
  startedAt: number | null;
  duration: number;
}

interface PendingSnapBack {
  kind: "snap-back";
  startedAt: number;
  duration: number;
}

type PendingAnimation = PendingNavigation | PendingSnapBack;

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
const DEFAULT_DRAG_THRESHOLD = 0.16;
const DEFAULT_VELOCITY_THRESHOLD = 0.45;
const DEFAULT_TRANSITION_DURATION = 650;
const EDGE_RESISTANCE = 0.28;
const MAX_TRANSITION_END_TOLERANCE_MS = 16;

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
  const relativeDistance = loop
    ? getWrappedDistance(distance, safeCount, safePreferredDirection)
    : distance;

  return relativeDistance - safeMotionProgress;
}

export function useExpoSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  orientation = "horizontal",
  disabled = false,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
  transitionDuration = DEFAULT_TRANSITION_DURATION,
}: UseExpoSliderOptions) {
  const safeCount = getSafeCount(count);
  const effectiveLoop = loop && safeCount > 1;
  const resolvedDragThreshold = clamp(
    getFiniteNumber(dragThreshold, DEFAULT_DRAG_THRESHOLD),
    0,
    1,
  );
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

  const currentValueRef = useRef(currentValue);
  const renderedValueRef = useRef(currentValue);
  const isControlledRef = useRef(isControlled);
  const onValueChangeRef = useRef(onValueChange);
  const optionsRef = useRef({
    count: safeCount,
    loop: effectiveLoop,
    orientation,
    disabled,
    dragThreshold: resolvedDragThreshold,
    velocityThreshold: resolvedVelocityThreshold,
    transitionDuration: resolvedTransitionDuration,
  });
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const pendingAnimationRef = useRef<PendingAnimation | null>(null);
  const pendingProgressRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const transitionRestoreFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    currentValueRef.current = currentValue;
    renderedValueRef.current = currentValue;
    isControlledRef.current = isControlled;
    onValueChangeRef.current = onValueChange;
    optionsRef.current = {
      count: safeCount,
      loop: effectiveLoop,
      orientation,
      disabled,
      dragThreshold: resolvedDragThreshold,
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
    resolvedDragThreshold,
    resolvedTransitionDuration,
    resolvedVelocityThreshold,
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
      setMotion({
        progress: 0,
        wrapDirection: 0,
        isDragging: false,
        isAnimating: false,
        shouldTransition: false,
      });
      scheduleTransitionRestore();

      if (pendingAnimation.kind === "snap-back") return true;

      const latestOptions = optionsRef.current;
      const topologyChanged =
        pendingAnimation.count !== latestOptions.count ||
        pendingAnimation.loop !== latestOptions.loop;
      const controlledValueChanged =
        isControlledRef.current &&
        currentValueRef.current !== pendingAnimation.from;
      if (topologyChanged || controlledValueChanged) return false;

      if (!isControlledRef.current) {
        currentValueRef.current = pendingAnimation.to;
        setUncontrolledValue(pendingAnimation.to);
      }
      onValueChangeRef.current?.(pendingAnimation.to, {
        previousValue: pendingAnimation.from,
        direction: pendingAnimation.direction,
        source: pendingAnimation.source,
      });
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

    if (duration === 0 || prefersReducedMotion()) {
      queueMicrotask(completeAnimation);
      return;
    }

    fallbackTimerRef.current = setTimeout(
      completeAnimation,
      duration + ANIMATION_FALLBACK_BUFFER_MS,
    );
  }, [clearFallbackTimer, completeAnimation]);

  const beginNavigation = useCallback(
    (
      requestedValue: number,
      source: ExpoSliderChangeSource,
      requestedDirection?: ExpoSliderDirection,
    ) => {
      const latestOptions = optionsRef.current;
      if (
        latestOptions.disabled ||
        latestOptions.count <= 1 ||
        pointerSessionRef.current ||
        pendingAnimationRef.current
      ) {
        return false;
      }

      const from = currentValueRef.current;
      const to = normalizeExpoSliderValue(
        requestedValue,
        latestOptions.count,
        latestOptions.loop,
      );
      if (to === from) return false;

      const directDistance = to - from;
      const navigationDistance = requestedDirection
        ? requestedDirection
        : latestOptions.loop
          ? getWrappedDistance(directDistance, latestOptions.count)
          : directDistance;
      const direction: ExpoSliderDirection =
        requestedDirection ?? (navigationDistance > 0 ? 1 : -1);
      const previousProgress = pendingProgressRef.current;
      const oppositeIndex =
        latestOptions.count % 2 === 0
          ? (from + latestOptions.count / 2) % latestOptions.count
          : from;
      const currentWrapDirection =
        getMotionDirection(previousProgress) ||
        getMotionDirection(oppositeIndex - from);
      const shouldPrepareWrap =
        latestOptions.loop &&
        latestOptions.count % 2 === 0 &&
        currentWrapDirection !== direction;

      cancelFrame();
      cancelTransitionRestore();
      const pendingNavigation: PendingNavigation = {
        kind: "navigation",
        from,
        to,
        direction,
        source,
        count: latestOptions.count,
        loop: latestOptions.loop,
        startedAt: null,
        duration: latestOptions.transitionDuration,
      };
      pendingAnimationRef.current = pendingNavigation;
      const startNavigationTransition = () => {
        frameRef.current = null;
        if (pendingAnimationRef.current !== pendingNavigation) return;
        pendingNavigation.duration = optionsRef.current.transitionDuration;
        pendingNavigation.startedAt = getCurrentTime();
        pendingProgressRef.current = navigationDistance;
        setMotion({
          progress: navigationDistance,
          wrapDirection: direction,
          isDragging: false,
          isAnimating: true,
          shouldTransition: true,
        });
        scheduleAnimationFallback();
      };

      if (shouldPrepareWrap && typeof requestAnimationFrame === "function") {
        setMotion({
          progress: previousProgress,
          wrapDirection: direction,
          isDragging: false,
          isAnimating: true,
          shouldTransition: false,
        });
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = requestAnimationFrame(startNavigationTransition);
        });
      } else {
        startNavigationTransition();
      }
      return true;
    },
    [cancelFrame, cancelTransitionRestore, scheduleAnimationFallback],
  );

  const canNavigate = useCallback(
    (direction: ExpoSliderDirection) =>
      !motion.isDragging &&
      !motion.isAnimating &&
      canNavigateFromValue(
        currentValue,
        direction,
        safeCount,
        effectiveLoop,
        disabled,
      ),
    [
      currentValue,
      disabled,
      effectiveLoop,
      motion.isAnimating,
      motion.isDragging,
      safeCount,
    ],
  );

  const navigate = useCallback(
    (
      direction: ExpoSliderDirection,
      source: ExpoSliderChangeSource = "programmatic",
    ) =>
      beginNavigation(currentValueRef.current + direction, source, direction),
    [beginNavigation],
  );

  const goTo = useCallback(
    (index: number, source: ExpoSliderChangeSource = "programmatic") =>
      beginNavigation(index, source),
    [beginNavigation],
  );

  const beginSnapBack = useCallback(() => {
    cancelFrame();
    const hasVisibleProgress = Math.abs(pendingProgressRef.current) > 0.001;
    const wrapDirection = getMotionDirection(pendingProgressRef.current);
    pendingProgressRef.current = 0;

    if (!hasVisibleProgress) {
      pendingAnimationRef.current = null;
      clearFallbackTimer();
      resetMotion();
      return;
    }

    pendingAnimationRef.current = {
      kind: "snap-back",
      startedAt: getCurrentTime(),
      duration: optionsRef.current.transitionDuration,
    };
    setMotion({
      progress: 0,
      wrapDirection,
      isDragging: false,
      isAnimating: true,
      shouldTransition: true,
    });
    scheduleAnimationFallback();
  }, [cancelFrame, clearFallbackTimer, resetMotion, scheduleAnimationFallback]);

  const getDragProgress = useCallback((session: PointerSession) => {
    const latestOptions = optionsRef.current;
    let progress = -(session.latestAxis - session.startAxis) / session.extent;
    progress = clamp(progress, -1.2, 1.2);

    if (!latestOptions.loop) {
      const latestValue = currentValueRef.current;
      const isPastPreviousEdge = progress < 0 && latestValue === 0;
      const isPastNextEdge =
        progress > 0 && latestValue === latestOptions.count - 1;
      if (isPastPreviousEdge || isPastNextEdge) {
        progress *= EDGE_RESISTANCE;
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

      const interruptedAnimation = pendingAnimationRef.current;
      const completedInterruptedAnimation = interruptedAnimation
        ? completeAnimation()
        : false;
      const latestOptions = optionsRef.current;
      if (
        latestOptions.disabled ||
        latestOptions.count <= 1 ||
        pointerSessionRef.current ||
        pendingAnimationRef.current ||
        !event.currentTarget.isConnected
      ) {
        return;
      }
      const expectedValueAfterInterrupt =
        completedInterruptedAnimation &&
        interruptedAnimation?.kind === "navigation" &&
        renderedValueRef.current !== interruptedAnimation.to
          ? interruptedAnimation.to
          : undefined;

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
        axis: "pending",
        captured: false,
        samples: [{ axis, time: getEventTime(event) }],
        expectedValueAfterInterrupt,
      };
      pointerSessionRef.current = session;
      capturePointer(session);
      pendingProgressRef.current = 0;
    },
    [completeAnimation],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      if (optionsRef.current.disabled || pendingAnimationRef.current) {
        detachPointerSession(event.pointerId);
        beginSnapBack();
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
          resetMotion();
          return;
        }
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
      beginSnapBack,
      detachPointerSession,
      getDragProgress,
      resetMotion,
      scheduleDragProgress,
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
      cancelFrame();
      if (session.axis !== "primary") {
        resetMotion();
        return;
      }

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
      const hasDistance =
        Math.abs(delta) >= session.extent * latestOptions.dragThreshold;
      const hasVelocity = Math.abs(velocity) >= latestOptions.velocityThreshold;
      const projectedDelta = delta + velocity * PROJECTED_MOTION_MS;
      const directionalDelta = projectedDelta || delta;
      const direction: ExpoSliderDirection = directionalDelta < 0 ? 1 : -1;

      if (
        (hasDistance || hasVelocity) &&
        canNavigateFromValue(
          currentValueRef.current,
          direction,
          latestOptions.count,
          latestOptions.loop,
          latestOptions.disabled,
        ) &&
        beginNavigation(
          currentValueRef.current + direction,
          "pointer",
          direction,
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
      resetMotion,
    ],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = detachPointerSession(event.pointerId);
      if (!session) return;
      cancelFrame();
      pendingProgressRef.current = getDragProgress(session);
      beginSnapBack();
    },
    [beginSnapBack, cancelFrame, detachPointerSession, getDragProgress],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = detachPointerSession(event.pointerId, false);
      if (!session) return;
      cancelFrame();
      pendingProgressRef.current = getDragProgress(session);
      beginSnapBack();
    },
    [beginSnapBack, cancelFrame, detachPointerSession, getDragProgress],
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

      detachPointerSession(event.pointerId, false);
      cancelFrame();
      resetMotion();
    },
    [cancelFrame, detachPointerSession, resetMotion],
  );

  const cancelActiveInteraction = useCallback(() => {
    detachPointerSession();
    pendingAnimationRef.current = null;
    cancelFrame();
    clearFallbackTimer();
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

    const pointerSession = pointerSessionRef.current;
    const acceptsInterruptedValue =
      valueChanged &&
      !structureChanged &&
      pointerSession?.expectedValueAfterInterrupt === currentValue;
    if (acceptsInterruptedValue && pointerSession) {
      pointerSession.expectedValueAfterInterrupt = undefined;
    }

    if ((valueChanged || structureChanged) && !acceptsInterruptedValue) {
      if (pointerSessionRef.current || pendingAnimationRef.current) {
        cancelActiveInteraction();
      } else {
        resetMotionWithoutTransition();
      }
    }
  }, [
    cancelActiveInteraction,
    currentValue,
    disabled,
    effectiveLoop,
    orientation,
    resetMotionWithoutTransition,
    safeCount,
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
