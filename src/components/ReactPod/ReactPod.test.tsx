import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReactPod from "./ReactPod";
import type {
  ReactPodCoverflowAlbum,
  ReactPodMenuItem,
  ReactPodPhotoAlbum,
} from "./ReactPod";

const COVERFLOW_ALBUMS = [
  {
    id: "night-drive",
    title: "Night Drive",
    coverSrc: "/night-drive.webp",
    coverAlt: "Blue city lights on the Night Drive album cover",
    tracks: [
      { id: "night-drive-1", title: "Streetlights" },
      { id: "night-drive-2", title: "Last Exit" },
    ],
  },
  {
    id: "sea-glass",
    title: "Sea Glass",
    coverSrc: "/sea-glass.webp",
    coverAlt: "Sunlit waves on the Sea Glass album cover",
    tracks: [
      { id: "sea-glass-1", title: "High Tide" },
      { id: "sea-glass-2", title: "Driftwood" },
    ],
  },
  {
    id: "paper-moon",
    title: "Paper Moon",
    coverSrc: "/paper-moon.webp",
    coverAlt: "A paper moon floating over a dark sky",
    tracks: [{ id: "paper-moon-1", title: "Silver Thread" }],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

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

    const menuButton = screen.getByRole("button", { name: "Previous menu" });
    fireEvent.click(menuButton);
    expect(screen.getByRole("listbox", { name: "Songs" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Seoul at 2AM/ }),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.click(menuButton);
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

    expect(screen.getByRole("option", { name: "Photos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("treats a drag starting on MENU as wheel rotation, not a menu click", () => {
    render(<ReactPod />);
    const wheel = screen.getByLabelText(/Click wheel/);
    const menuButton = screen.getByRole("button", { name: "Previous menu" });
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
    const menuButton = screen.getByRole("button", { name: "Previous menu" });
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
    const menuButton = screen.getByRole("button", { name: "Previous menu" });
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

  it("returns directly to the main menu when MENU is held", () => {
    vi.useFakeTimers();

    try {
      render(
        <ReactPod
          menuItems={[{ id: "photos", label: "Photos" }]}
          photoAlbums={[
            {
              id: "favorites",
              title: "Favorites",
              photos: [
                {
                  id: "favorite-1",
                  src: "/favorite.webp",
                  alt: "A favorite photo",
                },
              ],
            },
          ]}
        />,
      );

      const select = screen.getByRole("button", { name: "Select" });
      fireEvent.click(select);
      fireEvent.click(select);
      expect(
        screen.getByRole("grid", { name: "Favorites photos" }),
      ).toBeInTheDocument();

      const menuButton = screen.getByRole("button", {
        name: "Previous menu",
      });
      fireEvent.pointerDown(menuButton, {
        pointerId: 7,
        pointerType: "mouse",
        button: 0,
        clientX: 100,
        clientY: 20,
      });

      act(() => vi.advanceTimersByTime(650));

      expect(
        screen.getByRole("listbox", { name: "Main menu" }),
      ).toBeInTheDocument();

      fireEvent.pointerUp(menuButton, {
        pointerId: 7,
        pointerType: "mouse",
      });
      fireEvent.click(menuButton);
      expect(
        screen.getByRole("listbox", { name: "Main menu" }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels a MENU hold when the gesture becomes a wheel drag", () => {
    vi.useFakeTimers();

    try {
      render(
        <ReactPod
          menuItems={[{ id: "photos", label: "Photos" }]}
          photoAlbums={[
            {
              id: "favorites",
              title: "Favorites",
              photos: [
                {
                  id: "favorite-1",
                  src: "/favorite-1.webp",
                  alt: "First favorite",
                },
                {
                  id: "favorite-2",
                  src: "/favorite-2.webp",
                  alt: "Second favorite",
                },
              ],
            },
          ]}
        />,
      );

      const wheel = screen.getByLabelText(/Click wheel/);
      const select = screen.getByRole("button", { name: "Select" });
      const menuButton = screen.getByRole("button", {
        name: "Previous menu",
      });

      fireEvent.click(select);
      fireEvent.click(select);

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
        pointerId: 8,
        pointerType: "mouse",
        button: 0,
        clientX: 100,
        clientY: 20,
      });
      fireEvent.pointerMove(wheel, {
        pointerId: 8,
        pointerType: "mouse",
        clientX: 122,
        clientY: 25,
      });

      act(() => vi.advanceTimersByTime(700));

      expect(
        screen.getByRole("grid", { name: "Favorites photos" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("gridcell", { name: /Second favorite/ }),
      ).toHaveAttribute("aria-selected", "true");

      fireEvent.pointerUp(wheel, {
        pointerId: 8,
        pointerType: "mouse",
      });
      fireEvent.click(menuButton);
      expect(
        screen.getByRole("grid", { name: "Favorites photos" }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
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
        wheelSensitivity={2}
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
    expect(screen.getByLabelText(/Click wheel/)).toHaveAttribute(
      "data-sensitivity",
      "2",
    );

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
    const menu = screen.getByRole("button", { name: "Previous menu" });

    fireEvent.click(select);
    expect(
      screen.getByRole("listbox", { name: "Photo albums" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /City Lights/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(select);
    expect(
      screen.getByRole("grid", { name: "City Lights photos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: /Blue Hour/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    expect(
      screen.getByRole("gridcell", { name: /Late Night/ }),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.click(select);
    expect(screen.getByRole("img", { name: "Neon alley" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(
      screen.getByRole("img", { name: "River at night" }),
    ).toBeInTheDocument();

    fireEvent.click(menu);
    expect(
      screen.getByRole("grid", { name: "City Lights photos" }),
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

  it("shows Coverflow in the default menu and enters it with the click wheel", () => {
    render(<ReactPod coverflowAlbums={COVERFLOW_ALBUMS} />);

    const menu = screen.getByRole("listbox", { name: "Main menu" });
    expect(within(menu).getAllByRole("option")).toHaveLength(6);

    const wheel = screen.getByLabelText(/Click wheel/);
    fireEvent.wheel(wheel, { deltaY: 1 });
    fireEvent.wheel(wheel, { deltaY: 1 });
    fireEvent.wheel(wheel, { deltaY: 1 });

    expect(screen.getByRole("option", { name: "Coverflow" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Select" }));

    const coverflow = screen.getByRole("region", { name: "Album coverflow" });
    const viewport = within(coverflow).getByRole("group", {
      name: "Coverflow navigation",
    });
    expect(coverflow).toHaveClass(
      "origin-center",
      "scale-[0.875]",
      "items-center",
      "justify-center",
      "[&_[data-slot=coverflow-close-trigger]]:size-12",
    );
    expect(viewport).toHaveFocus();
    expect(
      within(coverflow).getByRole("button", {
        name: "Show details for Night Drive",
      }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("preserves Coverflow wheel, keyboard, flip, close, outside click, and MENU behavior", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(Date.now());
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    try {
      render(
        <ReactPod
          menuItems={[{ id: "coverflow", label: "Album Browser" }]}
          coverflowAlbums={COVERFLOW_ALBUMS}
          coverflowAriaLabel="Pocket album browser"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Select" }));
      const coverflow = screen.getByRole("region", {
        name: "Pocket album browser",
      });
      const viewport = within(coverflow).getByRole("group", {
        name: "Coverflow navigation",
      });
      expect(screen.getByText("Album Browser")).toBeInTheDocument();

      fireEvent.wheel(viewport, { deltaY: 100 });
      act(() => vi.advanceTimersByTime(200));

      const seaGlassTrigger = within(coverflow).getByRole("button", {
        name: "Show details for Sea Glass",
      });
      expect(
        seaGlassTrigger.closest('[data-slot="coverflow-card"]'),
      ).toHaveAttribute("data-active", "true");

      fireEvent.keyDown(viewport, { key: "ArrowRight" });
      act(() => vi.runOnlyPendingTimers());

      const paperMoonTrigger = within(coverflow).getByRole("button", {
        name: "Show details for Paper Moon",
      });
      expect(paperMoonTrigger).toHaveFocus();

      fireEvent.keyDown(paperMoonTrigger, { key: "Enter" });
      expect(paperMoonTrigger).toHaveAttribute("aria-pressed", "true");
      const paperMoonItem = paperMoonTrigger.closest(
        '[data-slot="coverflow-item"]',
      );
      const paperMoonBack = paperMoonItem?.querySelector(
        '[data-slot="coverflow-back"]',
      );
      expect(paperMoonBack).toHaveAttribute("aria-hidden", "false");
      expect(
        within(paperMoonBack as HTMLElement).getByText("Silver Thread"),
      ).toBeInTheDocument();

      const close = paperMoonItem?.querySelector(
        '[data-slot="coverflow-close-trigger"]',
      ) as HTMLButtonElement;
      expect(close).toHaveAttribute(
        "aria-label",
        "Close details for Paper Moon",
      );
      expect(close).toHaveClass("top-2", "right-2");
      fireEvent.click(close);
      expect(paperMoonTrigger).toHaveFocus();
      expect(paperMoonTrigger).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(paperMoonTrigger);
      expect(paperMoonTrigger).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(document.body);
      expect(paperMoonTrigger).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(paperMoonTrigger);
      fireEvent.click(screen.getByRole("button", { name: "Previous menu" }));
      expect(
        screen.getByRole("listbox", { name: "Main menu" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Album Browser" }),
      ).toHaveAttribute("aria-selected", "true");
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it("restores click-wheel focus after Coverflow keyboard exits", () => {
    render(
      <ReactPod
        menuItems={[{ id: "coverflow", label: "Coverflow" }]}
        coverflowAlbums={COVERFLOW_ALBUMS}
      />,
    );

    const wheel = screen.getByLabelText(/Click wheel/);
    fireEvent.keyDown(wheel, { key: "Enter" });
    fireEvent.keyDown(
      screen.getByRole("group", { name: "Coverflow navigation" }),
      { key: "Escape" },
    );
    expect(
      screen.getByRole("listbox", { name: "Main menu" }),
    ).toBeInTheDocument();
    expect(wheel).toHaveFocus();

    fireEvent.keyDown(wheel, { key: "Enter" });
    fireEvent.keyDown(
      screen.getByRole("group", { name: "Coverflow navigation" }),
      { key: "Home" },
    );
    expect(
      screen.getByRole("listbox", { name: "Main menu" }),
    ).toBeInTheDocument();
    expect(wheel).toHaveFocus();
  });

  it("recovers focus when Coverflow album data is removed", () => {
    const { rerender } = render(
      <ReactPod
        menuItems={[{ id: "coverflow", label: "Coverflow" }]}
        coverflowAlbums={COVERFLOW_ALBUMS}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    screen
      .getByRole("button", { name: "Show details for Night Drive" })
      .focus();

    rerender(
      <ReactPod
        menuItems={[{ id: "coverflow", label: "Coverflow" }]}
        coverflowAlbums={[]}
      />,
    );

    expect(screen.getByRole("status").closest("section")).toHaveFocus();
  });

  it("shows a Coverflow empty state without injected album data", () => {
    render(<ReactPod menuItems={[{ id: "coverflow", label: "Coverflow" }]} />);

    fireEvent.keyDown(screen.getByLabelText(/Click wheel/), { key: "Enter" });

    expect(screen.getByRole("status")).toHaveTextContent("No Coverflow Albums");
  });
});
