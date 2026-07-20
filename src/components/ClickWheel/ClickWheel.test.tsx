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
    const buttons = [
      screen.getByRole("button", { name: "Menu" }),
      screen.getByRole("button", { name: "Previous" }),
      screen.getByRole("button", { name: "Select" }),
      screen.getByRole("button", { name: "Next" }),
      screen.getByRole("button", { name: "Play or pause" }),
    ];

    buttons.forEach((button) => {
      expect(button).toBeVisible();
      expect(button).toHaveClass(
        "data-pressing:scale-[0.94]",
        "data-pressing:brightness-90",
        "data-pressing:shadow-[inset_0_2px_5px_rgba(0,0,0,0.24)]",
      );
    });

    const previousIcon = buttons[1].querySelector(
      '[data-skip-direction="previous"]',
    );
    const nextIcon = buttons[3].querySelector('[data-skip-direction="next"]');
    expect(previousIcon).toHaveAttribute("viewBox", "0 0 113 56");
    expect(previousIcon?.querySelector("rect")).not.toHaveAttribute("x");
    expect(nextIcon).toHaveAttribute("viewBox", "0 0 113 56");
    expect(nextIcon?.querySelector("rect")).toHaveAttribute("x", "113");
    expect(ClientClickWheel).toBe(ClickWheel);
  });

  it("shows tactile button feedback and clears it after release or rotation", () => {
    const onRotate = vi.fn();
    render(<ClickWheel onRotate={onRotate} />);

    const wheel = screen.getByLabelText(/Click wheel/);
    const buttons = [
      screen.getByRole("button", { name: "Menu" }),
      screen.getByRole("button", { name: "Previous" }),
      screen.getByRole("button", { name: "Select" }),
      screen.getByRole("button", { name: "Next" }),
      screen.getByRole("button", { name: "Play or pause" }),
    ];
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

    buttons.forEach((button, index) => {
      const pointerId = index + 1;
      fireEvent.pointerDown(button, {
        pointerId,
        pointerType: "mouse",
        button: 0,
        clientX: 100,
        clientY: 20,
      });
      expect(button).toHaveAttribute("data-pressing");
      fireEvent.pointerUp(button, { pointerId, pointerType: "mouse" });
      expect(button).not.toHaveAttribute("data-pressing");
    });

    const menu = buttons[0];
    fireEvent.pointerDown(menu, {
      pointerId: 20,
      pointerType: "mouse",
      button: 0,
      clientX: 100,
      clientY: 20,
    });
    expect(menu).toHaveAttribute("data-pressing");
    fireEvent.pointerMove(wheel, {
      pointerId: 20,
      pointerType: "mouse",
      clientX: 122,
      clientY: 25,
    });
    expect(onRotate).toHaveBeenCalledWith(1);
    expect(menu).not.toHaveAttribute("data-pressing");
    fireEvent.pointerUp(wheel, { pointerId: 20, pointerType: "mouse" });

    const select = buttons[2];
    fireEvent.pointerDown(select, {
      pointerId: 21,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    expect(select).toHaveAttribute("data-pressing");
    fireEvent.pointerCancel(wheel, {
      pointerId: 21,
      pointerType: "touch",
    });
    expect(select).not.toHaveAttribute("data-pressing");

    const next = buttons[3];
    fireEvent.pointerDown(next, {
      pointerId: 22,
      pointerType: "mouse",
      button: 0,
    });
    expect(next).toHaveAttribute("data-pressing");
    fireEvent.pointerLeave(next, { pointerId: 22, pointerType: "mouse" });
    expect(next).not.toHaveAttribute("data-pressing");
  });

  it("mirrors root and native-button keyboard presses without changing toggle aria", () => {
    render(
      <ClickWheel buttonProps={{ playPause: { "aria-pressed": true } }} />,
    );

    const wheel = screen.getByLabelText(/Click wheel/);
    const shortcuts = [
      ["Enter", screen.getByRole("button", { name: "Select" })],
      ["Escape", screen.getByRole("button", { name: "Menu" })],
      ["Home", screen.getByRole("button", { name: "Menu" })],
      [" ", screen.getByRole("button", { name: "Play or pause" })],
    ] as const;

    shortcuts.forEach(([key, button]) => {
      fireEvent.keyDown(wheel, { key });
      expect(button).toHaveAttribute("data-pressing");
      fireEvent.keyUp(wheel, { key });
      expect(button).not.toHaveAttribute("data-pressing");
    });

    const playPause = screen.getByRole("button", { name: "Play or pause" });
    fireEvent.keyDown(playPause, { key: " " });
    expect(playPause).toHaveAttribute("data-pressing");
    expect(playPause).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyUp(playPause, { key: " " });
    expect(playPause).not.toHaveAttribute("data-pressing");
    expect(playPause).toHaveAttribute("aria-pressed", "true");
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

  it("scales circular drag thresholds with a safe sensitivity multiplier", () => {
    const lowSensitivityRotate = vi.fn();
    const defaultSensitivityRotate = vi.fn();
    const highSensitivityRotate = vi.fn();
    const invalidSensitivityRotate = vi.fn();

    render(
      <>
        <ClickWheel
          data-testid="low-sensitivity-wheel"
          sensitivity={0.5}
          onRotate={lowSensitivityRotate}
        />
        <ClickWheel
          data-testid="default-sensitivity-wheel"
          onRotate={defaultSensitivityRotate}
        />
        <ClickWheel
          data-testid="high-sensitivity-wheel"
          sensitivity={2}
          onRotate={highSensitivityRotate}
        />
        <ClickWheel
          data-testid="invalid-sensitivity-wheel"
          sensitivity={Number.NaN}
          onRotate={invalidSensitivityRotate}
        />
      </>,
    );

    const wheels = [
      screen.getByTestId("low-sensitivity-wheel"),
      screen.getByTestId("default-sensitivity-wheel"),
      screen.getByTestId("high-sensitivity-wheel"),
      screen.getByTestId("invalid-sensitivity-wheel"),
    ];
    const rect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    };

    wheels.forEach((wheel, index) => {
      vi.spyOn(wheel, "getBoundingClientRect").mockReturnValue(rect);
      const pointerId = index + 20;
      fireEvent.pointerDown(wheel, {
        pointerId,
        pointerType: "mouse",
        button: 0,
        clientX: 200,
        clientY: 100,
      });
      fireEvent.pointerMove(wheel, {
        pointerId,
        pointerType: "mouse",
        clientX: 197,
        clientY: 124,
      });
      fireEvent.pointerUp(wheel, { pointerId, pointerType: "mouse" });
    });

    expect(lowSensitivityRotate).not.toHaveBeenCalled();
    expect(defaultSensitivityRotate).toHaveBeenCalledTimes(1);
    expect(highSensitivityRotate).toHaveBeenCalledTimes(2);
    expect(invalidSensitivityRotate).toHaveBeenCalledTimes(1);
    expect(wheels.map((wheel) => wheel.dataset.sensitivity)).toEqual([
      "0.5",
      "1",
      "2",
      "1",
    ]);
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
    const disabledMenu = screen.getByRole("button", { name: "Menu" });
    expect(disabledMenu).toBeDisabled();
    fireEvent.pointerDown(disabledMenu, {
      pointerId: 30,
      pointerType: "mouse",
      button: 0,
    });
    expect(disabledMenu).not.toHaveAttribute("data-pressing");
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
