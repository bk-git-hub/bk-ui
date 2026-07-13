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
}

interface PointerSession {
  pointerId: number;
  viewport: HTMLDivElement;
  startX: number;
  startY: number;
  latestX: number;
  axis: "pending" | "horizontal" | "vertical";
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
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const transitionRef = useRef<SlicerSliderTransition | null>(null);
  const transitionIdRef = useRef(0);
  const pointerSessionRef = useRef<PointerSession | null>(null);

  useEffect(() => {
    const pending = transitionRef.current;
    if (pending && isControlled && settledValue !== pending.from) {
      transitionRef.current = null;
      setTransition(null);
      setRenderedValue(settledValue);
      return;
    }

    if (!pending) {
      setRenderedValue((currentValue) =>
        currentValue === settledValue ? currentValue : settledValue,
      );
    }
  }, [isControlled, settledValue]);

  useEffect(() => {
    const pending = transitionRef.current;
    if (!pending || (pending.from < safeCount && pending.to < safeCount)) {
      return;
    }

    transitionRef.current = null;
    setTransition(null);
    setRenderedValue(settledValue);
  }, [safeCount, settledValue]);

  const goTo = useCallback(
    (
      requestedValue: number,
      source: SlicerSliderChangeSource,
      requestedDirection?: SlicerSliderDirection,
    ) => {
      if (disabled || safeCount <= 1 || transitionRef.current) return false;

      const targetValue = normalizeSlicerSliderValue(
        requestedValue,
        safeCount,
        loop,
      );
      if (targetValue === renderedValue) return false;

      const direction =
        requestedDirection ?? (targetValue > renderedValue ? 1 : -1);
      const detail: SlicerSliderValueChangeDetail = {
        previousValue: renderedValue,
        direction,
        source,
      };

      if (reducedMotion) {
        if (!isControlled) {
          setUncontrolledValue(targetValue);
          setRenderedValue(targetValue);
        }
        onValueChange?.(targetValue, detail);
        return true;
      }

      const nextTransition: SlicerSliderTransition = {
        id: ++transitionIdRef.current,
        from: renderedValue,
        to: targetValue,
        ...detail,
      };

      transitionRef.current = nextTransition;
      setTransition(nextTransition);
      setIsDragging(false);
      return true;
    },
    [
      disabled,
      isControlled,
      loop,
      onValueChange,
      reducedMotion,
      renderedValue,
      safeCount,
    ],
  );

  const navigate = useCallback(
    (direction: SlicerSliderDirection, source: SlicerSliderChangeSource) =>
      goTo(
        getSlicerSliderTarget(renderedValue, direction, safeCount, loop),
        source,
        direction,
      ),
    [goTo, loop, renderedValue, safeCount],
  );

  const canNavigate = useCallback(
    (direction: SlicerSliderDirection) =>
      !disabled &&
      !isPointerActive &&
      transitionRef.current === null &&
      safeCount > 1 &&
      getSlicerSliderTarget(renderedValue, direction, safeCount, loop) !==
        renderedValue,
    [disabled, isPointerActive, loop, renderedValue, safeCount],
  );

  const completeTransition = useCallback(
    (transitionId: number) => {
      const pending = transitionRef.current;
      if (!pending || pending.id !== transitionId) return false;

      transitionRef.current = null;
      setTransition(null);
      if (!isControlled) {
        setUncontrolledValue(pending.to);
        setRenderedValue(pending.to);
      } else {
        setRenderedValue(settledValue);
      }
      onValueChange?.(pending.to, {
        previousValue: pending.previousValue,
        direction: pending.direction,
        source: pending.source,
      });
      return true;
    },
    [isControlled, onValueChange, settledValue],
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
        transitionRef.current ||
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
