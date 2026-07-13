import { useCallback, useEffect, useRef, useState } from "react";

export type SlotRandomSource = () => number;
// eslint-disable-next-line no-unused-vars
export type SlotValueChangeHandler<T> = (...args: [T[]]) => void;

export interface UseSlotMachineOptions<T> {
  reels: readonly (readonly T[])[];
  value?: readonly T[];
  defaultValue?: readonly T[];
  onValueChange?: SlotValueChangeHandler<T>;
  random?: SlotRandomSource;
  spinDuration?: number;
}

export interface UseSlotMachineResult<T> {
  selectedItems: readonly T[];
  canSpin: boolean;
  hasSpun: boolean;
  isSpinning: boolean;
  spin: () => T[];
  reset: () => void;
}

function normalizeRandomValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1 - Number.EPSILON);
}

export function canSpinReels<T>(reels: readonly (readonly T[])[]) {
  return reels.length > 0 && reels.every((reel) => reel.length > 0);
}

export function selectSlotResults<T>(
  reels: readonly (readonly T[])[],
  random: SlotRandomSource = Math.random,
): T[] {
  if (!canSpinReels(reels)) return [];

  return reels.map((reel) => {
    const index = Math.floor(normalizeRandomValue(random()) * reel.length);
    return reel[index];
  });
}

export function createReelSpinSequence<T>(
  reel: readonly T[],
  currentItem: T,
  targetItem: T,
  intermediateCount = 14,
): T[] {
  if (reel.length === 0) return [currentItem, targetItem];

  const safeIntermediateCount = Math.min(
    Math.max(Math.floor(intermediateCount), 6),
    22,
  );
  const currentIndex = reel.findIndex((item) => Object.is(item, currentItem));
  const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  const sequence = [currentItem];

  for (let index = 0; index < safeIntermediateCount; index += 1) {
    sequence.push(reel[(startIndex + index) % reel.length]);
  }

  sequence.push(targetItem);
  return sequence;
}

function getInitialResults<T>(
  reels: readonly (readonly T[])[],
  defaultValue?: readonly T[],
) {
  if (defaultValue?.length === reels.length) return [...defaultValue];
  if (!canSpinReels(reels)) return [];
  return reels.map((reel) => reel[0]);
}

export function useSlotMachine<T>({
  reels,
  value,
  defaultValue,
  onValueChange,
  random = Math.random,
  spinDuration = 900,
}: UseSlotMachineOptions<T>): UseSlotMachineResult<T> {
  const [uncontrolledValue, setUncontrolledValue] = useState<T[]>(() =>
    getInitialResults(reels, defaultValue),
  );
  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const isSpinningRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isControlled = value !== undefined;
  const selectedItems = isControlled ? value : uncontrolledValue;
  const canSpin = canSpinReels(reels);

  const clearSpinTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearSpinTimer, [clearSpinTimer]);

  const updateValue = useCallback(
    (nextValue: T[]) => {
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  const finishSpin = useCallback(
    (nextValue: T[]) => {
      updateValue(nextValue);
      isSpinningRef.current = false;
      setIsSpinning(false);
      setHasSpun(true);
      timeoutRef.current = null;
    },
    [updateValue],
  );

  const spin = useCallback(() => {
    if (!canSpin || isSpinningRef.current) return [];

    const nextValue = selectSlotResults(reels, random);
    if (nextValue.length === 0) return nextValue;

    isSpinningRef.current = true;
    setIsSpinning(true);

    const duration = Math.max(0, spinDuration);
    if (duration === 0) {
      finishSpin(nextValue);
    } else {
      clearSpinTimer();
      timeoutRef.current = setTimeout(() => finishSpin(nextValue), duration);
    }

    return nextValue;
  }, [canSpin, clearSpinTimer, finishSpin, random, reels, spinDuration]);

  const reset = useCallback(() => {
    clearSpinTimer();
    isSpinningRef.current = false;
    setIsSpinning(false);
    setHasSpun(false);
    updateValue(getInitialResults(reels, defaultValue));
  }, [clearSpinTimer, defaultValue, reels, updateValue]);

  return {
    selectedItems,
    canSpin,
    hasSpun,
    isSpinning,
    spin,
    reset,
  };
}
