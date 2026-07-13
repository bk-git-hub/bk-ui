import { describe, expect, it } from "vitest";
import { createSlotReels, parseSlotItems } from "./slot-machine-demo.util";

describe("parseSlotItems", () => {
  it("accepts newline and comma separated content", () => {
    expect(parseSlotItems(" Cherry \nLemon, Seven\n\n")).toEqual([
      "Cherry",
      "Lemon",
      "Seven",
    ]);
  });

  it("drops empty entries", () => {
    expect(parseSlotItems("\n,  ,\n")).toEqual([]);
  });
});

describe("createSlotReels", () => {
  it("creates the requested number of reels from the provided items", () => {
    expect(createSlotReels(["Cherry", "Lemon"], 3)).toEqual([
      ["Cherry", "Lemon"],
      ["Cherry", "Lemon"],
      ["Cherry", "Lemon"],
    ]);
  });
});
