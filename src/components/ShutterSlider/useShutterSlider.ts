/* eslint-disable no-unused-vars -- Public callback parameter names document the hook contract. */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type ShutterSliderDirection = -1 | 1;

export type ShutterSliderChangeSource =
  | "keyboard"
  | "next"
  | "pagination"
  | "pointer"
  | "previous";

export interface ShutterSliderValueChangeDetail {
  previousValue: number;
  direction: ShutterSliderDirection;
  source: ShutterSliderChangeSource;
}

export interface ShutterSliderTransition
  extends ShutterSliderValueChangeDetail {
  id: number;
  from: number;
  to: number;
}

export type ShutterSliderValueChangeHandler = (
  value: number,
  detail: ShutterSliderValueChangeDetail,
) => void;

export interface UseShutterSliderOptions {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: ShutterSliderValueChangeHandler;
  loop?: boolean;
  disabled?: boolean;
  dragThreshold?: number;
}

type PointerAxis = "horizontal" | "pending" | "vertical";

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startX: number;
  startY: number;
  latestX: number;
  axis: PointerAxis;
}

interface TransitionTopology {
  count: number;
  loop: boolean;
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-shutter-slider-no-drag]";
const AXIS_LOCK_DISTANCE = 7;
const DEFAULT_DRAG_THRESHOLD = 48;

function getSafeCount(count: number) {
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function capturePointer(viewport: HTMLDivElement, pointerId: number) {
  if (typeof viewport.setPointerCapture !== "function") return;

  try {
    viewport.setPointerCapture(pointerId);
  } catch {
    return;
  }
}

function releasePointerCapture(session: PointerSession) {
  const { pointerId, viewport } = session;
  if (typeof viewport.releasePointerCapture !== "function") return;

  try {
    if (
      typeof viewport.hasPointerCapture === "function" &&
      !viewport.hasPointerCapture(pointerId)
    ) {
      return;
    }
    viewport.releasePointerCapture(pointerId);
  } catch {
    return;
  }
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR);
}

export function normalizeShutterSliderValue(
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

export function getShutterSliderTarget(
  value: number,
  direction: ShutterSliderDirection,
  count: number,
  loop: boolean,
) {
  return normalizeShutterSliderValue(value + direction, count, loop);
}

export function useShutterSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  disabled = false,
  dragThreshold = DEFAULT_DRAG_THRESHOLD,
}: UseShutterSliderOptions) {
  const safeCount = getSafeCount(count);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeShutterSliderValue(defaultValue, safeCount, loop),
  );
  const settledValue = normalizeShutterSliderValue(
    isControlled ? value : uncontrolledValue,
    safeCount,
    loop,
  );
  const [renderedValue, setRenderedValue] = useState(settledValue);
  const [transition, setTransition] = useState<ShutterSliderTransition | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const currentValueRef = useRef(renderedValue);
  const settledValueRef = useRef(settledValue);
  const transitionRef = useRef<ShutterSliderTransition | null>(null);
  const transitionTopologyRef = useRef<TransitionTopology | null>(null);
  const invalidatedTransitionIdRef = useRef<number | null>(null);
  const transitionIdRef = useRef(0);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const isControlledRef = useRef(isControlled);
  const onValueChangeRef = useRef(onValueChange);
  const optionsRef = useRef({
    count: safeCount,
    loop,
    disabled,
    dragThreshold,
  });

  const pendingTopology = transitionTopologyRef.current;
  const topologyChanged =
    transition !== null &&
    pendingTopology !== null &&
    (pendingTopology.count !== safeCount || pendingTopology.loop !== loop);
  const controlledValueChanged =
    isControlled && transition !== null && settledValue !== transition.from;
  const shouldCancelTransition = topologyChanged || controlledValueChanged;
  const visibleTransition = shouldCancelTransition ? null : transition;
  const currentValue =
    isControlled && visibleTransition === null
      ? settledValue
      : normalizeShutterSliderValue(renderedValue, safeCount, loop);

  currentValueRef.current = currentValue;
  invalidatedTransitionIdRef.current = shouldCancelTransition
    ? (transition?.id ?? null)
    : null;
  settledValueRef.current = settledValue;
  isControlledRef.current = isControlled;
  onValueChangeRef.current = onValueChange;
  optionsRef.current = {
    count: safeCount,
    loop,
    disabled,
    dragThreshold,
  };

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
    releasePointerCapture(session);
    return session;
  }, []);

  useEffect(() => {
    if (
      isControlled ||
      transitionRef.current ||
      renderedValue === settledValue
    ) {
      return;
    }

    currentValueRef.current = settledValue;
    setRenderedValue(settledValue);
  }, [isControlled, renderedValue, settledValue]);

  useEffect(() => {
    if (!shouldCancelTransition || transition === null) return;

    if (transitionRef.current?.id === transition.id) {
      transitionRef.current = null;
      transitionTopologyRef.current = null;
      invalidatedTransitionIdRef.current = null;
    }
    setTransition((pending) =>
      pending?.id === transition.id ? null : pending,
    );
    const nextValue = isControlled
      ? settledValue
      : normalizeShutterSliderValue(renderedValue, safeCount, loop);
    currentValueRef.current = nextValue;
    setRenderedValue(nextValue);
    releasePointerSession();
  }, [
    isControlled,
    loop,
    releasePointerSession,
    renderedValue,
    safeCount,
    settledValue,
    shouldCancelTransition,
    transition,
  ]);

  useEffect(() => {
    if (isControlled) return;

    setUncontrolledValue((previousValue) => {
      const normalizedValue = normalizeShutterSliderValue(
        previousValue,
        safeCount,
        loop,
      );
      return normalizedValue === previousValue
        ? previousValue
        : normalizedValue;
    });
  }, [isControlled, loop, safeCount]);

  useEffect(() => {
    const pending = transitionRef.current;
    if (!pending) return;

    const fromIsValid =
      normalizeShutterSliderValue(pending.from, safeCount, loop) ===
      pending.from;
    const toIsValid =
      normalizeShutterSliderValue(pending.to, safeCount, loop) === pending.to;
    if (safeCount > 1 && fromIsValid && toIsValid) return;

    transitionRef.current = null;
    transitionTopologyRef.current = null;
    invalidatedTransitionIdRef.current = null;
    setTransition(null);
    currentValueRef.current = settledValue;
    setRenderedValue(settledValue);
  }, [loop, safeCount, settledValue]);

  useEffect(() => {
    if (!disabled && safeCount > 1) return;
    releasePointerSession();
  }, [disabled, releasePointerSession, safeCount]);

  useEffect(
    () => () => {
      const session = pointerSessionRef.current;
      pointerSessionRef.current = null;
      transitionRef.current = null;
      transitionTopologyRef.current = null;
      invalidatedTransitionIdRef.current = null;
      if (session) releasePointerCapture(session);
    },
    [],
  );

  const commitTransition = useCallback(
    (pending: ShutterSliderTransition, committedValue: number) => {
      if (transitionRef.current?.id !== pending.id) return false;

      transitionRef.current = null;
      transitionTopologyRef.current = null;
      invalidatedTransitionIdRef.current = null;
      setTransition((current) => (current?.id === pending.id ? null : current));
      currentValueRef.current = committedValue;
      setRenderedValue(committedValue);
      if (!isControlledRef.current) setUncontrolledValue(pending.to);
      onValueChangeRef.current?.(pending.to, {
        previousValue: pending.previousValue,
        direction: pending.direction,
        source: pending.source,
      });
      return true;
    },
    [],
  );

  const goTo = useCallback(
    (
      requestedValue: number,
      source: ShutterSliderChangeSource,
      requestedDirection?: ShutterSliderDirection,
    ) => {
      const latestOptions = optionsRef.current;
      if (
        latestOptions.disabled ||
        latestOptions.count <= 1 ||
        pointerSessionRef.current
      ) {
        return false;
      }

      const pending = transitionRef.current;
      if (pending && invalidatedTransitionIdRef.current === pending.id) {
        return false;
      }

      const from = pending?.to ?? currentValueRef.current;
      const to = normalizeShutterSliderValue(
        requestedValue,
        latestOptions.count,
        latestOptions.loop,
      );
      if (to === from) return false;

      if (pending) commitTransition(pending, pending.to);

      const direction = requestedDirection ?? (to > from ? 1 : -1);
      const nextTransition: ShutterSliderTransition = {
        id: ++transitionIdRef.current,
        from,
        to,
        previousValue: from,
        direction,
        source,
      };

      transitionRef.current = nextTransition;
      transitionTopologyRef.current = {
        count: latestOptions.count,
        loop: latestOptions.loop,
      };
      invalidatedTransitionIdRef.current = null;
      setTransition(nextTransition);
      setIsDragging(false);
      return true;
    },
    [commitTransition],
  );

  const navigate = useCallback(
    (direction: ShutterSliderDirection, source: ShutterSliderChangeSource) => {
      const latestOptions = optionsRef.current;
      const pending = transitionRef.current;
      const from =
        pending && invalidatedTransitionIdRef.current !== pending.id
          ? pending.to
          : currentValueRef.current;
      return goTo(
        getShutterSliderTarget(
          from,
          direction,
          latestOptions.count,
          latestOptions.loop,
        ),
        source,
        direction,
      );
    },
    [goTo],
  );

  const canNavigate = useCallback((direction: ShutterSliderDirection) => {
    const latestOptions = optionsRef.current;
    const pending = transitionRef.current;
    const from =
      pending && invalidatedTransitionIdRef.current !== pending.id
        ? pending.to
        : currentValueRef.current;
    return (
      !latestOptions.disabled &&
      latestOptions.count > 1 &&
      pointerSessionRef.current === null &&
      getShutterSliderTarget(
        from,
        direction,
        latestOptions.count,
        latestOptions.loop,
      ) !== from
    );
  }, []);

  const completeTransition = useCallback(
    (transitionId: number) => {
      if (invalidatedTransitionIdRef.current === transitionId) return;

      const pending = transitionRef.current;
      if (!pending || pending.id !== transitionId) return;

      const committedValue = isControlledRef.current
        ? settledValueRef.current
        : pending.to;
      commitTransition(pending, committedValue);
    },
    [commitTransition],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const latestOptions = optionsRef.current;
      if (
        latestOptions.disabled ||
        latestOptions.count <= 1 ||
        pointerSessionRef.current ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        isInteractiveTarget(event.target)
      ) {
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
      capturePointer(event.currentTarget, event.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      if (optionsRef.current.disabled) {
        releasePointerSession(event.pointerId);
        return;
      }

      const deltaX = event.clientX - session.startX;
      const deltaY = event.clientY - session.startY;
      session.latestX = event.clientX;

      if (
        session.axis === "pending" &&
        Math.hypot(deltaX, deltaY) >= AXIS_LOCK_DISTANCE
      ) {
        session.axis =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
        if (session.axis === "vertical") {
          releasePointerSession(event.pointerId);
          return;
        }
        setIsDragging(true);
      }

      if (session.axis === "horizontal") event.preventDefault();
    },
    [releasePointerSession],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = releasePointerSession(event.pointerId);
      if (!session || session.axis !== "horizontal") return;

      const eventX = Number.isFinite(event.clientX)
        ? event.clientX
        : session.latestX;
      const deltaX = eventX - session.startX;
      const configuredThreshold = optionsRef.current.dragThreshold;
      const threshold = Number.isFinite(configuredThreshold)
        ? Math.max(0, configuredThreshold)
        : DEFAULT_DRAG_THRESHOLD;
      if (Math.abs(deltaX) < threshold) return;

      navigate(deltaX < 0 ? 1 : -1, "pointer");
    },
    [navigate, releasePointerSession],
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
    currentValue,
    transition: visibleTransition,
    isDragging,
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
