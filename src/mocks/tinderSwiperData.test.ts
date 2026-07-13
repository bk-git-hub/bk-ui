import { describe, expect, it } from "vitest";
import { SAMPLE_CARDS, TINDER_DEMO_IMAGES } from "./tinderSwiperData";

describe("SAMPLE_CARDS responsive images", () => {
  it("provides a moderate fallback and DPR-aware candidates", () => {
    for (const card of SAMPLE_CARDS) {
      expect(card.image.src).toContain("w=800");
      expect(card.image.srcSet).toContain("w=400");
      expect(card.image.srcSet).toContain("w=800");
      expect(card.image.srcSet).toContain("w=1200");
      expect(card.image.srcSet).not.toMatch(/w=1[7-9]\d{2}/);
    }
  });

  it("exposes stable image presets for editable demos", () => {
    expect(Object.keys(TINDER_DEMO_IMAGES)).toEqual([
      "jennifer",
      "david",
      "sophia",
      "michael",
      "emily",
    ]);
    expect(SAMPLE_CARDS.map((card) => card.imageKey)).toEqual(
      Object.keys(TINDER_DEMO_IMAGES),
    );
  });
});
