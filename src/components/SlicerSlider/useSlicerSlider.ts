/* eslint-disable no-unused-vars -- Base ESLint treats TypeScript callback parameter names as runtime bindings. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type SlicerSliderDirection = -1 | 1;

export type SlicerSliderChangeSource =
  | "keyboard"
  | "next"
  | "pagination"
  | "pointer"
  | "previous";

export interface SlicerSliderValueChangeDetail {
  previousValue: number;
  direction: SlicerSliderDirection;
  source: SlicerSliderChangeSource;
}

export interface SlicerSliderTransition extends SlicerSliderValueChangeDetail {
  id: number;
  from: number;
  to: number;
}

export interface UseSlicerSliderOptions {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (
    value: number,
    detail: SlicerSliderValueChangeDetail,
  ) => void;
  loop?: boolean;
  disabled?: boolean;
  dragThreshold?: number;
  reducedMotion?: boolean;
  getReducedMotion?: () => boolean;
}

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startX: number;
  startY: number;
  latestX: number;
  axis: "pending" | "horizontal" | "vertical";
}

interface SlicerSliderNavigationRequest {
  to: number;
  direction: SlicerSliderDirection;
  source: SlicerSliderChangeSource;
}

interface PendingSlicerSliderTransition extends SlicerSliderTransition {
  completed: boolean;
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-slicer-slider-no-drag]";
const AXIS_LOCK_DISTANCE = 7;
const MAX_CONCURRENT_WAVES = 8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function normalizeSlicerSliderValue(
  value: number,
  count: number,
  loop: boolean,
) {
  const safeCount = Math.max(0, Math.trunc(count));
  if (safeCount === 0) return 0;

  const integerValue = Number.isFinite(value) ? Math.trunc(value) : 0;
  if (!loop) return clamp(integerValue, 0, safeCount - 1);
  return ((integerValue % safeCount) + safeCount) % safeCount;
}

export function getSlicerSliderTarget(
  value: number,
  direction: SlicerSliderDirection,
  count: number,
  loop: boolean,
) {
  return normalizeSlicerSliderValue(value + direction, count, loop);
}

export function useSlicerSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  disabled = false,
  dragThreshold = 48,
  reducedMotion = false,
  getReducedMotion,
}: UseSlicerSliderOptions) {
  const safeCount = Math.max(0, Math.trunc(count));
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeSlicerSliderValue(defaultValue, safeCount, loop),
  );
  const settledValue = normalizeSlicerSliderValue(
    isControlled ? value : uncontrolledValue,
    safeCount,
    loop,
  );
  const [renderedValue, setRenderedValue] = useState(settledValue);
  const [plannedValue, setPlannedValueState] = useState(settledValue);
  const [transitions, setTransitions] = useState<
    readonly SlicerSliderTransition[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const plannedValueRef = useRef(settledValue);
  const transitionsRef = useRef<readonly SlicerSliderTransition[]>([]);
  const pendingTransitionsRef = useRef<PendingSlicerSliderTransition[]>([]);
  const controlledExpectedValuesRef = useRef<number[]>([]);
  const previousSettledValueRef = useRef(settledValue);
  const previousControlledRef = useRef(isControlled);
  const transitionIdRef = useRef(0);
  const pointerSessionRef = useRef<PointerSession | null>(null);

  const updatePlannedValue = useCallback((nextValue: number) => {
    plannedValueRef.current = nextValue;
    setPlannedValueState(nextValue);
  }, []);

  const replaceVisibleTransitions = useCallback(
    (nextTransitions: readonly SlicerSliderTransition[]) => {
      transitionsRef.current = nextTransitions;
      setTransitions(nextTransitions);
    },
    [],
  );

  const removeVisibleTransition = useCallback(
    (transitionId: number) => {
      replaceVisibleTransitions(
        transitionsRef.current.filter(
          (transition) => transition.id !== transitionId,
        ),
      );
    },
    [replaceVisibleTransitions],
  );

  const resetTransitions = useCallback(
    (nextValue: number) => {
      pendingTransitionsRef.current = [];
      controlledExpectedValuesRef.current = [];
      replaceVisibleTransitions([]);
      updatePlannedValue(nextValue);
      setRenderedValue(nextValue);
      setIsDragging(false);
    },
    [replaceVisibleTransitions, updatePlannedValue],
  );

  const drainCompletedTransitions = useCallback(() => {
    const completedTransitions: PendingSlicerSliderTransition[] = [];
    const pendingTransitions = pendingTransitionsRef.current;

    while (pendingTransitions[0]?.completed) {
      completedTransitions.push(pendingTransitions.shift()!);
    }
    if (completedTransitions.length === 0) return false;

    if (isControlled) {
      const completedValues = completedTransitions.map(
        (transition) => transition.to,
      );
      controlledExpectedValuesRef.current.push(...completedValues);
      if (completedValues[completedValues.length - 1] === settledValue) {
        controlledExpectedValuesRef.current = [];
      }
      if (pendingTransitions.length === 0) {
        updatePlannedValue(settledValue);
      }
    } else {
      const committedValue =
        completedTransitions[completedTransitions.length - 1].to;
      setUncontrolledValue(committedValue);
      setRenderedValue(committedValue);
    }

    completedTransitions.forEach((completedTransition) => {
      onValueChange?.(completedTransition.to, {
        previousValue: completedTransition.previousValue,
        direction: completedTransition.direction,
        source: completedTransition.source,
      });
    });
    return true;
  }, [isControlled, onValueChange, settledValue, updatePlannedValue]);

  const completeTransition = useCallback(
    (transitionId: number) => {
      const pendingTransition = pendingTransitionsRef.current.find(
        (transition) => transition.id === transitionId,
      );
      if (!pendingTransition || pendingTransition.completed) return false;

      pendingTransition.completed = true;
      removeVisibleTransition(transitionId);
      drainCompletedTransitions();
      return true;
    },
    [drainCompletedTransitions, removeVisibleTransition],
  );

  const completeAllTransitions = useCallback(() => {
    const pendingTransitions = pendingTransitionsRef.current;
    if (!pendingTransitions.some((transition) => !transition.completed)) {
      return false;
    }

    pendingTransitions.forEach((transition) => {
      transition.completed = true;
    });
    replaceVisibleTransitions([]);
    drainCompletedTransitions();
    return true;
  }, [drainCompletedTransitions, replaceVisibleTransitions]);

  const startTransition = useCallback(
    (from: number, request: SlicerSliderNavigationRequest) => {
      if (request.to === from) return false;

      while (transitionsRef.current.length >= MAX_CONCURRENT_WAVES) {
        const oldestTransition = transitionsRef.current[0];
        const oldestPendingTransition = pendingTransitionsRef.current.find(
          (transition) => transition.id === oldestTransition.id,
        );
        if (oldestPendingTransition) oldestPendingTransition.completed = true;
        removeVisibleTransition(oldestTransition.id);
        drainCompletedTransitions();
      }

      const nextTransition: SlicerSliderTransition = {
        id: ++transitionIdRef.current,
        from,
        to: request.to,
        previousValue: from,
        direction: request.direction,
        source: request.source,
      };

      pendingTransitionsRef.current.push({
        ...nextTransition,
        completed: false,
      });
      replaceVisibleTransitions([...transitionsRef.current, nextTransition]);
      updatePlannedValue(request.to);
      setIsDragging(false);
      return true;
    },
    [
      drainCompletedTransitions,
      removeVisibleTransition,
      replaceVisibleTransitions,
      updatePlannedValue,
    ],
  );

  const runNavigation = useCallback(
    (from: number, request: SlicerSliderNavigationRequest) => {
      if (request.to === from) return false;

      if (getReducedMotion?.() ?? reducedMotion) {
        completeAllTransitions();
        if (isControlled) {
          if (request.to === settledValue) {
            controlledExpectedValuesRef.current = [];
          } else {
            controlledExpectedValuesRef.current.push(request.to);
          }
          updatePlannedValue(settledValue);
        } else {
          updatePlannedValue(request.to);
          setUncontrolledValue(request.to);
          setRenderedValue(request.to);
        }
        onValueChange?.(request.to, {
          previousValue: from,
          direction: request.direction,
          source: request.source,
        });
        return true;
      }

      return startTransition(from, request);
    },
    [
      completeAllTransitions,
      getReducedMotion,
      isControlled,
      onValueChange,
      reducedMotion,
      settledValue,
      startTransition,
      updatePlannedValue,
    ],
  );

  useEffect(() => {
    const wasControlled = previousControlledRef.current;
    const previousSettledValue = previousSettledValueRef.current;
    previousControlledRef.current = isControlled;
    previousSettledValueRef.current = settledValue;

    if (wasControlled !== isControlled) {
      resetTransitions(settledValue);
      return;
    }

    if (!isControlled) {
      setRenderedValue((currentValue) =>
        currentValue === settledValue ? currentValue : settledValue,
      );
      if (pendingTransitionsRef.current.length === 0) {
        updatePlannedValue(settledValue);
      }
      return;
    }

    if (settledValue === previousSettledValue) return;

    const expectedValues = controlledExpectedValuesRef.current;
    const approvedIndex = expectedValues.lastIndexOf(settledValue);
    if (approvedIndex >= 0) {
      expectedValues.splice(0, approvedIndex + 1);
      setRenderedValue(settledValue);
      if (
        pendingTransitionsRef.current.length === 0 &&
        expectedValues.length === 0
      ) {
        updatePlannedValue(settledValue);
      }
      return;
    }

    resetTransitions(settledValue);
  }, [isControlled, resetTransitions, settledValue, updatePlannedValue]);

  useEffect(() => {
    const normalizedPlannedValue = normalizeSlicerSliderValue(
      plannedValueRef.current,
      safeCount,
      loop,
    );
    const hasInvalidTransition = pendingTransitionsRef.current.some(
      (transition) =>
        transition.from >= safeCount ||
        transition.to >= safeCount ||
        transition.from < 0 ||
        transition.to < 0,
    );

    if (
      hasInvalidTransition ||
      normalizedPlannedValue !== plannedValueRef.current
    ) {
      resetTransitions(settledValue);
    }
  }, [loop, resetTransitions, safeCount, settledValue]);

  useEffect(() => {
    if (reducedMotion) completeAllTransitions();
  }, [completeAllTransitions, reducedMotion]);

  const goTo = useCallback(
    (
      requestedValue: number,
      source: SlicerSliderChangeSource,
      requestedDirection?: SlicerSliderDirection,
    ) => {
      if (disabled || safeCount <= 1) return false;

      const from = plannedValueRef.current;
      const targetValue = normalizeSlicerSliderValue(
        requestedValue,
        safeCount,
        loop,
      );
      if (targetValue === from) return false;

      return runNavigation(from, {
        to: targetValue,
        direction: requestedDirection ?? (targetValue > from ? 1 : -1),
        source,
      });
    },
    [disabled, loop, runNavigation, safeCount],
  );

  const navigate = useCallback(
    (direction: SlicerSliderDirection, source: SlicerSliderChangeSource) => {
      const from = plannedValueRef.current;
      return goTo(
        getSlicerSliderTarget(from, direction, safeCount, loop),
        source,
        direction,
      );
    },
    [goTo, loop, safeCount],
  );

  const canNavigate = useCallback(
    (direction: SlicerSliderDirection) =>
      !disabled &&
      !isPointerActive &&
      safeCount > 1 &&
      getSlicerSliderTarget(plannedValue, direction, safeCount, loop) !==
        plannedValue,
    [disabled, isPointerActive, loop, plannedValue, safeCount],
  );

  const releasePointerSession = useCallback((pointerId?: number) => {
    const session = pointerSessionRef.current;
    if (
      !session ||
      (pointerId !== undefined && session.pointerId !== pointerId)
    ) {
      return null;
    }

    pointerSessionRef.current = null;
    setIsDragging(false);
    setIsPointerActive(false);
    if (
      session.viewport.hasPointerCapture?.(session.pointerId) &&
      session.viewport.releasePointerCapture
    ) {
      session.viewport.releasePointerCapture(session.pointerId);
    }
    return session;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        disabled ||
        safeCount <= 1 ||
        pointerSessionRef.current ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      const target = event.target;
      if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      pointerSessionRef.current = {
        pointerId: event.pointerId,
        viewport: event.currentTarget,
        startX: event.clientX,
        startY: event.clientY,
        latestX: event.clientX,
        axis: "pending",
      };
      setIsPointerActive(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [disabled, safeCount],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - session.startX;
      const deltaY = event.clientY - session.startY;
      session.latestX = event.clientX;

      if (
        session.axis === "pending" &&
        Math.hypot(deltaX, deltaY) >= AXIS_LOCK_DISTANCE
      ) {
        session.axis =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
        if (session.axis === "horizontal") {
          setIsDragging(true);
        } else {
          releasePointerSession(event.pointerId);
          return;
        }
      }

      if (session.axis === "horizontal") event.preventDefault();
    },
    [releasePointerSession],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = releasePointerSession(event.pointerId);
      if (!session || session.axis !== "horizontal") return;

      const deltaX = event.clientX - session.startX;
      if (Math.abs(deltaX) < Math.max(0, dragThreshold)) return;
      navigate(deltaX < 0 ? 1 : -1, "pointer");
    },
    [dragThreshold, navigate, releasePointerSession],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      releasePointerSession(event.pointerId);
    },
    [releasePointerSession],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      releasePointerSession(event.pointerId);
    },
    [releasePointerSession],
  );

  const transition = transitions[0] ?? null;

  return {
    currentValue: renderedValue,
    plannedValue,
    transition,
    transitions,
    isDragging,
    isPointerActive,
    canNavigate,
    goTo,
    navigate,
    completeTransition,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handlePointerCancel,
    handleLostPointerCapture,
  };
}
