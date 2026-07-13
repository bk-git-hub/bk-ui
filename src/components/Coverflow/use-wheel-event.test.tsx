import { act, fireEvent, render } from "@testing-library/react";
import { useRef, type Dispatch } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWheelEvent } from "./use-wheel-event";

interface WheelHarnessProps {
  initialPosition?: number;
  maxIndex?: number;
  reducedMotion?: boolean;
  onScrollStart?: () => void;
  onScroll: Dispatch<number>;
  onScrollEnd: Dispatch<number>;
}

function WheelHarness({
  initialPosition = 0,
  maxIndex = 20,
  reducedMotion = false,
  onScrollStart,
  onScroll,
  onScrollEnd,
}: WheelHarnessProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(initialPosition);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const cancel = useWheelEvent({
    containerRef,
    positionRef,
    reducedMotionRef,
    maxIndex,
    onScrollStart,
    onScroll,
    onScrollEnd,
  });

  return (
    <>
      <div ref={containerRef} data-testid="wheel-target" />
      <button type="button" onClick={cancel}>
        Cancel wheel
      </button>
      <button
        type="button"
        onClick={() => {
          cancel();
          positionRef.current = 5;
        }}
      >
        Move externally
      </button>
    </>
  );
}

describe("useWheelEvent", () => {
  const advance = (milliseconds: number) => {
    act(() => vi.advanceTimersByTime(milliseconds));
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(Date.now()), 16),
      ),
    );
    vi.stubGlobal("cancelAnimationFrame", (frameId: number) =>
      window.clearTimeout(frameId),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("normalizes pixel, line, and page deltas and batches them per frame", () => {
    const onScroll = vi.fn();
    const onScrollEnd = vi.fn();
    const { getByTestId } = render(
      <WheelHarness onScroll={onScroll} onScrollEnd={onScrollEnd} />,
    );
    const target = getByTestId("wheel-target");

    fireEvent.wheel(target, { deltaY: 100, deltaMode: 0 });
    fireEvent.wheel(target, { deltaY: 3, deltaMode: 1 });
    fireEvent.wheel(target, { deltaY: 1, deltaMode: 2 });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    advance(16);
    expect(onScroll.mock.calls[0]![0]).toBeGreaterThan(2);
    expect(onScroll.mock.calls[0]![0]).toBeLessThan(3);

    act(() => vi.runAllTimers());
    expect(onScrollEnd).toHaveBeenCalledTimes(1);
    expect(onScrollEnd).toHaveBeenCalledWith(3);
  });

  it("eases a mouse-wheel step before settling on the next item", () => {
    const positions: number[] = [];
    const onScrollEnd = vi.fn();
    const { getByTestId } = render(
      <WheelHarness
        onScroll={(position) => positions.push(position)}
        onScrollEnd={onScrollEnd}
      />,
    );

    fireEvent.wheel(getByTestId("wheel-target"), { deltaY: 100 });
    advance(16);

    expect(positions[0]).toBeGreaterThan(0);
    expect(positions[0]).toBeLessThan(1);
    expect(onScrollEnd).not.toHaveBeenCalled();

    act(() => vi.runAllTimers());
    expect(onScrollEnd).toHaveBeenCalledTimes(1);
    expect(onScrollEnd).toHaveBeenCalledWith(1);
    expect(positions[positions.length - 1]).toBe(1);
    expect(positions.length).toBeGreaterThan(5);
  });

  it("retargets an in-flight settle instead of emitting a stale index", () => {
    const onScrollEnd = vi.fn();
    const { getByTestId } = render(
      <WheelHarness onScroll={() => undefined} onScrollEnd={onScrollEnd} />,
    );
    const target = getByTestId("wheel-target");

    fireEvent.wheel(target, { deltaY: 100 });
    advance(32);
    fireEvent.wheel(target, { deltaY: 100 });
    act(() => vi.runAllTimers());

    expect(onScrollEnd).toHaveBeenCalledTimes(1);
    expect(onScrollEnd).toHaveBeenCalledWith(2);
  });

  it("batches reduced motion input but skips the easing frames", () => {
    const onScroll = vi.fn();
    const onScrollEnd = vi.fn();
    const { getByTestId } = render(
      <WheelHarness
        reducedMotion
        onScroll={onScroll}
        onScrollEnd={onScrollEnd}
      />,
    );

    fireEvent.wheel(getByTestId("wheel-target"), { deltaY: 100 });
    advance(16);

    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onScroll).toHaveBeenLastCalledWith(1);
    advance(64);
    expect(onScrollEnd).toHaveBeenCalledTimes(1);
    expect(onScrollEnd).toHaveBeenCalledWith(1);
  });

  it("cancels a pending settle without a trailing navigation callback", () => {
    const onScrollStart = vi.fn();
    const onScrollEnd = vi.fn();
    const { getByRole, getByTestId } = render(
      <WheelHarness
        onScrollStart={onScrollStart}
        onScroll={() => undefined}
        onScrollEnd={onScrollEnd}
      />,
    );

    fireEvent.wheel(getByTestId("wheel-target"), { deltaX: 200, deltaY: 10 });
    advance(16);
    fireEvent.click(getByRole("button", { name: "Cancel wheel" }));
    act(() => vi.runAllTimers());

    expect(onScrollStart).toHaveBeenCalledTimes(1);
    expect(onScrollEnd).not.toHaveBeenCalled();
  });

  it("starts the next gesture from an externally controlled position", () => {
    const onScrollEnd = vi.fn();
    const { getByRole, getByTestId } = render(
      <WheelHarness onScroll={() => undefined} onScrollEnd={onScrollEnd} />,
    );

    fireEvent.click(getByRole("button", { name: "Move externally" }));
    fireEvent.wheel(getByTestId("wheel-target"), { deltaY: 100 });
    act(() => vi.runAllTimers());

    expect(onScrollEnd).toHaveBeenCalledTimes(1);
    expect(onScrollEnd).toHaveBeenCalledWith(6);
  });
});
