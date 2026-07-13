import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
  type CardsStackViewportProps,
} from "./CardsStackSlider";
import {
  getCardsStackRelativeProgress,
  normalizeCardsStackValue,
  type CardsStackValueChangeHandler,
} from "./useCardsStackSlider";

const cards = ["Alpha", "Beta", "Gamma"];

interface TestSliderProps {
  value?: number;
  defaultValue?: number;
  loop?: boolean;
  orientation?: "horizontal" | "vertical";
  onValueChange?: CardsStackValueChangeHandler;
  onViewportLostPointerCapture?: CardsStackViewportProps["onLostPointerCapture"];
}

function TestSlider({
  value,
  defaultValue,
  loop = true,
  orientation = "horizontal",
  onValueChange,
  onViewportLostPointerCapture,
}: TestSliderProps) {
  return (
    <CardsStackRoot
      count={cards.length}
      value={value}
      defaultValue={defaultValue}
      loop={loop}
      orientation={orientation}
      onValueChange={onValueChange}
      aria-label="Test cards"
    >
      <CardsStackViewport
        data-testid="viewport"
        onLostPointerCapture={onViewportLostPointerCapture}
      >
        {cards.map((card, index) => (
          <CardsStackItem key={card} index={index}>
            <CardsStackFront>{card} front</CardsStackFront>
            <CardsStackBack>{card} back</CardsStackBack>
          </CardsStackItem>
        ))}
      </CardsStackViewport>
      <CardsStackPrevious>Previous</CardsStackPrevious>
      <CardsStackStatus />
      <CardsStackNext>Next</CardsStackNext>
    </CardsStackRoot>
  );
}

function getActivePositioner() {
  return document.querySelector(
    '[data-slot="cards-stack-item-positioner"][data-active]',
  ) as HTMLElement;
}

function finishTransition() {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: "transform" });
  fireEvent(getActivePositioner(), event);
}

describe("cards stack utilities", () => {
  it("normalizes bounded and looping values", () => {
    expect(normalizeCardsStackValue(5, 3, false)).toBe(2);
    expect(normalizeCardsStackValue(-1, 3, true)).toBe(2);
    expect(normalizeCardsStackValue(4, 3, true)).toBe(1);
    expect(normalizeCardsStackValue(Number.NaN, 3, true)).toBe(0);
  });

  it("keeps loop progress continuous across the end of the deck", () => {
    expect(getCardsStackRelativeProgress(0, 2, 3, true)).toBe(1);
    expect(getCardsStackRelativeProgress(2, 0, 3, true)).toBe(-1);
    expect(getCardsStackRelativeProgress(1, 0, 3, true, -0.5)).toBe(0.5);
    expect(getCardsStackRelativeProgress(3, 0, 5, true, -1)).toBe(2);
    expect(getCardsStackRelativeProgress(3, 1, 5, true, 0)).toBe(2);
  });
});

describe("CardsStackSlider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) =>
      window.clearTimeout(id),
    );
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("exposes carousel semantics and removes inactive cards from interaction", () => {
    render(<TestSlider />);

    expect(screen.getByRole("region", { name: "Test cards" })).toHaveAttribute(
      "aria-roledescription",
      "carousel",
    );
    expect(screen.getByTestId("viewport")).toHaveAttribute("tabindex", "0");
    expect(getActivePositioner()).toHaveAttribute("data-index", "0");

    const positioners = document.querySelectorAll(
      '[data-slot="cards-stack-item-positioner"]',
    );
    expect(positioners[0]).toHaveAttribute("aria-hidden", "false");
    expect(positioners[0]).not.toHaveAttribute("inert");
    expect(positioners[1]).toHaveAttribute("aria-hidden", "true");
    expect(positioners[1]).toHaveAttribute("inert");
    expect(
      document.querySelector('[data-slot="cards-stack-back"]'),
    ).toHaveAttribute("inert");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");
  });

  it("moves one card, announces it, and reports the input source once", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    expect(screen.getByRole("button", { name: "Next card" })).toBeDisabled();
    expect(getActivePositioner().style.transform).toContain("rotateY(180deg)");

    finishTransition();
    act(() => vi.runAllTimers());

    expect(getActivePositioner()).toHaveAttribute("data-index", "1");
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
  });

  it("wraps in both directions when loop is enabled", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous card" }));
    finishTransition();

    expect(getActivePositioner()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: -1,
      source: "previous",
    });

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    finishTransition();
    expect(getActivePositioner()).toHaveAttribute("data-index", "0");
  });

  it("disables controls at non-looping boundaries", () => {
    render(<TestSlider loop={false} defaultValue={0} />);

    expect(
      screen.getByRole("button", { name: "Previous card" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next card" })).toBeEnabled();
  });

  it("waits for a controlled value to be updated by the consumer", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TestSlider value={0} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    finishTransition();

    expect(onValueChange).toHaveBeenCalledWith(1, expect.any(Object));
    expect(getActivePositioner()).toHaveAttribute("data-index", "0");

    rerender(<TestSlider value={1} onValueChange={onValueChange} />);
    expect(getActivePositioner()).toHaveAttribute("data-index", "1");
  });

  it("cancels a pending navigation when the controlled value changes", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TestSlider value={0} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    rerender(<TestSlider value={2} onValueChange={onValueChange} />);
    act(() => vi.runAllTimers());

    expect(getActivePositioner()).toHaveAttribute("data-index", "2");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("supports orientation-aware keyboard navigation on the viewport only", () => {
    const onValueChange = vi.fn();
    render(<TestSlider orientation="vertical" onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");

    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.keyDown(viewport, { key: "ArrowDown" });
    finishTransition();
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "keyboard",
    });
  });

  it("commits a primary-axis drag past the threshold", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 240,
      width: 400,
      height: 240,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(viewport, {
      pointerId: 7,
      pointerType: "mouse",
      button: 0,
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 7,
      pointerType: "mouse",
      clientX: 200,
      clientY: 102,
    });
    fireEvent.pointerUp(viewport, {
      pointerId: 7,
      pointerType: "mouse",
      clientX: 200,
      clientY: 102,
    });
    finishTransition();

    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("releases a cross-axis gesture without changing cards", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");

    fireEvent.pointerDown(viewport, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 104,
      clientY: 180,
    });

    act(() => vi.runAllTimers());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(getActivePositioner()).toHaveAttribute("data-index", "0");
  });

  it("blocks navigation during a drag and always cleans up lost capture", () => {
    const preventLostCapture = vi.fn((event: ReactPointerEvent) =>
      event.preventDefault(),
    );
    render(<TestSlider onViewportLostPointerCapture={preventLostCapture} />);
    const viewport = screen.getByTestId("viewport");
    const nextButton = screen.getByRole("button", { name: "Next card" });

    fireEvent.pointerDown(viewport, {
      pointerId: 12,
      pointerType: "mouse",
      button: 0,
      clientX: 200,
      clientY: 100,
    });

    expect(nextButton).toBeDisabled();
    fireEvent.click(nextButton);
    fireEvent.lostPointerCapture(viewport, { pointerId: 12 });

    expect(preventLostCapture).toHaveBeenCalledTimes(1);
    expect(viewport).not.toHaveAttribute("data-dragging");
    expect(nextButton).toBeEnabled();
  });
});
