import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { ClickWheel } from "./index";
import { ClickWheel as ClientClickWheel } from "./client";

describe("ClickWheel", () => {
  it("renders independently with accessible default controls", () => {
    render(<ClickWheel />);

    const wheel = screen.getByLabelText(/Click wheel/);
    expect(wheel).toHaveAttribute("role", "group");
    expect(wheel).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Select" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Play or pause" })).toBeVisible();
    expect(ClientClickWheel).toBe(ClickWheel);
  });

  it("customizes every button and composes native and semantic callbacks", () => {
    const onMenu = vi.fn();
    const onPrevious = vi.fn();
    const onSelect = vi.fn();
    const onNext = vi.fn();
    const onPlayPause = vi.fn();
    const onMenuClick = vi.fn();
    const rootRef = createRef<HTMLDivElement>();
    const selectRef = createRef<HTMLButtonElement>();

    render(
      <ClickWheel
        ref={rootRef}
        data-testid="custom-wheel"
        title="Pocket controls"
        className="h-[240px] w-[240px] bg-slate-900"
        onMenu={onMenu}
        onPrevious={onPrevious}
        onSelect={onSelect}
        onNext={onNext}
        onPlayPause={onPlayPause}
        buttonProps={{
          menu: {
            children: <span>BACK</span>,
            "aria-label": "Go back",
            className: "text-fuchsia-500",
            title: "Custom menu",
            "data-control": "menu",
            onClick: onMenuClick,
          },
          previous: {
            children: "−",
            "aria-label": "Decrease",
          },
          select: {
            ref: selectRef,
            children: "OK",
            "aria-label": "Confirm",
            className: "grid place-items-center",
          },
          next: {
            children: "+",
            "aria-label": "Increase",
          },
          playPause: {
            children: "GO",
            "aria-label": "Start or stop",
            "aria-pressed": true,
          },
        }}
      />,
    );

    const wheel = screen.getByTestId("custom-wheel");
    expect(rootRef.current).toBe(wheel);
    expect(wheel).toHaveClass("h-[240px]", "w-[240px]", "bg-slate-900");
    expect(wheel).not.toHaveClass("h-[200px]", "w-[200px]");
    expect(wheel).toHaveAttribute("title", "Pocket controls");

    const menu = screen.getByRole("button", { name: "Go back" });
    expect(menu).toHaveTextContent("BACK");
    expect(menu).toHaveClass("text-fuchsia-500");
    expect(menu).toHaveAttribute("data-control", "menu");
    expect(menu).toHaveAttribute("title", "Custom menu");

    const select = screen.getByRole("button", { name: "Confirm" });
    expect(selectRef.current).toBe(select);
    expect(select).toHaveTextContent("OK");

    fireEvent.click(menu);
    fireEvent.click(screen.getByRole("button", { name: "Decrease" }));
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("button", { name: "Increase" }));
    fireEvent.click(screen.getByRole("button", { name: "Start or stop" }));

    expect(onMenuClick).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPlayPause).toHaveBeenCalledTimes(1);
  });

  it("lets a native button handler cancel its semantic action", () => {
    const onNext = vi.fn();
    render(
      <ClickWheel
        onNext={onNext}
        buttonProps={{
          next: {
            onClick: (event) => event.preventDefault(),
          },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it("maps keyboard and wheel input while composing root handlers", () => {
    const onRotate = vi.fn();
    const onMenu = vi.fn();
    const onMenuLongPress = vi.fn();
    const onSelect = vi.fn();
    const onPlayPause = vi.fn();
    const onKeyDown = vi.fn();
    const onWheel = vi.fn();

    render(
      <ClickWheel
        onRotate={onRotate}
        onMenu={onMenu}
        onMenuLongPress={onMenuLongPress}
        onSelect={onSelect}
        onPlayPause={onPlayPause}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
      />,
    );

    const wheel = screen.getByLabelText(/Click wheel/);
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    fireEvent.keyDown(wheel, { key: "ArrowLeft" });
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.keyDown(wheel, { key: "ArrowRight" });
    fireEvent.keyDown(wheel, { key: "Enter" });
    fireEvent.keyDown(wheel, { key: "Escape" });
    fireEvent.keyDown(wheel, { key: "Home" });
    fireEvent.keyDown(wheel, { key: " " });
    fireEvent.keyDown(wheel, { key: "Enter", repeat: true });
    fireEvent.keyDown(wheel, { key: "Escape", altKey: true });
    fireEvent.keyDown(wheel, { key: "Home", ctrlKey: true });
    fireEvent.keyDown(wheel, { key: " ", metaKey: true });
    const upwardWheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -10,
    });
    const downwardWheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 10,
    });
    fireEvent(wheel, upwardWheelEvent);
    fireEvent(wheel, downwardWheelEvent);
    fireEvent.wheel(wheel, { deltaY: 0 });

    expect(onRotate.mock.calls.map(([direction]) => direction)).toEqual([
      -1, -1, 1, 1, -1, 1,
    ]);
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onMenuLongPress).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onPlayPause).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(12);
    expect(onWheel).toHaveBeenCalledTimes(3);
    expect(upwardWheelEvent.defaultPrevented).toBe(true);
    expect(downwardWheelEvent.defaultPrevented).toBe(true);

    fireEvent.keyDown(screen.getByRole("button", { name: "Select" }), {
      key: "Enter",
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("distinguishes a MENU hold from a drag and suppresses their clicks", () => {
    vi.useFakeTimers();

    try {
      const onRotate = vi.fn();
      const onMenu = vi.fn();
      const onMenuLongPress = vi.fn();
      render(
        <ClickWheel
          onRotate={onRotate}
          onMenu={onMenu}
          onMenuLongPress={onMenuLongPress}
        />,
      );

      const wheel = screen.getByLabelText(/Click wheel/);
      const menu = screen.getByRole("button", { name: "Menu" });
      vi.spyOn(wheel, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 200,
        bottom: 200,
        width: 200,
        height: 200,
        toJSON: () => ({}),
      });

      fireEvent.pointerDown(menu, {
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        clientX: 100,
        clientY: 20,
      });
      act(() => vi.advanceTimersByTime(650));
      fireEvent.pointerUp(wheel, { pointerId: 1, pointerType: "mouse" });
      fireEvent.click(menu);

      expect(onMenuLongPress).toHaveBeenCalledTimes(1);
      expect(onMenu).not.toHaveBeenCalled();

      fireEvent.pointerDown(menu, {
        pointerId: 2,
        pointerType: "mouse",
        button: 0,
        clientX: 100,
        clientY: 20,
      });
      fireEvent.pointerMove(wheel, {
        pointerId: 2,
        pointerType: "mouse",
        clientX: 122,
        clientY: 25,
      });
      act(() => vi.advanceTimersByTime(700));
      fireEvent.pointerUp(wheel, { pointerId: 2, pointerType: "mouse" });
      fireEvent.click(menu);

      expect(onRotate).toHaveBeenCalledWith(1);
      expect(onMenuLongPress).toHaveBeenCalledTimes(1);
      expect(onMenu).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("disables root and button interactions predictably", () => {
    const onRotate = vi.fn();
    const onMenu = vi.fn();
    const { rerender } = render(
      <ClickWheel disabled onRotate={onRotate} onMenu={onMenu} />,
    );

    const wheel = screen.getByLabelText(/Click wheel/);
    expect(wheel).toHaveAttribute("aria-disabled", "true");
    expect(wheel).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Menu" })).toBeDisabled();
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.wheel(wheel, { deltaY: 10 });
    expect(onRotate).not.toHaveBeenCalled();

    rerender(
      <ClickWheel onMenu={onMenu} buttonProps={{ menu: { disabled: true } }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(onMenu).not.toHaveBeenCalled();
  });
});
