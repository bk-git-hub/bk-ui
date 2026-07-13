import type { ShaderSliderEffect } from "@/components/ShaderSlider";

export interface ShaderSliderDemoConfig {
  effect: ShaderSliderEffect;
  transitionDuration: number;
  intensity: number;
  frequency: number;
  dprCap: number;
  loop: boolean;
}

export const DEFAULT_SHADER_SLIDER_DEMO_CONFIG: ShaderSliderDemoConfig = {
  effect: "wave",
  transitionDuration: 980,
  intensity: 0.95,
  frequency: 2.8,
  dprCap: 2,
  loop: true,
};

export const formatShaderSliderDemoCode = (config: ShaderSliderDemoConfig) =>
  JSON.stringify(config, null, 2);

export const DEFAULT_SHADER_SLIDER_DEMO_CODE = formatShaderSliderDemoCode(
  DEFAULT_SHADER_SLIDER_DEMO_CONFIG,
);

type ParseResult =
  | { config: ShaderSliderDemoConfig; error: null }
  | { config: null; error: string };

const EFFECTS = new Set<ShaderSliderEffect>(["wave", "ripple", "pixel"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function readNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    return {
      value: null,
      error: `${field} must be a number from ${minimum} to ${maximum}.`,
    } as const;
  }

  return { value, error: null } as const;
}

export function parseShaderSliderDemoCode(source: string): ParseResult {
  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch {
    return { config: null, error: "Enter valid JSON to update the preview." };
  }

  if (!isRecord(value)) {
    return { config: null, error: "The configuration must be a JSON object." };
  }

  if (
    typeof value.effect !== "string" ||
    !EFFECTS.has(value.effect as ShaderSliderEffect)
  ) {
    return {
      config: null,
      error: "effect must be one of: wave, ripple, pixel.",
    };
  }

  const transitionDuration = readNumber(
    value.transitionDuration,
    "transitionDuration",
    0,
    5000,
  );
  if (transitionDuration.error !== null) {
    return { config: null, error: transitionDuration.error };
  }

  const intensity = readNumber(value.intensity, "intensity", 0, 2);
  if (intensity.error !== null) {
    return { config: null, error: intensity.error };
  }

  const frequency = readNumber(value.frequency, "frequency", 0.5, 12);
  if (frequency.error !== null) {
    return { config: null, error: frequency.error };
  }

  const dprCap = readNumber(value.dprCap, "dprCap", 1, 3);
  if (dprCap.error !== null) {
    return { config: null, error: dprCap.error };
  }

  if (typeof value.loop !== "boolean") {
    return { config: null, error: "loop must be a boolean." };
  }

  return {
    config: {
      effect: value.effect as ShaderSliderEffect,
      transitionDuration: transitionDuration.value,
      intensity: intensity.value,
      frequency: frequency.value,
      dprCap: dprCap.value,
      loop: value.loop,
    },
    error: null,
  };
}
