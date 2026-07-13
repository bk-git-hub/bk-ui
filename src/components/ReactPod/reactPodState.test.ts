import { describe, expect, it } from "vitest";
import {
  getNextTrackIndex,
  initialReactPodState,
  MAIN_MENU_ITEMS,
  reactPodReducer,
  TRACKS,
} from "./reactPodState";
import type {
  ReactPodCoverflowAlbum,
  ReactPodPhotoAlbum,
  ReactPodState,
} from "./reactPodState";

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

const COVERFLOW_ALBUMS = [
  {
    id: "night-drive",
    title: "Night Drive",
    coverSrc: "/night-drive.webp",
    coverAlt: "Night Drive cover",
    tracks: [],
  },
  {
    id: "sea-glass",
    title: "Sea Glass",
    coverSrc: "/sea-glass.webp",
    coverAlt: "Sea Glass cover",
    tracks: [],
  },
  {
    id: "paper-moon",
    title: "Paper Moon",
    coverSrc: "/paper-moon.webp",
    coverAlt: "Paper Moon cover",
    tracks: [],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

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

  it("returns from a selected song one menu at a time", () => {
    const songsMenu = { ...initialReactPodState, menuIndex: 1 };
    const songs = reactPodReducer(songsMenu, { type: "SELECT" });
    expect(songs.screen).toBe("songs");

    const selectedSong = { ...songs, songIndex: 2 };
    const nowPlaying = reactPodReducer(selectedSong, { type: "SELECT" });
    expect(nowPlaying).toMatchObject({
      screen: "now-playing",
      navigationHistory: ["menu", "songs"],
      currentTrackIndex: 2,
      isPlaying: true,
      progress: 0,
    });

    const returnedToSongs = reactPodReducer(nowPlaying, { type: "BACK" });
    expect(returnedToSongs).toMatchObject({
      screen: "songs",
      navigationHistory: ["menu"],
      songIndex: 2,
      currentTrackIndex: 2,
      isPlaying: true,
    });

    const returnedToMain = reactPodReducer(returnedToSongs, { type: "BACK" });
    expect(returnedToMain).toMatchObject({
      screen: "menu",
      navigationHistory: [],
    });
  });

  it("returns directly opened Now Playing to the main menu", () => {
    const nowPlaying = reactPodReducer(initialReactPodState, {
      type: "SELECT",
    });

    expect(nowPlaying).toMatchObject({
      screen: "now-playing",
      navigationHistory: ["menu"],
    });
    expect(reactPodReducer(nowPlaying, { type: "BACK" })).toMatchObject({
      screen: "menu",
      navigationHistory: [],
    });
  });

  it("enters Coverflow through the menu and returns through history", () => {
    const coverflowMenuIndex = MAIN_MENU_ITEMS.findIndex(
      (item) => item.id === "coverflow",
    );
    const coverflow = reactPodReducer(
      { ...initialReactPodState, menuIndex: coverflowMenuIndex },
      { type: "SELECT" },
    );

    expect(coverflow).toMatchObject({
      screen: "coverflow",
      navigationHistory: ["menu"],
    });
    expect(reactPodReducer(coverflow, { type: "BACK" })).toMatchObject({
      screen: "menu",
      navigationHistory: [],
      menuIndex: coverflowMenuIndex,
    });
  });

  it("moves and synchronizes the Coverflow index without wrapping", () => {
    let state: ReactPodState = {
      ...initialReactPodState,
      screen: "coverflow",
    };

    state = reactPodReducer(
      state,
      { type: "ROTATE", direction: 1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      COVERFLOW_ALBUMS,
    );
    expect(state.coverflowIndex).toBe(1);

    state = reactPodReducer(
      state,
      { type: "ROTATE", direction: -1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      COVERFLOW_ALBUMS,
    );
    state = reactPodReducer(
      state,
      { type: "ROTATE", direction: -1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      COVERFLOW_ALBUMS,
    );
    expect(state.coverflowIndex).toBe(0);

    state = reactPodReducer(
      state,
      { type: "ROTATE", direction: 1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      COVERFLOW_ALBUMS,
    );
    state = reactPodReducer(
      state,
      { type: "ROTATE", direction: 1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      COVERFLOW_ALBUMS,
    );
    state = reactPodReducer(
      state,
      { type: "ROTATE", direction: 1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      COVERFLOW_ALBUMS,
    );
    expect(state.coverflowIndex).toBe(2);

    state = reactPodReducer(
      state,
      { type: "SET_COVERFLOW_INDEX", index: 1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      COVERFLOW_ALBUMS,
    );
    expect(state.coverflowIndex).toBe(1);

    state = reactPodReducer(
      state,
      { type: "SYNC_COVERFLOW_ALBUMS" },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      COVERFLOW_ALBUMS.slice(0, 1),
    );
    expect(state.coverflowIndex).toBe(0);

    const emptyState = reactPodReducer(
      state,
      { type: "ROTATE", direction: -1 },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
      [],
    );
    expect(emptyState).toBe(state);
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

  it("navigates from photo albums through a thumbnail grid and viewer", () => {
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
    expect(state).toMatchObject({ screen: "photo-grid", photoIndex: 0 });

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
    expect(state).toMatchObject({ screen: "photo-grid", photoIndex: 0 });

    state = reactPodReducer(
      state,
      { type: "PREVIOUS" },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state).toMatchObject({ screen: "photo-grid", photoIndex: 2 });

    state = reactPodReducer(
      state,
      { type: "SELECT" },
      MAIN_MENU_ITEMS,
      PHOTO_ALBUMS,
    );
    expect(state).toMatchObject({ screen: "photo-viewer", photoIndex: 2 });

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
    expect(state).toMatchObject({ screen: "photo-grid", photoIndex: 2 });

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
    for (const screen of ["photo-grid", "photo-viewer"] as const) {
      const withoutPhotos = reactPodReducer(
        { ...clamped, screen },
        { type: "SYNC_PHOTO_ALBUMS" },
        MAIN_MENU_ITEMS,
        emptyAlbum,
      );
      expect(withoutPhotos).toMatchObject({
        screen: "photo-albums",
        albumIndex: 0,
        photoIndex: 0,
      });
    }
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

  it("goes straight to the main menu from a nested screen", () => {
    const nestedState = {
      ...initialReactPodState,
      screen: "photo-viewer" as const,
      navigationHistory: ["menu", "photo-albums", "photo-grid"] as const,
      albumIndex: 1,
      photoIndex: 2,
    };

    expect(
      reactPodReducer(nestedState, { type: "GO_TO_MAIN_MENU" }),
    ).toMatchObject({
      screen: "menu",
      navigationHistory: [],
      albumIndex: 1,
      photoIndex: 2,
    });
  });
});
