import { describe, expect, it } from "vitest";
import {
  BACCARAT_SQUEEZE_DEMO_CORNERS,
  BACCARAT_SQUEEZE_DEMO_RANKS,
  BACCARAT_SQUEEZE_DEMO_SUITS,
  DEFAULT_BACCARAT_SQUEEZE_DEMO_CODE,
  DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG,
  getRandomBaccaratSqueezeDemoCard,
  parseBaccaratSqueezeDemoCode,
} from "./baccarat-squeeze-demo.util";

const createSource = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({ ...DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG, ...overrides });

describe("parseBaccaratSqueezeDemoCode", () => {
  it("parses the default configuration with the public Baccarat value types", () => {
    expect(
      parseBaccaratSqueezeDemoCode(DEFAULT_BACCARAT_SQUEEZE_DEMO_CODE),
    ).toEqual({
      config: DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG,
      error: null,
    });
    expect(BACCARAT_SQUEEZE_DEMO_RANKS).toHaveLength(13);
    expect(BACCARAT_SQUEEZE_DEMO_SUITS).toEqual([
      "clubs",
      "diamonds",
      "hearts",
      "spades",
    ]);
    expect(BACCARAT_SQUEEZE_DEMO_CORNERS).toEqual([
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ]);
  });

  it("rejects invalid JSON and non-object configurations", () => {
    expect(parseBaccaratSqueezeDemoCode("{")).toEqual({
      config: null,
      error: "Enter valid JSON to update the preview.",
    });
    expect(parseBaccaratSqueezeDemoCode("[]")).toEqual({
      config: null,
      error: "The configuration must be a JSON object.",
    });
  });

  it.each([
    ["rank", "1", "rank must be one of:"],
    ["suit", "stars", "suit must be one of:"],
    ["corner", "center", "corner must be one of:"],
  ])("rejects an unsupported %s", (field, value, expectedError) => {
    expect(
      parseBaccaratSqueezeDemoCode(createSource({ [field]: value })).error,
    ).toContain(expectedError);
  });

  it.each([
    ["revealThreshold", -0.01, "0 to 1"],
    ["revealThreshold", 1.01, "0 to 1"],
    ["revealThreshold", "0.68", "0 to 1"],
    ["edgeHitArea", 0.079, "0.08 to 0.35"],
    ["edgeHitArea", 0.351, "0.08 to 0.35"],
    ["edgeHitArea", null, "0.08 to 0.35"],
  ])(
    "rejects an out-of-range or non-number %s value",
    (field, value, expectedRange) => {
      expect(
        parseBaccaratSqueezeDemoCode(createSource({ [field]: value })).error,
      ).toContain(expectedRange);
    },
  );

  it("rejects non-finite numeric input", () => {
    expect(
      parseBaccaratSqueezeDemoCode(
        '{"rank":"8","suit":"diamonds","corner":"bottom-right","revealThreshold":1e400,"edgeHitArea":0.2}',
      ).error,
    ).toBe("revealThreshold must be a finite number from 0 to 1.");
  });

  it("accepts inclusive numeric boundaries", () => {
    expect(
      parseBaccaratSqueezeDemoCode(
        createSource({ revealThreshold: 0, edgeHitArea: 0.08 }),
      ).error,
    ).toBeNull();
    expect(
      parseBaccaratSqueezeDemoCode(
        createSource({ revealThreshold: 1, edgeHitArea: 0.35 }),
      ).error,
    ).toBeNull();
  });
});

describe("getRandomBaccaratSqueezeDemoCard", () => {
  it("maps the random range across the other 51 cards", () => {
    expect(
      getRandomBaccaratSqueezeDemoCard(
        { rank: "8", suit: "diamonds" },
        () => 0,
      ),
    ).toEqual({ rank: "A", suit: "clubs" });
    expect(
      getRandomBaccaratSqueezeDemoCard(
        { rank: "K", suit: "spades" },
        () => 0.999999,
      ),
    ).toEqual({ rank: "Q", suit: "spades" });
  });

  it("never returns the currently selected card", () => {
    expect(
      getRandomBaccaratSqueezeDemoCard({ rank: "A", suit: "clubs" }, () => 0),
    ).toEqual({ rank: "2", suit: "clubs" });
  });
});
