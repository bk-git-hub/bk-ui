import { describe, expect, it } from "vitest";
import {
  getNextTrackIndex,
  initialReactPodState,
  reactPodReducer,
  TRACKS,
} from "./reactPodState";

describe("reactPodReducer", () => {
  it("wraps menu and song navigation", () => {
    const wrappedMenu = reactPodReducer(initialReactPodState, {
      type: "ROTATE",
      direction: -1,
    });
    expect(wrappedMenu.menuIndex).toBe(3);

    const songs = { ...initialReactPodState, screen: "songs" as const };
    const wrappedSongs = reactPodReducer(songs, {
      type: "ROTATE",
      direction: -1,
    });
    expect(wrappedSongs.songIndex).toBe(TRACKS.length - 1);
  });

  it("opens songs and starts the selected track", () => {
    const songsMenu = { ...initialReactPodState, menuIndex: 1 };
    const songs = reactPodReducer(songsMenu, { type: "SELECT" });
    expect(songs.screen).toBe("songs");

    const selectedSong = { ...songs, songIndex: 2 };
    const nowPlaying = reactPodReducer(selectedSong, { type: "SELECT" });
    expect(nowPlaying).toMatchObject({
      screen: "now-playing",
      currentTrackIndex: 2,
      isPlaying: true,
      progress: 0,
    });
  });

  it("clamps volume and restarts or changes the previous track", () => {
    const loud = {
      ...initialReactPodState,
      screen: "now-playing" as const,
      volume: 100,
    };
    expect(reactPodReducer(loud, { type: "ROTATE", direction: 1 }).volume).toBe(
      100,
    );

    const restarted = reactPodReducer(
      { ...loud, progress: 10, currentTrackIndex: 2 },
      { type: "PREVIOUS" },
    );
    expect(restarted).toMatchObject({ progress: 0, currentTrackIndex: 2 });

    const previous = reactPodReducer(
      { ...loud, progress: 0, currentTrackIndex: 0 },
      { type: "PREVIOUS" },
    );
    expect(previous.currentTrackIndex).toBe(TRACKS.length - 1);
  });

  it("selects a different next track while shuffling", () => {
    const state = {
      ...initialReactPodState,
      currentTrackIndex: 1,
      isShuffling: true,
    };
    expect(getNextTrackIndex(state, 0)).toBe(2);
    expect(getNextTrackIndex(state, 0.999)).not.toBe(1);
  });
});
