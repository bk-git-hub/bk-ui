import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import { ReactPodContext } from "./ReactPodContext";
import {
  createReactPodScreenControllerRegistry,
  routeReactPodScreenAction,
  routeReactPodScreenNavigation,
} from "./ReactPodActiveScreenController";
import {
  getNextTrackIndex,
  initialReactPodState,
  reactPodReducer,
} from "./reactPodState";
import type {
  ReactPodAction,
  ReactPodCoverflowAlbum,
  ReactPodMenuItem,
  ReactPodPhotoAlbum,
  ReactPodSliderItem,
  ReactPodState,
  ReactPodTrack,
} from "./reactPodState";

interface ReactPodProviderProps {
  children: ReactNode;
  deviceName: string;
  menuItems: readonly ReactPodMenuItem[];
  photoAlbums: readonly ReactPodPhotoAlbum[];
  coverflowAlbums: readonly ReactPodCoverflowAlbum[];
  sliderItems: readonly ReactPodSliderItem[];
  tracks: readonly ReactPodTrack[];
  coverflowAriaLabel: string;
}

export function ReactPodProvider({
  children,
  deviceName,
  menuItems,
  photoAlbums,
  coverflowAlbums,
  sliderItems,
  tracks,
  coverflowAriaLabel,
}: ReactPodProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const screenControllerRegistryRef = useRef<ReturnType<
    typeof createReactPodScreenControllerRegistry
  > | null>(null);
  if (screenControllerRegistryRef.current === null) {
    screenControllerRegistryRef.current =
      createReactPodScreenControllerRegistry();
  }
  const screenControllerRegistry = screenControllerRegistryRef.current;
  const reducer = useCallback(
    (state: ReactPodState, action: ReactPodAction) =>
      reactPodReducer(
        state,
        action,
        menuItems,
        photoAlbums,
        coverflowAlbums,
        tracks,
      ),
    [menuItems, photoAlbums, coverflowAlbums, tracks],
  );
  const [state, dispatch] = useReducer(reducer, initialReactPodState);

  useEffect(() => {
    dispatch({ type: "SYNC_MENU_ITEMS", menuLength: menuItems.length });
  }, [menuItems.length]);

  useEffect(() => {
    dispatch({ type: "SYNC_PHOTO_ALBUMS" });
  }, [photoAlbums]);

  useEffect(() => {
    dispatch({ type: "SYNC_COVERFLOW_ALBUMS" });
  }, [coverflowAlbums]);

  useEffect(() => {
    dispatch({ type: "SYNC_SLIDER_ITEMS", itemCount: sliderItems.length });
  }, [sliderItems.length]);

  useEffect(() => {
    dispatch({ type: "SYNC_TRACKS" });
  }, [tracks]);

  const requestTrackPlayback = useCallback(
    (trackIndex: number) => {
      const audio = audioRef.current;
      const track = tracks[trackIndex];
      if (!audio || !track?.src) return;

      if (audio.getAttribute("src") !== track.src) {
        audio.src = track.src;
        audio.load();
      }

      try {
        const playRequest = audio.play();
        void playRequest?.catch(() => {
          dispatch({ type: "SET_PLAYING", isPlaying: false });
        });
      } catch {
        dispatch({ type: "SET_PLAYING", isPlaying: false });
      }
    },
    [tracks],
  );

  const rotate = useCallback(
    (direction: -1 | 1) => {
      if (
        routeReactPodScreenNavigation(
          screenControllerRegistry.get(state.screen),
          direction,
          "rotate",
        )
      ) {
        return;
      }

      dispatch({ type: "ROTATE", direction });
    },
    [screenControllerRegistry, state.screen],
  );

  const setCoverflowIndex = useCallback((index: number) => {
    dispatch({ type: "SET_COVERFLOW_INDEX", index });
  }, []);

  const setSliderIndex = useCallback(
    (
      screen: "slicer-slider" | "expo-slider" | "cards-stack-slider",
      index: number,
    ) => {
      dispatch({ type: "SET_SLIDER_INDEX", screen, index });
    },
    [],
  );

  const select = useCallback(() => {
    if (
      routeReactPodScreenAction(
        screenControllerRegistry.get(state.screen),
        "select",
      )
    ) {
      return;
    }

    const shuffledTrackIndex =
      tracks.length === 0
        ? undefined
        : Math.floor(Math.random() * tracks.length);
    const selectedMenuItem = menuItems[state.menuIndex];
    const playbackTrackIndex =
      state.screen === "songs"
        ? state.songIndex
        : state.screen === "menu" && selectedMenuItem?.id === "shuffle"
          ? shuffledTrackIndex
          : undefined;

    dispatch({
      type: "SELECT",
      shuffledTrackIndex,
    });
    if (playbackTrackIndex !== undefined) {
      requestTrackPlayback(playbackTrackIndex);
    }
  }, [
    menuItems,
    requestTrackPlayback,
    screenControllerRegistry,
    state,
    tracks.length,
  ]);

  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const goToMainMenu = useCallback(
    () => dispatch({ type: "GO_TO_MAIN_MENU" }),
    [],
  );
  const togglePlay = useCallback(() => {
    if (
      routeReactPodScreenAction(
        screenControllerRegistry.get(state.screen),
        "playPause",
      )
    ) {
      return;
    }

    const currentTrack = tracks[state.currentTrackIndex];
    const audio = audioRef.current;
    if (!currentTrack?.src || !audio) {
      dispatch({ type: "TOGGLE_PLAY" });
      return;
    }

    if (state.isPlaying) {
      dispatch({ type: "SET_PLAYING", isPlaying: false });
      audio.pause();
      return;
    }

    dispatch({ type: "SET_PLAYING", isPlaying: true });
    requestTrackPlayback(state.currentTrackIndex);
  }, [
    requestTrackPlayback,
    screenControllerRegistry,
    state.currentTrackIndex,
    state.isPlaying,
    state.screen,
    tracks,
  ]);

  const previous = useCallback(() => {
    if (
      routeReactPodScreenNavigation(
        screenControllerRegistry.get(state.screen),
        -1,
        "previous",
      )
    ) {
      return;
    }

    if (state.screen === "photo-grid" || state.screen === "photo-viewer") {
      dispatch({ type: "PREVIOUS" });
      return;
    }
    if (tracks.length === 0) return;

    const audio = audioRef.current;
    const shouldRestart = Math.max(state.progress, audio?.currentTime ?? 0) > 3;
    dispatch({ type: "PREVIOUS" });

    if (shouldRestart) {
      if (audio) audio.currentTime = 0;
      return;
    }

    const previousTrackIndex =
      (state.currentTrackIndex - 1 + tracks.length) % tracks.length;
    requestTrackPlayback(previousTrackIndex);
  }, [requestTrackPlayback, screenControllerRegistry, state, tracks.length]);

  const next = useCallback(() => {
    if (
      routeReactPodScreenNavigation(
        screenControllerRegistry.get(state.screen),
        1,
        "next",
      )
    ) {
      return;
    }

    if (state.screen === "photo-grid" || state.screen === "photo-viewer") {
      dispatch({ type: "NEXT", trackIndex: 0 });
      return;
    }
    if (tracks.length === 0) return;

    const trackIndex = getNextTrackIndex(state, Math.random(), tracks.length);
    dispatch({ type: "NEXT", trackIndex });
    requestTrackPlayback(trackIndex);
  }, [requestTrackPlayback, screenControllerRegistry, state, tracks.length]);

  const registerScreenController = screenControllerRegistry.register;

  const currentTrack = tracks[state.currentTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.src) return;

    audio.volume = state.volume / 100;
    if (state.isPlaying && audio.paused) {
      requestTrackPlayback(state.currentTrackIndex);
    } else if (!state.isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [
    currentTrack?.src,
    requestTrackPlayback,
    state.currentTrackIndex,
    state.isPlaying,
    state.volume,
  ]);

  useEffect(() => {
    if (!state.isPlaying || currentTrack?.src) return;

    const timer = window.setTimeout(() => {
      if (!currentTrack) return;

      if (state.progress + 1 >= currentTrack.duration) {
        dispatch({
          type: "ADVANCE_TRACK",
          trackIndex: getNextTrackIndex(state, Math.random(), tracks.length),
        });
      } else {
        dispatch({ type: "TICK" });
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [currentTrack, state, tracks.length]);

  const handleAudioEnded = useCallback(() => {
    if (tracks.length === 0) return;
    const trackIndex = getNextTrackIndex(state, Math.random(), tracks.length);
    dispatch({ type: "ADVANCE_TRACK", trackIndex });
    requestTrackPlayback(trackIndex);
  }, [requestTrackPlayback, state, tracks.length]);

  const value = useMemo(
    () => ({
      state,
      deviceName,
      menuItems,
      photoAlbums,
      coverflowAlbums,
      sliderItems,
      tracks,
      coverflowAriaLabel,
      rotate,
      setCoverflowIndex,
      setSliderIndex,
      select,
      back,
      goToMainMenu,
      togglePlay,
      next,
      previous,
      registerScreenController,
    }),
    [
      state,
      deviceName,
      menuItems,
      photoAlbums,
      coverflowAlbums,
      sliderItems,
      tracks,
      coverflowAriaLabel,
      rotate,
      setCoverflowIndex,
      setSliderIndex,
      select,
      back,
      goToMainMenu,
      togglePlay,
      next,
      previous,
      registerScreenController,
    ],
  );

  return (
    <ReactPodContext.Provider value={value}>
      {children}
      {currentTrack?.src && (
        <audio
          ref={audioRef}
          data-slot="react-pod-audio"
          preload="metadata"
          hidden
          onPlay={() => dispatch({ type: "SET_PLAYING", isPlaying: true })}
          onPause={() => dispatch({ type: "SET_PLAYING", isPlaying: false })}
          onTimeUpdate={(event) =>
            dispatch({
              type: "SET_PROGRESS",
              progress: Math.floor(event.currentTarget.currentTime),
            })
          }
          onEnded={handleAudioEnded}
          onError={() => dispatch({ type: "SET_PLAYING", isPlaying: false })}
        >
          <source src={currentTrack.src} />
        </audio>
      )}
    </ReactPodContext.Provider>
  );
}
