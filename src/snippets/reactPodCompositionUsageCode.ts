export const reactPodCompositionUsageCode = `"use client";

// Internal architecture excerpt: this is how ReactPod composes the public
// components without copying their transition or gesture logic.
import {
  useCallback,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import { Coverflow, CoverflowItem, LazyImage } from "@/components/Coverflow";
import type { ClickWheelDirection } from "@/components/ClickWheel";
import {
  SlicerSliderNext,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderViewport,
} from "@/components/SlicerSlider";
import {
  ExpoSliderNext,
  ExpoSliderPrevious,
  ExpoSliderRoot,
  ExpoSliderViewport,
} from "@/components/ExpoSlider";
import {
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackViewport,
} from "@/components/CardsStackSlider";
import {
  ReactPod,
  type ReactPodCoverflowAlbum,
  type ReactPodPhotoAlbum,
  type ReactPodSliderItem,
  type ReactPodTrack,
} from "@/components/ReactPod";
import { useReactPodScreenController } from "@/components/ReactPod/ReactPodActiveScreenController";
import { useReactPod } from "@/components/ReactPod/ReactPodContext";

const menuItems = [
  { id: "now-playing", label: "Now Playing" },
  { id: "songs", label: "Songs" },
  { id: "photos", label: "Photos" },
  { id: "coverflow", label: "Coverflow" },
  { id: "slicer-slider", label: "Slicer Slider" },
  { id: "expo-slider", label: "Expo Slider" },
  { id: "cards-stack-slider", label: "Cards Stack" },
  { id: "shuffle", label: "Shuffle Songs" },
  { id: "about", label: "About" },
] as const;

interface ReactPodShowcaseProps {
  tracks: readonly ReactPodTrack[];
  albums: readonly ReactPodCoverflowAlbum[];
  photos: readonly ReactPodPhotoAlbum[];
  slides: readonly ReactPodSliderItem[];
}

export function ReactPodShowcase({
  tracks,
  albums,
  photos,
  slides,
}: ReactPodShowcaseProps) {
  return (
    <ReactPod
      menuItems={menuItems}
      tracks={tracks}
      coverflowAlbums={albums}
      photoAlbums={photos}
      sliderItems={slides}
    />
  );
}

// src/components/ReactPod/Display.tsx
// Each menu resolves to a small screen adapter. Media data stays in props.
function DisplayScreens() {
  const { state } = useReactPod();

  return (
    <>
      {state.screen === "menu" && <MainMenu />}
      {state.screen === "songs" && <Songs />}
      {state.screen === "now-playing" && <NowPlaying />}
      {state.screen === "photo-albums" && <PhotoAlbums />}
      {state.screen === "photo-grid" && <PhotoGrid />}
      {state.screen === "photo-viewer" && <PhotoViewer />}
      {state.screen === "coverflow" && <ReactPodCoverflow />}
      {state.screen === "slicer-slider" && <ReactPodSlicerSlider />}
      {state.screen === "expo-slider" && <ReactPodExpoSlider />}
      {state.screen === "cards-stack-slider" && <ReactPodCardsStackSlider />}
      {state.screen === "about" && <About />}
    </>
  );
}

// Coverflow is controlled directly by the ReactPod index.
function ReactPodCoverflow() {
  const { coverflowAlbums, setCoverflowIndex, state } = useReactPod();

  return (
    <Coverflow
      activeIndex={state.coverflowIndex}
      onActiveIndexChange={setCoverflowIndex}
    >
      {coverflowAlbums.map((album) => (
        <CoverflowItem key={album.id} aria-label={album.title}>
          <LazyImage src={album.coverSrc} alt={album.coverAlt} />
        </CoverflowItem>
      ))}
    </Coverflow>
  );
}

// The three slider adapters use this pattern. The ClickWheel clicks each
// component's own Previous/Next primitive, so drag, keyboard and wheel input
// all continue from the same native slider state.
function useWheelSliderAdapter(
  screen: "slicer-slider" | "expo-slider" | "cards-stack-slider",
  itemCount: number,
  previousRef: RefObject<HTMLButtonElement | null>,
  nextRef: RefObject<HTMLButtonElement | null>,
) {
  const navigate = useCallback((direction: ClickWheelDirection) => {
    const button = direction === -1 ? previousRef.current : nextRef.current;
    if (button && !button.disabled) button.click();
  }, [nextRef, previousRef]);
  const controller = useMemo(
    () => ({ navigate, disabled: itemCount === 0 }),
    [itemCount, navigate],
  );

  useReactPodScreenController(screen, controller);
}

function ReactPodSlicerSlider() {
  const { setSliderIndex, sliderItems, state } = useReactPod();
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useWheelSliderAdapter(
    "slicer-slider",
    sliderItems.length,
    previousRef,
    nextRef,
  );

  return (
    <SlicerSliderRoot
      slides={sliderItems.map((item) => ({
        src: item.imageSrc,
        alt: item.imageAlt,
      }))}
      defaultValue={state.slicerSliderIndex}
      onValueChange={(index) => setSliderIndex("slicer-slider", index)}
    >
      <SlicerSliderViewport>{/* slides */}</SlicerSliderViewport>
      <SlicerSliderPrevious ref={previousRef} className="sr-only" />
      <SlicerSliderNext ref={nextRef} className="sr-only" />
    </SlicerSliderRoot>
  );
}

function ReactPodExpoSlider() {
  const { setSliderIndex, sliderItems, state } = useReactPod();
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useWheelSliderAdapter(
    "expo-slider",
    sliderItems.length,
    previousRef,
    nextRef,
  );

  return (
    <ExpoSliderRoot
      count={sliderItems.length}
      defaultValue={state.expoSliderIndex}
      onValueChange={(index) => setSliderIndex("expo-slider", index)}
    >
      <ExpoSliderViewport>{/* slides */}</ExpoSliderViewport>
      <ExpoSliderPrevious ref={previousRef} className="sr-only" />
      <ExpoSliderNext ref={nextRef} className="sr-only" />
    </ExpoSliderRoot>
  );
}

function ReactPodCardsStackSlider() {
  const { setSliderIndex, sliderItems, state } = useReactPod();
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useWheelSliderAdapter(
    "cards-stack-slider",
    sliderItems.length,
    previousRef,
    nextRef,
  );

  return (
    <CardsStackRoot
      count={sliderItems.length}
      defaultValue={state.cardsStackSliderIndex}
      onValueChange={(index) => setSliderIndex("cards-stack-slider", index)}
    >
      <CardsStackViewport>{/* cards */}</CardsStackViewport>
      <CardsStackPrevious ref={previousRef} className="sr-only" />
      <CardsStackNext ref={nextRef} className="sr-only" />
    </CardsStackRoot>
  );
}
`;
