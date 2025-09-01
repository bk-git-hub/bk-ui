// src/coverflow/cover.util.ts
export class Util {
  private xWeightRegion1: number;
  private xWeightRegion2: number;
  private scaleWeightRegion1: number;
  private scaleWeightRegion2: number;

  constructor(size: number) {
    this.xWeightRegion1 = size * 0.55;
    this.xWeightRegion2 = size * 0.2;
    this.scaleWeightRegion1 = -0.2;
    this.scaleWeightRegion2 = -0.05;
  }

  private getX(score: number) {
    if (score < -1) {
      return -this.xWeightRegion1 + this.xWeightRegion2 * (score + 1);
    }
    if (score < 1) {
      return score * this.xWeightRegion1;
    }
    return this.xWeightRegion1 + this.xWeightRegion2 * (score - 1);
  }

  private getRotateY(score: number) {
    if (score < -1) {
      return 40;
    }
    if (score < 1) {
      return score * -40;
    }
    return -40;
  }

  private getScale(score: number) {
    if (score < -2) {
      return 1 + this.scaleWeightRegion1 + this.scaleWeightRegion2;
    }
    if (score < -1) {
      return (
        1 + this.scaleWeightRegion1 - this.scaleWeightRegion2 * (score + 1)
      );
    }
    if (score < 0) {
      return 1 - this.scaleWeightRegion1 * score;
    }
    if (score < 1) {
      return 1 + this.scaleWeightRegion1 * score;
    }
    if (score < 2) {
      return (
        1 + this.scaleWeightRegion1 + this.scaleWeightRegion2 * (score - 1)
      );
    }
    return 1 + this.scaleWeightRegion1 + this.scaleWeightRegion2;
  }

  getTransform(score: number) {
    return {
      transform: `translateX(${this.getX(score)}px) scale(${this.getScale(
        score,
      )}) rotateY(${this.getRotateY(score)}deg)`,
    };
  }
}
