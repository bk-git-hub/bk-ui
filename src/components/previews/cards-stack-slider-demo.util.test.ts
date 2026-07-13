import { describe, expect, it } from "vitest";
import {
  DEFAULT_CARDS_STACK_SLIDER_DEMO_CODE,
  DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
  parseCardsStackSliderDemoCode,
} from "./cards-stack-slider-demo.util";

describe("cards stack slider demo config", () => {
  it("parses the default live configuration", () => {
    expect(
      parseCardsStackSliderDemoCode(DEFAULT_CARDS_STACK_SLIDER_DEMO_CODE),
    ).toEqual({
      config: DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
      error: null,
    });
  });

  it("accepts each supported setting", () => {
    const source = JSON.stringify({
      orientation: "vertical",
      loop: false,
      sideOffset: 72.5,
      visibleCount: 6,
      transitionDuration: 800,
    });

    expect(parseCardsStackSliderDemoCode(source)).toEqual({
      config: {
        orientation: "vertical",
        loop: false,
        sideOffset: 72.5,
        visibleCount: 6,
        transitionDuration: 800,
      },
      error: null,
    });
  });

  it.each([
    ["{", "Enter valid JSON"],
    ["[]", "JSON object"],
    [
      JSON.stringify({
        ...DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
        orientation: "diagonal",
      }),
      "orientation",
    ],
    [
      JSON.stringify({
        ...DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
        loop: "yes",
      }),
      "loop",
    ],
    [
      JSON.stringify({
        ...DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
        visibleCount: 2.5,
      }),
      "visibleCount",
    ],
    [
      JSON.stringify({
        ...DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
        transitionDuration: 5000,
      }),
      "transitionDuration",
    ],
  ])("rejects invalid input", (source, expectedError) => {
    const result = parseCardsStackSliderDemoCode(source);

    expect(result.config).toBeNull();
    expect(result.error).toContain(expectedError);
  });
});
