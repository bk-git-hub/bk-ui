import { describe, expect, it } from "vitest";
import { SAMPLE_CARDS } from "./tinderSwiperData";

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
});
