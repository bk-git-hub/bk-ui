import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHADER_SLIDER_DEMO_CODE,
  DEFAULT_SHADER_SLIDER_DEMO_CONFIG,
  formatShaderSliderDemoCode,
  parseShaderSliderDemoCode,
} from "./shader-slider-demo.util";

describe("shader slider demo config", () => {
  it("parses and formats the default live configuration", () => {
    expect(parseShaderSliderDemoCode(DEFAULT_SHADER_SLIDER_DEMO_CODE)).toEqual({
      config: DEFAULT_SHADER_SLIDER_DEMO_CONFIG,
      error: null,
    });
    expect(formatShaderSliderDemoCode(DEFAULT_SHADER_SLIDER_DEMO_CONFIG)).toBe(
      DEFAULT_SHADER_SLIDER_DEMO_CODE,
    );
  });

  it("accepts every documented boundary", () => {
    expect(
      parseShaderSliderDemoCode(
        JSON.stringify({
          effect: "pixel",
          transitionDuration: 0,
          intensity: 0,
          frequency: 0.5,
          dprCap: 1,
          loop: false,
        }),
      ).error,
    ).toBeNull();

    expect(
      parseShaderSliderDemoCode(
        JSON.stringify({
          effect: "ripple",
          transitionDuration: 5000,
          intensity: 2,
          frequency: 12,
          dprCap: 3,
          loop: true,
        }),
      ).error,
    ).toBeNull();
  });

  const invalidCases: Array<[string, unknown, string]> = [
    ["invalid JSON", "{", "Enter valid JSON"],
    ["non-object", "[]", "JSON object"],
    [
      "effect",
      { ...DEFAULT_SHADER_SLIDER_DEMO_CONFIG, effect: "blur" },
      "effect",
    ],
    [
      "transitionDuration",
      { ...DEFAULT_SHADER_SLIDER_DEMO_CONFIG, transitionDuration: 5001 },
      "transitionDuration",
    ],
    [
      "intensity",
      { ...DEFAULT_SHADER_SLIDER_DEMO_CONFIG, intensity: -1 },
      "intensity",
    ],
    [
      "frequency",
      { ...DEFAULT_SHADER_SLIDER_DEMO_CONFIG, frequency: 13 },
      "frequency",
    ],
    ["dprCap", { ...DEFAULT_SHADER_SLIDER_DEMO_CONFIG, dprCap: 0 }, "dprCap"],
    ["loop", { ...DEFAULT_SHADER_SLIDER_DEMO_CONFIG, loop: "yes" }, "loop"],
  ];

  it.each(invalidCases)(
    "rejects an invalid %s value",
    (name, input, expectedMessage) => {
      const source = typeof input === "string" ? input : JSON.stringify(input);
      const result = parseShaderSliderDemoCode(source);

      expect(result.config).toBeNull();
      expect(result.error, name).toContain(expectedMessage);
    },
  );
});
