import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ClickWheel,
  getClickWheelControllerBindings,
  useClickWheelController,
  type ClickWheelNavigateHandler,
} from "./index";

describe("useClickWheelController", () => {
  it("maps every command and preserves directional input details", () => {
    const navigate = vi.fn<ClickWheelNavigateHandler>();
    const back = vi.fn();
    const home = vi.fn();
    const previous = vi.fn();
    const select = vi.fn();
    const next = vi.fn();
    const playPause = vi.fn();
    const bindings = getClickWheelControllerBindings({
      navigate,
      back,
      home,
      previous,
      select,
      next,
      playPause,
    });

    bindings.onRotate?.(-1);
    bindings.onRotate?.(1);
    bindings.onMenu?.();
    bindings.onMenuLongPress?.();
    bindings.onPrevious?.();
    bindings.onSelect?.();
    bindings.onNext?.();
    bindings.onPlayPause?.();

    expect(navigate.mock.calls).toEqual([
      [-1, { source: "rotate" }],
      [1, { source: "rotate" }],
    ]);
    expect(back).toHaveBeenCalledOnce();
    expect(home).toHaveBeenCalledOnce();
    expect(previous).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(playPause).toHaveBeenCalledOnce();
    expect(bindings.disabled).toBe(false);
  });

  it("uses navigation as the default previous and next command", () => {
    const navigate = vi.fn<ClickWheelNavigateHandler>();
    const bindings = getClickWheelControllerBindings({ navigate });

    bindings.onPrevious?.();
    bindings.onNext?.();

    expect(navigate.mock.calls).toEqual([
      [-1, { source: "previous" }],
      [1, { source: "next" }],
    ]);
    expect(bindings.onMenu).toBeUndefined();
    expect(bindings.onMenuLongPress).toBeUndefined();
    expect(bindings.onSelect).toBeUndefined();
    expect(bindings.onPlayPause).toBeUndefined();
  });

  it("blocks every binding while disabled and resumes with current handlers", () => {
    const firstNavigate = vi.fn<ClickWheelNavigateHandler>();
    const secondNavigate = vi.fn<ClickWheelNavigateHandler>();
    const select = vi.fn();
    const { result, rerender } = renderHook(
      ({ navigate, disabled }) =>
        useClickWheelController({ navigate, select, disabled }),
      {
        initialProps: {
          navigate: firstNavigate,
          disabled: true,
        },
      },
    );

    act(() => {
      result.current.onRotate?.(1);
      result.current.onPrevious?.();
      result.current.onNext?.();
      result.current.onSelect?.();
    });

    expect(result.current.disabled).toBe(true);
    expect(firstNavigate).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();

    rerender({ navigate: secondNavigate, disabled: false });
    act(() => {
      result.current.onRotate?.(-1);
      result.current.onSelect?.();
    });

    expect(result.current.disabled).toBe(false);
    expect(firstNavigate).not.toHaveBeenCalled();
    expect(secondNavigate).toHaveBeenCalledWith(-1, { source: "rotate" });
    expect(select).toHaveBeenCalledOnce();
  });

  it("forwards rapid navigation in input order without imposing a queue", () => {
    const directions: number[] = [];
    const bindings = getClickWheelControllerBindings({
      navigate: (direction) => directions.push(direction),
    });

    bindings.onRotate?.(-1);
    bindings.onRotate?.(1);
    bindings.onRotate?.(1);

    expect(directions).toEqual([-1, 1, 1]);
  });

  it("connects a standalone ClickWheel to a controlled list", () => {
    function ControlledList() {
      const [index, setIndex] = useState(1);
      const wheelBindings = useClickWheelController({
        navigate: (direction) =>
          setIndex((current) => Math.max(0, Math.min(2, current + direction))),
      });

      return (
        <>
          <output data-testid="active-index">{index}</output>
          <ClickWheel aria-label="List controller" {...wheelBindings} />
        </>
      );
    }

    render(<ControlledList />);

    const wheel = screen.getByLabelText("List controller");
    fireEvent.keyDown(wheel, { key: "ArrowRight" });
    expect(screen.getByTestId("active-index")).toHaveTextContent("2");

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByTestId("active-index")).toHaveTextContent("1");

    fireEvent.wheel(wheel, { deltaY: -10 });
    expect(screen.getByTestId("active-index")).toHaveTextContent("0");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("active-index")).toHaveTextContent("1");
  });
});
