export type CardsStackSliderDemoOrientation = "horizontal" | "vertical";

export interface CardsStackSliderDemoConfig {
  orientation: CardsStackSliderDemoOrientation;
  loop: boolean;
  sideOffset: number;
  visibleCount: number;
  transitionDuration: number;
}

export const DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG: CardsStackSliderDemoConfig =
  {
    orientation: "horizontal",
    loop: true,
    sideOffset: 64,
    visibleCount: 4,
    transitionDuration: 420,
  };

export const DEFAULT_CARDS_STACK_SLIDER_DEMO_CODE = JSON.stringify(
  DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
  null,
  2,
);

type ParseResult =
  | { config: CardsStackSliderDemoConfig; error: null }
  | { config: null; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function readNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  integer = false,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (integer && !Number.isInteger(value)) ||
    value < minimum ||
    value > maximum
  ) {
    const numberType = integer ? "an integer" : "a number";
    return {
      value: null,
      error: `${field} must be ${numberType} from ${minimum} to ${maximum}.`,
    } as const;
  }

  return { value, error: null } as const;
}

export function parseCardsStackSliderDemoCode(source: string): ParseResult {
  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch {
    return { config: null, error: "Enter valid JSON to update the preview." };
  }

  if (!isRecord(value)) {
    return { config: null, error: "The configuration must be a JSON object." };
  }

  if (value.orientation !== "horizontal" && value.orientation !== "vertical") {
    return {
      config: null,
      error: 'orientation must be either "horizontal" or "vertical".',
    };
  }

  if (typeof value.loop !== "boolean") {
    return { config: null, error: "loop must be a boolean." };
  }

  const sideOffset = readNumber(value.sideOffset, "sideOffset", 0, 120);
  if (sideOffset.error !== null) {
    return { config: null, error: sideOffset.error };
  }

  const visibleCount = readNumber(
    value.visibleCount,
    "visibleCount",
    1,
    8,
    true,
  );
  if (visibleCount.error !== null) {
    return { config: null, error: visibleCount.error };
  }

  const transitionDuration = readNumber(
    value.transitionDuration,
    "transitionDuration",
    0,
    2000,
    true,
  );
  if (transitionDuration.error !== null) {
    return { config: null, error: transitionDuration.error };
  }

  return {
    config: {
      orientation: value.orientation,
      loop: value.loop,
      sideOffset: sideOffset.value,
      visibleCount: visibleCount.value,
      transitionDuration: transitionDuration.value,
    },
    error: null,
  };
}
