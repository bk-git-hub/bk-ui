import { describe, expect, it } from "vitest";
import {
  createLottoPhysicsBodies,
  isLottoPhysicsBodyFinite,
  kickLottoPhysicsBodies,
  stepLottoPhysicsBodies,
  type LottoPhysicsBody,
} from "./lottoMachinePhysics";

describe("lottoMachinePhysics", () => {
  it("creates deterministic bodies without using the draw random source", () => {
    const options = { count: 45, ballRadius: 0.075, seed: 1_234 };

    expect(createLottoPhysicsBodies(options)).toEqual(
      createLottoPhysicsBodies(options),
    );
  });

  it("applies downward gravity when the mixer is idle", () => {
    const body: LottoPhysicsBody = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 0.08,
      rotation: 0,
      angularVelocity: 0,
      phase: 0,
    };

    stepLottoPhysicsBodies([body], {
      deltaTime: 1 / 60,
      elapsedTime: 0,
      mixing: false,
    });

    expect(body.vy).toBeGreaterThan(0);
    expect(body.y).toBeGreaterThan(0);
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
      expect(Math.hypot(body.x, body.y)).toBeLessThanOrEqual(
        1 - body.radius - 0.018 + Number.EPSILON,
      );
    });
  });
});
