import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReactPod from "./ReactPod";

describe("ReactPod", () => {
  it("navigates songs and controls playback from the click wheel", () => {
    render(<ReactPod />);

    const wheel = screen.getByLabelText(/Click wheel/);
    const select = screen.getByRole("button", { name: "Select" });

    expect(screen.getByRole("option", { name: "Now Playing" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "Songs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(select);
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.click(select);

    expect(screen.getByText("Soft Focus")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next track" }));
    expect(screen.getByText("Seoul at 2AM")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "Back to menu" }));
    expect(
      screen.getByRole("listbox", { name: "Main menu" }),
    ).toBeInTheDocument();
  });

  it("converts a large circular gesture into multiple menu steps", () => {
    render(<ReactPod />);
    const wheel = screen.getByLabelText(/Click wheel/);

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

    fireEvent.pointerDown(wheel, {
      pointerId: 1,
      button: 0,
      clientX: 200,
      clientY: 100,
    });
    fireEvent.pointerMove(wheel, {
      pointerId: 1,
      clientX: 185,
      clientY: 151,
    });
    fireEvent.pointerUp(wheel, { pointerId: 1 });

    expect(
      screen.getByRole("option", { name: "Shuffle Songs" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("treats a drag starting on MENU as wheel rotation, not a menu click", () => {
    render(<ReactPod />);
    const wheel = screen.getByLabelText(/Click wheel/);
    const menuButton = screen.getByRole("button", { name: "Back to menu" });
    const selectButton = screen.getByRole("button", { name: "Select" });

    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.click(selectButton);
    expect(screen.getByRole("listbox", { name: "Songs" })).toBeInTheDocument();

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

    fireEvent.pointerDown(menuButton, {
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
    fireEvent.pointerUp(wheel, { pointerId: 2, pointerType: "mouse" });
    fireEvent.click(menuButton);

    expect(screen.getByRole("option", { name: /Soft Focus/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("listbox", { name: "Songs" })).toBeInTheDocument();
  });

  it("treats a drag starting on play as wheel rotation, not playback", () => {
    render(<ReactPod />);
    const wheel = screen.getByLabelText(/Click wheel/);
    const playButton = screen.getByRole("button", { name: "Play" });

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

    fireEvent.pointerDown(playButton, {
      pointerId: 3,
      pointerType: "mouse",
      button: 0,
      clientX: 100,
      clientY: 180,
    });
    fireEvent.pointerMove(wheel, {
      pointerId: 3,
      pointerType: "mouse",
      clientX: 78,
      clientY: 175,
    });
    fireEvent.pointerUp(wheel, { pointerId: 3, pointerType: "mouse" });
    fireEvent.click(playButton);

    expect(screen.getByRole("option", { name: "Songs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps a short play-button tap as a normal click", () => {
    render(<ReactPod />);
    const wheel = screen.getByLabelText(/Click wheel/);
    const playButton = screen.getByRole("button", { name: "Play" });

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

    fireEvent.pointerDown(playButton, {
      pointerId: 4,
      pointerType: "mouse",
      button: 0,
      clientX: 100,
      clientY: 180,
    });
    fireEvent.pointerMove(wheel, {
      pointerId: 4,
      pointerType: "mouse",
      clientX: 97,
      clientY: 180,
    });
    fireEvent.pointerUp(wheel, { pointerId: 4, pointerType: "mouse" });
    fireEvent.click(playButton);

    expect(screen.getByRole("button", { name: "Pause" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
