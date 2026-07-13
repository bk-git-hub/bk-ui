import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BaccaratSqueezeDemoPreview from "./BaccaratSqueezeDemoPreview";
import {
  DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG,
  type BaccaratSqueezeDemoConfig,
} from "./baccarat-squeeze-demo.util";

function prepareCard(card: HTMLElement) {
  let capturedPointerId: number | null = null;
  Object.defineProperties(card, {
    setPointerCapture: {
      configurable: true,
      value: vi.fn((pointerId: number) => {
        capturedPointerId = pointerId;
      }),
    },
    hasPointerCapture: {
      configurable: true,
      value: vi.fn((pointerId: number) => capturedPointerId === pointerId),
    },
    releasePointerCapture: {
      configurable: true,
      value: vi.fn((pointerId: number) => {
        if (capturedPointerId === pointerId) capturedPointerId = null;
      }),
    },
  });
  vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 200,
    bottom: 280,
    width: 200,
    height: 280,
    toJSON: () => ({}),
  });
}

describe("BaccaratSqueezeDemoPreview", () => {
  it("supports uncontrolled card settings and reports complete config changes", () => {
    const onConfigChange = vi.fn();
    const defaultConfig: BaccaratSqueezeDemoConfig = {
      rank: "A",
      suit: "spades",
      corner: "top-left",
      revealThreshold: 0.75,
      edgeHitArea: 0.12,
    };

    const { container } = render(
      <BaccaratSqueezeDemoPreview
        defaultConfig={defaultConfig}
        onConfigChange={onConfigChange}
      />,
    );

    const card = container.querySelector<HTMLElement>(
      '[data-slot="baccarat-squeeze-card"]',
    );
    const rank = container.querySelector<HTMLSelectElement>("select");
    const root = container.querySelector('[data-slot="baccarat-squeeze"]');
    expect(card).not.toBeNull();
    expect(rank).not.toBeNull();
    expect(rank).toHaveValue("A");
    expect(container.querySelector('[aria-label="스페이드 A"]')).not.toBeNull();
    expect(root).toHaveAttribute("data-corner", "top-left");

    fireEvent.keyDown(card!, { key: "End" });
    expect(card).toHaveAttribute("aria-valuenow", "100");

    fireEvent.change(rank!, { target: { value: "K" } });
    expect(rank).toHaveValue("K");
    expect(card).toHaveAttribute("aria-valuenow", "0");
    expect(onConfigChange).toHaveBeenLastCalledWith({
      ...defaultConfig,
      rank: "K",
    });

    fireEvent.click(container.querySelector('button[aria-label="하트"]')!);
    expect(container.querySelector('[aria-label="하트 K"]')).not.toBeNull();
    expect(onConfigChange).toHaveBeenLastCalledWith({
      ...defaultConfig,
      rank: "K",
      suit: "hearts",
    });
  });

  it("syncs controlled JSON settings and resets only the internal squeeze progress", () => {
    const onConfigChange = vi.fn();
    const initialConfig = { ...DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG };
    const { container, rerender } = render(
      <BaccaratSqueezeDemoPreview
        config={initialConfig}
        onConfigChange={onConfigChange}
      />,
    );
    const card = container.querySelector<HTMLElement>(
      '[data-slot="baccarat-squeeze-card"]',
    );
    expect(card).not.toBeNull();

    fireEvent.keyDown(card!, { key: "End" });
    expect(card).toHaveAttribute("aria-valuenow", "100");

    const nextConfig: BaccaratSqueezeDemoConfig = {
      ...initialConfig,
      rank: "Q",
      suit: "clubs",
      corner: "top-right",
    };
    rerender(
      <BaccaratSqueezeDemoPreview
        config={nextConfig}
        onConfigChange={onConfigChange}
      />,
    );

    expect(container.querySelector("select")).toHaveValue("Q");
    expect(container.querySelector('[aria-label="클럽 Q"]')).not.toBeNull();
    expect(card).toHaveAttribute("aria-valuenow", "0");
    expect(
      container.querySelector('[data-slot="baccarat-squeeze"]'),
    ).toHaveAttribute("data-corner", "top-right");

    fireEvent.click(
      container.querySelector('button[aria-label="다이아몬드"]')!,
    );
    expect(onConfigChange).toHaveBeenCalledWith({
      ...nextConfig,
      suit: "diamonds",
    });
    expect(container.querySelector('[aria-label="클럽 Q"]')).not.toBeNull();
  });

  it("draws a concealed random card only on demand and resets the squeeze", () => {
    const random = vi.fn(() => 0);
    const onConfigChange = vi.fn();
    const initialConfig = { ...DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG };
    const { container, getByRole, queryByLabelText, rerender } = render(
      <BaccaratSqueezeDemoPreview
        config={initialConfig}
        onConfigChange={onConfigChange}
        random={random}
      />,
    );
    const card = container.querySelector<HTMLElement>(
      '[data-slot="baccarat-squeeze-card"]',
    );
    const result = container.querySelector<HTMLElement>(
      '[data-slot="baccarat-random-result"]',
    );
    expect(card).not.toBeNull();
    expect(result).not.toBeNull();
    expect(random).not.toHaveBeenCalled();

    fireEvent.keyDown(card!, { key: "End" });
    expect(card).toHaveAttribute("aria-valuenow", "100");

    const drawButton = getByRole("button", { name: "랜덤 카드 뽑기" });
    expect(drawButton).toHaveAttribute("type", "button");
    fireEvent.click(drawButton);

    const nextConfig: BaccaratSqueezeDemoConfig = {
      ...initialConfig,
      rank: "A",
      suit: "clubs",
    };
    expect(random).toHaveBeenCalledTimes(1);
    expect(onConfigChange).toHaveBeenLastCalledWith(nextConfig);
    expect(card).toHaveAttribute("aria-valuenow", "0");

    rerender(
      <BaccaratSqueezeDemoPreview
        config={nextConfig}
        onConfigChange={onConfigChange}
        random={random}
      />,
    );
    expect(random).toHaveBeenCalledTimes(1);
    expect(result).toHaveTextContent("???");
    expect(queryByLabelText("Rank")).not.toBeVisible();
    expect(
      container.querySelector('[data-slot="baccarat-squeeze-face"]'),
    ).toHaveAttribute("aria-hidden", "true");

    fireEvent.keyDown(card!, { key: "End" });
    expect(result).toHaveTextContent("♣ A");
    expect(
      container.querySelector('[data-slot="baccarat-squeeze-face"]'),
    ).toHaveAttribute("aria-hidden", "false");

    fireEvent.click(getByRole("button", { name: "직접 설정으로 전환" }));
    expect(queryByLabelText("Rank")).toBeVisible();
    expect(queryByLabelText("Rank")).toHaveValue("A");
  });

  it("applies revealThreshold and edgeHitArea to real pointer interaction", () => {
    const strictConfig: BaccaratSqueezeDemoConfig = {
      ...DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG,
      corner: "top-left",
      revealThreshold: 0.8,
      edgeHitArea: 0.08,
    };
    const { container, rerender } = render(
      <BaccaratSqueezeDemoPreview config={strictConfig} />,
    );
    const card = container.querySelector<HTMLElement>(
      '[data-slot="baccarat-squeeze-card"]',
    );
    const root = container.querySelector('[data-slot="baccarat-squeeze"]');
    expect(card).not.toBeNull();
    prepareCard(card!);

    fireEvent.pointerDown(card!, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 30,
      clientY: 140,
    });
    expect(root).toHaveAttribute("data-origin", "corner");
    fireEvent.pointerCancel(card!, { pointerId: 1, pointerType: "touch" });

    const permissiveConfig: BaccaratSqueezeDemoConfig = {
      ...strictConfig,
      revealThreshold: 0.6,
      edgeHitArea: 0.35,
    };
    rerender(<BaccaratSqueezeDemoPreview config={permissiveConfig} />);

    fireEvent.pointerDown(card!, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 30,
      clientY: 140,
    });
    expect(root).toHaveAttribute("data-origin", "left-edge");
    fireEvent.pointerCancel(card!, { pointerId: 2, pointerType: "touch" });

    fireEvent.pointerDown(card!, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 196,
      clientY: 140,
    });
    fireEvent.pointerUp(card!, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 96,
      clientY: 140,
    });
    expect(card).toHaveAttribute("aria-valuenow", "100");
  });
});
