/* eslint-disable no-unused-vars -- Base ESLint treats TypeScript callback parameter names as runtime bindings. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ShaderSliderDirection } from "./shader-slider-types";

export type ShaderSliderChangeSource =
  | "keyboard"
  | "next"
  | "pagination"
  | "pointer"
  | "previous";

export interface ShaderSliderValueChangeDetail {
  previousValue: number;
  direction: ShaderSliderDirection;
  source: ShaderSliderChangeSource;
}

export interface ShaderSliderTransition extends ShaderSliderValueChangeDetail {
  id: number;
  from: number;
  to: number;
}

export interface UseShaderSliderOptions {
  count: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (
    value: number,
    detail: ShaderSliderValueChangeDetail,
  ) => void;
  loop?: boolean;
  disabled?: boolean;
  dragThreshold?: number;
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
  "a, button, input, select, textarea, label, [contenteditable='true'], [data-shader-slider-no-drag]";
const AXIS_LOCK_DISTANCE = 7;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function normalizeShaderSliderValue(
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

export function getShaderSliderTarget(
  value: number,
  direction: ShaderSliderDirection,
  count: number,
  loop: boolean,
) {
  return normalizeShaderSliderValue(value + direction, count, loop);
}

export function useShaderSlider({
  count,
  value,
  defaultValue = 0,
  onValueChange,
  loop = true,
  disabled = false,
  dragThreshold = 48,
}: UseShaderSliderOptions) {
  const safeCount = Math.max(0, Math.trunc(count));
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeShaderSliderValue(defaultValue, safeCount, loop),
  );
  const settledValue = normalizeShaderSliderValue(
    isControlled ? value : uncontrolledValue,
    safeCount,
    loop,
  );
  const [renderedValue, setRenderedValue] = useState(settledValue);
  const [transition, setTransition] = useState<ShaderSliderTransition | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const transitionRef = useRef<ShaderSliderTransition | null>(null);
  const transitionIdRef = useRef(0);
  const pointerSessionRef = useRef<PointerSession | null>(null);

  useEffect(() => {
    if (transitionRef.current) return;
    setRenderedValue((currentValue) =>
      currentValue === settledValue ? currentValue : settledValue,
    );
  }, [renderedValue, settledValue]);

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
      source: ShaderSliderChangeSource,
      requestedDirection?: ShaderSliderDirection,
    ) => {
      if (disabled || safeCount <= 1 || transitionRef.current !== null) {
        return false;
      }

      const targetValue = normalizeShaderSliderValue(
        requestedValue,
        safeCount,
        loop,
      );
      if (targetValue === renderedValue) return false;

      const direction =
        requestedDirection ?? (targetValue > renderedValue ? 1 : -1);
      const nextTransition: ShaderSliderTransition = {
        id: ++transitionIdRef.current,
        from: renderedValue,
        to: targetValue,
        previousValue: renderedValue,
        direction,
        source,
      };

      transitionRef.current = nextTransition;
      setTransition(nextTransition);
      setIsDragging(false);
      return true;
    },
    [disabled, loop, renderedValue, safeCount],
  );

  const navigate = useCallback(
    (direction: ShaderSliderDirection, source: ShaderSliderChangeSource) =>
      goTo(
        getShaderSliderTarget(renderedValue, direction, safeCount, loop),
        source,
        direction,
      ),
    [goTo, loop, renderedValue, safeCount],
  );

  const canNavigate = useCallback(
    (direction: ShaderSliderDirection) =>
      !disabled &&
      transitionRef.current === null &&
      safeCount > 1 &&
      getShaderSliderTarget(renderedValue, direction, safeCount, loop) !==
        renderedValue,
    [disabled, loop, renderedValue, safeCount],
  );

  const completeTransition = useCallback(
    (transitionId: number) => {
      const pending = transitionRef.current;
      if (!pending || pending.id !== transitionId) return;

      transitionRef.current = null;
      setTransition(null);
      setRenderedValue(pending.to);
      if (!isControlled) setUncontrolledValue(pending.to);
      onValueChange?.(pending.to, {
        previousValue: pending.previousValue,
        direction: pending.direction,
        source: pending.source,
      });
    },
    [isControlled, onValueChange],
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
