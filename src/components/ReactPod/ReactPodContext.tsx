import { createContext, useContext } from "react";
import type {
  ReactPodCoverflowAlbum,
  ReactPodMenuItem,
  ReactPodPhotoAlbum,
  ReactPodState,
} from "./reactPodState";

// The base ESLint rule cannot distinguish type-only function parameters.
// eslint-disable-next-line no-unused-vars
type RotateHandler = (direction: -1 | 1) => void;

export interface ReactPodContextValue {
  state: ReactPodState;
  deviceName: string;
  menuItems: readonly ReactPodMenuItem[];
  photoAlbums: readonly ReactPodPhotoAlbum[];
  coverflowAlbums: readonly ReactPodCoverflowAlbum[];
  coverflowAriaLabel: string;
  rotate: RotateHandler;
  // The base ESLint rule cannot distinguish type-only function parameters.
  // eslint-disable-next-line no-unused-vars
  setCoverflowIndex: (index: number) => void;
  select: () => void;
  back: () => void;
  goToMainMenu: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
}

export const ReactPodContext = createContext<ReactPodContextValue | null>(null);

export function useReactPod() {
  const context = useContext(ReactPodContext);
  if (!context) {
    throw new Error("useReactPod must be used within a ReactPodProvider");
  }
  return context;
}
