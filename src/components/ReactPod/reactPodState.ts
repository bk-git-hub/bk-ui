export type ReactPodScreen = "menu" | "songs" | "now-playing" | "about";

export type ReactPodMenuItemId = "now-playing" | "songs" | "shuffle" | "about";

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
  { id: "shuffle", label: "Shuffle Songs" },
  { id: "about", label: "About" },
];

export interface ReactPodState {
  screen: ReactPodScreen;
  menuIndex: number;
  songIndex: number;
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isShuffling: boolean;
}

export const initialReactPodState: ReactPodState = {
  screen: "menu",
  menuIndex: 0,
  songIndex: 0,
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
  | { type: "TOGGLE_PLAY" }
  | { type: "NEXT"; trackIndex: number }
  | { type: "PREVIOUS" }
  | { type: "TICK" }
  | { type: "SYNC_MENU_ITEMS"; menuLength: number };

function wrap(value: number, length: number) {
  return (value + length) % length;
}

function clampMenuIndex(menuIndex: number, menuLength: number) {
  if (menuLength === 0) return 0;
  return Math.min(menuIndex, menuLength - 1);
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

      return state;

    case "SELECT": {
      if (state.screen === "songs") {
        return {
          ...state,
          screen: "now-playing",
          currentTrackIndex: state.songIndex,
          progress: 0,
          isPlaying: true,
          isShuffling: false,
        };
      }

      if (state.screen === "now-playing") {
        return { ...state, isPlaying: !state.isPlaying };
      }

      if (state.screen !== "menu") return state;

      const selectedItem = menuItems[state.menuIndex];
      if (!selectedItem) return state;

      if (selectedItem.id === "songs") {
        return {
          ...state,
          screen: "songs",
          songIndex: state.currentTrackIndex,
        };
      }
      if (selectedItem.id === "about") {
        return { ...state, screen: "about" };
      }
      if (selectedItem.id === "shuffle") {
        return {
          ...state,
          screen: "now-playing",
          currentTrackIndex: action.shuffledTrackIndex ?? 0,
          progress: 0,
          isPlaying: true,
          isShuffling: true,
        };
      }
      return { ...state, screen: "now-playing" };
    }

    case "BACK":
      return state.screen === "menu" ? state : { ...state, screen: "menu" };

    case "TOGGLE_PLAY":
      return { ...state, isPlaying: !state.isPlaying };

    case "NEXT":
      return {
        ...state,
        currentTrackIndex: action.trackIndex,
        songIndex: action.trackIndex,
        progress: 0,
        isPlaying: true,
      };

    case "PREVIOUS":
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
  }
}
