import type { ShutterSliderOrientation } from "@/components/ShutterSlider";

const MIN_STRIP_COUNT = 2;
const MAX_STRIP_COUNT = 16;
const MAX_TRANSITION_DURATION = 5_000;
const MAX_STAGGER = 500;

export interface ShutterSliderDemoConfig {
  orientation: ShutterSliderOrientation;
  stripCount: number;
  transitionDuration: number;
  stagger: number;
  loop: boolean;
}

export const DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG: ShutterSliderDemoConfig = {
  orientation: "vertical",
  stripCount: 5,
  transitionDuration: 820,
  stagger: 52,
  loop: true,
};

export const DEFAULT_SHUTTER_SLIDER_DEMO_CODE = JSON.stringify(
  DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
  null,
  2,
);

type ParseResult =
  | { config: ShutterSliderDemoConfig; error: null }
  | { config: null; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const readInteger = (
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): { value: number; error: null } | { value: null; error: string } => {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    return {
      value: null,
      error: `${field} must be an integer from ${minimum} to ${maximum}.`,
    };
  }

  return { value, error: null };
};

export function parseShutterSliderDemoCode(source: string): ParseResult {
  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch {
    return { config: null, error: "Enter valid JSON to update the preview." };
  }

  if (!isRecord(value)) {
    return { config: null, error: "The configuration must be a JSON object." };
  }

  if (value.orientation !== "vertical" && value.orientation !== "horizontal") {
    return {
      config: null,
      error: 'orientation must be either "vertical" or "horizontal".',
    };
  }

  const stripCount = readInteger(
    value.stripCount,
    "stripCount",
    MIN_STRIP_COUNT,
    MAX_STRIP_COUNT,
  );
  if (stripCount.error !== null) {
    return { config: null, error: stripCount.error };
  }

  const transitionDuration = readInteger(
    value.transitionDuration,
    "transitionDuration",
    0,
    MAX_TRANSITION_DURATION,
  );
  if (transitionDuration.error !== null) {
    return { config: null, error: transitionDuration.error };
  }

  const stagger = readInteger(value.stagger, "stagger", 0, MAX_STAGGER);
  if (stagger.error !== null) {
    return { config: null, error: stagger.error };
  }

  if (typeof value.loop !== "boolean") {
    return { config: null, error: "loop must be a boolean." };
  }

  return {
    config: {
      orientation: value.orientation,
      stripCount: stripCount.value,
      transitionDuration: transitionDuration.value,
      stagger: stagger.value,
      loop: value.loop,
    },
    error: null,
  };
}
