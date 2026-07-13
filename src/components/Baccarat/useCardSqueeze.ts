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
export type SqueezeOrigin = "corner" | "left-edge" | "right-edge";
export type SqueezeInput = "pointer" | "keyboard" | "action";
export type SqueezeState = "concealed" | "squeezing" | "revealed";

export interface SqueezeChangeDetail {
  input: SqueezeInput;
  corner: SqueezeCorner;
  origin: SqueezeOrigin;
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
  edgeHitArea?: number;
  disabled?: boolean;
  readOnly?: boolean;
}

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function getInwardVector(corner: SqueezeCorner, origin: SqueezeOrigin) {
  if (origin === "left-edge") return { x: 1, y: 0 };
  if (origin === "right-edge") return { x: -1, y: 0 };

  const x = corner.endsWith("left") ? 1 : -1;
  const y = corner.startsWith("top") ? 1 : -1;
  const length = Math.hypot(x, y);

  return { x: x / length, y: y / length };
}

function getPointerInteraction(
  event: PointerEvent<HTMLDivElement>,
  edgeHitArea: number,
  fallbackCorner: SqueezeCorner,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / Math.max(1, rect.width));
  const y = clamp((event.clientY - rect.top) / Math.max(1, rect.height));
  const inSideBody = y >= 0.2 && y <= 0.8;

  if (inSideBody && x <= edgeHitArea) {
    return {
      corner: fallbackCorner,
      origin: "left-edge",
    } satisfies Pick<SqueezeChangeDetail, "corner" | "origin">;
  }
  if (inSideBody && x >= 1 - edgeHitArea) {
    return {
      corner: fallbackCorner,
      origin: "right-edge",
    } satisfies Pick<SqueezeChangeDetail, "corner" | "origin">;
  }

  const pointerCorner: SqueezeCorner =
    y < 0.5
      ? x < 0.5
        ? "top-left"
        : "top-right"
      : x < 0.5
        ? "bottom-left"
        : "bottom-right";

  return {
    corner: pointerCorner,
    origin: "corner",
  } satisfies Pick<SqueezeChangeDetail, "corner" | "origin">;
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
  edgeHitArea = 0.2,
  disabled = false,
  readOnly = false,
}: UseCardSqueezeOptions = {}) {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    clamp(defaultValue),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [origin, setOrigin] = useState<SqueezeOrigin>("corner");
  const [activeCorner, setActiveCorner] = useState<SqueezeCorner>(corner);
  const progress = clamp(isControlled ? value : uncontrolledValue);
  const progressRef = useRef(progress);
  const didRevealRef = useRef(progress === 1);
  const originRef = useRef<SqueezeOrigin>(origin);
  const cornerRef = useRef<SqueezeCorner>(activeCorner);
  const activePointerIdRef = useRef<number | null>(null);
  const activeElementRef = useRef<HTMLDivElement | null>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const latestPointRef = useRef({ x: 0, y: 0 });
  const startProgressRef = useRef(progress);
  const revealDistanceRef = useRef(1);
  const animationFrameRef = useRef<number | null>(null);

  progressRef.current = progress;

  useEffect(() => {
    if (activePointerIdRef.current !== null) return;
    cornerRef.current = corner;
    setActiveCorner(corner);
  }, [corner]);

  useEffect(() => {
    if (progress < 1) didRevealRef.current = false;
    if (progress === 1) didRevealRef.current = true;
  }, [progress]);

  const updateProgress = useCallback(
    (nextValue: number, input: SqueezeInput) => {
      const nextProgress = clamp(nextValue);
      progressRef.current = nextProgress;
      if (!isControlled) setUncontrolledValue(nextProgress);

      const detail = {
        input,
        corner: cornerRef.current,
        origin: originRef.current,
      } satisfies SqueezeChangeDetail;
      onValueChange?.(nextProgress, detail);

      if (nextProgress < 1) {
        didRevealRef.current = false;
      } else if (!didRevealRef.current) {
        didRevealRef.current = true;
        onReveal?.(detail);
      }

      return nextProgress;
    },
    [isControlled, onReveal, onValueChange],
  );

  const commitProgress = useCallback(
    (nextValue: 0 | 1, input: SqueezeInput) => {
      updateProgress(nextValue, input);
      onValueCommit?.(nextValue, {
        input,
        corner: cornerRef.current,
        origin: originRef.current,
      });
    },
    [onValueCommit, updateProgress],
  );

  const applyLatestPointerPosition = useCallback(() => {
    if (activePointerIdRef.current === null) return;

    const deltaX = latestPointRef.current.x - startPointRef.current.x;
    const deltaY = latestPointRef.current.y - startPointRef.current.y;
    const inward = getInwardVector(cornerRef.current, originRef.current);
    const projectedDistance = deltaX * inward.x + deltaY * inward.y;
    updateProgress(
      startProgressRef.current + projectedDistance / revealDistanceRef.current,
      "pointer",
    );
  }, [updateProgress]);

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
      const interaction = getPointerInteraction(
        event,
        clamp(edgeHitArea, 0.08, 0.35),
        corner,
      );
      const nextOrigin = interaction.origin;
      cornerRef.current = interaction.corner;
      originRef.current = nextOrigin;
      setActiveCorner(interaction.corner);
      setOrigin(nextOrigin);
      activePointerIdRef.current = event.pointerId;
      activeElementRef.current = event.currentTarget;
      startPointRef.current = { x: event.clientX, y: event.clientY };
      latestPointRef.current = { x: event.clientX, y: event.clientY };
      startProgressRef.current = progressRef.current;
      revealDistanceRef.current = Math.max(
        1,
        nextOrigin === "corner"
          ? Math.hypot(rect.width, rect.height) * 0.58
          : rect.width * 0.72,
      );
      setIsDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [corner, disabled, edgeHitArea, readOnly],
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
    corner: activeCorner,
    origin,
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
