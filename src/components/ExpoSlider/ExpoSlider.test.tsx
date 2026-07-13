import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ExpoSliderContent,
  ExpoSliderFrame,
  ExpoSliderImage,
  ExpoSliderNext,
  ExpoSliderPagination,
  ExpoSliderPrevious,
  ExpoSliderRoot,
  ExpoSliderSlide,
  ExpoSliderStatus,
  ExpoSliderViewport,
} from "./ExpoSlider";

const TEST_SLIDES = ["Aurora", "Dunes", "Lagoon", "Forest"] as const;

interface TestSliderProps {
  slides?: readonly string[];
  value?: number;
  defaultValue?: number;
  loop?: boolean;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  dragThreshold?: number;
  transitionDuration?: number;
  onValueChange?: ComponentProps<typeof ExpoSliderRoot>["onValueChange"];
  rootProps?: Partial<ComponentProps<typeof ExpoSliderRoot>> & {
    "data-consumer"?: string;
  };
  viewportProps?: ComponentProps<typeof ExpoSliderViewport>;
  previousProps?: ComponentProps<typeof ExpoSliderPrevious>;
  nextProps?: ComponentProps<typeof ExpoSliderNext>;
  imageProps?: Omit<ComponentProps<typeof ExpoSliderImage>, "alt" | "src">;
}

function TestSlider({
  slides = TEST_SLIDES.slice(0, 3),
  value,
  defaultValue,
  loop = true,
  orientation = "horizontal",
  disabled = false,
  dragThreshold = 0.16,
  transitionDuration = 80,
  onValueChange,
  rootProps,
  viewportProps,
  previousProps,
  nextProps,
  imageProps,
}: TestSliderProps) {
  return (
    <ExpoSliderRoot
      {...rootProps}
      count={slides.length}
      value={value}
      defaultValue={defaultValue}
      loop={loop}
      orientation={orientation}
      disabled={disabled}
      dragThreshold={dragThreshold}
      transitionDuration={transitionDuration}
      onValueChange={onValueChange}
      aria-label={rootProps?.["aria-label"] ?? "Test expo gallery"}
      data-testid="root"
    >
      <ExpoSliderViewport {...viewportProps} data-testid="viewport">
        {slides.map((slide, index) => (
          <ExpoSliderSlide key={slide} index={index}>
            <ExpoSliderFrame data-testid={`frame-${index}`}>
              <ExpoSliderImage
                {...imageProps}
                src={`/${slide.toLowerCase()}.jpg`}
                alt={`${slide} scene`}
                data-testid={`image-${index}`}
              />
              <ExpoSliderContent data-testid={`content-${index}`}>
                <span>{slide}</span>
              </ExpoSliderContent>
            </ExpoSliderFrame>
          </ExpoSliderSlide>
        ))}
      </ExpoSliderViewport>
      <ExpoSliderPrevious {...previousProps}>Previous</ExpoSliderPrevious>
      <ExpoSliderStatus />
      <ExpoSliderNext {...nextProps}>Next</ExpoSliderNext>
      <ExpoSliderPagination />
    </ExpoSliderRoot>
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

function getSlides() {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="expo-slider-slide"]'),
  );
}

function getActiveSlide() {
  const slide = document.querySelector<HTMLElement>(
    '[data-slot="expo-slider-slide"][data-active]',
  );
  expect(slide).not.toBeNull();
  return slide as HTMLElement;
}

function finishTransition() {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: "transform" });
  fireEvent(getActiveSlide(), event);
}

function mockViewportBounds(viewport: HTMLElement) {
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
}

function installPointerCapture(viewport: HTMLElement) {
  let capturedPointer: number | null = null;
  const setPointerCapture = vi.fn((pointerId: number) => {
    capturedPointer = pointerId;
  });
  const releasePointerCapture = vi.fn((pointerId: number) => {
    if (capturedPointer === pointerId) capturedPointer = null;
  });
  const hasPointerCapture = vi.fn(
    (pointerId: number) => capturedPointer === pointerId,
  );

  Object.defineProperties(viewport, {
    setPointerCapture: { configurable: true, value: setPointerCapture },
    releasePointerCapture: {
      configurable: true,
      value: releasePointerCapture,
    },
    hasPointerCapture: { configurable: true, value: hasPointerCapture },
  });

  return { hasPointerCapture, releasePointerCapture, setPointerCapture };
}

describe("ExpoSlider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", createMatchMedia(false));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (frameId: number) =>
      window.clearTimeout(frameId),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders on the server without browser globals", () => {
    vi.stubGlobal("window", undefined);

    expect(() => renderToString(<TestSlider />)).not.toThrow();
    expect(renderToString(<TestSlider />)).toContain(
      'aria-roledescription="carousel"',
    );
  });

  it("exposes carousel and slide semantics and makes inactive slides inert", () => {
    render(<TestSlider />);

    expect(
      screen.getByRole("region", { name: "Test expo gallery" }),
    ).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByTestId("viewport")).toHaveAttribute("tabindex", "0");

    const slides = getSlides();
    expect(slides).toHaveLength(3);
    expect(slides[0]).toHaveAttribute("role", "group");
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides[0]).toHaveAttribute("aria-label", "Slide 1 of 3");
    expect(slides[0]).toHaveAttribute("aria-hidden", "false");
    expect(slides[0]).not.toHaveAttribute("inert");
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
    expect(slides[1]).toHaveAttribute("inert");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByText("01 / 03")).toHaveAttribute("aria-live", "polite");
  });

  it("normalizes a non-finite count to an empty carousel", () => {
    render(
      <ExpoSliderRoot count={Number.NaN} aria-label="Empty expo gallery">
        <ExpoSliderViewport />
        <ExpoSliderStatus />
        <ExpoSliderPagination />
      </ExpoSliderRoot>,
    );

    expect(screen.getByText("00 / 00")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Go to slide/ }),
    ).not.toBeInTheDocument();
  });

  it("applies the default Expo scale, grayscale, and parallax effects", () => {
    render(
      <TestSlider
        imageProps={{
          className: "brightness-[0.82]",
          style: { filter: "sepia(25%)" },
        }}
      />,
    );

    expect(screen.getByTestId("frame-0")).toHaveStyle({
      transform: "scale(1) rotateY(0deg)",
      transformOrigin: "center center",
    });
    expect(screen.getByTestId("frame-1")).toHaveStyle({
      transform: "scale(1.25) rotateY(0deg)",
      transformOrigin: "left center",
    });
    expect(screen.getByTestId("frame-2")).toHaveStyle({
      transform: "scale(1.25) rotateY(0deg)",
      transformOrigin: "right center",
    });

    const image0 = screen.getByTestId("image-0");
    const image1 = screen.getByTestId("image-1");
    const image2 = screen.getByTestId("image-2");
    const imageEffect0 = image0.parentElement as HTMLElement;
    const imageEffect1 = image1.parentElement as HTMLElement;
    const imageEffect2 = image2.parentElement as HTMLElement;

    expect(imageEffect0).toHaveAttribute(
      "data-slot",
      "expo-slider-image-effect",
    );
    expect(imageEffect0).toHaveStyle({
      filter: "grayscale(0%)",
      transform: "translate3d(0%, 0, 0) scale(1)",
    });
    expect(imageEffect1).toHaveStyle({
      filter: "grayscale(100%)",
      transform: "translate3d(-12.5%, 0, 0) scale(1.125)",
    });
    expect(imageEffect2).toHaveStyle({
      filter: "grayscale(100%)",
      transform: "translate3d(12.5%, 0, 0) scale(1.125)",
    });
    expect(image1).toHaveClass("brightness-[0.82]");
    expect(image1).toHaveStyle({ filter: "sepia(25%)" });
    expect(screen.getByTestId("content-1")).toHaveStyle({
      opacity: "0",
      transform: "translate3d(-100%, 0, 0)",
    });
  });

  it("navigates with next, previous, and pagination controls", () => {
    const onValueChange = vi.fn();
    render(<TestSlider onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");
    expect(onValueChange).not.toHaveBeenCalled();
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenLastCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).toHaveBeenLastCalledWith(0, {
      previousValue: 1,
      direction: -1,
      source: "previous",
    });

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 2 of 3" }));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(screen.getByText("02 / 03")).toBeInTheDocument();
    expect(onValueChange).toHaveBeenLastCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "pagination",
    });
  });

  it("commits navigation immediately when reduced motion is preferred", async () => {
    vi.stubGlobal("matchMedia", createMatchMedia(true));
    render(<TestSlider transitionDuration={650} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await act(async () => {});

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-animating");
  });

  it("supports horizontal Arrow, Home, and End keyboard navigation", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        defaultValue={1}
        onValueChange={onValueChange}
      />,
    );
    const viewport = screen.getByTestId("viewport");

    expect(fireEvent.keyDown(viewport, { key: "ArrowRight" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");

    expect(fireEvent.keyDown(viewport, { key: "ArrowLeft" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");

    expect(fireEvent.keyDown(viewport, { key: "End" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "3");

    expect(fireEvent.keyDown(viewport, { key: "Home" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).toHaveBeenLastCalledWith(0, {
      previousValue: 3,
      direction: -1,
      source: "keyboard",
    });
  });

  it("uses vertical Arrow keys plus Home and End in vertical orientation", () => {
    render(
      <TestSlider
        slides={TEST_SLIDES}
        orientation="vertical"
        loop={false}
        defaultValue={1}
      />,
    );
    const viewport = screen.getByTestId("viewport");

    expect(fireEvent.keyDown(viewport, { key: "ArrowRight" })).toBe(true);
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");

    expect(fireEvent.keyDown(viewport, { key: "ArrowDown" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");

    expect(fireEvent.keyDown(viewport, { key: "ArrowUp" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");

    expect(fireEvent.keyDown(viewport, { key: "End" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "3");

    expect(fireEvent.keyDown(viewport, { key: "Home" })).toBe(false);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
  });

  it("keeps controlled rendering stable until the consumer updates value", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <TestSlider value={0} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    finishTransition();

    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByText("01 / 03")).toBeInTheDocument();

    rerender(<TestSlider value={1} onValueChange={onValueChange} />);
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(screen.getByText("02 / 03")).toBeInTheDocument();
  });

  it("wraps when looping and disables controls at bounded edges", () => {
    const looping = render(<TestSlider />);

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    looping.unmount();

    const firstEdge = render(<TestSlider loop={false} defaultValue={0} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    firstEdge.unmount();

    render(<TestSlider loop={false} defaultValue={2} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("commits a primary-axis drag and manages pointer capture", () => {
    const onValueChange = vi.fn();
    render(<TestSlider dragThreshold={0.2} onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    const capture = installPointerCapture(viewport);

    fireEvent.pointerDown(viewport, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 300,
      clientY: 100,
    });
    expect(capture.setPointerCapture).toHaveBeenCalledOnce();
    expect(capture.setPointerCapture).toHaveBeenCalledWith(7);
    expect(
      fireEvent.pointerMove(viewport, {
        pointerId: 7,
        pointerType: "touch",
        clientX: 180,
        clientY: 103,
      }),
    ).toBe(false);
    act(() => vi.advanceTimersByTime(1));

    expect(screen.getByTestId("root")).toHaveAttribute("data-dragging");
    expect(capture.setPointerCapture).toHaveBeenCalledOnce();

    fireEvent.pointerUp(viewport, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 180,
      clientY: 103,
    });
    expect(capture.hasPointerCapture).toHaveBeenCalledWith(7);
    expect(capture.releasePointerCapture).toHaveBeenCalledWith(7);
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("releases a captured pointer when movement resolves to the cross axis", () => {
    render(<TestSlider />);
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    const capture = installPointerCapture(viewport);

    fireEvent.pointerDown(viewport, {
      pointerId: 12,
      pointerType: "touch",
      clientX: 200,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 12,
      pointerType: "touch",
      clientX: 203,
      clientY: 145,
    });

    expect(capture.releasePointerCapture).toHaveBeenCalledWith(12);
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-dragging");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
  });

  it("clears an uncaptured pointer session when the pointer leaves", () => {
    render(<TestSlider />);
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    const setPointerCapture = vi.fn(() => {
      throw new Error("Pointer capture unavailable");
    });
    Object.defineProperty(viewport, "setPointerCapture", {
      configurable: true,
      value: setPointerCapture,
    });

    fireEvent.pointerDown(viewport, {
      pointerId: 13,
      pointerType: "touch",
      clientX: 200,
      clientY: 100,
    });
    fireEvent.pointerLeave(viewport, {
      pointerId: 13,
      pointerType: "touch",
      clientX: 205,
      clientY: 100,
    });

    expect(setPointerCapture).toHaveBeenCalledWith(13);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
  });

  it("snaps back after pointer cancel and lost pointer capture", () => {
    const onValueChange = vi.fn();
    const onLostPointerCapture = vi.fn((event) => event.preventDefault());
    render(
      <TestSlider
        onValueChange={onValueChange}
        viewportProps={{ onLostPointerCapture }}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    const capture = installPointerCapture(viewport);

    fireEvent.pointerDown(viewport, {
      pointerId: 8,
      pointerType: "touch",
      clientX: 280,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 8,
      pointerType: "touch",
      clientX: 230,
      clientY: 100,
    });
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("root")).toHaveAttribute("data-dragging");

    fireEvent.pointerCancel(viewport, {
      pointerId: 8,
      pointerType: "touch",
      clientX: 230,
      clientY: 100,
    });
    expect(capture.releasePointerCapture).toHaveBeenCalledWith(8);
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");
    finishTransition();
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-animating");

    fireEvent.pointerDown(viewport, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 280,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 220,
      clientY: 100,
    });
    act(() => vi.advanceTimersByTime(1));
    fireEvent.lostPointerCapture(viewport, { pointerId: 9 });

    expect(onLostPointerCapture).toHaveBeenCalledOnce();
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");
    finishTransition();
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-dragging");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("blocks controls, keyboard, pagination, and pointer input when disabled", () => {
    const onValueChange = vi.fn();
    render(<TestSlider disabled onValueChange={onValueChange} />);
    const viewport = screen.getByTestId("viewport");

    expect(screen.getByTestId("root")).toHaveAttribute("data-disabled");
    expect(screen.getByTestId("root")).toHaveAttribute("aria-disabled", "true");
    expect(viewport).toHaveAttribute("aria-disabled", "true");
    expect(viewport).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Go to slide 2 of 3" }),
    ).toBeDisabled();

    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    fireEvent.pointerDown(viewport, {
      pointerId: 10,
      pointerType: "touch",
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 10,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerUp(viewport, {
      pointerId: 10,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    act(() => vi.runAllTimers());

    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-dragging");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("merges custom HTML props and honors consumer-prevented handlers", () => {
    const onValueChange = vi.fn();
    const onKeyDown = vi.fn((event) => event.preventDefault());
    const onPointerDown = vi.fn((event) => event.preventDefault());
    const onNextClick = vi.fn((event) => event.preventDefault());
    render(
      <TestSlider
        onValueChange={onValueChange}
        rootProps={{
          id: "consumer-slider",
          title: "Custom expo slider",
          className: "consumer-root w-1/2",
          "data-consumer": "expo",
        }}
        viewportProps={{
          "aria-label": "Custom navigation",
          className: "consumer-viewport",
          tabIndex: -1,
          onKeyDown,
          onPointerDown,
        }}
        nextProps={{
          "aria-label": "Consumer next",
          className: "consumer-next",
          onClick: onNextClick,
        }}
      />,
    );
    const root = screen.getByTestId("root");
    const viewport = screen.getByTestId("viewport");

    expect(root).toHaveAttribute("id", "consumer-slider");
    expect(root).toHaveAttribute("title", "Custom expo slider");
    expect(root).toHaveAttribute("data-consumer", "expo");
    expect(root).toHaveClass("consumer-root", "w-1/2");
    expect(root).not.toHaveClass("w-full");
    expect(viewport).toHaveAttribute("aria-label", "Custom navigation");
    expect(viewport).toHaveAttribute("tabindex", "-1");
    expect(viewport).toHaveClass("consumer-viewport");

    expect(fireEvent.keyDown(viewport, { key: "ArrowRight" })).toBe(false);
    expect(
      fireEvent.pointerDown(viewport, {
        pointerId: 11,
        pointerType: "touch",
        clientX: 300,
        clientY: 100,
      }),
    ).toBe(false);
    fireEvent.pointerMove(viewport, {
      pointerId: 11,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerUp(viewport, {
      pointerId: 11,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    expect(
      fireEvent.click(screen.getByRole("button", { name: "Consumer next" })),
    ).toBe(false);

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onPointerDown).toHaveBeenCalledOnce();
    expect(onNextClick).toHaveBeenCalledOnce();
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
