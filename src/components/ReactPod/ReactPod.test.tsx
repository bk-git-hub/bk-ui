import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReactPod from "./ReactPod";
import type { ReactPodMenuItem, ReactPodPhotoAlbum } from "./ReactPod";

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
      screen.getByRole("option", { name: "Photos" }),
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

  it("keeps a slightly shaky MENU tap as a normal click", () => {
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
      pointerId: 5,
      pointerType: "mouse",
      button: 0,
      clientX: 100,
      clientY: 20,
    });
    fireEvent.pointerMove(wheel, {
      pointerId: 5,
      pointerType: "mouse",
      clientX: 106,
      clientY: 20,
    });
    fireEvent.pointerUp(wheel, { pointerId: 5, pointerType: "mouse" });
    fireEvent.click(menuButton);

    expect(
      screen.getByRole("listbox", { name: "Main menu" }),
    ).toBeInTheDocument();
  });

  it("keeps pointer capture on MENU so a tap clicks the button", () => {
    render(<ReactPod />);
    const wheel = screen.getByLabelText(/Click wheel/);
    const menuButton = screen.getByRole("button", { name: "Back to menu" });
    const captureOnMenu = vi.fn();
    const captureOnWheel = vi.fn();

    Object.defineProperty(menuButton, "setPointerCapture", {
      configurable: true,
      value: captureOnMenu,
    });
    Object.defineProperty(wheel, "setPointerCapture", {
      configurable: true,
      value: captureOnWheel,
    });

    fireEvent.pointerDown(menuButton, {
      pointerId: 6,
      pointerType: "mouse",
      button: 0,
      clientX: 100,
      clientY: 20,
    });

    expect(captureOnMenu).toHaveBeenCalledWith(6);
    expect(captureOnWheel).not.toHaveBeenCalled();
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

  it("renders a custom device name and built-in menu configuration", () => {
    const handleClick = vi.fn();
    const menuItems = [
      { id: "about", label: "Device Info" },
      { id: "songs", label: "My Library" },
    ] satisfies readonly ReactPodMenuItem[];

    render(
      <ReactPod
        deviceName="Pocket Mix"
        menuItems={menuItems}
        data-testid="custom-pod"
        data-theme="midnight"
        title="Custom music player"
        className="w-[360px]"
        onClick={handleClick}
      />,
    );

    const pod = screen.getByTestId("custom-pod");
    const menu = screen.getByRole("listbox", { name: "Main menu" });
    const labels = within(menu)
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(labels).toEqual(["Device Info", "My Library"]);
    expect(screen.getByText("Pocket Mix")).toBeInTheDocument();
    expect(pod).toHaveAttribute("data-theme", "midnight");
    expect(pod).toHaveAttribute("title", "Custom music player");
    expect(pod).toHaveClass("w-[360px]");
    expect(pod).not.toHaveClass("w-[300px]");

    fireEvent.click(pod);
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(screen.getAllByText("Pocket Mix")).toHaveLength(2);
  });

  it("keeps the selected menu index in range when menu props change", () => {
    const fullMenu = [
      { id: "now-playing", label: "Player" },
      { id: "songs", label: "Library" },
      { id: "shuffle", label: "Surprise Me" },
      { id: "about", label: "Information" },
    ] satisfies readonly ReactPodMenuItem[];
    const songsOnly = [
      { id: "songs", label: "Only Songs" },
    ] satisfies readonly ReactPodMenuItem[];
    const { rerender } = render(<ReactPod menuItems={fullMenu} />);
    const wheel = screen.getByLabelText(/Click wheel/);

    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: "Information" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    rerender(<ReactPod menuItems={songsOnly} />);

    expect(screen.getByRole("option", { name: "Only Songs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(screen.getByRole("listbox", { name: "Songs" })).toBeInTheDocument();
  });

  it("navigates photo albums and photos with the click wheel", () => {
    const photoAlbums = [
      {
        id: "city",
        title: "City Lights",
        photos: [
          {
            id: "river",
            src: "/river.webp",
            alt: "River at night",
            caption: "Blue Hour",
          },
          {
            id: "alley",
            src: "/alley.webp",
            alt: "Neon alley",
            caption: "Late Night",
          },
        ],
      },
      {
        id: "weekend",
        title: "Weekend Away",
        photos: [
          {
            id: "sea",
            src: "/sea.webp",
            alt: "Sea from a train platform",
          },
        ],
      },
    ] satisfies readonly ReactPodPhotoAlbum[];

    render(
      <ReactPod
        menuItems={[{ id: "photos", label: "Photos" }]}
        photoAlbums={photoAlbums}
      />,
    );

    const wheel = screen.getByLabelText(/Click wheel/);
    const select = screen.getByRole("button", { name: "Select" });
    const menu = screen.getByRole("button", { name: "Back to menu" });

    fireEvent.click(select);
    expect(
      screen.getByRole("listbox", { name: "Photo albums" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /City Lights/ }),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.click(select);
    expect(
      screen.getByRole("img", { name: "River at night" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    expect(
      screen.getByRole("img", { name: "Neon alley" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(
      screen.getByRole("img", { name: "River at night" }),
    ).toBeInTheDocument();

    fireEvent.click(menu);
    expect(
      screen.getByRole("listbox", { name: "Photo albums" }),
    ).toBeInTheDocument();
    fireEvent.click(menu);
    expect(screen.getByRole("option", { name: "Photos" })).toBeInTheDocument();
  });

  it("shows an empty state when no photo albums are provided", () => {
    render(<ReactPod menuItems={[{ id: "photos", label: "Photos" }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Select" }));

    expect(screen.getByText("No Albums")).toBeInTheDocument();
  });
});
