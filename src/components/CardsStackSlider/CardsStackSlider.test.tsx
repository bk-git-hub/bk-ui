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
  items?: string[];
  value?: number;
  defaultValue?: number;
  loop?: boolean;
  orientation?: "horizontal" | "vertical";
  onValueChange?: CardsStackValueChangeHandler;
  onViewportLostPointerCapture?: CardsStackViewportProps["onLostPointerCapture"];
}

function TestSlider({
  items = cards,
  value,
  defaultValue,
  loop = true,
  orientation = "horizontal",
  onValueChange,
  onViewportLostPointerCapture,
}: TestSliderProps) {
  return (
    <CardsStackRoot
      count={items.length}
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
        {items.map((card, index) => (
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

function getPositioner(index: number) {
  return document.querySelector(
    `[data-slot="cards-stack-item-positioner"][data-index="${index}"]`,
  ) as HTMLElement;
}

function getTopLayerPositioner() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="cards-stack-item-positioner"]',
    ),
  ).find((positioner) => positioner.style.zIndex === "2000") as HTMLElement;
}

function getHorizontalPrimaryOffset(index: number) {
  return Number(
    getPositioner(index).style.transform.match(
      /^translate3d\((-?[\d.]+)%/,
    )?.[1],
  );
}

function fireTransformTransition(positioner: HTMLElement) {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: "transform" });
  fireEvent(positioner, event);
}

function finishTransition() {
  fireTransformTransition(getTopLayerPositioner());
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

  it("places adjacent cards on the left and right in horizontal mode", () => {
    render(<TestSlider />);

    expect(getPositioner(2).style.transform).toContain("translate3d(-64%");
    expect(getPositioner(0).style.transform).toContain("translate3d(0%");
    expect(getPositioner(1).style.transform).toContain("translate3d(64%");
  });

  it("places adjacent cards above and below in vertical mode", () => {
    render(<TestSlider orientation="vertical" />);

    expect(getPositioner(2).style.transform).toContain("translate3d(0px, -64%");
    expect(getPositioner(0).style.transform).toContain("translate3d(0px, 0%");
    expect(getPositioner(1).style.transform).toContain("translate3d(0px, 64%");
    expect(getPositioner(1).style.transform).toContain("rotateX(-180deg)");
  });

  it("moves one card, announces it, and reports the input source once", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    expect(getPositioner(1).style.transform).toContain("rotateY(180deg)");
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    expect(screen.getByRole("button", { name: "Next card" })).toBeDisabled();
    expect(getPositioner(1).style.transform).toContain("rotateY(0deg)");
    expect(getPositioner(0).style.transform).toContain("rotateY(14deg)");
    expect(Number(getPositioner(1).style.zIndex)).toBeGreaterThan(
      Number(getPositioner(0).style.zIndex),
    );
    fireTransformTransition(getPositioner(0));
    expect(getActivePositioner()).toHaveAttribute("data-index", "0");
    expect(onValueChange).not.toHaveBeenCalled();
    const outgoingTransform = getPositioner(0).style.transform;
    const incomingTransform = getPositioner(1).style.transform;
    const settledStyles = cards.map((_, index) => ({
      transform: getPositioner(index).style.transform,
      opacity: getPositioner(index).style.opacity,
      zIndex: getPositioner(index).style.zIndex,
    }));

    finishTransition();
    act(() => vi.runAllTimers());

    expect(getActivePositioner()).toHaveAttribute("data-index", "1");
    expect(getPositioner(0).style.transform).toBe(outgoingTransform);
    expect(getPositioner(1).style.transform).toBe(incomingTransform);
    cards.forEach((_, index) => {
      expect(getPositioner(index).style.transform).toBe(
        settledStyles[index].transform,
      );
      expect(getPositioner(index).style.opacity).toBe(
        settledStyles[index].opacity,
      );
      expect(getPositioner(index).style.zIndex).toBe(
        settledStyles[index].zIndex,
      );
    });
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
  });

  it("keeps the outgoing card on top while navigating to a previous index", () => {
    render(<TestSlider loop={false} defaultValue={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous card" }));

    expect(getPositioner(1).style.transform).toContain("rotateY(180deg)");
    expect(getPositioner(0).style.transform).toContain("rotateY(0deg)");
    expect(Number(getPositioner(1).style.zIndex)).toBeGreaterThan(
      Number(getPositioner(0).style.zIndex),
    );
    fireTransformTransition(getPositioner(0));
    expect(getActivePositioner()).toHaveAttribute("data-index", "1");

    finishTransition();

    expect(getActivePositioner()).toHaveAttribute("data-index", "0");
    expect(Number(getPositioner(0).style.zIndex)).toBeGreaterThan(
      Number(getPositioner(1).style.zIndex),
    );
  });

  it("wraps in both directions when loop is enabled", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous card" }));
    expect(getTopLayerPositioner()).toHaveAttribute("data-index", "0");
    expect(getPositioner(0).style.transform).toContain("rotateY(180deg)");
    finishTransition();

    expect(getActivePositioner()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: -1,
      source: "previous",
    });

    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    expect(getTopLayerPositioner()).toHaveAttribute("data-index", "0");
    expect(getPositioner(0).style.transform).toContain("rotateY(0deg)");
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

  it("drags continuously across multiple cards and settles on the nearest one", () => {
    const onValueChange = vi.fn();
    const longDeck = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    render(<TestSlider items={longDeck} onValueChange={onValueChange} />);
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
      pointerId: 17,
      pointerType: "mouse",
      button: 0,
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 17,
      pointerType: "mouse",
      clientX: -500,
      clientY: 100,
    });
    act(() => vi.advanceTimersByTime(1));

    expect(getHorizontalPrimaryOffset(2)).toBeCloseTo(-19.2, 5);
    expect(getPositioner(3).style.zIndex).toBe("2000");
    expect(Number(getPositioner(2).style.zIndex)).toBeGreaterThan(
      Number(getPositioner(0).style.zIndex),
    );

    act(() => vi.advanceTimersByTime(120));
    fireEvent.pointerUp(viewport, {
      pointerId: 17,
      pointerType: "mouse",
      clientX: -500,
      clientY: 100,
    });
    expect(getPositioner(3).style.zIndex).toBe("2000");
    finishTransition();

    expect(getActivePositioner()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("only resists at the actual end of a non-looping deck", () => {
    const onValueChange = vi.fn();
    const longDeck = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    render(
      <TestSlider
        items={longDeck}
        loop={false}
        defaultValue={1}
        onValueChange={onValueChange}
      />,
    );
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
      pointerId: 18,
      pointerType: "mouse",
      button: 0,
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 18,
      pointerType: "mouse",
      clientX: -900,
      clientY: 100,
    });
    act(() => vi.advanceTimersByTime(1));

    expect(getHorizontalPrimaryOffset(4)).toBeCloseTo(-8.064, 5);

    fireEvent.pointerMove(viewport, {
      pointerId: 18,
      pointerType: "mouse",
      clientX: -10000,
      clientY: 100,
    });
    act(() => vi.advanceTimersByTime(1));

    expect(getHorizontalPrimaryOffset(4)).toBeCloseTo(-28.8, 5);

    act(() => vi.advanceTimersByTime(120));
    fireEvent.pointerUp(viewport, {
      pointerId: 18,
      pointerType: "mouse",
      clientX: -10000,
      clientY: 100,
    });
    finishTransition();

    expect(getActivePositioner()).toHaveAttribute("data-index", "4");
    expect(onValueChange).toHaveBeenCalledWith(4, {
      previousValue: 1,
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
