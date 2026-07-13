import { describe, expect, it } from "vitest";
import * as coreEntry from "@/components/CardsStackSlider";
import {
  cardsStackSliderNextJsExport,
  cardsStackSliderReactExport,
} from "./cardsStackSliderExportCode";
import { cardsStackSliderInstallDescriptor } from "./cardsStackSliderInstallDescriptor";

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
      "deterministic React ZIP",
    );
    expect(cardsStackSliderReactExport.description).toContain(
      "local verification artifact",
    );

    const code = cardsStackSliderReactExport.code;
    expect(code).toContain("registry/components/cards-stack-slider.json");
    expect(code).toContain("cards-stack-slider-react.zip");
    expect(code).toContain("cards-stack-slider-artifacts.test.mjs");
    expect(code).toContain("tailwind-merge@^3.3.1");
    expect(code).toContain("tailwind-merge@2.6.0");
    expect(code).toContain('from "./components/CardsStackSlider"');
    expect(code).toContain("Release status: release-blocked");
    expect(code).toContain("@source");
    expect(code).toContain("Tailwind 3.4 content");
    expect(code).not.toContain("CardsStackSlider/client");
    expect(code).not.toContain('from "@/');
    expect(code).not.toContain("bk-ui@latest");
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
    expect(cardsStackSliderNextJsExport.description).toContain(
      "disabling SSR is unnecessary",
    );

    const code = cardsStackSliderNextJsExport.code;
    expect(code).toContain("cards-stack-slider-next.zip");
    expect(code).toContain("components/CardsStackSlider/client.ts");
    expect(code).toContain('// src/app/cards/cards-gallery.tsx\n"use client";');
    expect(code).toContain('from "../../components/CardsStackSlider/client"');
    expect(code).toContain("tailwind-merge@^3.3.1");
    expect(code).toContain("tailwind-merge@2.6.0");
    expect(code).toContain("SSR / hydration");
    expect(code).toContain("serializable data");
    expect(code).toContain("window/document");
    expect(code).toContain("@source");
    expect(code).toContain("Release status: release-blocked");
    expect(code).not.toContain('from "@/');
    expect(code).not.toContain("bk-ui@latest");
    expect(code).not.toMatch(/from ["']next\//);
  });

  it("exposes the generated blocked descriptor without fake public commands", () => {
    expect(cardsStackSliderInstallDescriptor).toMatchObject({
      name: "cards-stack-slider",
      title: "Cards Stack Slider",
      componentVersion: "1.0.0",
      sourceCommit: "fecaf6502f823c379eedfbeb3e1b3e256040ff5e",
      status: "release-blocked",
      defaultVariantId: "tailwind-4",
    });
    expect(
      cardsStackSliderInstallDescriptor.variants.map(
        (variant) => variant.tailwindMajor,
      ),
    ).toEqual([3, 4]);

    for (const variant of cardsStackSliderInstallDescriptor.variants) {
      expect(variant.commands).toBeUndefined();
      expect(variant.resources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "registry",
            repositoryPath: expect.stringContaining("cards-stack-slider"),
            sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
          }),
          expect.objectContaining({
            kind: "zip",
            framework: "react",
            repositoryPath: "public/downloads/cards-stack-slider-react.zip",
          }),
          expect.objectContaining({
            kind: "zip",
            framework: "nextjs",
            repositoryPath: "public/downloads/cards-stack-slider-next.zip",
          }),
          expect.objectContaining({
            kind: "copy-for-ai",
            repositoryPath: "public/ai/cards-stack-slider.md",
          }),
        ]),
      );
    }
  });
});
