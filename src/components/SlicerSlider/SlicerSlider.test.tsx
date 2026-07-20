import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SlicerSliderNext,
  SlicerSliderPagination,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderStatus,
  SlicerSliderViewport,
} from "./SlicerSlider";
import {
  getSlicerSliderTarget,
  normalizeSlicerSliderValue,
  useSlicerSlider,
} from "./useSlicerSlider";
import * as clientEntry from "./client";

const TEST_SLIDES = [
  { src: "/one.svg", alt: "First abstract scene" },
  { src: "/two.svg", alt: "Second abstract scene" },
  { src: "/three.svg", alt: "Third abstract scene" },
] as const;

interface TestSliderProps {
  value?: number;
  defaultValue?: number;
  loop?: boolean;
  disabled?: boolean;
  onValueChange?: ComponentProps<typeof SlicerSliderRoot>["onValueChange"];
}

function TestSlider({
  value,
  defaultValue,
  loop = true,
  disabled = false,
  onValueChange,
}: TestSliderProps) {
  return (
    <SlicerSliderRoot
      slides={TEST_SLIDES}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      loop={loop}
      sliceCount={5}
      sliceDuration={40}
      staggerDelay={10}
      dragThreshold={40}
      disabled={disabled}
      aria-label="Test stories"
      data-testid="root"
    >
      <SlicerSliderViewport data-testid="viewport">
        {TEST_SLIDES.map((slide, index) => (
          <SlicerSliderSlide key={slide.src} index={index}>
            {slide.alt} panel
          </SlicerSliderSlide>
        ))}
      </SlicerSliderViewport>
      <SlicerSliderPrevious>Previous</SlicerSliderPrevious>
      <SlicerSliderNext>Next</SlicerSliderNext>
      <SlicerSliderPagination />
      <SlicerSliderStatus />
    </SlicerSliderRoot>
  );
}

function getSlides() {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="slicer-slider-slide"]'),
  );
}

function getActiveSlide() {
  return document.querySelector(
    '[data-slot="slicer-slider-slide"][data-active]',
  ) as HTMLElement;
}

function getSliceLayers() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="slicer-slider-slices"]',
    ),
  );
}

function getSlices(root: ParentNode = document) {
  return Array.from(
    root.querySelectorAll<HTMLElement>('[data-slot="slicer-slider-slice"]'),
  );
}

function getTransitionDelay(slice: HTMLElement) {
  return Number.parseFloat(slice.style.transitionDelay) || 0;
}

function dispatchTransformTransitionEnd(slice: HTMLElement) {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: "transform" });
  fireEvent(slice, event);
}

function finishLatestSliceTransition() {
  const slices = getSlices();
  expect(slices.length).toBeGreaterThan(0);
  const latestSlice = slices.reduce((latest, slice) =>
    getTransitionDelay(slice) > getTransitionDelay(latest) ? slice : latest,
  );
  dispatchTransformTransitionEnd(latestSlice);
}

function finishSliceLayerTransition(layer: HTMLElement) {
  const slices = getSlices(layer);
  expect(slices.length).toBeGreaterThan(0);
  const latestSlice = slices.reduce((latest, slice) =>
    getTransitionDelay(slice) > getTransitionDelay(latest) ? slice : latest,
  );
  dispatchTransformTransitionEnd(latestSlice);
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

describe("slicer slider utilities", () => {
  it("normalizes looping and bounded values", () => {
    expect(normalizeSlicerSliderValue(-1, 3, true)).toBe(2);
    expect(normalizeSlicerSliderValue(4, 3, true)).toBe(1);
    expect(normalizeSlicerSliderValue(9, 3, false)).toBe(2);
    expect(normalizeSlicerSliderValue(Number.NaN, 3, true)).toBe(0);
    expect(normalizeSlicerSliderValue(2, 0, true)).toBe(0);
  });

  it("finds the next target with and without looping", () => {
    expect(getSlicerSliderTarget(2, 1, 3, true)).toBe(0);
    expect(getSlicerSliderTarget(2, 1, 3, false)).toBe(2);
    expect(getSlicerSliderTarget(0, -1, 3, true)).toBe(2);
  });
});

describe("SlicerSlider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", createMatchMedia(false));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exposes carousel and slide semantics and keeps inactive slides inert", () => {
    render(<TestSlider />);

    expect(
      screen.getByRole("region", { name: "Test stories" }),
    ).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByTestId("viewport")).toHaveAttribute("tabindex", "0");

    const slides = getSlides();
    expect(slides).toHaveLength(TEST_SLIDES.length);
    expect(slides[0]).toHaveAttribute("role", "group");
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides[0]).toHaveAttribute("aria-hidden", "false");
    expect(slides[0]).not.toHaveAttribute("inert");
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
    expect(slides[1]).toHaveAttribute("inert");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");
  });

  it("provides a Next.js client entry and renders without browser globals", () => {
    expect(clientEntry.SlicerSliderRoot).toBe(SlicerSliderRoot);

    vi.stubGlobal("window", undefined);
    expect(() => renderToString(<TestSlider />)).not.toThrow();
    vi.unstubAllGlobals();
    vi.stubGlobal("matchMedia", createMatchMedia(false));
  });

  it("renders the configured decorative slices and commits after the latest slice", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    const next = screen.getByRole("button", { name: "Next slide" });
    fireEvent.click(next);

    const slices = getSlices();
    expect(slices).toHaveLength(5);
    slices.forEach((slice) => {
      expect(slice).toHaveAttribute("aria-hidden", "true");
    });
    expect(next).toBeEnabled();
    expect(getActiveSlide()).toHaveAttribute("data-state", "outgoing");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");
    expect(onValueChange).not.toHaveBeenCalled();

    const orderedSlices = [...slices].sort(
      (left, right) => getTransitionDelay(left) - getTransitionDelay(right),
    );
    dispatchTransformTransitionEnd(orderedSlices[0]);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");

    dispatchTransformTransitionEnd(orderedSlices[orderedSlices.length - 1]);

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
  });

  it("starts an independent overlapping wave for every rapid next input", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    const next = screen.getByRole("button", { name: "Next slide" });
    fireEvent.click(next);
    fireEvent.click(next);

    const [firstWave, secondWave] = getSliceLayers();
    expect(getSliceLayers()).toHaveLength(2);
    expect(firstWave).toHaveAttribute("data-transition-id");
    expect(secondWave).toHaveAttribute("data-transition-id");
    expect(firstWave.dataset.transitionId).not.toBe(
      secondWave.dataset.transitionId,
    );
    expect(Number(firstWave.style.zIndex)).toBeGreaterThan(
      Number(secondWave.style.zIndex),
    );
    const firstWaveSlice = getSlices(firstWave)[0];
    const secondWaveSlice = getSlices(secondWave)[0];
    expect(firstWaveSlice.style.opacity).toBe("1");
    expect(secondWaveSlice.style.opacity).toBe("1");
    act(() => vi.advanceTimersByTime(50));
    expect(firstWaveSlice.style.opacity).toBe("0");
    expect(secondWaveSlice.style.opacity).toBe("1");
    expect(getSlices(firstWave)).toHaveLength(5);
    expect(getSlices(secondWave)).toHaveLength(5);
    expect(firstWave.querySelector("img")).toHaveAttribute("src", "/one.svg");
    expect(secondWave.querySelector("img")).toHaveAttribute("src", "/two.svg");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");
    expect(onValueChange).not.toHaveBeenCalled();

    finishSliceLayerTransition(firstWave);

    expect(getSliceLayers()).toEqual([secondWave]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });

    finishSliceLayerTransition(secondWave);

    expect(getSliceLayers()).toHaveLength(0);
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenLastCalledWith(2, {
      previousValue: 1,
      direction: 1,
      source: "next",
    });
  });

  it("starts a reversing wave immediately for rapid opposite input", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));

    const [forwardWave, reverseWave] = getSliceLayers();
    expect(getSliceLayers()).toHaveLength(2);
    expect(forwardWave).toHaveAttribute("data-direction", "next");
    expect(reverseWave).toHaveAttribute("data-direction", "previous");
    expect(forwardWave.querySelector("img")).toHaveAttribute("src", "/one.svg");
    expect(reverseWave.querySelector("img")).toHaveAttribute("src", "/two.svg");

    finishSliceLayerTransition(forwardWave);
    expect(getSliceLayers()).toEqual([reverseWave]);
    finishSliceLayerTransition(reverseWave);

    expect(getSlices()).toHaveLength(0);
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange.mock.calls.map(([nextValue]) => nextValue)).toEqual([
      1, 0,
    ]);
    expect(onValueChange).toHaveBeenLastCalledWith(0, {
      previousValue: 1,
      direction: -1,
      source: "previous",
    });
  });

  it("derives bounded control availability from the latest planned target", () => {
    render(<TestSlider loop={false} />);

    const previous = screen.getByRole("button", { name: "Previous slide" });
    const next = screen.getByRole("button", { name: "Next slide" });
    fireEvent.click(next);

    expect(previous).toBeEnabled();
    expect(next).toBeEnabled();
    fireEvent.click(next);

    expect(previous).toBeEnabled();
    expect(next).toBeDisabled();
  });

  it("starts an absolute pagination wave from the latest planned target", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    const thirdPaginationItem = screen.getByRole("button", {
      name: "Go to slide 3: Third abstract scene",
    });
    expect(thirdPaginationItem).toBeEnabled();
    fireEvent.click(thirdPaginationItem);

    const [nextWave, paginationWave] = getSliceLayers();
    expect(getSliceLayers()).toHaveLength(2);
    expect(nextWave.querySelector("img")).toHaveAttribute("src", "/one.svg");
    expect(paginationWave.querySelector("img")).toHaveAttribute(
      "src",
      "/two.svg",
    );

    finishSliceLayerTransition(nextWave);
    expect(getSliceLayers()).toEqual([paginationWave]);
    finishSliceLayerTransition(paginationWave);

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenLastCalledWith(2, {
      previousValue: 1,
      direction: 1,
      source: "pagination",
    });
  });

  it.each([
    [
      "keyboard",
      (viewport: HTMLElement) =>
        fireEvent.keyDown(viewport, { key: "ArrowRight" }),
    ],
    [
      "pointer",
      (viewport: HTMLElement) => {
        fireEvent.pointerDown(viewport, {
          pointerId: 11,
          pointerType: "touch",
          clientX: 180,
          clientY: 120,
        });
        fireEvent.pointerMove(viewport, {
          pointerId: 11,
          pointerType: "touch",
          clientX: 90,
          clientY: 122,
        });
        fireEvent.pointerUp(viewport, {
          pointerId: 11,
          pointerType: "touch",
          clientX: 90,
          clientY: 122,
        });
      },
    ],
  ] as const)(
    "starts an overlapping wave for %s input while another wave is active",
    (source, startWave) => {
      const onValueChange = vi.fn();
      render(<TestSlider onValueChange={onValueChange} />);
      const viewport = screen.getByTestId("viewport");

      fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
      startWave(viewport);

      const [firstWave, sourceWave] = getSliceLayers();
      expect(getSliceLayers()).toHaveLength(2);
      expect(firstWave.querySelector("img")).toHaveAttribute("src", "/one.svg");
      expect(sourceWave.querySelector("img")).toHaveAttribute(
        "src",
        "/two.svg",
      );

      finishSliceLayerTransition(firstWave);
      expect(getSliceLayers()).toEqual([sourceWave]);
      finishSliceLayerTransition(sourceWave);
      expect(onValueChange).toHaveBeenLastCalledWith(2, {
        previousValue: 1,
        direction: 1,
        source,
      });
    },
  );

  it("drains out-of-order wave completions in sequence and ignores stale IDs", () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSlicerSlider({ count: 3, onValueChange }),
    );

    act(() => {
      result.current.navigate(1, "next");
      result.current.navigate(1, "next");
    });
    const [firstTransition, secondTransition] = result.current.transitions;
    expect(result.current.transitions).toHaveLength(2);
    expect(firstTransition).toMatchObject({ from: 0, to: 1 });
    expect(secondTransition).toMatchObject({ from: 1, to: 2 });
    expect(result.current.transition).toEqual(firstTransition);

    let secondCompletion = false;
    act(() => {
      secondCompletion = result.current.completeTransition(secondTransition.id);
    });
    expect(secondCompletion).toBe(true);
    expect(result.current.currentValue).toBe(0);
    expect(result.current.transition).toEqual(firstTransition);
    expect(onValueChange).not.toHaveBeenCalled();

    let firstCompletion = false;
    act(() => {
      firstCompletion = result.current.completeTransition(firstTransition.id);
    });
    expect(firstCompletion).toBe(true);
    expect(result.current.transitions).toHaveLength(0);
    expect(result.current.transition).toBeNull();
    expect(result.current.currentValue).toBe(2);
    expect(onValueChange.mock.calls.map(([nextValue]) => nextValue)).toEqual([
      1, 2,
    ]);

    let staleCompletion = true;
    act(() => {
      staleCompletion = result.current.completeTransition(firstTransition.id);
    });

    expect(staleCompletion).toBe(false);
    expect(result.current.transitions).toHaveLength(0);
    expect(result.current.currentValue).toBe(2);
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("caps visible waves and fast-forwards the oldest transition in order", () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSlicerSlider({ count: 12, loop: false, onValueChange }),
    );

    act(() => {
      for (let input = 0; input < 9; input += 1) {
        result.current.navigate(1, "next");
      }
    });

    expect(result.current.transitions).toHaveLength(8);
    expect(
      result.current.transitions.map(({ from, to }) => [from, to]),
    ).toEqual([
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
    ]);
    expect(result.current.currentValue).toBe(1);
    expect(result.current.plannedValue).toBe(9);
    expect(onValueChange.mock.calls.map(([nextValue]) => nextValue)).toEqual([
      1,
    ]);

    act(() => {
      result.current.completeTransition(result.current.transitions[0].id);
    });

    expect(result.current.currentValue).toBe(2);
    expect(onValueChange.mock.calls.map(([nextValue]) => nextValue)).toEqual([
      1, 2,
    ]);
  });

  it("flushes active waves in input order when reduced motion turns on", () => {
    const onValueChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ reducedMotion }: { reducedMotion: boolean }) =>
        useSlicerSlider({ count: 3, onValueChange, reducedMotion }),
      { initialProps: { reducedMotion: false } },
    );

    act(() => {
      result.current.navigate(1, "next");
      result.current.navigate(1, "next");
    });

    expect(result.current.transitions).toHaveLength(2);
    expect(result.current.currentValue).toBe(0);
    expect(onValueChange).not.toHaveBeenCalled();

    rerender({ reducedMotion: true });

    expect(result.current.transitions).toHaveLength(0);
    expect(result.current.transition).toBeNull();
    expect(result.current.currentValue).toBe(2);
    expect(result.current.plannedValue).toBe(2);
    expect(onValueChange.mock.calls.map(([nextValue]) => nextValue)).toEqual([
      1, 2,
    ]);
  });

  it("starts controlled waves immediately but waits for approved rendered values", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TestSlider value={0} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    const [firstWave, secondWave] = getSliceLayers();
    expect(getSliceLayers()).toHaveLength(2);
    expect(secondWave.querySelector("img")).toHaveAttribute("src", "/two.svg");

    finishSliceLayerTransition(firstWave);

    expect(getSliceLayers()).toEqual([secondWave]);
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).toHaveBeenCalledTimes(1);

    rerender(<TestSlider value={1} onValueChange={onValueChange} />);

    expect(getSliceLayers()).toEqual([secondWave]);
    finishSliceLayerTransition(secondWave);
    expect(onValueChange).toHaveBeenLastCalledWith(2, {
      previousValue: 1,
      direction: 1,
      source: "next",
    });
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");

    rerender(<TestSlider value={2} onValueChange={onValueChange} />);
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
  });

  it("returns an unapproved controlled plan to the authoritative value", () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useSlicerSlider({ count: 3, value: 0, onValueChange }),
    );

    act(() => {
      result.current.navigate(1, "next");
    });
    const firstTransition = result.current.transitions[0];

    act(() => {
      result.current.completeTransition(firstTransition.id);
    });

    expect(result.current.currentValue).toBe(0);
    expect(result.current.plannedValue).toBe(0);
    expect(onValueChange).toHaveBeenLastCalledWith(1, expect.any(Object));

    act(() => {
      result.current.navigate(1, "next");
    });
    expect(result.current.transitions[0]).toMatchObject({ from: 0, to: 1 });
  });

  it("wraps when looping and disables bounded controls at either edge", () => {
    const { unmount } = render(<TestSlider />);

    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    finishLatestSliceTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");

    unmount();
    const bounded = render(<TestSlider loop={false} defaultValue={0} />);
    expect(
      screen.getByRole("button", { name: "Previous slide" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeEnabled();

    bounded.unmount();
    render(<TestSlider loop={false} defaultValue={2} />);
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
  });

  it("supports keyboard navigation and pagination", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");

    expect(fireEvent.keyDown(viewport, { key: "ArrowRight" })).toBe(false);
    finishLatestSliceTransition();
    expect(onValueChange).toHaveBeenLastCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "keyboard",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Go to slide 3: Third abstract scene",
      }),
    );
    finishLatestSliceTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");

    fireEvent.keyDown(viewport, { key: "Home" });
    finishLatestSliceTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
  });

  it("commits a horizontal pointer swipe past the configured threshold", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");

    fireEvent.pointerDown(viewport, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 180,
      clientY: 120,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 90,
      clientY: 123,
    });
    fireEvent.pointerUp(viewport, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 90,
      clientY: 123,
    });
    finishLatestSliceTransition();

    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("waits for a controlled consumer to update the rendered value", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TestSlider value={0} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    finishLatestSliceTransition();

    expect(onValueChange).toHaveBeenCalledWith(1, expect.any(Object));
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");

    rerender(<TestSlider value={1} onValueChange={onValueChange} />);
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3");
  });

  it("changes immediately without waiting for slice events in reduced motion", async () => {
    vi.stubGlobal("matchMedia", createMatchMedia(true));
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3");
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
  });

  it("blocks controls and viewport input when disabled", () => {
    const onValueChange = vi.fn();
    render(<TestSlider disabled onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");

    expect(screen.getByTestId("root")).toHaveAttribute("data-disabled");
    expect(
      screen.getByRole("button", { name: "Previous slide" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();

    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    fireEvent.pointerDown(viewport, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 180,
      clientY: 100,
    });
    fireEvent.pointerUp(viewport, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 80,
      clientY: 100,
    });
    act(() => vi.runAllTimers());

    expect(onValueChange).not.toHaveBeenCalled();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
  });
});
