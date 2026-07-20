import { useState, type ComponentProps } from "react";
import { flushSync } from "react-dom";
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
import { getExpoSliderRelativeProgress } from "./useExpoSlider";

const TEST_SLIDES = ["Aurora", "Dunes", "Lagoon", "Forest"] as const;
const TEST_TRANSITION_DURATION = 80;
const TEST_FRAME_DURATION = 16;

interface TestSliderProps {
  slides?: readonly string[];
  value?: number;
  defaultValue?: number;
  loop?: boolean;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  dragThreshold?: number;
  velocityThreshold?: number;
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
  velocityThreshold,
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
      velocityThreshold={velocityThreshold}
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

function ControlledTestSlider({
  onValueChange,
  ...props
}: Omit<TestSliderProps, "defaultValue" | "value">) {
  const [value, setValue] = useState(0);

  return (
    <TestSlider
      {...props}
      value={value}
      onValueChange={(nextValue, detail) => {
        setValue(nextValue);
        onValueChange?.(nextValue, detail);
      }}
    />
  );
}

function DisableAfterChangeTestSlider() {
  const [disabled, setDisabled] = useState(false);

  return (
    <TestSlider
      disabled={disabled}
      dragThreshold={0.2}
      onValueChange={() => flushSync(() => setDisabled(true))}
    />
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

function getSlideProgress(index: number) {
  return Number(getSlides()[index]?.getAttribute("data-progress"));
}

function dispatchTransformTransitionEnd() {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: "transform" });
  fireEvent(getActiveSlide(), event);
}

function finishTransition() {
  act(() => vi.advanceTimersByTime(TEST_TRANSITION_DURATION));
  dispatchTransformTransitionEnd();
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

function startHorizontalDrag(
  viewport: HTMLElement,
  pointerId: number,
  startX = 300,
  endX = 180,
  pointerType: "mouse" | "touch" = "touch",
) {
  fireEvent.pointerDown(viewport, {
    pointerId,
    pointerType,
    button: 0,
    clientX: startX,
    clientY: 100,
  });
  fireEvent.pointerMove(viewport, {
    pointerId,
    pointerType,
    clientX: endX,
    clientY: 100,
  });
  act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
}

function endHorizontalDrag(
  viewport: HTMLElement,
  pointerId: number,
  clientX = 180,
  pointerType: "mouse" | "touch" = "touch",
) {
  fireEvent.pointerUp(viewport, {
    pointerId,
    pointerType,
    clientX,
    clientY: 100,
  });
}

describe("ExpoSlider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", createMatchMedia(false));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), TEST_FRAME_DURATION),
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

  it("keeps loop geometry on the trailing side at exact wrap ties", () => {
    expect(getExpoSliderRelativeProgress(3, 0, 4, true, 3, 1)).toBe(0);
    expect(getExpoSliderRelativeProgress(0, 0, 4, true, 3, 1)).toBe(1);
    expect(getExpoSliderRelativeProgress(2, 0, 4, true, 2.2, 1)).toBeCloseTo(
      -0.2,
    );
    expect(getExpoSliderRelativeProgress(0, 0, 2, true, 0.999, 1)).toBeCloseTo(
      -0.999,
    );
    expect(getExpoSliderRelativeProgress(0, 0, 2, true, 1, 1)).toBe(-1);
    expect(getExpoSliderRelativeProgress(1, 0, 2, true, 1, 1)).toBe(0);
    expect(getExpoSliderRelativeProgress(0, 0, 4, true, 2, 1)).toBe(-2);
  });

  it("hides a loop copy while it rebases across the far edge", () => {
    render(
      <TestSlider slides={TEST_SLIDES.slice(0, 2)} transitionDuration={650} />,
    );
    const currentSlide = getSlides()[0];

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    let previousProgress = getSlideProgress(0);
    let rebaseOpacity: number | null = null;
    for (let frame = 0; frame < 20; frame += 1) {
      act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
      const progress = getSlideProgress(0);
      if (previousProgress < 0 && progress > 0) {
        rebaseOpacity = Number(currentSlide.style.opacity);
        break;
      }
      previousProgress = progress;
    }

    expect(rebaseOpacity).not.toBeNull();
    expect(rebaseOpacity).toBeLessThan(1);
  });

  it("retargets repeated controls before the active transition completes", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        onValueChange={onValueChange}
      />,
    );
    const next = screen.getByRole("button", { name: "Next" });

    fireEvent.click(next);
    expect(next).toBeEnabled();
    fireEvent.click(next);

    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    const intermediateProgress = Number(
      getSlides()[1].getAttribute("data-progress"),
    );
    expect(Math.abs(intermediateProgress)).toBeLessThan(1);
    expect(screen.getByTestId("frame-1")).not.toHaveStyle({
      transform: "scale(1.25) rotateY(0deg)",
    });

    dispatchTransformTransitionEnd();
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");

    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(screen.getByText("03 / 04")).toBeInTheDocument();
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
  });

  it("reports net direction when the final input reverses an active target", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "previous",
    });
  });

  it("retargets keyboard and pagination input while animating", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        onValueChange={onValueChange}
      />,
    );
    const viewport = screen.getByTestId("viewport");

    expect(fireEvent.keyDown(viewport, { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(viewport, { key: "ArrowRight" })).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Go to slide 4 of 4" }));

    const currentPage = screen.getByRole("button", {
      name: "Go to slide 1 of 4",
    });
    const targetPage = screen.getByRole("button", {
      name: "Go to slide 4 of 4",
    });
    expect(currentPage).toHaveAttribute("aria-current", "true");
    expect(currentPage).toBeEnabled();
    expect(targetPage).toHaveAttribute("data-active");
    expect(targetPage).toBeDisabled();

    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "3");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(3, {
      previousValue: 0,
      direction: 1,
      source: "pagination",
    });
  });

  it("commits the final controlled target after repeated input", () => {
    const onValueChange = vi.fn();
    render(
      <ControlledTestSlider
        slides={TEST_SLIDES}
        loop={false}
        onValueChange={onValueChange}
      />,
    );
    const next = screen.getByRole("button", { name: "Next" });

    fireEvent.click(next);
    fireEvent.click(next);
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: 1,
      source: "next",
    });
  });

  it("ignores a stale transition end after a new navigation starts", () => {
    render(<TestSlider slides={TEST_SLIDES} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    dispatchTransformTransitionEnd();

    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");

    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
  });

  it("commits repeated navigation immediately when reduced motion is preferred", async () => {
    vi.stubGlobal("matchMedia", createMatchMedia(true));
    render(<TestSlider transitionDuration={650} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await act(async () => {});

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
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
    expect(
      screen.getByRole("button", { name: "Go to slide 1 of 3" }),
    ).toHaveAttribute("data-active");
    expect(
      screen.getByRole("button", { name: "Go to slide 2 of 3" }),
    ).toBeEnabled();

    rerender(<TestSlider value={1} onValueChange={onValueChange} />);
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(screen.getByText("02 / 03")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to slide 2 of 3" }),
    ).toHaveAttribute("data-active");
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
    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));

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

  it("commits any direction-locked drag without a slide threshold", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        dragThreshold={1}
        velocityThreshold={100}
        onValueChange={onValueChange}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 30, 300, 290);
    endHorizontalDrag(viewport, 30, 290);
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(onValueChange).toHaveBeenCalledWith(1, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("keeps long drag progress and advances across multiple indices", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        dragThreshold={1}
        velocityThreshold={100}
        onValueChange={onValueChange}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 31, 300, -580);
    expect(getSlides()[2]).toHaveAttribute("data-progress", "-0.200");

    endHorizontalDrag(viewport, 31, -580);
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("supports multi-index dragging in vertical orientation", () => {
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        orientation="vertical"
        velocityThreshold={100}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    fireEvent.pointerDown(viewport, {
      pointerId: 32,
      pointerType: "touch",
      clientX: 100,
      clientY: 200,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 32,
      pointerType: "touch",
      clientX: 100,
      clientY: -328,
    });
    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));

    expect(getSlides()[2]).toHaveAttribute("data-progress", "-0.200");

    fireEvent.pointerUp(viewport, {
      pointerId: 32,
      pointerType: "touch",
      clientX: 100,
      clientY: -328,
    });
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
  });

  it("caps non-loop edge resistance during extreme overdrag", () => {
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        velocityThreshold={10_000}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 33, 300, -7_700);
    expect(getSlides()[3]).toHaveAttribute("data-progress", "-0.350");

    endHorizontalDrag(viewport, 33, -7_700);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "3");
  });

  it("settles an exact multi-index drag without waiting for a fallback", async () => {
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        velocityThreshold={10_000}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 34, 300, -500);
    endHorizontalDrag(viewport, 34, -500);
    await act(async () => {});

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-animating");
  });

  it("accepts a rapid second drag during an uncontrolled transition", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        dragThreshold={0.2}
        onValueChange={onValueChange}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 20, 300, 180, "mouse");
    endHorizontalDrag(viewport, 20, 180, "mouse");
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");

    startHorizontalDrag(viewport, 20, 300, 180, "mouse");
    expect(screen.getByTestId("root")).toHaveAttribute("data-dragging");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");

    endHorizontalDrag(viewport, 20, 180, "mouse");
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("counts a slow same-direction regrab as another index", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        velocityThreshold={10_000}
        onValueChange={onValueChange}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 35, 300, 180);
    endHorizontalDrag(viewport, 35, 180);
    startHorizontalDrag(viewport, 36, 300, 180);
    endHorizontalDrag(viewport, 36, 180);
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("lets a slow reverse regrab cancel the pending index", () => {
    const onValueChange = vi.fn();
    render(
      <TestSlider
        slides={TEST_SLIDES}
        loop={false}
        velocityThreshold={10_000}
        onValueChange={onValueChange}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 37, 300, 180);
    endHorizontalDrag(viewport, 37, 180);
    startHorizontalDrag(viewport, 38, 180, 300);
    endHorizontalDrag(viewport, 38, 300);

    expect(getActiveSlide()).toHaveAttribute("data-index", "0");
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-animating");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("preserves a controlled value update when a second drag interrupts", () => {
    const onValueChange = vi.fn();
    render(
      <ControlledTestSlider
        slides={TEST_SLIDES}
        dragThreshold={0.2}
        onValueChange={onValueChange}
      />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 22);
    endHorizontalDrag(viewport, 22);
    startHorizontalDrag(viewport, 23);

    expect(screen.getByTestId("root")).toHaveAttribute("data-dragging");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");

    endHorizontalDrag(viewport, 23);
    finishTransition();

    expect(getActiveSlide()).toHaveAttribute("data-index", "2");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(2, {
      previousValue: 0,
      direction: 1,
      source: "pointer",
    });
  });

  it("accepts a new drag while a canceled drag is snapping back", () => {
    render(<TestSlider slides={TEST_SLIDES} dragThreshold={0.2} />);
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    startHorizontalDrag(viewport, 24, 280, 230);
    fireEvent.pointerCancel(viewport, {
      pointerId: 24,
      pointerType: "touch",
      clientX: 230,
      clientY: 100,
    });
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");

    startHorizontalDrag(viewport, 25);
    expect(screen.getByTestId("root")).toHaveAttribute("data-dragging");

    endHorizontalDrag(viewport, 25);
    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
  });

  it("does not commit an animation for a pending or cross-axis pointer", () => {
    render(<DisableAfterChangeTestSlider />);
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    const capture = installPointerCapture(viewport);

    startHorizontalDrag(viewport, 27);
    endHorizontalDrag(viewport, 27);
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");

    fireEvent.pointerDown(viewport, {
      pointerId: 28,
      pointerType: "touch",
      clientX: 300,
      clientY: 100,
    });

    expect(screen.getByTestId("root")).not.toHaveAttribute("data-disabled");
    expect(capture.setPointerCapture).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-dragging");

    fireEvent.pointerMove(viewport, {
      pointerId: 28,
      pointerType: "touch",
      clientX: 303,
      clientY: 160,
    });

    expect(capture.releasePointerCapture).toHaveBeenCalledWith(28);
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-disabled");

    finishTransition();
    expect(screen.getByTestId("root")).toHaveAttribute("data-disabled");
  });

  it("animates even-count reverse navigation with continuous frame progress", () => {
    render(<TestSlider slides={TEST_SLIDES} transitionDuration={80} />);
    const oppositeSlide = getSlides()[2];

    expect(oppositeSlide).toHaveAttribute("data-progress", "2.000");
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "80ms" });

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");
    expect(oppositeSlide).toHaveAttribute("data-progress", "-2.000");
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    const firstFrameProgress = getSlideProgress(2);
    expect(firstFrameProgress).toBeGreaterThan(-2);
    expect(firstFrameProgress).toBeLessThan(-1);
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(getSlideProgress(2)).toBeGreaterThan(firstFrameProgress);
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    finishTransition();
    expect(getActiveSlide()).toHaveAttribute("data-index", "3");
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "80ms" });
  });

  it("preserves the visible side when an even-count loop commits", () => {
    render(
      <TestSlider slides={TEST_SLIDES.slice(0, 2)} transitionDuration={80} />,
    );
    const previousSlide = getSlides()[0];

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    act(() => vi.advanceTimersByTime(TEST_TRANSITION_DURATION));

    expect(getActiveSlide()).toHaveAttribute("data-index", "1");
    expect(previousSlide).toHaveAttribute("data-progress", "1.000");
    expect(previousSlide).toHaveStyle({ transitionDuration: "0ms" });
  });

  it("restores transitions after an animation finishes under a pending pointer", () => {
    render(<TestSlider transitionDuration={80} />);
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);
    const activeSlide = getActiveSlide();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.pointerDown(viewport, {
      pointerId: 39,
      pointerType: "touch",
      clientX: 200,
      clientY: 100,
    });
    act(() =>
      vi.advanceTimersByTime(
        TEST_TRANSITION_DURATION + TEST_FRAME_DURATION * 2,
      ),
    );

    expect(activeSlide).toHaveStyle({ transitionDuration: "0ms" });

    fireEvent.pointerUp(viewport, {
      pointerId: 39,
      pointerType: "touch",
      clientX: 200,
      clientY: 100,
    });
    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION * 2));

    expect(activeSlide).toHaveStyle({ transitionDuration: "80ms" });
  });

  it("suppresses wrap transitions for an external controlled value change", () => {
    const view = render(
      <TestSlider slides={TEST_SLIDES} value={0} transitionDuration={80} />,
    );
    const oppositeSlide = getSlides()[2];

    expect(oppositeSlide).toHaveAttribute("data-progress", "2.000");
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "80ms" });

    view.rerender(
      <TestSlider slides={TEST_SLIDES} value={3} transitionDuration={80} />,
    );

    expect(getActiveSlide()).toHaveAttribute("data-index", "3");
    expect(oppositeSlide).toHaveAttribute("data-progress", "-1.000");
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "80ms" });
  });

  it("suppresses loop rebase transitions when topology changes during a drag", () => {
    const view = render(
      <TestSlider slides={TEST_SLIDES} transitionDuration={80} />,
    );
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);
    const oppositeSlide = getSlides()[2];

    startHorizontalDrag(viewport, 29, 200, 250);
    expect(oppositeSlide).toHaveAttribute("data-progress", "-1.875");
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    view.rerender(
      <TestSlider slides={TEST_SLIDES} disabled transitionDuration={80} />,
    );

    expect(screen.getByTestId("root")).toHaveAttribute("data-disabled");
    expect(oppositeSlide).toHaveAttribute("data-progress", "2.000");
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "0ms" });

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(oppositeSlide).toHaveStyle({ transitionDuration: "80ms" });
  });

  it("keeps an even-count loop on one side during snap-back and disables idle rebase transitions", () => {
    render(<TestSlider slides={TEST_SLIDES} transitionDuration={80} />);
    const viewport = screen.getByTestId("viewport");
    mockViewportBounds(viewport);
    installPointerCapture(viewport);

    const oppositeSlide = getSlides()[2];
    const frame = screen.getByTestId("frame-2");
    const imageEffect = screen
      .getByTestId("image-2")
      .closest<HTMLElement>('[data-slot="expo-slider-image-effect"]');
    const content = screen.getByTestId("content-2");
    expect(imageEffect).not.toBeNull();
    const animatedElements = [
      oppositeSlide,
      frame,
      imageEffect as HTMLElement,
      content,
    ];

    animatedElements.forEach((element) =>
      expect(element).toHaveStyle({ transitionDuration: "80ms" }),
    );

    startHorizontalDrag(viewport, 26, 200, 250);
    expect(oppositeSlide).toHaveAttribute("data-progress", "-1.875");
    animatedElements.forEach((element) =>
      expect(element).toHaveStyle({ transitionDuration: "0ms" }),
    );

    fireEvent.pointerCancel(viewport, {
      pointerId: 26,
      pointerType: "touch",
      clientX: 250,
      clientY: 100,
    });

    expect(oppositeSlide).toHaveAttribute("data-progress", "-1.875");
    animatedElements.forEach((element) =>
      expect(element).toHaveStyle({ transitionDuration: "0ms" }),
    );

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(getSlideProgress(2)).toBeLessThan(-1.875);

    finishTransition();

    expect(oppositeSlide).toHaveAttribute("data-progress", "2.000");
    animatedElements.forEach((element) =>
      expect(element).toHaveStyle({ transitionDuration: "0ms" }),
    );

    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    animatedElements.forEach((element) =>
      expect(element).toHaveStyle({ transitionDuration: "80ms" }),
    );
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

  it("snaps back an uncaptured primary drag when the pointer leaves", () => {
    render(<TestSlider velocityThreshold={10_000} />);
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
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 13,
      pointerType: "touch",
      clientX: 220,
      clientY: 100,
    });
    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
    expect(screen.getByTestId("root")).toHaveAttribute("data-dragging");

    fireEvent.pointerLeave(viewport, {
      pointerId: 13,
      pointerType: "touch",
      clientX: 220,
      clientY: 100,
    });

    expect(setPointerCapture).toHaveBeenCalledWith(13);
    expect(screen.getByTestId("root")).toHaveAttribute("data-animating");
    finishTransition();
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-dragging");
    expect(screen.getByTestId("root")).not.toHaveAttribute("data-animating");
    expect(getActiveSlide()).toHaveAttribute("data-index", "0");

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
    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
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
    act(() => vi.advanceTimersByTime(TEST_FRAME_DURATION));
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
