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

  return {
    cancelAnimationFrame,
    step(milliseconds = 16) {
      timestamp += milliseconds;
      const pendingFrames = [...frames.values()];
      frames.clear();
      act(() => {
        pendingFrames.forEach((callback) => callback(timestamp));
      });
    },
  };
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
    const { container, unmount } = render(
      <LottoMachine
        items={[1, 2, 3]}
        spinning
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

    unmount();
    expect(animationFrames.cancelAnimationFrame).toHaveBeenCalled();
  });
});
