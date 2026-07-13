import { describe, expect, it } from "vitest";
import {
  DEFAULT_REACT_POD_DEMO_CODE,
  parseReactPodDemoCode,
} from "./react-pod-demo.util";

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
});
