import { describe, expect, it } from "vitest";
import * as coreEntry from "@/components/CardsStackSlider";
import {
  cardsStackSliderNextJsExport,
  cardsStackSliderReactExport,
} from "./cardsStackSliderExportCode";

const usedRuntimeExports = [
  "CardsStackBack",
  "CardsStackFront",
  "CardsStackItem",
  "CardsStackNext",
  "CardsStackPrevious",
  "CardsStackRoot",
  "CardsStackStatus",
  "CardsStackViewport",
] as const;

describe("Cards Stack Slider export snippets", () => {
  it("uses the current framework-neutral React entry", () => {
    expect(cardsStackSliderReactExport.language).toBe("React / Vite TSX");
    expect(cardsStackSliderReactExport.description).toContain(
      "CardsStackSlider.tsx",
    );

    const code = cardsStackSliderReactExport.code;
    expect(code).toContain("CardsStackSlider.tsx");
    expect(code).toContain("useCardsStackSlider.ts");
    expect(code).toContain("pnpm add clsx tailwind-merge");
    expect(code).toContain('from "@/components/CardsStackSlider"');
    expect(code).toContain("@source");
    expect(code).toContain("Tailwind v3 content");
    expect(code).not.toContain("CardsStackSlider/client");
    expect(code).not.toMatch(/from ["']next\//);

    usedRuntimeExports.forEach((exportName) => {
      expect(coreEntry).toHaveProperty(exportName);
      expect(code).toContain(exportName);
    });
  });

  it("uses the real Next.js client entry and documents SSR constraints", () => {
    expect(cardsStackSliderNextJsExport.language).toBe(
      "Next.js App Router TSX",
    );
    expect(cardsStackSliderNextJsExport.description).toContain("serializable");
    expect(cardsStackSliderNextJsExport.description).toContain("hydration");

    const code = cardsStackSliderNextJsExport.code;
    expect(code).toContain(
      '// src/components/CardsStackSlider/client.ts\n"use client";\n\nexport * from "./index";',
    );
    expect(code).toContain('// app/cards/cards-gallery.tsx\n"use client";');
    expect(code).toContain('from "@/components/CardsStackSlider/client"');
    expect(code).toContain("SSR / hydration");
    expect(code).toContain("serializable data");
    expect(code).toContain("window/document");
    expect(code).toContain("@source");
    expect(code).not.toMatch(/from ["']next\//);
  });
});
