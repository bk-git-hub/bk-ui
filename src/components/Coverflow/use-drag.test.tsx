import { act, fireEvent, render } from "@testing-library/react";
import { useRef, type Dispatch } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { useDrag } from "./use-drag";

interface DragHarnessProps {
  initialPosition?: number;
  maxIndex?: number;
  reducedMotion?: boolean;
  onDrag: Dispatch<number>;
  onDragEnd: Dispatch<number>;
}

function DragHarness({
  initialPosition = 8,
  maxIndex = 20,
  reducedMotion = false,
  onDrag,
  onDragEnd,
}: DragHarnessProps) {
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const { handleDragStart } = useDrag({
    maxIndex,
    onDrag,
    onDragEnd,
    reducedMotionRef,
    size: 200,
  });

  return (
    <div
      data-testid="drag-target"
      onMouseDown={(event) => handleDragStart(event, initialPosition)}
    />
  );
}

describe("useDrag inertia", () => {
  let frameDurationMs: number;
  let requestAnimationFrameMock: Mock;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    frameDurationMs = 16;
    requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), frameDurationMs),
    );
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);
    vi.stubGlobal("cancelAnimationFrame", (frameId: number) =>
      window.clearTimeout(frameId),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const advance = (milliseconds: number) => {
    act(() => vi.advanceTimersByTime(milliseconds));
  };

  it("keeps release velocity continuous and settles without a terminal jump", () => {
    const positions: number[] = [];
    const onDragEnd = vi.fn();
    const { getByTestId } = render(
      <DragHarness
        onDrag={(position) => positions.push(position)}
        onDragEnd={onDragEnd}
      />,
    );
    const target = getByTestId("drag-target");

    fireEvent.mouseDown(target, { clientX: 500 });
    for (const clientX of [484, 468, 452, 436, 420, 404]) {
      fireEvent.mouseMove(window, { clientX });
      advance(16);
    }

    const releaseSampleCount = positions.length;
    const lastDragDelta =
      positions[releaseSampleCount - 1]! - positions[releaseSampleCount - 2]!;

    fireEvent.mouseUp(window);
    advance(16);

    const firstInertiaDelta =
      positions[releaseSampleCount]! - positions[releaseSampleCount - 1]!;
    expect(Math.sign(firstInertiaDelta)).toBe(Math.sign(lastDragDelta));
    expect(Math.abs(firstInertiaDelta / lastDragDelta)).toBeGreaterThan(0.7);
    expect(Math.abs(firstInertiaDelta / lastDragDelta)).toBeLessThan(1.3);

    act(() => vi.runAllTimers());

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith(
      Math.round(onDragEnd.mock.calls[0]![0]),
    );
    const terminalDelta =
      positions[positions.length - 1]! - positions[positions.length - 2]!;
    const previousDelta =
      positions[positions.length - 2]! - positions[positions.length - 3]!;
    expect(Math.abs(terminalDelta)).toBeLessThanOrEqual(
      Math.max(Math.abs(previousDelta) * 2, 0.02),
    );
    expect(requestAnimationFrameMock.mock.calls.length).toBeLessThan(240);
  });

  it("uses the pending pointer target when release happens before the next frame", () => {
    const positions: number[] = [];
    const onDragEnd = vi.fn();
    const { getByTestId } = render(
      <DragHarness
        onDrag={(position) => positions.push(position)}
        onDragEnd={onDragEnd}
      />,
    );

    fireEvent.mouseDown(getByTestId("drag-target"), { clientX: 500 });
    advance(16);
    fireEvent.mouseMove(window, { clientX: 440 });
    fireEvent.mouseUp(window);

    expect(positions[positions.length - 1]).toBeCloseTo(9, 5);
    act(() => vi.runAllTimers());
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it("does not reuse stale velocity after the pointer pauses before release", () => {
    const positions: number[] = [];
    const onDragEnd = vi.fn();
    const { getByTestId } = render(
      <DragHarness
        onDrag={(position) => positions.push(position)}
        onDragEnd={onDragEnd}
      />,
    );

    fireEvent.mouseDown(getByTestId("drag-target"), { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 450 });
    advance(16);
    fireEvent.mouseMove(window, { clientX: 400 });
    advance(16);
    advance(200);

    const releasePosition = positions[positions.length - 1]!;
    fireEvent.mouseUp(window);
    act(() => vi.runAllTimers());

    expect(onDragEnd).toHaveBeenCalledWith(Math.round(releasePosition));
  });

  it("fades momentum continuously when release follows a brief pause", () => {
    const firstInertiaDeltaAfterPause = (pauseMs: number) => {
      const positions: number[] = [];
      const view = render(
        <DragHarness
          onDrag={(position) => positions.push(position)}
          onDragEnd={() => undefined}
        />,
      );
      const target = view.getByTestId("drag-target");

      fireEvent.mouseDown(target, { clientX: 500 });
      fireEvent.mouseMove(window, { clientX: 464 });
      advance(16);
      fireEvent.mouseMove(window, { clientX: 428 });
      advance(pauseMs);

      const releaseSampleCount = positions.length;
      fireEvent.mouseUp(window);
      advance(16);

      const firstInertiaDelta =
        positions[releaseSampleCount]! - positions[releaseSampleCount - 1]!;
      view.unmount();
      return firstInertiaDelta;
    };

    const justBeforePreviousCutoff = firstInertiaDeltaAfterPause(79);
    const justAfterPreviousCutoff = firstInertiaDeltaAfterPause(81);

    expect(Math.sign(justBeforePreviousCutoff)).toBe(
      Math.sign(justAfterPreviousCutoff),
    );
    expect(
      Math.abs(justBeforePreviousCutoff - justAfterPreviousCutoff),
    ).toBeLessThan(0.05);
  });

  it("reseeds velocity samples when maxIndex changes during a drag", () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const view = render(
      <DragHarness
        initialPosition={8}
        maxIndex={20}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      />,
    );

    fireEvent.mouseDown(view.getByTestId("drag-target"), { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 200 });
    advance(16);

    view.rerender(
      <DragHarness
        initialPosition={8}
        maxIndex={5}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      />,
    );
    onDrag.mockClear();
    fireEvent.mouseMove(window, { clientX: 199 });
    advance(16);
    expect(onDrag.mock.calls[onDrag.mock.calls.length - 1]?.[0]).toBeCloseTo(
      5 + 1 / (200 * 0.3),
      5,
    );
    fireEvent.mouseUp(window);
    act(() => vi.runAllTimers());

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith(5);
  });

  it("normalizes spring motion across 60Hz and 120Hz frames", () => {
    const runAtFrameDuration = (duration: number) => {
      frameDurationMs = duration;
      const positions: number[] = [];
      const view = render(
        <DragHarness
          onDrag={(position) => positions.push(position)}
          onDragEnd={() => undefined}
        />,
      );
      const target = view.getByTestId("drag-target");

      fireEvent.mouseDown(target, { clientX: 500 });
      for (const clientX of [480, 460, 440, 420]) {
        fireEvent.mouseMove(window, { clientX });
        advance(16);
      }
      fireEvent.mouseUp(window);
      advance(240);

      const position = positions[positions.length - 1]!;
      view.unmount();
      return position;
    };

    const positionAt60Hz = runAtFrameDuration(16);
    const positionAt120Hz = runAtFrameDuration(8);

    expect(positionAt120Hz).toBeCloseTo(positionAt60Hz, 3);
  });

  it("finishes immediately when reduced motion is requested", () => {
    const positions: number[] = [];
    const onDragEnd = vi.fn();
    const { getByTestId } = render(
      <DragHarness
        initialPosition={2}
        reducedMotion
        onDrag={(position) => positions.push(position)}
        onDragEnd={onDragEnd}
      />,
    );

    fireEvent.mouseDown(getByTestId("drag-target"), { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 470 });
    const scheduledFramesBeforeRelease =
      requestAnimationFrameMock.mock.calls.length;
    fireEvent.mouseUp(window);

    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(
      scheduledFramesBeforeRelease,
    );
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith(3);
    expect(positions[positions.length - 1]).toBe(3);
  });
});
