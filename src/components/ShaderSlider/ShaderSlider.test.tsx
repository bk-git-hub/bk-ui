/* eslint-disable no-unused-vars -- Base ESLint treats TypeScript callback parameter names as runtime bindings. */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ShaderSliderNext,
  ShaderSliderPagination,
  ShaderSliderPrevious,
  ShaderSliderRoot,
  ShaderSliderSlide,
  ShaderSliderStatus,
  ShaderSliderViewport,
} from "./ShaderSlider";
import {
  getShaderSliderTarget,
  normalizeShaderSliderValue,
  type ShaderSliderValueChangeDetail,
} from "./useShaderSlider";

const TEST_SLIDES = [
  { src: "/one.svg", alt: "First abstract scene" },
  { src: "/two.svg", alt: "Second abstract scene" },
  { src: "/three.svg", alt: "Third abstract scene" },
] as const;

interface TestSliderProps {
  value?: number;
  defaultValue?: number;
  loop?: boolean;
  onValueChange?: (
    value: number,
    detail: ShaderSliderValueChangeDetail,
  ) => void;
  preventNext?: boolean;
}

function TestSlider({
  value,
  defaultValue,
  loop = true,
  onValueChange,
  preventNext = false,
}: TestSliderProps) {
  return (
    <ShaderSliderRoot
      slides={TEST_SLIDES}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      loop={loop}
      transitionDuration={40}
      aria-label="Test stories"
      data-testid="root"
    >
      <ShaderSliderViewport data-testid="viewport">
        {TEST_SLIDES.map((slide, index) => (
          <ShaderSliderSlide key={slide.src} index={index}>
            {slide.alt}
          </ShaderSliderSlide>
        ))}
      </ShaderSliderViewport>
      <ShaderSliderPrevious>Previous</ShaderSliderPrevious>
      <ShaderSliderNext
        onClick={
          preventNext
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
      >
        Next
      </ShaderSliderNext>
      <ShaderSliderPagination />
      <ShaderSliderStatus />
    </ShaderSliderRoot>
  );
}

function getActiveSlide() {
  return document.querySelector(
    '[data-slot="shader-slider-slide"][data-active]',
  ) as HTMLElement;
}

function finishFallbackTransition() {
  act(() => vi.runAllTimers());
}

describe("shader slider utilities", () => {
  it("normalizes looping and bounded values", () => {
    expect(normalizeShaderSliderValue(-1, 3, true)).toBe(2);
    expect(normalizeShaderSliderValue(4, 3, true)).toBe(1);
    expect(normalizeShaderSliderValue(9, 3, false)).toBe(2);
    expect(normalizeShaderSliderValue(Number.NaN, 3, true)).toBe(0);
    expect(normalizeShaderSliderValue(2, 0, true)).toBe(0);
  });

  it("finds the next target with and without looping", () => {
    expect(getShaderSliderTarget(2, 1, 3, true)).toBe(0);
    expect(getShaderSliderTarget(2, 1, 3, false)).toBe(2);
    expect(getShaderSliderTarget(0, -1, 3, true)).toBe(2);
  });
});

describe("ShaderSlider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => null,
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exposes carousel semantics and keeps inactive slides inert", () => {
    render(<TestSlider />);

    const root = screen.getByRole("region", { name: "Test stories" });
    expect(root).toHaveAttribute("aria-roledescription", "carousel");
    expect(root).toHaveAttribute("data-renderer", "fallback");
    expect(screen.getByTestId("viewport")).toHaveAttribute("tabindex", "0");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByRole("status")).toHaveTextContent("1 of 3");
    expect(
      screen.getByRole("img", { name: "First abstract scene" }),
    ).toBeInTheDocument();

    const slides = document.querySelectorAll(
      '[data-slot="shader-slider-slide"]',
    );
    expect(slides[0]).toHaveAttribute("aria-hidden", "false");
    expect(slides[0]).not.toHaveAttribute("inert");
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
    expect(slides[1]).toHaveAttribute("inert");
    expect(
      document.querySelector('[data-slot="shader-slider-canvas"]'),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("moves one slide and reports the input source after the transition", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
    expect(getActiveSlide()).toHaveAttribute("data-state", "outgoing");
    expect(onValueChange).not.toHaveBeenCalled();

    finishFallbackTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3");
    expect(
      screen.getByRole("img", { name: "Second abstract scene" }),
    ).toBeInTheDocument();
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
  });

  it("wraps with loop and disables controls at bounded edges", () => {
    const { unmount } = render(<TestSlider />);
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    finishFallbackTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");

    unmount();
    render(<TestSlider loop={false} defaultValue={0} />);
    expect(
      screen.getByRole("button", { name: "Previous slide" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeEnabled();
  });

  it("supports viewport keyboard navigation and pagination", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");

    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    finishFallbackTransition();
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
    finishFallbackTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");

    fireEvent.keyDown(viewport, { key: "Home" });
    finishFallbackTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
  });

  it("commits a horizontal pointer gesture past the threshold", () => {
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
    finishFallbackTransition();

    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("releases a cancelled pointer gesture without changing slides", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");

    fireEvent.pointerDown(viewport, {
      pointerId: 8,
      pointerType: "touch",
      clientX: 180,
      clientY: 120,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 8,
      pointerType: "touch",
      clientX: 80,
      clientY: 122,
    });
    fireEvent.pointerCancel(viewport, {
      pointerId: 8,
      pointerType: "touch",
      clientX: 80,
      clientY: 122,
    });
    finishFallbackTransition();

    expect(onValueChange).not.toHaveBeenCalled();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
  });

  it("waits for controlled consumers and respects prevented events", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TestSlider value={0} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    finishFallbackTransition();
    expect(onValueChange).toHaveBeenCalledWith(1, expect.any(Object));
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");

    rerender(<TestSlider value={1} onValueChange={onValueChange} />);
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");

    rerender(<TestSlider value={1} preventNext />);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    finishFallbackTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
  });
});
