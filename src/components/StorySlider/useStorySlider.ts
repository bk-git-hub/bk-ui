"use client";

/* eslint-disable no-unused-vars -- Callback parameter names document the public API. */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type StorySliderDirection = -1 | 1;

export interface StorySliderValue {
  groupIndex: number;
  itemIndex: number;
}

export type StorySliderChangeSource =
  | "autoplay"
  | "keyboard"
  | "next"
  | "pointer"
  | "previous"
  | "programmatic"
  | "tap";

export interface StorySliderValueChangeDetail {
  previousValue: StorySliderValue;
  direction: StorySliderDirection;
  source: StorySliderChangeSource;
}

export type StorySliderValueChangeHandler = (
  value: StorySliderValue,
  detail: StorySliderValueChangeDetail,
) => void;

export interface StorySliderPlaybackEndDetail {
  value: StorySliderValue;
}

export interface UseStorySliderOptions {
  groupCounts: readonly number[];
  value?: StorySliderValue;
  defaultValue?: StorySliderValue;
  onValueChange?: StorySliderValueChangeHandler;
  onPlaybackEnd?: (detail: StorySliderPlaybackEndDetail) => void;
  duration?: number | ((value: StorySliderValue) => number);
  autoplay?: boolean;
  loop?: boolean;
  disabled?: boolean;
  swipeThreshold?: number;
  tapPreviousRatio?: number;
  longPressDelay?: number;
}

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startX: number;
  startY: number;
  latestX: number;
  latestY: number;
  width: number;
  left: number;
  startedAt: number;
  axis: "pending" | "horizontal" | "vertical";
  captured: boolean;
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-story-slider-no-navigation]";
const AXIS_LOCK_DISTANCE = 7;
const DEFAULT_DURATION = 5000;
const MAX_FRAME_DELTA = 100;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function sanitizeGroupCounts(groupCounts: readonly number[]) {
  return groupCounts.map((count) =>
    Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0,
  );
}

function getPlayableGroups(groupCounts: readonly number[]) {
  return groupCounts
    .map((count, index) => (count > 0 ? index : -1))
    .filter((index) => index >= 0);
}

function valuesEqual(left: StorySliderValue, right: StorySliderValue) {
  return (
    left.groupIndex === right.groupIndex && left.itemIndex === right.itemIndex
  );
}

function getNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function getAdjacentPlayableGroup(
  groupIndex: number,
  direction: StorySliderDirection,
  groupCounts: readonly number[],
  loop: boolean,
) {
  const playableGroups = getPlayableGroups(groupCounts);
  if (playableGroups.length <= 1) return groupIndex;

  const currentPosition = playableGroups.indexOf(groupIndex);
  if (currentPosition < 0) return playableGroups[0] ?? 0;

  const requestedPosition = currentPosition + direction;
  if (loop) {
    return (
      playableGroups[
        (requestedPosition + playableGroups.length) % playableGroups.length
      ] ?? groupIndex
    );
  }

  return playableGroups[requestedPosition] ?? groupIndex;
}

export function normalizeStorySliderValue(
  value: StorySliderValue,
  groupCounts: readonly number[],
) {
  const safeCounts = sanitizeGroupCounts(groupCounts);
  const playableGroups = getPlayableGroups(safeCounts);
  if (playableGroups.length === 0) {
    return { groupIndex: 0, itemIndex: 0 };
  }

  const requestedGroup = Number.isFinite(value.groupIndex)
    ? Math.trunc(value.groupIndex)
    : playableGroups[0];
  const exactGroup = safeCounts[requestedGroup] ? requestedGroup : undefined;
  const groupIndex =
    exactGroup ??
    playableGroups.find((index) => index >= requestedGroup) ??
    playableGroups[playableGroups.length - 1] ??
    0;
  const itemCount = safeCounts[groupIndex] ?? 0;
  const requestedItem = Number.isFinite(value.itemIndex)
    ? Math.trunc(value.itemIndex)
    : 0;

  return {
    groupIndex,
    itemIndex: clamp(requestedItem, 0, Math.max(0, itemCount - 1)),
  };
}

export function getStorySliderStep(
  value: StorySliderValue,
  direction: StorySliderDirection,
  groupCounts: readonly number[],
  loop: boolean,
) {
  const safeCounts = sanitizeGroupCounts(groupCounts);
  const currentValue = normalizeStorySliderValue(value, safeCounts);
  const itemCount = safeCounts[currentValue.groupIndex] ?? 0;

  if (direction === 1 && currentValue.itemIndex < itemCount - 1) {
    return { ...currentValue, itemIndex: currentValue.itemIndex + 1 };
  }
  if (direction === -1 && currentValue.itemIndex > 0) {
    return { ...currentValue, itemIndex: currentValue.itemIndex - 1 };
  }

  const groupIndex = getAdjacentPlayableGroup(
    currentValue.groupIndex,
    direction,
    safeCounts,
    loop,
  );
  if (groupIndex === currentValue.groupIndex) {
    if (loop && itemCount > 1) {
      return {
        groupIndex,
        itemIndex: direction === 1 ? 0 : itemCount - 1,
      };
    }
    return currentValue;
  }

  return {
    groupIndex,
    itemIndex:
      direction === -1 ? Math.max(0, (safeCounts[groupIndex] ?? 1) - 1) : 0,
  };
}

export function getStorySliderGroupPosition(
  groupIndex: number,
  currentGroupIndex: number,
  groupCounts: readonly number[],
  loop: boolean,
) {
  const playableGroups = getPlayableGroups(groupCounts);
  const groupPosition = playableGroups.indexOf(groupIndex);
  const currentPosition = playableGroups.indexOf(currentGroupIndex);
  if (groupPosition < 0 || currentPosition < 0) {
    return groupIndex - currentGroupIndex;
  }

  let distance = groupPosition - currentPosition;
  const playableCount = playableGroups.length;
  if (!loop || playableCount <= 2) return distance;

  const half = playableCount / 2;
  distance =
    ((((distance + half) % playableCount) + playableCount) % playableCount) -
    half;
  return distance;
}

function resolveDuration(
  duration: UseStorySliderOptions["duration"],
  value: StorySliderValue,
) {
  const resolved = typeof duration === "function" ? duration(value) : duration;
  return Number.isFinite(resolved)
    ? Math.max(100, Number(resolved))
    : DEFAULT_DURATION;
}

export function useStorySlider({
  groupCounts,
  value,
  defaultValue = { groupIndex: 0, itemIndex: 0 },
  onValueChange,
  onPlaybackEnd,
  duration = DEFAULT_DURATION,
  autoplay = true,
  loop = false,
  disabled = false,
  swipeThreshold = 0.18,
  tapPreviousRatio = 0.35,
  longPressDelay = 200,
}: UseStorySliderOptions) {
  const groupCountsKey = groupCounts
    .map((count) =>
      Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0,
    )
    .join(",");
  const safeGroupCounts = useMemo(
    () =>
      groupCountsKey === ""
        ? []
        : groupCountsKey.split(",").map((count) => Number(count)),
    [groupCountsKey],
  );
  const isControlled = value !== undefined;
  const wasControlledRef = useRef(isControlled);
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeStorySliderValue(defaultValue, safeGroupCounts),
  );
  const candidateGroupIndex = (value ?? uncontrolledValue).groupIndex;
  const candidateItemIndex = (value ?? uncontrolledValue).itemIndex;
  const currentValue = useMemo(
    () =>
      normalizeStorySliderValue(
        {
          groupIndex: candidateGroupIndex,
          itemIndex: candidateItemIndex,
        },
        safeGroupCounts,
      ),
    [candidateGroupIndex, candidateItemIndex, safeGroupCounts],
  );
  const currentValueRef = useRef(currentValue);
  const groupCountsRef = useRef(safeGroupCounts);
  const loopRef = useRef(loop);
  const onValueChangeRef = useRef(onValueChange);
  const onPlaybackEndRef = useRef(onPlaybackEnd);

  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const [isManuallyPaused, setIsManuallyPaused] = useState(() => !autoplay);
  const transientPauseReasonsRef = useRef(new Set<string>());
  const [transientPauseCount, setTransientPauseCount] = useState(0);

  const pointerSessionRef = useRef<PointerSession | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingDragOffsetRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  currentValueRef.current = currentValue;
  groupCountsRef.current = safeGroupCounts;
  loopRef.current = loop;
  onValueChangeRef.current = onValueChange;
  onPlaybackEndRef.current = onPlaybackEnd;

  const resolvedDuration = resolveDuration(duration, currentValue);
  const isPaused = disabled || isManuallyPaused || transientPauseCount > 0;

  useEffect(() => {
    if (wasControlledRef.current !== isControlled) {
      console.warn(
        "StorySliderRoot should not switch between controlled and uncontrolled modes.",
      );
    }
  }, [isControlled]);

  useEffect(() => {
    if (isControlled) return;
    setUncontrolledValue((previousValue) =>
      normalizeStorySliderValue(previousValue, safeGroupCounts),
    );
    // A primitive key avoids resetting when consumers create the counts array inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupCountsKey, isControlled]);

  useEffect(() => {
    if (!autoplay) setIsManuallyPaused(true);
  }, [autoplay]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) setIsManuallyPaused(true);
    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsManuallyPaused(true);
    };
    motionQuery.addEventListener?.("change", handleMotionChange);
    return () =>
      motionQuery.removeEventListener?.("change", handleMotionChange);
  }, []);

  const setTransientPause = useCallback((reason: string, paused: boolean) => {
    const reasons = transientPauseReasonsRef.current;
    const hadReason = reasons.has(reason);
    if (paused === hadReason) return;

    if (paused) reasons.add(reason);
    else reasons.delete(reason);
    setTransientPauseCount(reasons.size);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const pauseReasons = transientPauseReasonsRef.current;
    const handleVisibilityChange = () =>
      setTransientPause("visibility", document.hidden);
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pauseReasons.delete("visibility");
    };
  }, [setTransientPause]);

  const resetPlaybackClock = useCallback(() => {
    elapsedRef.current = 0;
    lastFrameTimeRef.current = null;
    progressRef.current = 0;
    setProgress(0);
  }, []);

  const goTo = useCallback(
    (
      requestedValue: StorySliderValue,
      source: StorySliderChangeSource = "programmatic",
      requestedDirection?: StorySliderDirection,
    ) => {
      if (disabled) return false;
      const previousValue = currentValueRef.current;
      const nextValue = normalizeStorySliderValue(
        requestedValue,
        groupCountsRef.current,
      );
      if (valuesEqual(previousValue, nextValue)) return false;

      const direction =
        requestedDirection ??
        (nextValue.groupIndex > previousValue.groupIndex ||
        (nextValue.groupIndex === previousValue.groupIndex &&
          nextValue.itemIndex > previousValue.itemIndex)
          ? 1
          : -1);

      resetPlaybackClock();
      if (!wasControlledRef.current) setUncontrolledValue(nextValue);
      onValueChangeRef.current?.(nextValue, {
        previousValue,
        direction,
        source,
      });
      return true;
    },
    [disabled, resetPlaybackClock],
  );

  const getTarget = useCallback((direction: StorySliderDirection) => {
    return getStorySliderStep(
      currentValueRef.current,
      direction,
      groupCountsRef.current,
      loopRef.current,
    );
  }, []);

  const canNavigate = useCallback(
    (direction: StorySliderDirection) =>
      !disabled && !valuesEqual(currentValueRef.current, getTarget(direction)),
    [disabled, getTarget],
  );

  const navigate = useCallback(
    (direction: StorySliderDirection, source: StorySliderChangeSource) =>
      goTo(getTarget(direction), source, direction),
    [getTarget, goTo],
  );

  const getGroupTarget = useCallback((direction: StorySliderDirection) => {
    const previousValue = currentValueRef.current;
    const groupIndex = getAdjacentPlayableGroup(
      previousValue.groupIndex,
      direction,
      groupCountsRef.current,
      loopRef.current,
    );
    return { groupIndex, itemIndex: 0 };
  }, []);

  const canNavigateGroup = useCallback(
    (direction: StorySliderDirection) =>
      !disabled &&
      !valuesEqual(currentValueRef.current, getGroupTarget(direction)),
    [disabled, getGroupTarget],
  );

  const navigateGroup = useCallback(
    (direction: StorySliderDirection, source: StorySliderChangeSource) =>
      goTo(getGroupTarget(direction), source, direction),
    [getGroupTarget, goTo],
  );

  const pause = useCallback(() => setIsManuallyPaused(true), []);
  const play = useCallback(() => {
    if (progressRef.current >= 1) resetPlaybackClock();
    setIsManuallyPaused(false);
  }, [resetPlaybackClock]);
  const togglePlayback = useCallback(() => {
    if (isManuallyPaused) play();
    else pause();
  }, [isManuallyPaused, pause, play]);

  useEffect(() => {
    resetPlaybackClock();
  }, [
    currentValue.groupIndex,
    currentValue.itemIndex,
    resetPlaybackClock,
    resolvedDuration,
  ]);

  useEffect(() => {
    if (playbackFrameRef.current !== null) {
      cancelAnimationFrame(playbackFrameRef.current);
      playbackFrameRef.current = null;
    }
    lastFrameTimeRef.current = null;

    if (
      isPaused ||
      getPlayableGroups(safeGroupCounts).length === 0 ||
      resolvedDuration <= 0
    ) {
      return;
    }

    const runFrame = (timestamp: number) => {
      const lastFrameTime = lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      if (lastFrameTime !== null) {
        elapsedRef.current += Math.min(
          Math.max(0, timestamp - lastFrameTime),
          MAX_FRAME_DELTA,
        );
      }

      const nextProgress = clamp(elapsedRef.current / resolvedDuration, 0, 1);
      progressRef.current = nextProgress;
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        playbackFrameRef.current = null;
        if (!navigate(1, "autoplay")) {
          setIsManuallyPaused(true);
          onPlaybackEndRef.current?.({ value: currentValueRef.current });
        }
        return;
      }

      playbackFrameRef.current = requestAnimationFrame(runFrame);
    };

    playbackFrameRef.current = requestAnimationFrame(runFrame);
    return () => {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }
      lastFrameTimeRef.current = null;
    };
    // A primitive key keeps inline groupCounts arrays from restarting playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentValue.groupIndex,
    currentValue.itemIndex,
    groupCountsKey,
    isPaused,
    navigate,
    resolvedDuration,
  ]);

  const flushDragOffset = useCallback(() => {
    dragFrameRef.current = null;
    setDragOffset(pendingDragOffsetRef.current);
  }, []);

  const scheduleDragOffset = useCallback(
    (nextOffset: number) => {
      pendingDragOffsetRef.current = nextOffset;
      if (dragFrameRef.current !== null) return;
      if (typeof requestAnimationFrame !== "function") {
        flushDragOffset();
        return;
      }
      dragFrameRef.current = requestAnimationFrame(flushDragOffset);
    },
    [flushDragOffset],
  );

  const clearPointerSession = useCallback(
    (releaseCapture = true) => {
      const session = pointerSessionRef.current;
      pointerSessionRef.current = null;
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
      pendingDragOffsetRef.current = 0;
      setDragOffset(0);
      setIsDragging(false);
      setTransientPause("interaction", false);

      if (
        releaseCapture &&
        session?.captured &&
        session.viewport.hasPointerCapture?.(session.pointerId)
      ) {
        session.viewport.releasePointerCapture?.(session.pointerId);
      }
    },
    [setTransientPause],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0 || pointerSessionRef.current) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(INTERACTIVE_SELECTOR) !== null
      ) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const pointerSession: PointerSession = {
        pointerId: event.pointerId,
        viewport: event.currentTarget,
        startX: event.clientX,
        startY: event.clientY,
        latestX: event.clientX,
        latestY: event.clientY,
        width: Math.max(1, bounds.width),
        left: bounds.left,
        startedAt: getNow(),
        axis: "pending",
        captured: false,
      };
      pointerSessionRef.current = pointerSession;
      setTransientPause("interaction", true);
      if (event.pointerType === "mouse") {
        event.preventDefault();
        if (typeof event.currentTarget.setPointerCapture === "function") {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointerSession.captured = true;
        }
      }
    },
    [disabled, setTransientPause],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      session.latestX = event.clientX;
      session.latestY = event.clientY;
      const deltaX = session.latestX - session.startX;
      const deltaY = session.latestY - session.startY;

      if (session.axis === "pending") {
        if (
          Math.abs(deltaX) < AXIS_LOCK_DISTANCE &&
          Math.abs(deltaY) < AXIS_LOCK_DISTANCE
        ) {
          return;
        }

        session.axis =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
        if (session.axis === "vertical") {
          clearPointerSession(false);
          return;
        }

        if (typeof event.currentTarget.setPointerCapture === "function") {
          event.currentTarget.setPointerCapture(event.pointerId);
          session.captured = true;
        }
        setIsDragging(true);
      }

      if (session.axis !== "horizontal") return;
      event.preventDefault();
      let nextOffset = clamp(deltaX / session.width, -1, 1);
      const direction: StorySliderDirection = nextOffset > 0 ? -1 : 1;
      if (!canNavigateGroup(direction)) nextOffset *= 0.28;
      scheduleDragOffset(nextOffset);
    },
    [canNavigateGroup, clearPointerSession, scheduleDragOffset],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - session.startX;
      const offset = clamp(deltaX / session.width, -1, 1);
      const heldFor = getNow() - session.startedAt;
      const wasHorizontalDrag = session.axis === "horizontal";

      if (wasHorizontalDrag && Math.abs(offset) >= swipeThreshold) {
        navigateGroup(offset > 0 ? -1 : 1, "pointer");
      } else if (
        session.axis === "pending" &&
        heldFor < Math.max(0, longPressDelay)
      ) {
        const relativeX = clamp(
          (session.startX - session.left) / session.width,
          0,
          1,
        );
        navigate(relativeX < clamp(tapPreviousRatio, 0.1, 0.9) ? -1 : 1, "tap");
      }

      clearPointerSession();
    },
    [
      clearPointerSession,
      longPressDelay,
      navigate,
      navigateGroup,
      swipeThreshold,
      tapPreviousRatio,
    ],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      clearPointerSession();
    },
    [clearPointerSession],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      clearPointerSession(false);
    },
    [clearPointerSession],
  );

  useEffect(
    () => () => {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
      }
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
      }
    },
    [],
  );

  return {
    canNavigate,
    canNavigateGroup,
    currentValue,
    dragOffset,
    goTo,
    groupCounts: safeGroupCounts,
    handleLostPointerCapture,
    handlePointerCancel,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    isDragging,
    isManuallyPaused,
    isPaused,
    loop,
    navigate,
    navigateGroup,
    pause,
    play,
    progress,
    resolvedDuration,
    setTransientPause,
    togglePlayback,
  };
}
