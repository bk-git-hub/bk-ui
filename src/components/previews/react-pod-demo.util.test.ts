import { describe, expect, it } from "vitest";
import {
  DEFAULT_REACT_POD_DEMO_CODE,
  parseReactPodDemoCode,
} from "./react-pod-demo.util";
import { REACT_POD_DEMO_SLIDER_ITEMS } from "./react-pod-slider-items";

describe("parseReactPodDemoCode", () => {
  it("parses an editable ReactPod configuration", () => {
    const result = parseReactPodDemoCode(DEFAULT_REACT_POD_DEMO_CODE);

    expect(result.error).toBeNull();
    expect(result.config?.deviceName).toBe("ReactPod");
    expect(result.config?.wheelSensitivity).toBe(1);
    expect(result.config?.menuItems[0]).toEqual({
      id: "now-playing",
      label: "Now Playing",
    });
    expect(result.config?.menuItems).toContainEqual({
      id: "coverflow",
      label: "Coverflow",
    });
    expect(result.config?.menuItems).toEqual(
      expect.arrayContaining([
        { id: "slicer-slider", label: "Slicer Slider" },
        { id: "expo-slider", label: "Expo Slider" },
        { id: "cards-stack-slider", label: "Cards Stack" },
      ]),
    );
  });

  it("preserves a valid wheel sensitivity and defaults a missing value", () => {
    const source = JSON.parse(DEFAULT_REACT_POD_DEMO_CODE);
    source.wheelSensitivity = 2;
    expect(
      parseReactPodDemoCode(JSON.stringify(source)).config?.wheelSensitivity,
    ).toBe(2);

    delete source.wheelSensitivity;
    expect(
      parseReactPodDemoCode(JSON.stringify(source)).config?.wheelSensitivity,
    ).toBe(1);
  });

  it.each(["fast", 0, -1, 2.1, Number.POSITIVE_INFINITY])(
    "rejects invalid wheel sensitivity %s",
    (wheelSensitivity) => {
      const source = JSON.parse(DEFAULT_REACT_POD_DEMO_CODE);
      source.wheelSensitivity = wheelSensitivity;

      expect(parseReactPodDemoCode(JSON.stringify(source)).error).toMatch(
        /wheelSensitivity/,
      );
    },
  );

  it("rejects invalid JSON and duplicate menu ids", () => {
    expect(parseReactPodDemoCode("{").error).toMatch(/valid JSON/);
    expect(
      parseReactPodDemoCode(
        JSON.stringify({
          deviceName: "My Pod",
          menuItems: [
            { id: "songs", label: "Songs" },
            { id: "songs", label: "More songs" },
          ],
        }),
      ).error,
    ).toMatch(/duplicated/);
  });

  it("accepts Coverflow as a configurable menu id", () => {
    const result = parseReactPodDemoCode(
      JSON.stringify({
        deviceName: "Gallery Pod",
        menuItems: [{ id: "coverflow", label: "Album Browser" }],
      }),
    );

    expect(result.error).toBeNull();
    expect(result.config?.menuItems).toEqual([
      { id: "coverflow", label: "Album Browser" },
    ]);
  });

  it.each([
    ["slicer-slider", "Slicer Slider"],
    ["expo-slider", "Expo Slider"],
    ["cards-stack-slider", "Cards Stack"],
  ] as const)("accepts %s as a configurable menu id", (id, label) => {
    const result = parseReactPodDemoCode(
      JSON.stringify({
        deviceName: "Slider Pod",
        menuItems: [{ id, label }],
      }),
    );

    expect(result.error).toBeNull();
    expect(result.config?.menuItems).toEqual([{ id, label }]);
  });
});

describe("ReactPod slider preview data", () => {
  it("provides typed, reusable image data for all three slider screens", () => {
    expect(REACT_POD_DEMO_SLIDER_ITEMS).toHaveLength(4);
    expect(
      new Set(REACT_POD_DEMO_SLIDER_ITEMS.map((item) => item.id)).size,
    ).toBe(REACT_POD_DEMO_SLIDER_ITEMS.length);

    for (const item of REACT_POD_DEMO_SLIDER_ITEMS) {
      expect(item.title).toBeTruthy();
      expect(item.imageSrc).toMatch(/^\/reactpod\/photos\/.+\.webp$/);
      expect(item.imageAlt).toBeTruthy();
    }
  });
});
