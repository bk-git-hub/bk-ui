import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReactPod from "./ReactPod";
import type { ReactPodTrack } from "./ReactPod";

const AUDIO_TRACKS = [
  {
    id: "first",
    title: "First Song",
    artist: "Demo Artist",
    album: "First Album",
    duration: 120,
    src: "/audio/first.mp3",
    artworkSrc: "/covers/first.jpg",
    artworkAlt: "First Album cover",
  },
  {
    id: "second",
    title: "Second Song",
    artist: "Demo Artist",
    album: "Second Album",
    duration: 180,
    src: "/audio/second.mp3",
    artworkSrc: "/covers/second.jpg",
    artworkAlt: "Second Album cover",
  },
] satisfies readonly ReactPodTrack[];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReactPod native audio", () => {
  it("plays injected tracks and synchronizes progress, volume, and artwork", async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
    const load = vi
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => undefined);

    const { container } = render(
      <ReactPod
        menuItems={[
          { id: "songs", label: "Songs" },
          { id: "now-playing", label: "Now Playing" },
        ]}
        tracks={AUDIO_TRACKS}
      />,
    );

    const audio = container.querySelector<HTMLAudioElement>(
      '[data-slot="react-pod-audio"]',
    );
    expect(audio).not.toBeNull();
    expect(audio?.querySelector("source")).toHaveAttribute(
      "src",
      "/audio/first.mp3",
    );
    expect(audio).not.toHaveAttribute("src");
    expect(audio).toHaveAttribute("preload", "metadata");
    expect(audio?.volume).toBeCloseTo(0.6);

    const wheel = screen.getByLabelText(/Click wheel/);
    fireEvent.keyDown(wheel, { key: "Enter" });
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.keyDown(wheel, { key: "Enter" });

    expect(load).toHaveBeenCalled();
    expect(play).toHaveBeenCalled();
    expect(audio).toHaveAttribute("src", "/audio/second.mp3");
    expect(screen.getByText("Second Song")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Second Album cover" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      writable: true,
      value: 42,
    });
    fireEvent.timeUpdate(audio as HTMLAudioElement);
    expect(screen.getByText("0:42")).toBeInTheDocument();

    fireEvent.wheel(wheel, { deltaY: 1 });
    expect(audio?.volume).toBeCloseTo(0.65);

    fireEvent.ended(audio as HTMLAudioElement);
    expect(screen.getByText("First Song")).toBeInTheDocument();
    expect(audio).toHaveAttribute("src", "/audio/first.mp3");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("returns to paused state when native playback is rejected", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(
      () => undefined,
    );
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(
      new DOMException("Playback blocked", "NotAllowedError"),
    );

    render(
      <ReactPod
        menuItems={[{ id: "songs", label: "Songs" }]}
        tracks={AUDIO_TRACKS}
      />,
    );

    const wheel = screen.getByLabelText(/Click wheel/);
    fireEvent.keyDown(wheel, { key: "Enter" });
    fireEvent.keyDown(wheel, { key: "Enter" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
        "aria-pressed",
        "false",
      ),
    );
  });

  it("renders stable empty states for an empty injected library", () => {
    render(
      <ReactPod menuItems={[{ id: "songs", label: "Songs" }]} tracks={[]} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(screen.getByText("No Songs")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="react-pod-audio"]'),
    ).not.toBeInTheDocument();
  });
});
