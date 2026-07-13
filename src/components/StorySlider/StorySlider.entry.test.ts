import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientEntry from "./client";
import * as reactEntry from "./index";

describe("Story Slider public entries", () => {
  it("keeps the Next.js client directive as the first statement", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/StorySlider/client.ts"),
      "utf8",
    );

    expect(source).toMatch(/^"use client";/);
  });

  it("exposes the same framework-neutral API from the Next client boundary", () => {
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
