"use client";

import { ClickWheel as ClickWheelPrimitive } from "@/components/ClickWheel";
import { useReactPod } from "./ReactPodContext";

export function ReactPodClickWheel() {
  const {
    state,
    rotate,
    select,
    back,
    goToMainMenu,
    togglePlay,
    next,
    previous,
  } = useReactPod();
  const isBrowsingPhotos =
    state.screen === "photo-grid" || state.screen === "photo-viewer";

  return (
    <div className="flex h-[55%] items-center justify-center bg-zinc-200">
      <ClickWheelPrimitive
        onRotate={rotate}
        onMenu={back}
        onMenuLongPress={goToMainMenu}
        onPrevious={previous}
        onSelect={select}
        onNext={next}
        onPlayPause={togglePlay}
        aria-label="Click wheel. Drag or use arrow keys to navigate. Escape returns to the previous menu; Home opens the main menu."
        buttonProps={{
          menu: {
            "aria-label": "Previous menu",
            title: "Press for the previous menu. Hold for the main menu.",
          },
          previous: {
            "aria-label": isBrowsingPhotos
              ? "Previous photo"
              : "Previous track",
          },
          next: {
            "aria-label": isBrowsingPhotos ? "Next photo" : "Next track",
          },
          playPause: {
            "aria-label": state.isPlaying ? "Pause" : "Play",
            "aria-pressed": state.isPlaying,
          },
        }}
      />
    </div>
  );
}

export default ReactPodClickWheel;
