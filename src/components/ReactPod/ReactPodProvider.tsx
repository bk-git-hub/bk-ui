import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { ReactPodContext } from "./ReactPodContext";
import {
  getNextTrackIndex,
  initialReactPodState,
  reactPodReducer,
  TRACKS,
} from "./reactPodState";
import type {
  ReactPodAction,
  ReactPodMenuItem,
  ReactPodPhotoAlbum,
  ReactPodState,
} from "./reactPodState";

interface ReactPodProviderProps {
  children: ReactNode;
  deviceName: string;
  menuItems: readonly ReactPodMenuItem[];
  photoAlbums: readonly ReactPodPhotoAlbum[];
}

export function ReactPodProvider({
  children,
  deviceName,
  menuItems,
  photoAlbums,
}: ReactPodProviderProps) {
  const reducer = useCallback(
    (state: ReactPodState, action: ReactPodAction) =>
      reactPodReducer(state, action, menuItems, photoAlbums),
    [menuItems, photoAlbums],
  );
  const [state, dispatch] = useReducer(reducer, initialReactPodState);

  useEffect(() => {
    dispatch({ type: "SYNC_MENU_ITEMS", menuLength: menuItems.length });
  }, [menuItems.length]);

  useEffect(() => {
    dispatch({ type: "SYNC_PHOTO_ALBUMS" });
  }, [photoAlbums]);

  const rotate = useCallback((direction: -1 | 1) => {
    dispatch({ type: "ROTATE", direction });
  }, []);

  const select = useCallback(() => {
    dispatch({
      type: "SELECT",
      shuffledTrackIndex: Math.floor(Math.random() * TRACKS.length),
    });
  }, []);

  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const togglePlay = useCallback(() => dispatch({ type: "TOGGLE_PLAY" }), []);
  const previous = useCallback(() => dispatch({ type: "PREVIOUS" }), []);
  const next = useCallback(() => {
    dispatch({ type: "NEXT", trackIndex: getNextTrackIndex(state) });
  }, [state]);

  useEffect(() => {
    if (!state.isPlaying) return;

    const timer = window.setTimeout(() => {
      const currentTrack = TRACKS[state.currentTrackIndex];
      if (state.progress + 1 >= currentTrack.duration) {
        dispatch({
          type: "ADVANCE_TRACK",
          trackIndex: getNextTrackIndex(state),
        });
      } else {
        dispatch({ type: "TICK" });
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [state]);

  const value = useMemo(
    () => ({
      state,
      deviceName,
      menuItems,
      photoAlbums,
      rotate,
      select,
      back,
      togglePlay,
      next,
      previous,
    }),
    [
      state,
      deviceName,
      menuItems,
      photoAlbums,
      rotate,
      select,
      back,
      togglePlay,
      next,
      previous,
    ],
  );

  return (
    <ReactPodContext.Provider value={value}>
      {children}
    </ReactPodContext.Provider>
  );
}
