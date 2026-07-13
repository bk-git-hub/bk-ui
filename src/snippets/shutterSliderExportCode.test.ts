import { describe, expect, it } from "vitest";
import {
  shutterSliderNextJsExport,
  shutterSliderReactExport,
} from "./shutterSliderExportCode";

describe("Shutter Slider export snippets", () => {
  it("documents a copyable React and Vite public entry", () => {
    expect(shutterSliderReactExport.language).toBe("React / Vite TSX");
    expect(shutterSliderReactExport.description).toContain("Tailwind source");
    expect(shutterSliderReactExport.code).toContain(
      "src/components/ShutterSlider/ShutterSlider.tsx",
    );
    expect(shutterSliderReactExport.code).toContain(
      "src/components/ShutterSlider/useShutterSlider.ts",
    );
    expect(shutterSliderReactExport.code).toContain('from "./ShutterSlider"');
    expect(shutterSliderReactExport.code).toContain(
      'import from "@/components/ShutterSlider"',
    );
    expect(shutterSliderReactExport.code).toContain(
      "Save each section below as the file named",
    );
    expect(shutterSliderReactExport.code).toContain(
      "pnpm add clsx tailwind-merge",
    );
    expect(shutterSliderReactExport.code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/ShutterSlider"',
    );
  });

  it("documents the real Next.js client entry and SSR constraints", () => {
    expect(shutterSliderNextJsExport.language).toBe("Next.js App Router TSX");
    expect(shutterSliderNextJsExport.description).toContain("SSR");
    expect(shutterSliderNextJsExport.code).toContain(
      "src/components/ShutterSlider/client.ts",
    );
    expect(shutterSliderNextJsExport.code).toContain('"use client";');
    expect(shutterSliderNextJsExport.code).toContain('export * from "./index"');
    expect(shutterSliderNextJsExport.code).toContain(
      'from "@/components/ShutterSlider/client"',
    );
    expect(shutterSliderNextJsExport.code).toContain(
      "If your tsconfig does not map @/*",
    );
    expect(shutterSliderNextJsExport.code).toContain(
      "Save each section below as the file named",
    );
    expect(shutterSliderNextJsExport.code).toContain("SSR / hydration");
    expect(shutterSliderNextJsExport.code).toContain("serializable across");
    expect(shutterSliderNextJsExport.code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/ShutterSlider"',
    );
    expect(shutterSliderNextJsExport.code).not.toMatch(/from ["']next\//);
  });
});
