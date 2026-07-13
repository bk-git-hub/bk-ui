export type ReactPodScreen =
  | "menu"
  | "songs"
  | "now-playing"
  | "photo-albums"
  | "photo-grid"
  | "photo-viewer"
  | "coverflow"
  | "about";

export type ReactPodMenuItemId =
  | "now-playing"
  | "songs"
  | "photos"
  | "coverflow"
  | "shuffle"
  | "about";

export interface ReactPodMenuItem {
  id: ReactPodMenuItemId;
  label: string;
}

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork: string;
}

export interface ReactPodPhoto {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface ReactPodPhotoAlbum {
  id: string;
  title: string;
  photos: readonly ReactPodPhoto[];
}

export interface ReactPodCoverflowTrack {
  id: string;
  title: string;
}

export interface ReactPodCoverflowAlbum {
  id: string;
  title: string;
  coverSrc: string;
  coverAlt: string;
  tracks: readonly ReactPodCoverflowTrack[];
}

export const TRACKS: Track[] = [
  {
    id: 1,
    title: "Midnight Drive",
    artist: "BK Waves",
    album: "Neon Avenue",
    duration: 214,
    artwork: "linear-gradient(145deg, #172554 5%, #7c3aed 55%, #f472b6)",
  },
  {
    id: 2,
    title: "Soft Focus",
    artist: "Paper Satellites",
    album: "Daydreams",
    duration: 188,
    artwork: "linear-gradient(145deg, #164e63, #22d3ee 55%, #fde68a)",
  },
  {
    id: 3,
    title: "Seoul at 2AM",
    artist: "Night Bus",
    album: "Last Stop",
    duration: 242,
    artwork: "linear-gradient(145deg, #111827, #2563eb 55%, #f97316)",
  },
  {
    id: 4,
    title: "Polaroid Summer",
    artist: "Small Hours",
    album: "Postcards",
    duration: 201,
    artwork: "linear-gradient(145deg, #be123c, #fb7185 50%, #fef3c7)",
  },
  {
    id: 5,
    title: "Cloud Arcade",
    artist: "Pixel Hearts",
    album: "Continue?",
    duration: 176,
    artwork: "linear-gradient(145deg, #312e81, #06b6d4 55%, #a3e635)",
  },
];

export const MAIN_MENU_ITEMS: readonly ReactPodMenuItem[] = [
  { id: "now-playing", label: "Now Playing" },
  { id: "songs", label: "Songs" },
  { id: "photos", label: "Photos" },
  { id: "coverflow", label: "Coverflow" },
  { id: "shuffle", label: "Shuffle Songs" },
  { id: "about", label: "About" },
];

export interface ReactPodState {
  screen: ReactPodScreen;
  navigationHistory: readonly ReactPodScreen[];
  menuIndex: number;
  songIndex: number;
  albumIndex: number;
  photoIndex: number;
  coverflowIndex: number;
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isShuffling: boolean;
}

export const initialReactPodState: ReactPodState = {
  screen: "menu",
  navigationHistory: [],
  menuIndex: 0,
  songIndex: 0,
  albumIndex: 0,
  photoIndex: 0,
  coverflowIndex: 0,
  currentTrackIndex: 0,
  isPlaying: false,
  progress: 0,
  volume: 60,
  isShuffling: false,
};

export type ReactPodAction =
  | { type: "ROTATE"; direction: -1 | 1 }
  | { type: "SELECT"; shuffledTrackIndex?: number }
  | { type: "BACK" }
  | { type: "GO_TO_MAIN_MENU" }
  | { type: "TOGGLE_PLAY" }
  | { type: "NEXT"; trackIndex: number }
  | { type: "ADVANCE_TRACK"; trackIndex: number }
  | { type: "PREVIOUS" }
  | { type: "TICK" }
  | { type: "SYNC_MENU_ITEMS"; menuLength: number }
  | { type: "SYNC_PHOTO_ALBUMS" }
  | { type: "SET_COVERFLOW_INDEX"; index: number }
  | { type: "SYNC_COVERFLOW_ALBUMS" };

function wrap(value: number, length: number) {
  return (value + length) % length;
}

function clampMenuIndex(menuIndex: number, menuLength: number) {
  if (menuLength === 0) return 0;
  return Math.min(menuIndex, menuLength - 1);
}

function clampIndex(index: number, length: number) {
  if (length === 0 || !Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(Math.round(index), length - 1));
}

function navigateTo(
  state: ReactPodState,
  screen: ReactPodScreen,
  updates: Partial<Omit<ReactPodState, "screen" | "navigationHistory">> = {},
): ReactPodState {
  if (screen === state.screen) return { ...state, ...updates };

  return {
    ...state,
    ...updates,
    screen,
    navigationHistory: [...state.navigationHistory, state.screen],
  };
}

function getFallbackPreviousScreen(screen: ReactPodScreen): ReactPodScreen {
  if (screen === "photo-viewer") return "photo-grid";
  if (screen === "photo-grid") return "photo-albums";
  return "menu";
}

function rewindHistoryTo(
  navigationHistory: readonly ReactPodScreen[],
  screen: ReactPodScreen,
) {
  const screenIndex = navigationHistory.lastIndexOf(screen);
  return screenIndex === -1
    ? navigationHistory
    : navigationHistory.slice(0, screenIndex);
}

function syncPhotoSelection(
  state: ReactPodState,
  photoAlbums: readonly ReactPodPhotoAlbum[],
) {
  const albumIndex = clampIndex(state.albumIndex, photoAlbums.length);
  const photoLength = photoAlbums[albumIndex]?.photos.length ?? 0;
  const photoIndex = clampIndex(state.photoIndex, photoLength);
  const screen =
    (state.screen === "photo-grid" || state.screen === "photo-viewer") &&
    photoLength === 0
      ? "photo-albums"
      : state.screen;
  const navigationHistory =
    screen === state.screen
      ? state.navigationHistory
      : rewindHistoryTo(state.navigationHistory, screen);

  if (
    albumIndex === state.albumIndex &&
    photoIndex === state.photoIndex &&
    screen === state.screen &&
    navigationHistory === state.navigationHistory
  ) {
    return state;
  }

  return { ...state, albumIndex, photoIndex, screen, navigationHistory };
}

function advanceTrack(state: ReactPodState, trackIndex: number) {
  return {
    ...state,
    currentTrackIndex: trackIndex,
    songIndex: trackIndex,
    progress: 0,
    isPlaying: true,
  };
}

export function getNextTrackIndex(
  state: ReactPodState,
  randomValue = Math.random(),
) {
  if (!state.isShuffling) {
    return wrap(state.currentTrackIndex + 1, TRACKS.length);
  }

  if (TRACKS.length < 2) return 0;

  const offset = Math.floor(randomValue * (TRACKS.length - 1)) + 1;
  return wrap(state.currentTrackIndex + offset, TRACKS.length);
}

export function reactPodReducer(
  state: ReactPodState,
  action: ReactPodAction,
  menuItems: readonly ReactPodMenuItem[] = MAIN_MENU_ITEMS,
  photoAlbums: readonly ReactPodPhotoAlbum[] = [],
  coverflowAlbums: readonly ReactPodCoverflowAlbum[] = [],
): ReactPodState {
  switch (action.type) {
    case "ROTATE":
      if (state.screen === "menu") {
        if (menuItems.length === 0) return state;

        return {
          ...state,
          menuIndex: wrap(state.menuIndex + action.direction, menuItems.length),
        };
      }

      if (state.screen === "songs") {
        return {
          ...state,
          songIndex: wrap(state.songIndex + action.direction, TRACKS.length),
        };
      }

      if (state.screen === "now-playing") {
        return {
          ...state,
          volume: Math.min(
            100,
            Math.max(0, state.volume + action.direction * 5),
          ),
        };
      }

      if (state.screen === "photo-albums") {
        if (photoAlbums.length === 0) return state;

        return {
          ...state,
          albumIndex: wrap(
            state.albumIndex + action.direction,
            photoAlbums.length,
          ),
          photoIndex: 0,
        };
      }

      if (state.screen === "photo-grid" || state.screen === "photo-viewer") {
        const photoLength = photoAlbums[state.albumIndex]?.photos.length ?? 0;
        if (photoLength === 0) return state;

        return {
          ...state,
          photoIndex: wrap(state.photoIndex + action.direction, photoLength),
        };
      }

      if (state.screen === "coverflow") {
        if (coverflowAlbums.length === 0) return state;

        return {
          ...state,
          coverflowIndex: Math.max(
            0,
            Math.min(
              state.coverflowIndex + action.direction,
              coverflowAlbums.length - 1,
            ),
          ),
        };
      }

      return state;

    case "SELECT": {
      if (state.screen === "songs") {
        return navigateTo(state, "now-playing", {
          currentTrackIndex: state.songIndex,
          progress: 0,
          isPlaying: true,
          isShuffling: false,
        });
      }

      if (state.screen === "now-playing") {
        return { ...state, isPlaying: !state.isPlaying };
      }

      if (state.screen === "photo-albums") {
        const selectedAlbum = photoAlbums[state.albumIndex];
        if (!selectedAlbum || selectedAlbum.photos.length === 0) return state;

        return navigateTo(state, "photo-grid", { photoIndex: 0 });
      }

      if (state.screen === "photo-grid") {
        const selectedAlbum = photoAlbums[state.albumIndex];
        if (!selectedAlbum || selectedAlbum.photos.length === 0) return state;

        return navigateTo(state, "photo-viewer");
      }

      if (state.screen !== "menu") return state;

      const selectedItem = menuItems[state.menuIndex];
      if (!selectedItem) return state;

      if (selectedItem.id === "songs") {
        return navigateTo(state, "songs", {
          songIndex: state.currentTrackIndex,
        });
      }
      if (selectedItem.id === "about") {
        return navigateTo(state, "about");
      }
      if (selectedItem.id === "photos") {
        return navigateTo(state, "photo-albums", {
          albumIndex: clampIndex(state.albumIndex, photoAlbums.length),
          photoIndex: 0,
        });
      }
      if (selectedItem.id === "coverflow") {
        return navigateTo(state, "coverflow", {
          coverflowIndex: clampIndex(
            state.coverflowIndex,
            coverflowAlbums.length,
          ),
        });
      }
      if (selectedItem.id === "shuffle") {
        return navigateTo(state, "now-playing", {
          currentTrackIndex: action.shuffledTrackIndex ?? 0,
          progress: 0,
          isPlaying: true,
          isShuffling: true,
        });
      }
      return navigateTo(state, "now-playing");
    }

    case "BACK": {
      if (state.screen === "menu") return state;

      const previousScreen =
        state.navigationHistory[state.navigationHistory.length - 1] ??
        getFallbackPreviousScreen(state.screen);

      return {
        ...state,
        screen: previousScreen,
        navigationHistory: state.navigationHistory.slice(0, -1),
      };
    }

    case "GO_TO_MAIN_MENU":
      if (state.screen === "menu" && state.navigationHistory.length === 0) {
        return state;
      }
      return { ...state, screen: "menu", navigationHistory: [] };

    case "TOGGLE_PLAY":
      return { ...state, isPlaying: !state.isPlaying };

    case "NEXT":
      if (state.screen === "photo-grid" || state.screen === "photo-viewer") {
        const photoLength = photoAlbums[state.albumIndex]?.photos.length ?? 0;
        if (photoLength === 0) return state;

        return {
          ...state,
          photoIndex: wrap(state.photoIndex + 1, photoLength),
        };
      }

      return advanceTrack(state, action.trackIndex);

    case "ADVANCE_TRACK":
      return advanceTrack(state, action.trackIndex);

    case "PREVIOUS":
      if (state.screen === "photo-grid" || state.screen === "photo-viewer") {
        const photoLength = photoAlbums[state.albumIndex]?.photos.length ?? 0;
        if (photoLength === 0) return state;

        return {
          ...state,
          photoIndex: wrap(state.photoIndex - 1, photoLength),
        };
      }

      if (state.progress > 3) return { ...state, progress: 0 };
      return {
        ...state,
        currentTrackIndex: wrap(state.currentTrackIndex - 1, TRACKS.length),
        songIndex: wrap(state.currentTrackIndex - 1, TRACKS.length),
        progress: 0,
        isPlaying: true,
      };

    case "TICK":
      return {
        ...state,
        progress: Math.min(
          state.progress + 1,
          TRACKS[state.currentTrackIndex].duration,
        ),
      };

    case "SYNC_MENU_ITEMS": {
      const menuIndex = clampMenuIndex(state.menuIndex, action.menuLength);
      return menuIndex === state.menuIndex ? state : { ...state, menuIndex };
    }

    case "SYNC_PHOTO_ALBUMS":
      return syncPhotoSelection(state, photoAlbums);

    case "SET_COVERFLOW_INDEX": {
      const coverflowIndex = clampIndex(action.index, coverflowAlbums.length);
      return coverflowIndex === state.coverflowIndex
        ? state
        : { ...state, coverflowIndex };
    }

    case "SYNC_COVERFLOW_ALBUMS": {
      const coverflowIndex = clampIndex(
        state.coverflowIndex,
        coverflowAlbums.length,
      );
      return coverflowIndex === state.coverflowIndex
        ? state
        : { ...state, coverflowIndex };
    }
  }
}
