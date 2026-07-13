import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHUTTER_SLIDER_DEMO_CODE,
  DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
  parseShutterSliderDemoCode,
} from "./shutter-slider-demo.util";

describe("parseShutterSliderDemoCode", () => {
  it("parses the default live configuration", () => {
    expect(
      parseShutterSliderDemoCode(DEFAULT_SHUTTER_SLIDER_DEMO_CODE),
    ).toEqual({
      config: DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
      error: null,
    });
  });

  it("accepts the full public configuration range used by the demo", () => {
    expect(
      parseShutterSliderDemoCode(
        JSON.stringify({
          orientation: "horizontal",
          stripCount: 16,
          transitionDuration: 0,
          stagger: 500,
          loop: false,
        }),
      ),
    ).toEqual({
      config: {
        orientation: "horizontal",
        stripCount: 16,
        transitionDuration: 0,
        stagger: 500,
        loop: false,
      },
      error: null,
    });
  });

  it.each([
    ["invalid JSON", "{", "Enter valid JSON"],
    [
      "invalid orientation",
      JSON.stringify({
        ...DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
        orientation: "diagonal",
      }),
      "orientation",
    ],
    [
      "out-of-range strip count",
      JSON.stringify({
        ...DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
        stripCount: 17,
      }),
      "stripCount",
    ],
    [
      "non-boolean loop",
      JSON.stringify({
        ...DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
        loop: "yes",
      }),
      "loop",
    ],
  ])("rejects %s", (_label, source, expectedError) => {
    const result = parseShutterSliderDemoCode(source);

    expect(result.config).toBeNull();
    expect(result.error).toContain(expectedError);
  });
});
