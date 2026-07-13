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
    expect(result.config?.menuItems[0]).toEqual({
      id: "now-playing",
      label: "Now Playing",
    });
  });

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
