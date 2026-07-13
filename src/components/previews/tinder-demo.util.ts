import {
  SAMPLE_CARDS,
  TINDER_DEMO_IMAGES,
  type TinderDemoImageKey,
} from "@/mocks/tinderSwiperData";

const MAX_CARD_COUNT = 20;
const MAX_ID_LENGTH = 40;
const MAX_NAME_LENGTH = 60;
const MAX_LABEL_LENGTH = 120;
const MIN_AGE = 18;
const MAX_AGE = 120;
const IMAGE_KEYS = new Set<string>(Object.keys(TINDER_DEMO_IMAGES));

export interface TinderDemoCardConfig {
  id: string;
  name: string;
  age: number;
  imageKey: TinderDemoImageKey;
}

export interface TinderDemoConfig {
  cards: TinderDemoCardConfig[];
  emptyMessage: string;
  resetLabel: string;
  passLabel: string;
  likeLabel: string;
}

export const DEFAULT_TINDER_DEMO_CONFIG: TinderDemoConfig = {
  cards: SAMPLE_CARDS.map(({ id, name, age, imageKey }) => ({
    id,
    name,
    age,
    imageKey,
  })),
  emptyMessage: "모든 카드를 확인했습니다!",
  resetLabel: "RESET",
  passLabel: "Pass card",
  likeLabel: "Like card",
};

export const DEFAULT_TINDER_DEMO_CODE = JSON.stringify(
  DEFAULT_TINDER_DEMO_CONFIG,
  null,
  2,
);

type ParseResult =
  | { config: TinderDemoConfig; error: null }
  | { config: null; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const readText = (
  value: unknown,
  field: string,
  maxLength: number,
): { value: string; error: null } | { value: null; error: string } => {
  if (typeof value !== "string" || value.trim() === "") {
    return { value: null, error: `${field} must be a non-empty string.` };
  }

  const text = value.trim();
  if (text.length > maxLength) {
    return {
      value: null,
      error: `${field} must be ${maxLength} characters or fewer.`,
    };
  }

  return { value: text, error: null };
};

export function parseTinderDemoCode(source: string): ParseResult {
  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch {
    return { config: null, error: "Enter valid JSON to update the preview." };
  }

  if (!isRecord(value)) {
    return { config: null, error: "The configuration must be a JSON object." };
  }

  if (!Array.isArray(value.cards) || value.cards.length === 0) {
    return { config: null, error: "cards must contain at least one card." };
  }

  if (value.cards.length > MAX_CARD_COUNT) {
    return {
      config: null,
      error: `cards can contain at most ${MAX_CARD_COUNT} cards.`,
    };
  }

  const cards: TinderDemoCardConfig[] = [];
  const seenIds = new Set<string>();

  for (const [index, item] of value.cards.entries()) {
    const label = `cards[${index}]`;
    if (!isRecord(item)) {
      return { config: null, error: `${label} must be a JSON object.` };
    }

    const id = readText(item.id, `${label}.id`, MAX_ID_LENGTH);
    if (id.error) return { config: null, error: id.error };
    if (seenIds.has(id.value)) {
      return { config: null, error: `Card id "${id.value}" is duplicated.` };
    }

    const name = readText(item.name, `${label}.name`, MAX_NAME_LENGTH);
    if (name.error) return { config: null, error: name.error };

    if (
      typeof item.age !== "number" ||
      !Number.isInteger(item.age) ||
      item.age < MIN_AGE ||
      item.age > MAX_AGE
    ) {
      return {
        config: null,
        error: `${label}.age must be an integer from ${MIN_AGE} to ${MAX_AGE}.`,
      };
    }

    if (typeof item.imageKey !== "string" || !IMAGE_KEYS.has(item.imageKey)) {
      return {
        config: null,
        error: `${label}.imageKey must be one of: ${[...IMAGE_KEYS].join(", ")}.`,
      };
    }

    seenIds.add(id.value);
    cards.push({
      id: id.value,
      name: name.value,
      age: item.age,
      imageKey: item.imageKey as TinderDemoImageKey,
    });
  }

  const emptyMessage = readText(
    value.emptyMessage,
    "emptyMessage",
    MAX_LABEL_LENGTH,
  );
  if (emptyMessage.error) return { config: null, error: emptyMessage.error };

  const resetLabel = readText(value.resetLabel, "resetLabel", MAX_LABEL_LENGTH);
  if (resetLabel.error) return { config: null, error: resetLabel.error };

  const passLabel = readText(value.passLabel, "passLabel", MAX_LABEL_LENGTH);
  if (passLabel.error) return { config: null, error: passLabel.error };

  const likeLabel = readText(value.likeLabel, "likeLabel", MAX_LABEL_LENGTH);
  if (likeLabel.error) return { config: null, error: likeLabel.error };

  return {
    config: {
      cards,
      emptyMessage: emptyMessage.value,
      resetLabel: resetLabel.value,
      passLabel: passLabel.value,
      likeLabel: likeLabel.value,
    },
    error: null,
  };
}

export function resolveTinderDemoCards(config: TinderDemoConfig) {
  return config.cards.map((card) => ({
    ...card,
    image: TINDER_DEMO_IMAGES[card.imageKey],
  }));
}
