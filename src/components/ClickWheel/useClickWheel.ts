"use client";

import {
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

const ROTATION_THRESHOLD = 15;
const INITIAL_ROTATION_THRESHOLD = 8;
const LONG_PRESS_DELAY = 650;
const LONG_PRESS_MOVE_TOLERANCE = 8;

export const CLICK_WHEEL_MIN_SENSITIVITY = 0.5;
export const CLICK_WHEEL_MAX_SENSITIVITY = 2;
export const CLICK_WHEEL_DEFAULT_SENSITIVITY = 1;

export type ClickWheelDirection = -1 | 1;

// The base ESLint rule cannot distinguish type-only function parameters.
// eslint-disable-next-line no-unused-vars
export type ClickWheelRotateHandler = (direction: ClickWheelDirection) => void;
// eslint-disable-next-line no-unused-vars
export type ClickWheelLongPressHandler = (button: HTMLButtonElement) => void;

export interface UseClickWheelOptions {
  onRotate?: ClickWheelRotateHandler;
  onLongPress?: ClickWheelLongPressHandler;
  disabled?: boolean;
  sensitivity?: number;
}

function normalizeSensitivity(sensitivity: number) {
  if (!Number.isFinite(sensitivity)) return CLICK_WHEEL_DEFAULT_SENSITIVITY;
  return Math.min(
    CLICK_WHEEL_MAX_SENSITIVITY,
    Math.max(CLICK_WHEEL_MIN_SENSITIVITY, sensitivity),
  );
}

export function useClickWheel({
  onRotate,
  onLongPress,
  disabled = false,
  sensitivity = CLICK_WHEEL_DEFAULT_SENSITIVITY,
}: UseClickWheelOptions = {}) {
  const normalizedSensitivity = normalizeSensitivity(sensitivity);
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const activePointerId = useRef<number | null>(null);
  const captureTarget = useRef<HTMLElement | null>(null);
  const lastAngle = useRef(0);
  const accumulatedAngle = useRef(0);
  const didDrag = useRef(false);
  const suppressClick = useRef(false);
  const dragOriginButton = useRef<HTMLButtonElement | null>(null);
  const suppressedButton = useRef<HTMLButtonElement | null>(null);
  const clickResetTimer = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const didLongPress = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const center = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const wheelElement = wheelRef.current;
    if (!wheelElement || typeof window === "undefined") return;

    const updateCenter = () => {
      const rect = wheelElement.getBoundingClientRect();
      center.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    updateCenter();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateCenter);
    resizeObserver?.observe(wheelElement);
    window.addEventListener("scroll", updateCenter, true);
    window.addEventListener("resize", updateCenter);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", updateCenter, true);
      window.removeEventListener("resize", updateCenter);
      if (clickResetTimer.current !== null) {
        window.clearTimeout(clickResetTimer.current);
      }
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const getAngle = (event: ReactPointerEvent<HTMLDivElement>) =>
    Math.atan2(
      event.clientY - center.current.y,
      event.clientX - center.current.x,
    ) *
    (180 / Math.PI);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;

    const target = event.target;
    const targetButton =
      target instanceof Element ? target.closest("button") : null;
    if (
      (event.pointerType === "mouse" && event.button !== 0) ||
      activePointerId.current !== null ||
      (targetButton instanceof HTMLButtonElement &&
        !targetButton.hasAttribute("data-wheel-drag"))
    ) {
      return;
    }

    if (clickResetTimer.current !== null) {
      window.clearTimeout(clickResetTimer.current);
      clickResetTimer.current = null;
    }
    suppressClick.current = false;
    suppressedButton.current = null;
    didLongPress.current = false;
    dragOriginButton.current =
      targetButton instanceof HTMLButtonElement ? targetButton : null;
    pointerStart.current = { x: event.clientX, y: event.clientY };

    if (
      onLongPress &&
      targetButton instanceof HTMLButtonElement &&
      targetButton.hasAttribute("data-wheel-long-press")
    ) {
      longPressTimer.current = window.setTimeout(() => {
        longPressTimer.current = null;
        didLongPress.current = true;
        onLongPress(targetButton);
      }, LONG_PRESS_DELAY);
    }

    isDragging.current = true;
    activePointerId.current = event.pointerId;
    captureTarget.current =
      targetButton instanceof HTMLButtonElement
        ? targetButton
        : event.currentTarget;
    captureTarget.current.setPointerCapture?.(event.pointerId);

    const rect = event.currentTarget.getBoundingClientRect();
    center.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    lastAngle.current = getAngle(event);
    accumulatedAngle.current = 0;
    didDrag.current = false;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      disabled ||
      !isDragging.current ||
      activePointerId.current !== event.pointerId
    ) {
      return;
    }

    if (
      longPressTimer.current !== null &&
      Math.hypot(
        event.clientX - pointerStart.current.x,
        event.clientY - pointerStart.current.y,
      ) > LONG_PRESS_MOVE_TOLERANCE
    ) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const currentAngle = getAngle(event);
    let delta = currentAngle - lastAngle.current;
    lastAngle.current = currentAngle;

    if (Math.abs(delta) > 180) {
      delta = delta > 0 ? delta - 360 : delta + 360;
    }
    accumulatedAngle.current += delta;

    let rotationThreshold =
      (didDrag.current ? ROTATION_THRESHOLD : INITIAL_ROTATION_THRESHOLD) /
      normalizedSensitivity;

    while (Math.abs(accumulatedAngle.current) >= rotationThreshold) {
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      didDrag.current = true;
      event.preventDefault();
      const direction: ClickWheelDirection =
        accumulatedAngle.current > 0 ? 1 : -1;
      onRotate?.(direction);
      accumulatedAngle.current -= direction * rotationThreshold;
      rotationThreshold = ROTATION_THRESHOLD / normalizedSensitivity;
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if ((didDrag.current || didLongPress.current) && dragOriginButton.current) {
      suppressClick.current = true;
      suppressedButton.current = dragOriginButton.current;
      clickResetTimer.current = window.setTimeout(() => {
        suppressClick.current = false;
        suppressedButton.current = null;
        clickResetTimer.current = null;
      }, 0);
    }

    isDragging.current = false;
    activePointerId.current = null;
    accumulatedAngle.current = 0;
    didDrag.current = false;
    didLongPress.current = false;
    dragOriginButton.current = null;

    if (captureTarget.current?.hasPointerCapture?.(event.pointerId)) {
      captureTarget.current.releasePointerCapture?.(event.pointerId);
    }
    captureTarget.current = null;
  };

  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    isDragging.current = false;
    activePointerId.current = null;
    accumulatedAngle.current = 0;
    didDrag.current = false;
    didLongPress.current = false;
    dragOriginButton.current = null;
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;
    cancelDrag(event);
    captureTarget.current = null;
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;
    cancelDrag(event);

    if (captureTarget.current?.hasPointerCapture?.(event.pointerId)) {
      captureTarget.current.releasePointerCapture?.(event.pointerId);
    }
    captureTarget.current = null;
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      !suppressClick.current ||
      !(target instanceof Node) ||
      !suppressedButton.current?.contains(target)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
    suppressedButton.current = null;
    if (clickResetTimer.current !== null) {
      window.clearTimeout(clickResetTimer.current);
      clickResetTimer.current = null;
    }
  };

  return {
    wheelRef,
    sensitivity: normalizedSensitivity,
    wheelProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel,
      onLostPointerCapture,
      onClickCapture,
    },
  };
}
