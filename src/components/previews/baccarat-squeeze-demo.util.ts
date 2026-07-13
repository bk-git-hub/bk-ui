import type {
  BaccaratRank,
  BaccaratSuit,
  SqueezeCorner,
} from "@/components/Baccarat";

export const BACCARAT_SQUEEZE_DEMO_RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const satisfies readonly BaccaratRank[];

export const BACCARAT_SQUEEZE_DEMO_SUITS = [
  "clubs",
  "diamonds",
  "hearts",
  "spades",
] as const satisfies readonly BaccaratSuit[];

export const BACCARAT_SQUEEZE_DEMO_CORNERS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const satisfies readonly SqueezeCorner[];

export interface BaccaratSqueezeDemoConfig {
  rank: BaccaratRank;
  suit: BaccaratSuit;
  corner: SqueezeCorner;
  revealThreshold: number;
  edgeHitArea: number;
}

export type BaccaratSqueezeDemoCard = Pick<
  BaccaratSqueezeDemoConfig,
  "rank" | "suit"
>;

export const DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG: BaccaratSqueezeDemoConfig = {
  rank: "8",
  suit: "diamonds",
  corner: "bottom-right",
  revealThreshold: 0.68,
  edgeHitArea: 0.2,
};

export const DEFAULT_BACCARAT_SQUEEZE_DEMO_CODE = JSON.stringify(
  DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG,
  null,
  2,
);

/** Preview-only card draw. Do not use Math.random for real game outcomes. */
export function getRandomBaccaratSqueezeDemoCard(
  currentCard: BaccaratSqueezeDemoCard,
  random: () => number = Math.random,
): BaccaratSqueezeDemoCard {
  const rankCount = BACCARAT_SQUEEZE_DEMO_RANKS.length;
  const suitCount = BACCARAT_SQUEEZE_DEMO_SUITS.length;
  const deckSize = rankCount * suitCount;
  const currentRankIndex = BACCARAT_SQUEEZE_DEMO_RANKS.indexOf(
    currentCard.rank,
  );
  const currentSuitIndex = BACCARAT_SQUEEZE_DEMO_SUITS.indexOf(
    currentCard.suit,
  );
  const currentCardIndex = currentSuitIndex * rankCount + currentRankIndex;
  const remainingCardIndex = Math.min(
    deckSize - 2,
    Math.max(0, Math.floor(random() * (deckSize - 1))),
  );
  const nextCardIndex =
    remainingCardIndex >= currentCardIndex
      ? remainingCardIndex + 1
      : remainingCardIndex;

  return {
    rank: BACCARAT_SQUEEZE_DEMO_RANKS[nextCardIndex % rankCount],
    suit: BACCARAT_SQUEEZE_DEMO_SUITS[Math.floor(nextCardIndex / rankCount)],
  };
}

export type BaccaratSqueezeDemoParseResult =
  | { config: BaccaratSqueezeDemoConfig; error: null }
  | { config: null; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isOneOf = <Value extends string>(
  value: unknown,
  options: readonly Value[],
): value is Value =>
  typeof value === "string" && (options as readonly string[]).includes(value);

const readNumberInRange = (
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): { value: number; error: null } | { value: null; error: string } => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    return {
      value: null,
      error: `${field} must be a finite number from ${minimum} to ${maximum}.`,
    };
  }

  return { value, error: null };
};

export function parseBaccaratSqueezeDemoCode(
  source: string,
): BaccaratSqueezeDemoParseResult {
  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch {
    return { config: null, error: "Enter valid JSON to update the preview." };
  }

  if (!isRecord(value)) {
    return { config: null, error: "The configuration must be a JSON object." };
  }

  if (!isOneOf(value.rank, BACCARAT_SQUEEZE_DEMO_RANKS)) {
    return {
      config: null,
      error: `rank must be one of: ${BACCARAT_SQUEEZE_DEMO_RANKS.join(", ")}.`,
    };
  }

  if (!isOneOf(value.suit, BACCARAT_SQUEEZE_DEMO_SUITS)) {
    return {
      config: null,
      error: `suit must be one of: ${BACCARAT_SQUEEZE_DEMO_SUITS.join(", ")}.`,
    };
  }

  if (!isOneOf(value.corner, BACCARAT_SQUEEZE_DEMO_CORNERS)) {
    return {
      config: null,
      error: `corner must be one of: ${BACCARAT_SQUEEZE_DEMO_CORNERS.join(", ")}.`,
    };
  }

  const revealThreshold = readNumberInRange(
    value.revealThreshold,
    "revealThreshold",
    0,
    1,
  );
  if (revealThreshold.error !== null) {
    return { config: null, error: revealThreshold.error };
  }

  const edgeHitArea = readNumberInRange(
    value.edgeHitArea,
    "edgeHitArea",
    0.08,
    0.35,
  );
  if (edgeHitArea.error !== null) {
    return { config: null, error: edgeHitArea.error };
  }

  return {
    config: {
      rank: value.rank,
      suit: value.suit,
      corner: value.corner,
      revealThreshold: revealThreshold.value,
      edgeHitArea: edgeHitArea.value,
    },
    error: null,
  };
}
