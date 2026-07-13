import { describe, expect, it } from "vitest";
import {
  SHADER_SLIDER_EXPORT_ASSET_FILES,
  SHADER_SLIDER_EXPORT_CORE_FILES,
  SHADER_SLIDER_EXPORT_DEPENDENCY_COMMAND,
  SHADER_SLIDER_NEXT_TAILWIND_SOURCE,
  SHADER_SLIDER_REACT_TAILWIND_SOURCE,
} from "./shaderSliderExportMeta";
import { shaderSliderNextExportCode } from "./shaderSliderNextExportCode";
import { shaderSliderReactExportCode } from "./shaderSliderReactExportCode";
import { shaderSliderUsageCode } from "./shaderSliderUsageCode";

const PUBLIC_PRIMITIVES = [
  "ShaderSliderRoot",
  "ShaderSliderViewport",
  "ShaderSliderSlide",
  "ShaderSliderPrevious",
  "ShaderSliderNext",
  "ShaderSliderPagination",
  "ShaderSliderStatus",
] as const;

describe("shader slider export snippets", () => {
  it("keeps Usage minimal, complete, and aligned with the public API", () => {
    expect(shaderSliderUsageCode).toContain('from "@/components/ShaderSlider"');
    expect(shaderSliderUsageCode).toContain(
      'src: "/shader-slider/tidal-glass.webp"',
    );
    for (const primitive of PUBLIC_PRIMITIVES) {
      expect(shaderSliderUsageCode).toContain(primitive);
    }
  });

  it("provides a Vite-ready React import and real setup metadata", () => {
    expect(shaderSliderReactExportCode).toContain(
      'from "./components/ShaderSlider"',
    );
    expect(shaderSliderReactExportCode).toContain(
      "export default function ShaderSliderExample()",
    );
    expect(SHADER_SLIDER_EXPORT_DEPENDENCY_COMMAND).toBe(
      "pnpm add clsx tailwind-merge",
    );
    expect(SHADER_SLIDER_REACT_TAILWIND_SOURCE).toContain(
      "components/ShaderSlider",
    );
    expect(SHADER_SLIDER_EXPORT_CORE_FILES).toHaveLength(5);
    expect(SHADER_SLIDER_EXPORT_ASSET_FILES).toHaveLength(4);
  });

  it("uses one client wrapper for Next without coupling the core to Next", () => {
    expect(shaderSliderNextExportCode.trimStart()).toMatch(
      /^['"]use client['"];?/,
    );
    expect(shaderSliderNextExportCode).toContain(
      'from "@/components/ShaderSlider"',
    );
    expect(shaderSliderNextExportCode).toContain(
      "export function ShaderSliderClient()",
    );
    expect(shaderSliderNextExportCode).toContain("if (!mounted)");
    expect(shaderSliderNextExportCode).not.toMatch(/from ["']next\//);
    expect(SHADER_SLIDER_NEXT_TAILWIND_SOURCE).toContain(
      "components/ShaderSlider",
    );
    for (const primitive of PUBLIC_PRIMITIVES) {
      expect(shaderSliderNextExportCode).toContain(primitive);
    }
  });
});
