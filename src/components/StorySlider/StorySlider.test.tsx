/* eslint-disable no-unused-vars -- Callback parameter names document test helpers. */
import { StrictMode, type ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStorySliderGroupPosition,
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
  StorySliderViewport,
  type StorySliderValue,
} from ".";

interface RafController {
  advance: (milliseconds: number, frameDuration?: number) => void;
  flushAt: (timestamp: number) => void;
  pending: () => number;
}

function installRafController(): RafController {
  let nextFrameId = 1;
  let currentTime = 0;
  const callbacks = new Map<number, FrameRequestCallback>();

  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId++;
      callbacks.set(frameId, callback);
      return frameId;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((frameId: number) => callbacks.delete(frameId)),
  );

  const flushAt = (timestamp: number) => {
    currentTime = timestamp;
    const pendingCallbacks = [...callbacks.values()];
    callbacks.clear();
    act(() => pendingCallbacks.forEach((callback) => callback(timestamp)));
  };

  return {
    flushAt,
    advance(milliseconds, frameDuration = 50) {
      const targetTime = currentTime + milliseconds;
      while (currentTime < targetTime) {
        flushAt(Math.min(targetTime, currentTime + frameDuration));
      }
    },
    pending: () => callbacks.size,
  };
}

function TestStorySlider({
  groupCounts = [2, 2],
  ...props
}: Partial<ComponentProps<typeof StorySliderRoot>> & {
  groupCounts?: readonly number[];
}) {
  return (
    <StorySliderRoot
      groupCounts={groupCounts}
      duration={400}
      aria-label="Test stories"
      {...props}
    >
      <StorySliderViewport data-testid="viewport">
        {groupCounts.map((count, groupIndex) => (
          <StorySliderGroup
            key={groupIndex}
            index={groupIndex}
            aria-label={`Creator ${groupIndex + 1}`}
          >
            {Array.from({ length: count }, (_, itemIndex) => (
              <StorySliderItem key={itemIndex} index={itemIndex}>
                <span>{`${groupIndex}-${itemIndex}`}</span>
              </StorySliderItem>
            ))}
          </StorySliderGroup>
        ))}
        <StorySliderProgress />
        <StorySliderPlayback>
          {({ paused }) => (paused ? "Play" : "Pause")}
        </StorySliderPlayback>
      </StorySliderViewport>
      <StorySliderPrevious>Previous</StorySliderPrevious>
      <StorySliderNext>Next</StorySliderNext>
      <StorySliderStatus />
    </StorySliderRoot>
  );
}

describe("StorySlider", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("positions groups by playable order when empty groups are skipped", () => {
    const groupCounts = [1, 0, 0, 1, 1];

    expect(getStorySliderGroupPosition(3, 0, groupCounts, false)).toBe(1);
    expect(getStorySliderGroupPosition(4, 0, groupCounts, true)).toBe(-1);
  });

  it("exposes carousel semantics and keeps inactive stories inert", () => {
    installRafController();
    const { container } = render(<TestStorySlider autoplay={false} />);

    const root = container.querySelector('[data-slot="story-slider-root"]');
    expect(root).toHaveAttribute("aria-roledescription", "carousel");
    expect(root).toHaveAttribute("data-paused");
    expect(screen.getByTestId("viewport")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("0-0")).toBeVisible();

    const inactiveItem = screen
      .getByText("0-1")
      .closest('[data-slot="story-slider-item-positioner"]');
    expect(inactiveItem).toHaveAttribute("aria-hidden", "true");
    expect(inactiveItem).toHaveAttribute("inert");

    const progress = screen.getByRole("progressbar", {
      name: "Story progress",
    });
    expect(progress).toHaveAttribute("aria-valuetext", "Story 1 of 2");
    expect(
      progress.querySelectorAll('[data-slot="story-slider-progress-track"]'),
    ).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Group 1 of 2, story 1 of 2",
    );

    fireEvent.click(screen.getByRole("button", { name: "Play stories" }));
    expect(root).not.toHaveAttribute("data-paused");
  });

  it("autoplays at the configured duration and reports the source", () => {
    const raf = installRafController();
    const onValueChange = vi.fn();
    render(<TestStorySlider duration={300} onValueChange={onValueChange} />);

    raf.flushAt(0);
    raf.advance(250);
    expect(screen.getByText("0-0")).toBeVisible();
    expect(onValueChange).not.toHaveBeenCalled();

    raf.advance(50);
    expect(screen.getByText("0-1")).toBeVisible();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(
      { groupIndex: 0, itemIndex: 1 },
      {
        previousValue: { groupIndex: 0, itemIndex: 0 },
        direction: 1,
        source: "autoplay",
      },
    );

    raf.flushAt(300);
    raf.advance(300);
    expect(screen.getByText("1-0")).toBeVisible();
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("preserves elapsed time across a pointer hold", () => {
    const raf = installRafController();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    render(<TestStorySlider duration={400} />);
    const viewport = screen.getByTestId("viewport");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      bottom: 600,
      height: 600,
      left: 0,
      right: 340,
      top: 0,
      width: 340,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    raf.flushAt(0);
    raf.advance(200);
    fireEvent.pointerDown(viewport, {
      button: 0,
      clientX: 250,
      clientY: 200,
      pointerId: 1,
      pointerType: "touch",
    });
    expect(viewport.closest('[data-slot="story-slider-root"]')).toHaveAttribute(
      "data-paused",
    );

    raf.advance(1000);
    expect(screen.getByText("0-0")).toBeVisible();

    now = 300;
    fireEvent.pointerUp(viewport, {
      button: 0,
      clientX: 250,
      clientY: 200,
      pointerId: 1,
      pointerType: "touch",
    });
    raf.flushAt(1250);
    raf.advance(150);
    expect(screen.getByText("0-0")).toBeVisible();
    raf.advance(50);
    expect(screen.getByText("0-1")).toBeVisible();
  });

  it("supports tap, keyboard navigation, and group swipes", () => {
    installRafController();
    render(<TestStorySlider autoplay={false} />);
    const viewport = screen.getByTestId("viewport");
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      bottom: 600,
      height: 600,
      left: 0,
      right: 300,
      top: 0,
      width: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(viewport, {
      button: 0,
      clientX: 240,
      clientY: 200,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.pointerUp(viewport, {
      button: 0,
      clientX: 240,
      clientY: 200,
      pointerId: 1,
      pointerType: "touch",
    });
    expect(screen.getByText("0-1")).toBeVisible();

    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    expect(screen.getByText("1-0")).toBeVisible();
    fireEvent.keyDown(viewport, { key: "ArrowLeft" });
    expect(screen.getByText("0-1")).toBeVisible();

    fireEvent.pointerDown(viewport, {
      button: 0,
      clientX: 260,
      clientY: 200,
      pointerId: 2,
      pointerType: "touch",
    });
    fireEvent.pointerMove(viewport, {
      button: 0,
      clientX: 30,
      clientY: 202,
      pointerId: 2,
      pointerType: "touch",
    });
    fireEvent.pointerUp(viewport, {
      button: 0,
      clientX: 30,
      clientY: 202,
      pointerId: 2,
      pointerType: "touch",
    });
    expect(screen.getByText("1-0")).toBeVisible();
  });

  it("keeps controlled markup stable until the consumer updates value", () => {
    const raf = installRafController();
    const onValueChange = vi.fn();
    const initialValue: StorySliderValue = { groupIndex: 0, itemIndex: 0 };
    const { rerender } = render(
      <TestStorySlider
        value={initialValue}
        duration={200}
        onValueChange={onValueChange}
      />,
    );

    raf.flushAt(0);
    raf.advance(200);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText("0-0")).toBeVisible();

    rerender(
      <TestStorySlider
        value={{ groupIndex: 0, itemIndex: 1 }}
        duration={200}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByText("0-1")).toBeVisible();
  });

  it("stops once at the final story and loops only when requested", () => {
    const raf = installRafController();
    const onPlaybackEnd = vi.fn();
    const onValueChange = vi.fn();
    const { unmount } = render(
      <TestStorySlider
        groupCounts={[1]}
        duration={100}
        onPlaybackEnd={onPlaybackEnd}
      />,
    );

    raf.flushAt(0);
    raf.advance(100);
    expect(onPlaybackEnd).toHaveBeenCalledTimes(1);
    raf.advance(500);
    expect(onPlaybackEnd).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Play stories" }));
    raf.flushAt(600);
    raf.advance(100);
    expect(onPlaybackEnd).toHaveBeenCalledTimes(2);
    unmount();

    const loopingRaf = installRafController();
    render(
      <TestStorySlider
        groupCounts={[2]}
        defaultValue={{ groupIndex: 0, itemIndex: 1 }}
        duration={100}
        loop
        onValueChange={onValueChange}
        onPlaybackEnd={onPlaybackEnd}
      />,
    );
    loopingRaf.flushAt(0);
    loopingRaf.advance(100);
    expect(onValueChange).toHaveBeenCalledWith(
      { groupIndex: 0, itemIndex: 0 },
      expect.objectContaining({ direction: 1, source: "autoplay" }),
    );
    expect(onPlaybackEnd).toHaveBeenCalledTimes(2);
  });

  it("cleans up animation frames in StrictMode and renders SSR-stable markup", () => {
    const raf = installRafController();
    const { unmount } = render(
      <StrictMode>
        <TestStorySlider />
      </StrictMode>,
    );
    expect(raf.pending()).toBeGreaterThan(0);
    unmount();
    expect(raf.pending()).toBe(0);

    const matchMedia = vi.mocked(window.matchMedia);
    matchMedia.mockReturnValueOnce({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const reducedMotionMarkup = renderToString(
      <TestStorySlider groupCounts={[1]} />,
    );
    matchMedia.mockReturnValueOnce({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const regularMarkup = renderToString(<TestStorySlider groupCounts={[1]} />);
    expect(reducedMotionMarkup).toBe(regularMarkup);
  });
});
