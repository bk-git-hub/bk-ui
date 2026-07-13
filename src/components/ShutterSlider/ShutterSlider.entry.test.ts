import { describe, expect, it } from "vitest";
import * as clientEntry from "./client";
import * as reactEntry from "./index";

describe("Shutter Slider public entries", () => {
  it("exposes the same framework-neutral implementation from the Next client boundary", () => {
    expect(Object.keys(clientEntry).sort()).toEqual(
      Object.keys(reactEntry).sort(),
    );

    for (const exportName of Object.keys(reactEntry)) {
      expect(clientEntry[exportName as keyof typeof clientEntry]).toBe(
        reactEntry[exportName as keyof typeof reactEntry],
      );
    }
  });
});
