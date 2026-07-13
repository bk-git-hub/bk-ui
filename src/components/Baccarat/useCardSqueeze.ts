import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type SqueezeCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export type SqueezeInput = "pointer" | "keyboard" | "action";
export type SqueezeState = "concealed" | "squeezing" | "revealed";

export interface SqueezeChangeDetail {
  input: SqueezeInput;
  corner: SqueezeCorner;
}

export type SqueezeValueChangeHandler = (
  // The base ESLint rule cannot distinguish type-only function parameters.
  // eslint-disable-next-line no-unused-vars
  ...args: [value: number, detail: SqueezeChangeDetail]
) => void;
export type SqueezeCommitHandler = (
  // eslint-disable-next-line no-unused-vars
  ...args: [value: 0 | 1, detail: SqueezeChangeDetail]
) => void;
// eslint-disable-next-line no-unused-vars
export type SqueezeRevealHandler = (detail: SqueezeChangeDetail) => void;

export interface UseCardSqueezeOptions {
  value?: number;
  defaultValue?: number;
  onValueChange?: SqueezeValueChangeHandler;
  onValueCommit?: SqueezeCommitHandler;
  onReveal?: SqueezeRevealHandler;
  corner?: SqueezeCorner;
  revealThreshold?: number;
  keyboardStep?: number;
  disabled?: boolean;
  readOnly?: boolean;
}

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function getInwardVector(corner: SqueezeCorner) {
  const x = corner.endsWith("left") ? 1 : -1;
  const y = corner.startsWith("top") ? 1 : -1;
  const length = Math.hypot(x, y);

  return { x: x / length, y: y / length };
}

export function useCardSqueeze({
  value,
  defaultValue = 0,
  onValueChange,
  onValueCommit,
  onReveal,
  corner = "bottom-right",
  revealThreshold = 0.68,
  keyboardStep = 0.05,
  disabled = false,
  readOnly = false,
}: UseCardSqueezeOptions = {}) {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    clamp(defaultValue),
  );
  const [isDragging, setIsDragging] = useState(false);
  const progress = clamp(isControlled ? value : uncontrolledValue);
  const progressRef = useRef(progress);
  const didRevealRef = useRef(progress === 1);
  const activePointerIdRef = useRef<number | null>(null);
  const activeElementRef = useRef<HTMLDivElement | null>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const latestPointRef = useRef({ x: 0, y: 0 });
  const startProgressRef = useRef(progress);
  const revealDistanceRef = useRef(1);
  const animationFrameRef = useRef<number | null>(null);

  progressRef.current = progress;

  useEffect(() => {
    if (progress < 1) didRevealRef.current = false;
    if (progress === 1) didRevealRef.current = true;
  }, [progress]);

  const updateProgress = useCallback(
    (nextValue: number, input: SqueezeInput) => {
      const nextProgress = clamp(nextValue);
      progressRef.current = nextProgress;
      if (!isControlled) setUncontrolledValue(nextProgress);

      const detail = { input, corner } satisfies SqueezeChangeDetail;
      onValueChange?.(nextProgress, detail);

      if (nextProgress < 1) {
        didRevealRef.current = false;
      } else if (!didRevealRef.current) {
        didRevealRef.current = true;
        onReveal?.(detail);
      }

      return nextProgress;
    },
    [corner, isControlled, onReveal, onValueChange],
  );

  const commitProgress = useCallback(
    (nextValue: 0 | 1, input: SqueezeInput) => {
      updateProgress(nextValue, input);
      onValueCommit?.(nextValue, { input, corner });
    },
    [corner, onValueCommit, updateProgress],
  );

  const applyLatestPointerPosition = useCallback(() => {
    if (activePointerIdRef.current === null) return;

    const deltaX = latestPointRef.current.x - startPointRef.current.x;
    const deltaY = latestPointRef.current.y - startPointRef.current.y;
    const inward = getInwardVector(corner);
    const projectedDistance = deltaX * inward.x + deltaY * inward.y;
    updateProgress(
      startProgressRef.current + projectedDistance / revealDistanceRef.current,
      "pointer",
    );
  }, [corner, updateProgress]);

  const cancelScheduledFrame = useCallback(() => {
    if (animationFrameRef.current === null) return;
    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }, []);

  const flushLatestPointerPosition = useCallback(() => {
    cancelScheduledFrame();
    applyLatestPointerPosition();
  }, [applyLatestPointerPosition, cancelScheduledFrame]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        disabled ||
        readOnly ||
        progressRef.current === 1 ||
        activePointerIdRef.current !== null ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      activePointerIdRef.current = event.pointerId;
      activeElementRef.current = event.currentTarget;
      startPointRef.current = { x: event.clientX, y: event.clientY };
      latestPointRef.current = { x: event.clientX, y: event.clientY };
      startProgressRef.current = progressRef.current;
      revealDistanceRef.current = Math.max(
        1,
        Math.hypot(rect.width, rect.height) * 0.58,
      );
      setIsDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [disabled, readOnly],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      event.preventDefault();
      latestPointRef.current = { x: event.clientX, y: event.clientY };
      if (animationFrameRef.current !== null) return;

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        applyLatestPointerPosition();
      });
    },
    [applyLatestPointerPosition],
  );

  const finishPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
      if (activePointerIdRef.current !== event.pointerId) return;

      if (cancelled) {
        cancelScheduledFrame();
      } else {
        latestPointRef.current = { x: event.clientX, y: event.clientY };
        flushLatestPointerPosition();
      }

      activePointerIdRef.current = null;
      activeElementRef.current = null;
      setIsDragging(false);

      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }

      const nextValue =
        !cancelled && progressRef.current >= clamp(revealThreshold) ? 1 : 0;
      commitProgress(nextValue, "pointer");
    },
    [
      cancelScheduledFrame,
      commitProgress,
      flushLatestPointerPosition,
      revealThreshold,
    ],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => finishPointer(event, false),
    [finishPointer],
  );

  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => finishPointer(event, true),
    [finishPointer],
  );

  const onLostPointerCapture = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      cancelScheduledFrame();
      activePointerIdRef.current = null;
      activeElementRef.current = null;
      setIsDragging(false);
      commitProgress(0, "pointer");
    },
    [cancelScheduledFrame, commitProgress],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled || readOnly) return;

      const step = clamp(keyboardStep, 0.01, 1) * (event.shiftKey ? 4 : 1);
      let nextValue: number | undefined;
      let commitValue: 0 | 1 | undefined;

      switch (event.key) {
        case "ArrowUp":
        case "ArrowRight":
          nextValue = clamp(progressRef.current + step);
          if (nextValue === 1) commitValue = 1;
          break;
        case "ArrowDown":
        case "ArrowLeft":
          nextValue = clamp(progressRef.current - step);
          if (nextValue === 0) commitValue = 0;
          break;
        case "End":
        case "Enter":
        case " ":
          commitValue = 1;
          break;
        case "Home":
        case "Escape":
          commitValue = 0;
          break;
        default:
          return;
      }

      event.preventDefault();
      if (commitValue !== undefined) {
        commitProgress(commitValue, "keyboard");
      } else if (nextValue !== undefined) {
        updateProgress(nextValue, "keyboard");
      }
    },
    [disabled, readOnly, keyboardStep, commitProgress, updateProgress],
  );

  const reveal = useCallback(
    (input: SqueezeInput = "action") => {
      if (disabled || readOnly) return;
      commitProgress(1, input);
    },
    [commitProgress, disabled, readOnly],
  );

  const reset = useCallback(
    (input: SqueezeInput = "action") => {
      if (disabled || readOnly) return;
      commitProgress(0, input);
    },
    [commitProgress, disabled, readOnly],
  );

  useEffect(
    () => () => {
      cancelScheduledFrame();
      const activeElement = activeElementRef.current;
      const activePointerId = activePointerIdRef.current;
      if (
        activeElement &&
        activePointerId !== null &&
        activeElement.hasPointerCapture?.(activePointerId)
      ) {
        activeElement.releasePointerCapture?.(activePointerId);
      }
    },
    [cancelScheduledFrame],
  );

  const state: SqueezeState =
    progress === 0 ? "concealed" : progress === 1 ? "revealed" : "squeezing";

  return {
    progress,
    state,
    corner,
    isDragging,
    disabled,
    readOnly,
    reveal,
    reset,
    cardProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture,
      onKeyDown,
    },
  };
}
