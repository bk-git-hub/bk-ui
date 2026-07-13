import { useCallback, useState } from "react";

export type LottoRandomSource = () => number;
// eslint-disable-next-line no-unused-vars
export type LottoValueChangeHandler<T> = (...args: [T[]]) => void;

export interface UseLottoDrawOptions<T> {
  items: readonly T[];
  drawCount: number;
  value?: readonly T[];
  defaultValue?: readonly T[];
  onValueChange?: LottoValueChangeHandler<T>;
  random?: LottoRandomSource;
}

export interface UseLottoDrawResult<T> {
  drawnItems: readonly T[];
  canDraw: boolean;
  draw: () => T[];
  reset: () => void;
}

export function isValidDrawCount(drawCount: number, itemCount: number) {
  return Number.isInteger(drawCount) && drawCount > 0 && drawCount <= itemCount;
}

export function drawRandomItems<T>(
  items: readonly T[],
  drawCount: number,
  random: LottoRandomSource = Math.random,
): T[] {
  if (!isValidDrawCount(drawCount, items.length)) return [];

  const pool = [...items];

  for (let index = 0; index < drawCount; index += 1) {
    const randomValue = random();
    const normalizedRandom = Number.isFinite(randomValue)
      ? Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON)
      : 0;
    const swapIndex =
      index + Math.floor(normalizedRandom * (pool.length - index));

    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, drawCount);
}

export function useLottoDraw<T>({
  items,
  drawCount,
  value,
  defaultValue = [],
  onValueChange,
  random = Math.random,
}: UseLottoDrawOptions<T>): UseLottoDrawResult<T> {
  const [uncontrolledValue, setUncontrolledValue] = useState<T[]>(() => [
    ...defaultValue,
  ]);
  const isControlled = value !== undefined;
  const drawnItems = isControlled ? value : uncontrolledValue;
  const canDraw = isValidDrawCount(drawCount, items.length);

  const updateValue = useCallback(
    (nextValue: T[]) => {
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  const draw = useCallback(() => {
    const nextValue = drawRandomItems(items, drawCount, random);
    if (nextValue.length > 0) updateValue(nextValue);
    return nextValue;
  }, [drawCount, items, random, updateValue]);

  const reset = useCallback(() => {
    updateValue([]);
  }, [updateValue]);

  return { drawnItems, canDraw, draw, reset };
}
