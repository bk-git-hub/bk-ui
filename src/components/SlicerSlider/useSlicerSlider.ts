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

interface AwaitingControlledValue {
  from: number;
  to: number;
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-slicer-slider-no-drag]";
const AXIS_LOCK_DISTANCE = 7;

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
  const [transition, setTransition] = useState<SlicerSliderTransition | null>(
    null,
  );
  const [queuedNavigation, setQueuedNavigation] =
    useState<SlicerSliderNavigationRequest | null>(null);
  const [awaitingControlledValue, setAwaitingControlledValue] = useState<
    number | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const transitionRef = useRef<SlicerSliderTransition | null>(null);
  const queuedNavigationRef = useRef<SlicerSliderNavigationRequest | null>(
    null,
  );
  const awaitingControlledValueRef = useRef<AwaitingControlledValue | null>(
    null,
  );
  const transitionIdRef = useRef(0);
  const pointerSessionRef = useRef<PointerSession | null>(null);

  const clearQueuedNavigation = useCallback(() => {
    queuedNavigationRef.current = null;
    setQueuedNavigation(null);
  }, []);

  const queueNavigation = useCallback(
    (request: SlicerSliderNavigationRequest) => {
      queuedNavigationRef.current = request;
      setQueuedNavigation(request);
    },
    [],
  );

  const takeQueuedNavigation = useCallback(() => {
    const queued = queuedNavigationRef.current;
    queuedNavigationRef.current = null;
    setQueuedNavigation(null);
    return queued;
  }, []);

  const clearAwaitingControlledValue = useCallback(() => {
    awaitingControlledValueRef.current = null;
    setAwaitingControlledValue(null);
  }, []);

  const waitForControlledValue = useCallback((from: number, to: number) => {
    awaitingControlledValueRef.current = { from, to };
    setAwaitingControlledValue(to);
  }, []);

  const startTransition = useCallback(
    (from: number, request: SlicerSliderNavigationRequest) => {
      if (request.to === from) return false;

      const nextTransition: SlicerSliderTransition = {
        id: ++transitionIdRef.current,
        from,
        to: request.to,
        previousValue: from,
        direction: request.direction,
        source: request.source,
      };

      transitionRef.current = nextTransition;
      setRenderedValue(from);
      setTransition(nextTransition);
      setIsDragging(false);
      return true;
    },
    [],
  );

  const runNavigation = useCallback(
    (from: number, request: SlicerSliderNavigationRequest) => {
      if (request.to === from) return false;

      if (getReducedMotion?.() ?? reducedMotion) {
        if (isControlled) {
          waitForControlledValue(from, request.to);
          setRenderedValue(settledValue);
        } else {
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
      getReducedMotion,
      isControlled,
      onValueChange,
      reducedMotion,
      settledValue,
      startTransition,
      waitForControlledValue,
    ],
  );

  useEffect(() => {
    const pending = transitionRef.current;
    if (pending && isControlled && settledValue !== pending.from) {
      transitionRef.current = null;
      setTransition(null);
      clearQueuedNavigation();
      clearAwaitingControlledValue();
      setRenderedValue(settledValue);
      return;
    }

    if (!pending) {
      setRenderedValue((currentValue) =>
        currentValue === settledValue ? currentValue : settledValue,
      );
    }
  }, [
    clearAwaitingControlledValue,
    clearQueuedNavigation,
    isControlled,
    settledValue,
  ]);

  useEffect(() => {
    const pending = transitionRef.current;
    const queued = queuedNavigationRef.current;
    const awaiting = awaitingControlledValueRef.current;

    if (queued && queued.to >= safeCount) {
      clearQueuedNavigation();
    }
    if (awaiting && (awaiting.from >= safeCount || awaiting.to >= safeCount)) {
      clearAwaitingControlledValue();
      clearQueuedNavigation();
    }
    if (!pending || (pending.from < safeCount && pending.to < safeCount))
      return;

    transitionRef.current = null;
    setTransition(null);
    clearQueuedNavigation();
    clearAwaitingControlledValue();
    setRenderedValue(settledValue);
  }, [
    clearAwaitingControlledValue,
    clearQueuedNavigation,
    safeCount,
    settledValue,
  ]);

  useEffect(() => {
    if (disabled) clearQueuedNavigation();
  }, [clearQueuedNavigation, disabled]);

  useEffect(() => {
    const awaiting = awaitingControlledValueRef.current;
    if (!awaiting) return;

    if (!isControlled) {
      clearAwaitingControlledValue();
      clearQueuedNavigation();
      return;
    }

    if (settledValue === awaiting.to) {
      clearAwaitingControlledValue();
      setRenderedValue(settledValue);
      const queued = takeQueuedNavigation();
      if (queued && queued.to !== settledValue) {
        runNavigation(settledValue, queued);
      }
      return;
    }

    if (settledValue !== awaiting.from) {
      clearAwaitingControlledValue();
      clearQueuedNavigation();
      setRenderedValue(settledValue);
    }
  }, [
    clearAwaitingControlledValue,
    clearQueuedNavigation,
    isControlled,
    runNavigation,
    settledValue,
    takeQueuedNavigation,
  ]);

  const goTo = useCallback(
    (
      requestedValue: number,
      source: SlicerSliderChangeSource,
      requestedDirection?: SlicerSliderDirection,
    ) => {
      if (disabled || safeCount <= 1) return false;

      const targetValue = normalizeSlicerSliderValue(
        requestedValue,
        safeCount,
        loop,
      );
      const activeTransition = transitionRef.current;
      const awaiting = awaitingControlledValueRef.current;
      const queued = queuedNavigationRef.current;
      const plannedFrom = activeTransition?.to ?? awaiting?.to ?? renderedValue;
      const currentPlannedValue = queued?.to ?? plannedFrom;
      if (targetValue === currentPlannedValue) return false;

      if (activeTransition || awaiting) {
        if (targetValue === plannedFrom) {
          if (!queued) return false;
          clearQueuedNavigation();
          return true;
        }

        queueNavigation({
          to: targetValue,
          direction: requestedDirection ?? (targetValue > plannedFrom ? 1 : -1),
          source,
        });
        return true;
      }

      if (targetValue === renderedValue) return false;

      const direction =
        requestedDirection ?? (targetValue > renderedValue ? 1 : -1);
      return runNavigation(renderedValue, {
        to: targetValue,
        direction,
        source,
      });
    },
    [
      clearQueuedNavigation,
      disabled,
      loop,
      queueNavigation,
      renderedValue,
      runNavigation,
      safeCount,
    ],
  );

  const navigate = useCallback(
    (direction: SlicerSliderDirection, source: SlicerSliderChangeSource) => {
      const plannedValue =
        queuedNavigationRef.current?.to ??
        transitionRef.current?.to ??
        awaitingControlledValueRef.current?.to ??
        renderedValue;
      return goTo(
        getSlicerSliderTarget(plannedValue, direction, safeCount, loop),
        source,
        direction,
      );
    },
    [goTo, loop, renderedValue, safeCount],
  );

  const plannedValue =
    queuedNavigation?.to ??
    transition?.to ??
    awaitingControlledValue ??
    renderedValue;

  const canNavigate = useCallback(
    (direction: SlicerSliderDirection) =>
      !disabled &&
      !isPointerActive &&
      safeCount > 1 &&
      getSlicerSliderTarget(plannedValue, direction, safeCount, loop) !==
        plannedValue,
    [disabled, isPointerActive, loop, plannedValue, safeCount],
  );

  const completeTransition = useCallback(
    (transitionId: number) => {
      const pending = transitionRef.current;
      if (!pending || pending.id !== transitionId) return false;

      transitionRef.current = null;
      setTransition(null);
      onValueChange?.(pending.to, {
        previousValue: pending.previousValue,
        direction: pending.direction,
        source: pending.source,
      });

      if (isControlled) {
        setRenderedValue(settledValue);
        waitForControlledValue(pending.from, pending.to);
      } else {
        setUncontrolledValue(pending.to);
        setRenderedValue(pending.to);
        const queued = takeQueuedNavigation();
        if (queued && queued.to !== pending.to) {
          runNavigation(pending.to, queued);
        }
      }
      return true;
    },
    [
      isControlled,
      onValueChange,
      runNavigation,
      settledValue,
      takeQueuedNavigation,
      waitForControlledValue,
    ],
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

  return {
    currentValue: renderedValue,
    plannedValue,
    transition,
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
