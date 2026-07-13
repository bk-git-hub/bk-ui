import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LottoMachine } from "./LottoMachine";

function installAnimationFrameHarness() {
  let timestamp = 0;
  let nextFrameId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const cancelAnimationFrame = vi.fn((frameId: number) => {
    frames.delete(frameId);
  });

  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    nextFrameId += 1;
    frames.set(nextFrameId, callback);
    return nextFrameId;
  });
  vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

  const runNextFrame = (milliseconds: number) => {
    timestamp += milliseconds;
    const pendingFrames = [...frames.values()];
    frames.clear();
    pendingFrames.forEach((callback) => callback(timestamp));
  };

  return {
    cancelAnimationFrame,
    get pendingFrameCount() {
      return frames.size;
    },
    step(milliseconds = 16) {
      act(() => {
        runNextFrame(milliseconds);
      });
    },
    advanceFrames(frameCount: number, milliseconds = 16) {
      act(() => {
        for (let frame = 0; frame < frameCount; frame += 1) {
          runNextFrame(milliseconds);
        }
      });
    },
  };
}

function readBallPositions(ballBodies: HTMLElement[]) {
  return ballBodies.map((ball) => {
    const match = ball.style.transform.match(
      /translate3d\(([-\d.e]+)px, ([-\d.e]+)px/,
    );
    if (!match)
      throw new Error(`Missing ball position: ${ball.style.transform}`);
    return { x: Number(match[1]), y: Number(match[2]) };
  });
}

function countMovedBalls(
  first: Array<{ x: number; y: number }>,
  second: Array<{ x: number; y: number }>,
  minimumDistance: number,
) {
  return first.filter((position, index) => {
    const nextPosition = second[index];
    return (
      Math.hypot(nextPosition.x - position.x, nextPosition.y - position.y) >=
      minimumDistance
    );
  }).length;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("LottoMachine", () => {
  it("renders a capped decorative pool and accessible results", () => {
    const { container } = render(
      <LottoMachine
        items={[
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
          { id: "c", label: "Gamma" },
          { id: "d", label: "Delta" },
        ]}
        drawnItems={[
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
        ]}
        maxVisibleBalls={3}
        getItemKey={(item) => item.id}
        getItemLabel={(item) => item.label}
        renderBall={(item) => <strong>{item.label}</strong>}
        resultLabel="Selected balls"
      />,
    );

    expect(
      container.querySelectorAll('[data-slot="lotto-machine-ball"]'),
    ).toHaveLength(3);
    expect(
      container.querySelector('[data-slot="lotto-machine-balls"]'),
    ).toHaveAttribute("aria-hidden", "true");

    const results = screen.getByRole("list", { name: "Selected balls" });
    expect(within(results).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Draw complete: Alpha, Beta",
    );
  });

  it("moves balls independently while exposing its spinning state", () => {
    const animationFrames = installAnimationFrameHarness();
    const items = Array.from({ length: 12 }, (_, index) => index + 1);
    const { container, unmount } = render(
      <LottoMachine
        items={items}
        spinning
        depthLayers={4}
        aria-label="Custom lotto machine"
        className="p-2"
        ballClassName="bg-fuchsia-500"
      />,
    );

    const machine = screen.getByRole("region", {
      name: "Custom lotto machine",
    });
    expect(machine).toHaveAttribute("data-state", "spinning");
    expect(machine).toHaveAttribute("aria-busy", "true");
    expect(machine).toHaveClass("p-2");
    expect(machine).not.toHaveClass("p-4");
    const field = container.querySelector('[data-slot="lotto-machine-balls"]');
    expect(field).not.toHaveClass(
      "motion-safe:animate-[spin_2.8s_linear_infinite]",
    );
    expect(
      container.querySelector('[data-slot="lotto-machine-ball"]'),
    ).toHaveClass("bg-fuchsia-500");
    expect(
      container.querySelector('[data-slot="lotto-machine-ball"]'),
    ).not.toHaveClass("motion-safe:animate-bounce");

    const ballBodies = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-slot="lotto-machine-ball-body"]',
      ),
    );
    const initialTransforms = ballBodies.map((ball) => ball.style.transform);

    animationFrames.step();
    animationFrames.step();

    const animatedTransforms = ballBodies.map((ball) => ball.style.transform);
    expect(new Set(animatedTransforms).size).toBe(ballBodies.length);
    expect(animatedTransforms).not.toEqual(initialTransforms);
    expect(
      new Set(ballBodies.map((ball) => ball.dataset.depthLayer)).size,
    ).toBe(4);
    expect(
      new Set(ballBodies.map((ball) => ball.style.opacity)).size,
    ).toBeGreaterThanOrEqual(4);
    expect(
      new Set(ballBodies.map((ball) => ball.style.zIndex)).size,
    ).toBeGreaterThanOrEqual(4);
    expect(
      new Set(
        ballBodies.map(
          (ball) => ball.style.transform.match(/scale\(([-\d.]+)\)/)?.[1],
        ),
      ).size,
    ).toBeGreaterThanOrEqual(4);

    animationFrames.advanceFrames(75);
    const earlyPositions = readBallPositions(ballBodies);
    animationFrames.advanceFrames(75);
    const middlePositions = readBallPositions(ballBodies);
    animationFrames.advanceFrames(75);
    const latePositions = readBallPositions(ballBodies);

    expect(
      countMovedBalls(earlyPositions, middlePositions, 4),
    ).toBeGreaterThanOrEqual(6);
    expect(
      countMovedBalls(middlePositions, latePositions, 4),
    ).toBeGreaterThanOrEqual(6);
    expect(animationFrames.pendingFrameCount).toBe(1);

    unmount();
    expect(animationFrames.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("keeps a static depth layout when reduced motion is preferred", () => {
    const animationFrames = installAnimationFrameHarness();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const { container } = render(
      <LottoMachine
        items={Array.from({ length: 10 }, (_, index) => index + 1)}
        spinning
      />,
    );
    const ballBodies = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-slot="lotto-machine-ball-body"]',
      ),
    );

    expect(animationFrames.pendingFrameCount).toBe(0);
    expect(
      new Set(ballBodies.map((ball) => ball.dataset.depthLayer)).size,
    ).toBe(5);
    expect(
      new Set(ballBodies.map((ball) => ball.style.zIndex)).size,
    ).toBeGreaterThanOrEqual(5);
    ballBodies.forEach((ball) => {
      expect(ball.style.transform).toContain("scale(");
      expect(ball.style.willChange).toBe("auto");
    });
  });
});
