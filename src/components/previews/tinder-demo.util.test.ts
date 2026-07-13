import { describe, expect, it } from "vitest";
import {
  DEFAULT_TINDER_DEMO_CODE,
  parseTinderDemoCode,
  resolveTinderDemoCards,
} from "./tinder-demo.util";

const readDefaultConfig = () =>
  JSON.parse(DEFAULT_TINDER_DEMO_CODE) as {
    cards: Array<Record<string, unknown>>;
    emptyMessage: string;
    resetLabel: string;
    passLabel: string;
    likeLabel: string;
  };

describe("parseTinderDemoCode", () => {
  it("parses the default configuration and resolves responsive images", () => {
    const result = parseTinderDemoCode(DEFAULT_TINDER_DEMO_CODE);

    expect(result.error).toBeNull();
    expect(result.config?.cards).toHaveLength(5);
    expect(result.config?.cards[0]).toMatchObject({
      name: "Jennifer",
      imageKey: "jennifer",
    });
    expect(
      result.config && resolveTinderDemoCards(result.config)[0]?.image.srcSet,
    ).toContain("w=1200");
  });

  it("rejects invalid JSON", () => {
    expect(parseTinderDemoCode("{")).toEqual({
      config: null,
      error: "Enter valid JSON to update the preview.",
    });
  });

  it("rejects duplicate ids", () => {
    const config = readDefaultConfig();
    config.cards[1]!.id = config.cards[0]!.id;

    expect(parseTinderDemoCode(JSON.stringify(config)).error).toBe(
      'Card id "1" is duplicated.',
    );
  });

  it("rejects unsupported image keys", () => {
    const config = readDefaultConfig();
    config.cards[0]!.imageKey = "remote-image";

    expect(parseTinderDemoCode(JSON.stringify(config)).error).toContain(
      "imageKey must be one of",
    );
  });

  it("rejects invalid ages", () => {
    const config = readDefaultConfig();
    config.cards[0]!.age = 17;

    expect(parseTinderDemoCode(JSON.stringify(config)).error).toBe(
      "cards[0].age must be an integer from 18 to 120.",
    );
  });

  it("rejects empty labels and oversized card collections", () => {
    const emptyLabelConfig = readDefaultConfig();
    emptyLabelConfig.likeLabel = " ";
    expect(parseTinderDemoCode(JSON.stringify(emptyLabelConfig)).error).toBe(
      "likeLabel must be a non-empty string.",
    );

    const oversizedConfig = readDefaultConfig();
    oversizedConfig.cards = Array.from({ length: 21 }, (_, index) => ({
      ...oversizedConfig.cards[0],
      id: String(index + 1),
    }));
    expect(parseTinderDemoCode(JSON.stringify(oversizedConfig)).error).toBe(
      "cards can contain at most 20 cards.",
    );
  });
});
