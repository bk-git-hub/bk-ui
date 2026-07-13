import { describe, expect, it } from "vitest";
import { SlicerSliderRoot as reactSlicerSliderRoot } from "@/components/SlicerSlider";
import { SlicerSliderRoot as nextSlicerSliderRoot } from "@/components/SlicerSlider/client";
import { slicerSliderNextJsExport } from "./slicerSliderNextExportCode";
import { slicerSliderReactExport } from "./slicerSliderReactExportCode";

const nextRuntimeImport = /(?:from\s+|import\s*\(|require\s*\()\s*["']next\//;

describe("Slicer Slider export snippets", () => {
  it("exposes one shared core through the React and client entry points", () => {
    expect(nextSlicerSliderRoot).toBe(reactSlicerSliderRoot);
  });

  it("documents a copyable React and Vite public entry", () => {
    expect(slicerSliderReactExport.language).toBe("React / Vite TSX");
    expect(slicerSliderReactExport.code).toContain(
      "src/components/SlicerSlider/SlicerSlider.tsx",
    );
    expect(slicerSliderReactExport.code).toContain(
      "src/components/SlicerSlider/useSlicerSlider.ts",
    );
    expect(slicerSliderReactExport.code).toContain(
      "src/components/SlicerSlider/index.ts",
    );
    expect(slicerSliderReactExport.code).toContain(
      'from "./components/SlicerSlider"',
    );
    expect(slicerSliderReactExport.code).toContain(
      "pnpm add clsx tailwind-merge",
    );
    expect(slicerSliderReactExport.code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/SlicerSlider"',
    );
    expect(slicerSliderReactExport.code).toContain("Tailwind v3");
    expect(slicerSliderReactExport.code).toContain("content:");
    expect(slicerSliderReactExport.code).not.toMatch(nextRuntimeImport);
  });

  it("documents the real Next.js client entry and SSR constraints", () => {
    expect(slicerSliderNextJsExport.language).toBe("Next.js App Router TSX");
    expect(slicerSliderNextJsExport.description).toContain("SSR / hydration");
    expect(slicerSliderNextJsExport.code).toContain(
      "src/components/SlicerSlider/SlicerSlider.tsx",
    );
    expect(slicerSliderNextJsExport.code).toContain(
      "src/components/SlicerSlider/useSlicerSlider.ts",
    );
    expect(slicerSliderNextJsExport.code).toContain(
      "src/components/SlicerSlider/index.ts",
    );
    expect(slicerSliderNextJsExport.code).toContain(
      "src/components/SlicerSlider/client.ts",
    );
    expect(slicerSliderNextJsExport.code).toMatch(
      /\/\/ src\/components\/SlicerSlider\/client\.ts\s+"use client";\s+export \* from "\.\/index";/,
    );
    expect(slicerSliderNextJsExport.code).toContain(
      'from "@/components/SlicerSlider/client"',
    );
    expect(slicerSliderNextJsExport.code).toContain("SSR / hydration notes");
    expect(slicerSliderNextJsExport.code).toContain("serializable data");
    expect(slicerSliderNextJsExport.code).toContain(
      "initial value deterministic",
    );
    expect(slicerSliderNextJsExport.code).toContain("run only in effects");
    expect(slicerSliderNextJsExport.code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/SlicerSlider"',
    );
    expect(slicerSliderNextJsExport.code).toContain("Tailwind v3");
    expect(slicerSliderNextJsExport.code).not.toMatch(nextRuntimeImport);
  });
});
