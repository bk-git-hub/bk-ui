import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createReactPodScreenControllerRegistry,
  useReactPodScreenController,
} from "./ReactPodActiveScreenController";
import type { ReactPodScreenController } from "./ReactPodActiveScreenController";
import { useReactPod } from "./ReactPodContext";
import { ReactPodProvider } from "./ReactPodProvider";
import type {
  ReactPodCoverflowAlbum,
  ReactPodState,
  ReactPodTrack,
} from "./reactPodState";

const albums = [
  {
    id: "one",
    title: "One",
    coverSrc: "/one.webp",
    coverAlt: "One cover",
    tracks: [],
  },
  {
    id: "two",
    title: "Two",
    coverSrc: "/two.webp",
    coverAlt: "Two cover",
    tracks: [],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

const tracks = [
  {
    id: "one",
    title: "One",
    artist: "Artist",
    album: "Album",
    duration: 120,
  },
  {
    id: "two",
    title: "Two",
    artist: "Artist",
    album: "Album",
    duration: 120,
  },
] satisfies readonly ReactPodTrack[];

interface ControllerHarnessProps {
  controller: ReactPodScreenController;
}

function ControllerHarness({ controller }: ControllerHarnessProps) {
  useReactPodScreenController("coverflow", controller);
  const {
    state,
    rotate,
    select,
    previous,
    next,
    togglePlay,
    back,
    goToMainMenu,
  } = useReactPod();

  return (
    <>
      <output data-testid="state">{JSON.stringify(state)}</output>
      <button type="button" onClick={() => rotate(1)}>
        rotate
      </button>
      <button type="button" onClick={select}>
        select
      </button>
      <button type="button" onClick={previous}>
        previous
      </button>
      <button type="button" onClick={next}>
        next
      </button>
      <button type="button" onClick={togglePlay}>
        play pause
      </button>
      <button type="button" onClick={back}>
        back
      </button>
      <button type="button" onClick={goToMainMenu}>
        home
      </button>
    </>
  );
}

function renderController(controller: ReactPodScreenController) {
  return render(
    <ReactPodProvider
      deviceName="Controller Pod"
      menuItems={[{ id: "coverflow", label: "Coverflow" }]}
      photoAlbums={[]}
      coverflowAlbums={albums}
      sliderItems={[]}
      tracks={tracks}
      coverflowAriaLabel="Controller coverflow"
    >
      <ControllerHarness controller={controller} />
    </ReactPodProvider>,
  );
}

function getState() {
  return JSON.parse(
    screen.getByTestId("state").textContent ?? "{}",
  ) as ReactPodState;
}

function enterControlledScreen() {
  fireEvent.click(screen.getByRole("button", { name: "select" }));
  expect(getState().screen).toBe("coverflow");
}

describe("ReactPod active screen controllers", () => {
  it("keeps a newer registration when an older cleanup runs", () => {
    const registry = createReactPodScreenControllerRegistry();
    const sharedController = {};
    const firstCleanup = registry.register("coverflow", sharedController);
    const latestCleanup = registry.register("coverflow", sharedController);
    const songsCleanup = registry.register("songs", sharedController);

    firstCleanup();
    expect(registry.get("coverflow")).toBe(sharedController);
    expect(registry.get("songs")).toBe(sharedController);

    latestCleanup();
    expect(registry.get("coverflow")).toBeUndefined();
    expect(registry.get("songs")).toBe(sharedController);

    songsCleanup();
    expect(registry.get("songs")).toBeUndefined();
  });

  it("routes active screen handlers before the built-in reducer behavior", () => {
    const navigate = vi.fn();
    const select = vi.fn();
    const previous = vi.fn();
    const next = vi.fn();
    const playPause = vi.fn();
    renderController({ navigate, select, previous, next, playPause });
    enterControlledScreen();

    fireEvent.click(screen.getByRole("button", { name: "rotate" }));
    expect(navigate).toHaveBeenCalledWith(1, { source: "rotate" });
    expect(getState().coverflowIndex).toBe(0);

    navigate.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "previous" }));
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    expect(previous).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(getState().currentTrackIndex).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "select" }));
    fireEvent.click(screen.getByRole("button", { name: "play pause" }));
    expect(select).toHaveBeenCalledTimes(1);
    expect(playPause).toHaveBeenCalledTimes(1);
    expect(getState().isPlaying).toBe(false);
  });

  it("uses navigate for previous and next when explicit handlers are absent", () => {
    const navigate = vi.fn();
    renderController({ navigate });
    enterControlledScreen();

    fireEvent.click(screen.getByRole("button", { name: "previous" }));
    fireEvent.click(screen.getByRole("button", { name: "next" }));

    expect(navigate).toHaveBeenNthCalledWith(1, -1, { source: "previous" });
    expect(navigate).toHaveBeenNthCalledWith(2, 1, { source: "next" });
    expect(getState().currentTrackIndex).toBe(0);
  });

  it("falls back per action when the active controller has no matching handler", () => {
    const select = vi.fn();
    renderController({ select });
    enterControlledScreen();

    fireEvent.click(screen.getByRole("button", { name: "rotate" }));
    expect(getState().coverflowIndex).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "play pause" }));
    expect(getState().isPlaying).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "next" }));
    expect(getState().currentTrackIndex).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "select" }));
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("consumes disabled controller input while preserving back and home", () => {
    const navigate = vi.fn();
    const select = vi.fn();
    const previous = vi.fn();
    const next = vi.fn();
    const playPause = vi.fn();
    renderController({
      disabled: true,
      navigate,
      select,
      previous,
      next,
      playPause,
    });
    enterControlledScreen();
    const initialControlledState = getState();

    fireEvent.click(screen.getByRole("button", { name: "rotate" }));
    fireEvent.click(screen.getByRole("button", { name: "select" }));
    fireEvent.click(screen.getByRole("button", { name: "previous" }));
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    fireEvent.click(screen.getByRole("button", { name: "play pause" }));

    expect(getState()).toEqual(initialControlledState);
    expect(navigate).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(previous).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(playPause).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "back" }));
    expect(getState().screen).toBe("menu");

    enterControlledScreen();
    fireEvent.click(screen.getByRole("button", { name: "home" }));
    expect(getState().screen).toBe("menu");
  });
});
