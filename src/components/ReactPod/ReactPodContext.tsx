import { createContext, useContext } from "react";
import type { RegisterReactPodScreenController } from "./ReactPodActiveScreenController";
import type {
  ReactPodCoverflowAlbum,
  ReactPodMenuItem,
  ReactPodPhotoAlbum,
  ReactPodScreen,
  ReactPodSliderItem,
  ReactPodState,
  ReactPodTrack,
} from "./reactPodState";

// The base ESLint rule cannot distinguish type-only function parameters.
// eslint-disable-next-line no-unused-vars
type RotateHandler = (direction: -1 | 1) => void;

type ReactPodSliderScreen = Extract<ReactPodScreen, `${string}-slider`>;

type SetSliderIndexHandler = (
  // The base ESLint rule cannot distinguish type-only function parameters.
  // eslint-disable-next-line no-unused-vars
  screen: ReactPodSliderScreen,
  // eslint-disable-next-line no-unused-vars
  index: number,
) => void;

export interface ReactPodContextValue {
  state: ReactPodState;
  deviceName: string;
  menuItems: readonly ReactPodMenuItem[];
  photoAlbums: readonly ReactPodPhotoAlbum[];
  coverflowAlbums: readonly ReactPodCoverflowAlbum[];
  sliderItems: readonly ReactPodSliderItem[];
  tracks: readonly ReactPodTrack[];
  coverflowAriaLabel: string;
  rotate: RotateHandler;
  // The base ESLint rule cannot distinguish type-only function parameters.
  // eslint-disable-next-line no-unused-vars
  setCoverflowIndex: (index: number) => void;
  setSliderIndex: SetSliderIndexHandler;
  select: () => void;
  back: () => void;
  goToMainMenu: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  registerScreenController: RegisterReactPodScreenController;
}

type ReactPodCompatibilityField =
  | "registerScreenController"
  | "setSliderIndex"
  | "sliderItems";

type ReactPodContextProviderValue = Omit<
  ReactPodContextValue,
  ReactPodCompatibilityField
> &
  Partial<Pick<ReactPodContextValue, ReactPodCompatibilityField>>;

const registerNoopScreenController: RegisterReactPodScreenController =
  () => () =>
    undefined;
const setNoopSliderIndex: SetSliderIndexHandler = () => undefined;
const EMPTY_SLIDER_ITEMS: readonly ReactPodSliderItem[] = [];

export const ReactPodContext =
  createContext<ReactPodContextProviderValue | null>(null);

export function useReactPod(): ReactPodContextValue {
  const context = useContext(ReactPodContext);
  if (!context) {
    throw new Error("useReactPod must be used within a ReactPodProvider");
  }

  if (
    context.registerScreenController &&
    context.setSliderIndex &&
    context.sliderItems
  ) {
    return context as ReactPodContextValue;
  }

  return {
    ...context,
    registerScreenController:
      context.registerScreenController ?? registerNoopScreenController,
    setSliderIndex: context.setSliderIndex ?? setNoopSliderIndex,
    sliderItems: context.sliderItems ?? EMPTY_SLIDER_ITEMS,
  };
}
