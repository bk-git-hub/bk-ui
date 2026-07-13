import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { ReactPodContext } from "./ReactPodContext";
import {
  getNextTrackIndex,
  initialReactPodState,
  reactPodReducer,
  TRACKS,
} from "./reactPodState";

interface ReactPodProviderProps {
  children: ReactNode;
}

export function ReactPodProvider({ children }: ReactPodProviderProps) {
  const [state, dispatch] = useReducer(reactPodReducer, initialReactPodState);

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
  const togglePlay = useCallback(
    () => dispatch({ type: "TOGGLE_PLAY" }),
    [],
  );
  const previous = useCallback(() => dispatch({ type: "PREVIOUS" }), []);
  const next = useCallback(() => {
    dispatch({ type: "NEXT", trackIndex: getNextTrackIndex(state) });
  }, [state]);

  useEffect(() => {
    if (!state.isPlaying) return;

    const timer = window.setTimeout(() => {
      const currentTrack = TRACKS[state.currentTrackIndex];
      if (state.progress + 1 >= currentTrack.duration) {
        dispatch({ type: "NEXT", trackIndex: getNextTrackIndex(state) });
      } else {
        dispatch({ type: "TICK" });
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [state]);

  const value = useMemo(
    () => ({ state, rotate, select, back, togglePlay, next, previous }),
    [state, rotate, select, back, togglePlay, next, previous],
  );

  return (
    <ReactPodContext.Provider value={value}>
      {children}
    </ReactPodContext.Provider>
  );
}
