import { describe, expect, it } from "vitest";
import {
  getShaderSliderCanvasMetrics,
  getShaderSliderUvScale,
} from "./shader-slider-renderer";

describe("shader slider renderer math", () => {
  it("calculates cover UV scales for wide and tall images", () => {
    expect(getShaderSliderUvScale(1600, 900, 2000, 1000, "cover")).toEqual([
      0.8888888888888888, 1,
    ]);
    expect(getShaderSliderUvScale(1600, 900, 900, 1600, "cover")).toEqual([
      1, 0.31640625,
    ]);
  });

  it("calculates contain UV scales that leave letterbox space", () => {
    expect(getShaderSliderUvScale(1600, 900, 2000, 1000, "contain")).toEqual([
      1, 1.125,
    ]);
    expect(getShaderSliderUvScale(1600, 900, 900, 1600, "contain")).toEqual([
      3.1604938271604937, 1,
    ]);
  });

  it("returns a neutral scale for invalid geometry", () => {
    expect(getShaderSliderUvScale(0, 900, 2000, 1000, "cover")).toEqual([1, 1]);
  });

  it("caps device pixel ratio and respects viewport limits", () => {
    expect(getShaderSliderCanvasMetrics(800, 600, 3, 2)).toEqual({
      width: 1600,
      height: 1200,
      pixelRatio: 2,
    });
    expect(getShaderSliderCanvasMetrics(1200, 900, 2, 2, 1600, 1000)).toEqual({
      width: 1333,
      height: 1000,
      pixelRatio: 1000 / 900,
    });
  });
});
