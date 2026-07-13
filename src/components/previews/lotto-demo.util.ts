export const LOTTO_MIX_DURATION_MS = 900;

export function parseBallItems(source: string) {
  return source
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
