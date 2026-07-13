import { describe, expect, it } from "vitest";
import {
  createLottoPhysicsBodies,
  getLottoPhysicsPresentation,
  isLottoPhysicsBodyFinite,
  kickLottoPhysicsBodies,
  stepLottoPhysicsBodies,
  type LottoPhysicsBody,
} from "./lottoMachinePhysics";

function createBody(
  overrides: Partial<LottoPhysicsBody> = {},
): LottoPhysicsBody {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 0.08,
    rotation: 0,
    angularVelocity: 0,
    phase: 0,
    depthLayer: 0,
    depth: 0,
    depthAnchor: 0,
    depthVelocity: 0,
    ...overrides,
  };
}

describe("lottoMachinePhysics", () => {
  it("creates deterministic bodies without using the draw random source", () => {
    const options = {
      count: 45,
      ballRadius: 0.075,
      seed: 1_234,
      depthLayerCount: 5,
    };
    const bodies = createLottoPhysicsBodies(options);

    expect(bodies).toEqual(createLottoPhysicsBodies(options));

    const layerCounts = new Map<number, number>();
    bodies.forEach((body) => {
      layerCounts.set(
        body.depthLayer,
        (layerCounts.get(body.depthLayer) ?? 0) + 1,
      );
    });
    expect(layerCounts.size).toBe(5);
    expect(new Set(layerCounts.values())).toEqual(new Set([9]));

    const backPresentation = getLottoPhysicsPresentation(
      createBody({ depth: -0.72 }),
    );
    const frontPresentation = getLottoPhysicsPresentation(
      createBody({ depth: 0.72 }),
    );
    expect(frontPresentation.scale).toBeGreaterThan(backPresentation.scale);
    expect(frontPresentation.opacity).toBeGreaterThan(backPresentation.opacity);
    expect(frontPresentation.zIndex).toBeGreaterThan(backPresentation.zIndex);
  });

  it("applies downward gravity when the mixer is idle", () => {
    const body = createBody();

    stepLottoPhysicsBodies([body], {
      deltaTime: 1 / 60,
      elapsedTime: 0,
      mixing: false,
    });

    expect(body.vy).toBeGreaterThan(0);
    expect(body.y).toBeGreaterThan(0);
  });

  it("collides only with balls in the same depth layer", () => {
    const sameLayer = [
      createBody({ x: -0.03, depthLayer: 2, depth: 0.2, depthAnchor: 0.2 }),
      createBody({ x: 0.03, depthLayer: 2, depth: 0.2, depthAnchor: 0.2 }),
    ];
    const separateLayers = [
      createBody({ x: -0.03, depthLayer: 0, depth: -0.7, depthAnchor: -0.7 }),
      createBody({ x: 0.03, depthLayer: 4, depth: 0.7, depthAnchor: 0.7 }),
    ];
    const step = {
      deltaTime: 1 / 120,
      elapsedTime: 0,
      mixing: false,
    };

    stepLottoPhysicsBodies(sameLayer, step);
    stepLottoPhysicsBodies(separateLayers, step);

    expect(sameLayer[1].x - sameLayer[0].x).toBeGreaterThan(0.14);
    expect(separateLayers[1].x - separateLayers[0].x).toBeCloseTo(0.06, 8);
    expect(separateLayers[0].vx).toBeCloseTo(0, 8);
    expect(separateLayers[1].vx).toBeCloseTo(0, 8);
  });

  it("keeps supplying motion throughout a long mixing run", () => {
    const bodies = createLottoPhysicsBodies({
      count: 45,
      ballRadius: 0.075,
      seed: 7_654,
      depthLayerCount: 5,
    });
    const pathLengths = Array.from({ length: bodies.length }, () => 0);
    const movedUp = Array.from({ length: bodies.length }, () => false);
    const movedDown = Array.from({ length: bodies.length }, () => false);
    const activeCounts: number[] = [];
    kickLottoPhysicsBodies(bodies, 4_321);

    for (let frame = 0; frame < 2_400; frame += 1) {
      const previousPositions = bodies.map(({ x, y }) => ({ x, y }));
      stepLottoPhysicsBodies(bodies, {
        deltaTime: 1 / 120,
        elapsedTime: frame / 120,
        mixing: true,
      });

      if (frame >= 1_440) {
        bodies.forEach((body, index) => {
          pathLengths[index] += Math.hypot(
            body.x - previousPositions[index].x,
            body.y - previousPositions[index].y,
          );
          movedUp[index] ||= body.vy < -0.15;
          movedDown[index] ||= body.vy > 0.15;
        });

        if ((frame + 1) % 120 === 0) {
          activeCounts.push(
            pathLengths.filter((distance) => distance > 0.12).length,
          );
          pathLengths.fill(0);
        }
      }
    }

    expect(activeCounts).toHaveLength(8);
    activeCounts.forEach((activeCount) => {
      expect(activeCount).toBeGreaterThanOrEqual(34);
    });
    expect(
      movedUp.filter((hasMovedUp, index) => hasMovedUp && movedDown[index])
        .length,
    ).toBeGreaterThanOrEqual(22);
  });

  it("keeps a full chamber finite and inside its circular boundary", () => {
    const bodies = createLottoPhysicsBodies({
      count: 45,
      ballRadius: 0.075,
      seed: 9_876,
    });
    kickLottoPhysicsBodies(bodies, 5_432);

    for (let frame = 0; frame < 720; frame += 1) {
      stepLottoPhysicsBodies(bodies, {
        deltaTime: 1 / 120,
        elapsedTime: frame / 120,
        mixing: frame < 576,
      });
    }

    bodies.forEach((body) => {
      expect(isLottoPhysicsBodyFinite(body)).toBe(true);
      const { scale } = getLottoPhysicsPresentation(body);
      expect(Math.hypot(body.x, body.y)).toBeLessThanOrEqual(
        1 - body.radius * scale - 0.018 + Number.EPSILON,
      );
    });
  });
});
