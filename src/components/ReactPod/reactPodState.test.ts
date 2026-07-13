import { describe, expect, it } from "vitest";
import {
  getNextTrackIndex,
  initialReactPodState,
  MAIN_MENU_ITEMS,
  reactPodReducer,
  TRACKS,
} from "./reactPodState";
import type { ReactPodPhotoAlbum } from "./reactPodState";

const PHOTO_ALBUMS = [
  {
    id: "city-lights",
    title: "City Lights",
    photos: [{ id: "city-1", src: "/city-1.webp", alt: "City at night" }],
  },
  {
    id: "summer-trip",
    title: "Summer Trip",
    photos: [
      { id: "summer-1", src: "/summer-1.webp", alt: "Beach at sunset" },
      { id: "summer-2", src: "/summer-2.webp", alt: "Coastal road" },
      { id: "summer-3", src: "/summer-3.webp", alt: "Blue ocean" },
    ],
  },
] satisfies readonly ReactPodPhotoAlbum[];

describe("reactPodReducer", () => {
  it("wraps menu and song navigation", () => {
    const wrappedMenu = reactPodReducer(initialReactPodState, {
      type: "ROTATE",
      direction: -1,
    });
    expect(wrappedMenu.menuIndex).toBe(MAIN_MENU_ITEMS.length - 1);

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

  it("navigates from photo albums into a viewer and back through each level", () => {
    const photosMenuIndex = MAIN_MENU_ITEMS.findIndex(
      (item) => item.id === "photos",
    );
    let state = reactPodReducer(
      { ...initialReactPodState, menuIndex: photosMenuIndex },
      { type: "SELECT" },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );

    expect(state).toMatchObject({
      screen: "photo-albums",
      albumIndex: 0,
      photoIndex: 0,
    });

    state = reactPodReducer(
      state,
      { type: "ROTATE", direction: 1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state.albumIndex).toBe(1);

    state = reactPodReducer(
      state,
      { type: "SELECT" },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state).toMatchObject({ screen: "photo-viewer", photoIndex: 0 });

    state = reactPodReducer(
      state,
      { type: "ROTATE", direction: -1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state.photoIndex).toBe(2);

    state = reactPodReducer(
      state,
      { type: "NEXT", trackIndex: 0 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state.photoIndex).toBe(0);

    state = reactPodReducer(
      state,
      { type: "PREVIOUS" },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state.photoIndex).toBe(2);

    state = reactPodReducer(
      state,
      { type: "BACK" },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state.screen).toBe("photo-albums");

    state = reactPodReducer(
      state,
      { type: "BACK" },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state.screen).toBe("menu");
  });

  it("clamps photo selection when albums or photos are removed", () => {
    const viewingLastPhoto = {
      ...initialReactPodState,
      screen: "photo-viewer" as const,
      albumIndex: 1,
      photoIndex: 2,
    };
    const onePhotoAlbum = [
      {
        id: "remaining",
        title: "Remaining",
        photos: [
          { id: "remaining-1", src: "/remaining.webp", alt: "A keepsake" },
        ],
      },
    ] satisfies readonly ReactPodPhotoAlbum[];

    const clamped = reactPodReducer(
      viewingLastPhoto,
      { type: "SYNC_PHOTO_ALBUMS" },
      MAIN_MENU_ITEMS,
      onePhotoAlbum,
    );
    expect(clamped).toMatchObject({
      screen: "photo-viewer",
      albumIndex: 0,
      photoIndex: 0,
    });

    const emptyAlbum = [{ ...onePhotoAlbum[0], photos: [] }];
    const withoutPhotos = reactPodReducer(
      clamped,
      { type: "SYNC_PHOTO_ALBUMS" },
      MAIN_MENU_ITEMS,
      emptyAlbum,
    );
    expect(withoutPhotos).toMatchObject({
      screen: "photo-albums",
      albumIndex: 0,
      photoIndex: 0,
    });
  });

  it("continues to the next track when playback ends in the photo viewer", () => {
    const viewingPhotosWhilePlaying = {
      ...initialReactPodState,
      screen: "photo-viewer" as const,
      currentTrackIndex: 0,
      photoIndex: 1,
      progress: TRACKS[0].duration,
      isPlaying: true,
    };

    const advanced = reactPodReducer(
      viewingPhotosWhilePlaying,
      { type: "ADVANCE_TRACK", trackIndex: 1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );

    expect(advanced).toMatchObject({
      screen: "photo-viewer",
      currentTrackIndex: 1,
      photoIndex: 1,
      progress: 0,
      isPlaying: true,
    });
  });
});
