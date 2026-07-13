import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
} from "./ShutterSlider";
import {
  getShutterSliderTarget,
  normalizeShutterSliderValue,
} from "./useShutterSlider";

const TEST_SLIDES = [
  { src: "/shutter-one.svg", alt: "First mountain scene" },
  { src: "/shutter-two.svg", alt: "Second desert scene" },
  { src: "/shutter-three.svg", alt: "Third ocean scene" },
  { src: "/shutter-four.svg", alt: "Fourth forest scene" },
] as const;

type TestSliderProps = Pick<
  ComponentProps<typeof ShutterSliderRoot>,
  | "value"
  | "defaultValue"
  | "loop"
  | "disabled"
  | "stripCount"
  | "transitionDuration"
  | "stagger"
  | "dragThreshold"
  | "onValueChange"
> & {
  slides?: ComponentProps<typeof ShutterSliderRoot>["slides"];
  viewportProps?: ComponentProps<typeof ShutterSliderViewport>;
};

function TestSlider({
  slides = TEST_SLIDES,
  value,
  defaultValue,
  loop = true,
  disabled = false,
  stripCount = 5,
  transitionDuration = 40,
  stagger = 10,
  dragThreshold = 40,
  onValueChange,
  viewportProps,
}: TestSliderProps) {
  return (
    <ShutterSliderRoot
      slides={slides}
      value={value}
      defaultValue={defaultValue}
      loop={loop}
      disabled={disabled}
      stripCount={stripCount}
      transitionDuration={transitionDuration}
      stagger={stagger}
      dragThreshold={dragThreshold}
      onValueChange={onValueChange}
      aria-label="Test shutter stories"
    >
      <ShutterSliderViewport {...viewportProps}>
        {slides.map((slide, index) => (
          <ShutterSliderSlide key={slide.src} index={index}>
            <span>{slide.alt} overlay</span>
            {index === 0 ? <input aria-label="Slide note" /> : null}
          </ShutterSliderSlide>
        ))}
      </ShutterSliderViewport>
      <ShutterSliderPrevious>Previous</ShutterSliderPrevious>
      <ShutterSliderNext>Next</ShutterSliderNext>
      <ShutterSliderPagination />
      <ShutterSliderStatus />
    </ShutterSliderRoot>
  );
}

function createMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function getSlot<T extends Element = HTMLElement>(slot: string) {
  const element = document.querySelector<T>(`[data-slot="${slot}"]`);
  expect(element).not.toBeNull();
  return element as T;
}

function getSlots<T extends Element = HTMLElement>(slot: string) {
  return Array.from(document.querySelectorAll<T>(`[data-slot="${slot}"]`));
}

function getRoot() {
  return getSlot("shutter-slider-root");
}

function getViewport() {
  return getSlot("shutter-slider-viewport");
}

function getActiveSlide() {
  const slide = document.querySelector<HTMLElement>(
    '[data-slot="shutter-slider-slide"][data-active]',
  );
  expect(slide).not.toBeNull();
  return slide as HTMLElement;
}

function getTerminalPanel() {
  const terminalStrip = document.querySelector<HTMLElement>(
    '[data-slot="shutter-slider-strip"][data-terminal]',
  );
  expect(terminalStrip).not.toBeNull();
  const panel = terminalStrip?.querySelector<HTMLElement>(
    '[data-slot="shutter-slider-panel"]',
  );
  expect(panel).not.toBeNull();
  return panel as HTMLElement;
}

function dispatchTransitionEnd(element: Element, propertyName = "transform") {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: propertyName });
  fireEvent(element, event);
}

function finishTransition() {
  dispatchTransitionEnd(getTerminalPanel());
}

describe("shutter slider utilities", () => {
  it("normalizes looping and bounded values", () => {
    expect(normalizeShutterSliderValue(-1, 4, true)).toBe(3);
    expect(normalizeShutterSliderValue(5, 4, true)).toBe(1);
    expect(normalizeShutterSliderValue(9, 4, false)).toBe(3);
    expect(normalizeShutterSliderValue(-4, 4, false)).toBe(0);
    expect(normalizeShutterSliderValue(Number.NaN, 4, true)).toBe(0);
    expect(normalizeShutterSliderValue(2, 0, true)).toBe(0);
  });

  it("finds adjacent targets at looping and bounded edges", () => {
    expect(getShutterSliderTarget(3, 1, 4, true)).toBe(0);
    expect(getShutterSliderTarget(3, 1, 4, false)).toBe(3);
    expect(getShutterSliderTarget(0, -1, 4, true)).toBe(3);
    expect(getShutterSliderTarget(0, -1, 4, false)).toBe(0);
  });
});

describe("ShutterSlider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", createMatchMedia(false));
    vi.stubGlobal("requestAnimationFrame", undefined);
    vi.stubGlobal("cancelAnimationFrame", undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exposes carousel and slide semantics while preloading decorative images", () => {
    render(<TestSlider />);

    expect(
      screen.getByRole("region", { name: "Test shutter stories" }),
    ).toHaveAttribute("aria-roledescription", "carousel");
    expect(getViewport()).toHaveAttribute("tabindex", "0");

    const slides = getSlots("shutter-slider-slide");
    expect(slides).toHaveLength(TEST_SLIDES.length);
    expect(slides[0]).toHaveAttribute("role", "group");
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides[0]).toHaveAttribute("aria-hidden", "false");
    expect(slides[0]).not.toHaveAttribute("inert");
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
    expect(slides[1]).toHaveAttribute("inert");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 4");

    const baseImages = getSlots<HTMLImageElement>("shutter-slider-base-image");
    expect(baseImages).toHaveLength(TEST_SLIDES.length);
    baseImages.forEach((image) => {
      expect(image).toHaveAttribute("alt", "");
      expect(image).toHaveAttribute("aria-hidden", "true");
      expect(image).toHaveAttribute("loading", "eager");
    });
  });

  it("renders deterministic markup without running browser effects on the server", () => {
    const markup = renderToString(<TestSlider />);

    expect(markup).toContain('data-slot="shutter-slider-root"');
    expect(markup).toContain('data-state="idle"');
    expect(markup).not.toContain("data-reduced-motion");
  });

  it("clamps strip count and alternates strip travel direction", () => {
    const first = render(<TestSlider stripCount={1} />);

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));
    expect(getRoot()).toHaveAttribute("data-strip-count", "2");
    expect(getSlots("shutter-slider-strip")).toHaveLength(2);
    finishTransition();
    first.unmount();

    render(<TestSlider stripCount={99} />);
    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));

    expect(getRoot()).toHaveAttribute("data-strip-count", "16");
    const forwardStrips = getSlots("shutter-slider-strip");
    expect(forwardStrips).toHaveLength(16);
    expect(getSlot("shutter-slider-strips")).toHaveAttribute(
      "data-direction",
      "1",
    );
    expect(forwardStrips[0]).toHaveAttribute("data-direction", "right");
    expect(forwardStrips[1]).toHaveAttribute("data-direction", "left");
    getSlots<HTMLImageElement>("shutter-slider-panel-image").forEach(
      (image) => {
        expect(image).toHaveAttribute("alt", "");
        expect(image).toHaveAttribute("aria-hidden", "true");
      },
    );

    finishTransition();
    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-previous"));
    const reverseStrips = getSlots("shutter-slider-strip");
    expect(getSlot("shutter-slider-strips")).toHaveAttribute(
      "data-direction",
      "-1",
    );
    expect(reverseStrips[0]).toHaveAttribute("data-direction", "left");
    expect(reverseStrips[1]).toHaveAttribute("data-direction", "right");
  });

  it("moves from primed to animating only after two animation frames", () => {
    let nextFrameId = 0;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const frameId = ++nextFrameId;
      frames.set(frameId, callback);
      return frameId;
    });
    const cancelFrame = vi.fn((frameId: number) => frames.delete(frameId));
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    render(<TestSlider />);

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));
    expect(getRoot()).toHaveAttribute("data-state", "primed");
    expect(getSlot("shutter-slider-strips")).not.toHaveAttribute(
      "data-running",
    );
    expect(requestFrame).toHaveBeenCalledTimes(1);

    act(() => {
      const firstFrame = frames.entries().next().value as
        | [number, FrameRequestCallback]
        | undefined;
      expect(firstFrame).toBeDefined();
      frames.delete(firstFrame![0]);
      firstFrame![1](16);
    });
    expect(getRoot()).toHaveAttribute("data-state", "primed");
    expect(requestFrame).toHaveBeenCalledTimes(2);

    act(() => {
      const secondFrame = frames.entries().next().value as
        | [number, FrameRequestCallback]
        | undefined;
      expect(secondFrame).toBeDefined();
      frames.delete(secondFrame![0]);
      secondFrame![1](32);
    });
    expect(getRoot()).toHaveAttribute("data-state", "animating");
    expect(getSlot("shutter-slider-strips")).toHaveAttribute("data-running");
  });

  it("commits once from the terminal transform event with change detail", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));

    const panels = getSlots("shutter-slider-panel");
    const terminalPanel = getTerminalPanel();
    const nonTerminalPanel = panels.find((panel) => panel !== terminalPanel);
    expect(nonTerminalPanel).toBeDefined();
    dispatchTransitionEnd(nonTerminalPanel!);
    dispatchTransitionEnd(terminalPanel, "opacity");
    dispatchTransitionEnd(
      getSlot<HTMLImageElement>("shutter-slider-panel-image"),
    );
    expect(onValueChange).not.toHaveBeenCalled();

    dispatchTransitionEnd(terminalPanel);

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });

    dispatchTransitionEnd(terminalPanel);
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it("uses the timer fallback when animation-frame and CSS events do not finish", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));
    expect(getRoot()).toHaveAttribute("data-state", "primed");

    act(() => vi.advanceTimersByTime(16));
    expect(getRoot()).toHaveAttribute("data-state", "primed");
    act(() => vi.advanceTimersByTime(16));
    expect(getRoot()).toHaveAttribute("data-state", "animating");

    act(() => vi.advanceTimersByTime(147));
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(getRoot()).toHaveAttribute("data-state", "idle");
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it("finishes immediately when duration is zero even with stagger", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        transitionDuration={0}
        stagger={100}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));

    expect(getRoot()).toHaveAttribute("data-state", "idle");
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it("supports previous and next controls", () => {
    const onValueChange = vi.fn();
    render(<TestSlider defaultValue={1} onValueChange={onValueChange} />);

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenLastCalledWith(2, {
      previousValue: 1,
      direction: 1,
      source: "next",
    });

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-previous"));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenLastCalledWith(1, {
      previousValue: 2,
      direction: -1,
      source: "previous",
    });
  });

  it("handles Arrow, Home, and End on the viewport but ignores child input keys", () => {
    const onValueChange = vi.fn();
    render(<TestSlider defaultValue={1} onValueChange={onValueChange} />);
    const viewport = getViewport();

    expect(fireEvent.keyDown(viewport, { key: "ArrowRight" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");

    expect(fireEvent.keyDown(viewport, { key: "ArrowLeft" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");

    expect(fireEvent.keyDown(viewport, { key: "End" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "3");
    expect(onValueChange).toHaveBeenLastCalledWith(3, {
      previousValue: 1,
      direction: 1,
      source: "keyboard",
    });

    expect(fireEvent.keyDown(viewport, { key: "Home" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).toHaveBeenLastCalledWith(0, {
      previousValue: 3,
      direction: -1,
      source: "keyboard",
    });

    const callCount = onValueChange.mock.calls.length;
    expect(
      fireEvent.keyDown(screen.getByRole("textbox", { name: "Slide note" }), {
        key: "ArrowRight",
      }),
    ).toBe(true);
    expect(getRoot()).toHaveAttribute("data-state", "idle");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).toHaveBeenCalledTimes(callCount);
  });

  it("navigates with pagination and updates its active state", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const pagination = getSlot("shutter-slider-pagination");
    const first = pagination.querySelector<HTMLButtonElement>(
      'button[data-index="0"]',
    );
    const fourth = pagination.querySelector<HTMLButtonElement>(
      'button[data-index="3"]',
    );

    expect(first).toHaveAttribute("aria-current", "true");
    expect(first).toBeDisabled();
    expect(fourth).toBeEnabled();
    fireEvent.click(fourth!);
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "3");
    expect(screen.getByRole("status")).toHaveTextContent("4 of 4");
    expect(fourth).toHaveAttribute("aria-current", "true");
    expect(onValueChange).toHaveBeenCalledWith(3, {
      previousValue: 0,
      direction: 1,
      source: "pagination",
    });
  });

  it("keeps the active slide when a controlled consumer does not update value", () => {
    const onValueChange = vi.fn();
    render(<TestSlider value={0} onValueChange={onValueChange} />);

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));
    finishTransition();

    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
    expect(getRoot()).toHaveAttribute("data-state", "idle");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 4");
  });

  it("cancels a pending transition when controlled value changes", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TestSlider value={0} onValueChange={onValueChange} />,
    );

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));
    expect(getRoot()).toHaveAttribute("data-state", "primed");
    rerender(<TestSlider value={2} onValueChange={onValueChange} />);
    act(() => vi.runAllTimers());

    expect(getRoot()).toHaveAttribute("data-state", "idle");
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("cancels a pending transition when loop topology changes", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TestSlider loop onValueChange={onValueChange} />,
    );

    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-previous"));
    expect(getRoot()).toHaveAttribute("data-state", "primed");
    rerender(<TestSlider loop={false} onValueChange={onValueChange} />);
    act(() => vi.runAllTimers());

    expect(getRoot()).toHaveAttribute("data-state", "idle");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("requires the swipe threshold and prevents default on horizontal drag", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const viewport = getViewport();

    fireEvent.pointerDown(viewport, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 180,
      clientY: 100,
    });
    expect(
      fireEvent.pointerMove(viewport, {
        pointerId: 7,
        pointerType: "touch",
        clientX: 150,
        clientY: 102,
      }),
    ).toBe(false);
    expect(getRoot()).toHaveAttribute("data-dragging");
    fireEvent.pointerUp(viewport, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 150,
      clientY: 102,
    });
    expect(getRoot()).not.toHaveAttribute("data-transitioning");
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(viewport, {
      pointerId: 8,
      pointerType: "touch",
      clientX: 180,
      clientY: 100,
    });
    expect(
      fireEvent.pointerMove(viewport, {
        pointerId: 8,
        pointerType: "touch",
        clientX: 90,
        clientY: 103,
      }),
    ).toBe(false);
    fireEvent.pointerUp(viewport, {
      pointerId: 8,
      pointerType: "touch",
      clientX: 90,
      clientY: 103,
    });
    finishTransition();

    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("releases cross-axis gestures without navigating", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const viewport = getViewport();

    fireEvent.pointerDown(viewport, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    expect(
      fireEvent.pointerMove(viewport, {
        pointerId: 9,
        pointerType: "touch",
        clientX: 104,
        clientY: 180,
      }),
    ).toBe(true);
    fireEvent.pointerUp(viewport, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 104,
      clientY: 180,
    });

    expect(getRoot()).not.toHaveAttribute("data-dragging");
    expect(getRoot()).not.toHaveAttribute("data-transitioning");
    expect(getSlot<HTMLButtonElement>("shutter-slider-next")).toBeEnabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("cleans up cancelled and consumer-prevented pointer endings", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        onValueChange={onValueChange}
        viewportProps={{
          onPointerUp: (event) => event.preventDefault(),
        }}
      />,
    );
    const viewport = getViewport();

    fireEvent.pointerDown(viewport, {
      pointerId: 10,
      pointerType: "touch",
      clientX: 180,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 10,
      pointerType: "touch",
      clientX: 80,
      clientY: 100,
    });
    expect(getRoot()).toHaveAttribute("data-dragging");
    fireEvent.pointerCancel(viewport, {
      pointerId: 10,
      pointerType: "touch",
      clientX: 80,
      clientY: 100,
    });
    expect(getRoot()).not.toHaveAttribute("data-dragging");

    fireEvent.pointerDown(viewport, {
      pointerId: 11,
      pointerType: "touch",
      clientX: 180,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 11,
      pointerType: "touch",
      clientX: 80,
      clientY: 100,
    });
    expect(
      fireEvent.pointerUp(viewport, {
        pointerId: 11,
        pointerType: "touch",
        clientX: 80,
        clientY: 100,
      }),
    ).toBe(false);

    expect(getRoot()).not.toHaveAttribute("data-dragging");
    expect(getRoot()).not.toHaveAttribute("data-transitioning");
    expect(getSlot<HTMLButtonElement>("shutter-slider-next")).toBeEnabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("commits immediately when reduced motion is preferred", async () => {
    const requestFrame = vi.fn();
    vi.stubGlobal("matchMedia", createMatchMedia(true));
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    expect(getRoot()).toHaveAttribute("data-reduced-motion");
    fireEvent.click(getSlot<HTMLButtonElement>("shutter-slider-next"));
    await act(async () => {
      await Promise.resolve();
    });

    expect(getRoot()).toHaveAttribute("data-state", "idle");
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
    expect(requestFrame).not.toHaveBeenCalled();
  });
});
