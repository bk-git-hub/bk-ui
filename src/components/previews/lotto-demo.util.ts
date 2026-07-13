export const LOTTO_MIX_DURATION_MS = 4_800;

export function parseBallItems(source: string) {
  return source
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
