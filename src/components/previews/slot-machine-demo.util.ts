export function parseSlotItems(source: string) {
  return source
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createSlotReels<T>(items: readonly T[], reelCount: number) {
  if (!Number.isInteger(reelCount) || reelCount <= 0) return [];
  return Array.from({ length: reelCount }, () => [...items]);
}

export function getSlotItemParts(item: string) {
  const [symbol, ...labelParts] = item.trim().split(/\s+/);
  return {
    symbol: symbol || item,
    label: labelParts.join(" "),
  };
}
