import { useReactPod } from "./ReactPodContext";
import { useClickWheel } from "./useClickWheel";
import type { KeyboardEvent } from "react";

export default function ClickWheel() {
  const { state, rotate, select, back, togglePlay, next, previous } =
    useReactPod();
  const isBrowsingPhotos =
    state.screen === "photo-grid" || state.screen === "photo-viewer";
  const { wheelRef, wheelProps } = useClickWheel({
    onRotate: rotate,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }

    const actions: Record<string, () => void> = {
      ArrowUp: () => rotate(-1),
      ArrowLeft: () => rotate(-1),
      ArrowDown: () => rotate(1),
      ArrowRight: () => rotate(1),
      Enter: select,
      Escape: back,
      " ": togglePlay,
    };

    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  return (
    <div className="flex h-[55%] items-center justify-center bg-zinc-200">
      <div
        ref={wheelRef}
        className="relative h-[200px] w-[200px] cursor-grab touch-none rounded-full border border-zinc-300 bg-gradient-to-br from-white to-zinc-100 shadow-[inset_0_2px_12px_rgba(0,0,0,0.12)] outline-none select-none focus-visible:ring-4 focus-visible:ring-blue-400/60 active:cursor-grabbing"
        tabIndex={0}
        aria-label="Click wheel. Drag or use arrow keys to navigate."
        onKeyDown={handleKeyDown}
        onWheel={(event) => {
          if (event.deltaY === 0) return;
          event.preventDefault();
          rotate(event.deltaY > 0 ? 1 : -1);
        }}
        {...wheelProps}
      >
        <button
          type="button"
          onClick={back}
          data-wheel-drag
          aria-label="Back to menu"
          className="absolute top-2 left-1/2 flex h-10 -translate-x-1/2 items-center px-2 text-sm font-bold text-zinc-500 outline-none hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          MENU
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={isBrowsingPhotos ? "Next photo" : "Next track"}
          className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-zinc-200/70 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src="/reactpod/next.svg"
            alt=""
            className="h-8 w-8 object-contain"
          />
        </button>
        <button
          type="button"
          onClick={previous}
          aria-label={isBrowsingPhotos ? "Previous photo" : "Previous track"}
          className="absolute top-1/2 left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full outline-none hover:bg-zinc-200/70 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src="/reactpod/prev.svg"
            alt=""
            className="h-8 w-8 object-contain"
          />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          data-wheel-drag
          aria-label={state.isPlaying ? "Pause" : "Play"}
          aria-pressed={state.isPlaying}
          className="absolute bottom-2 left-1/2 flex h-10 -translate-x-1/2 items-center px-3 text-lg font-bold text-zinc-500 outline-none hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ▶︎❚❚
        </button>
        <button
          type="button"
          onClick={select}
          aria-label="Select"
          className="absolute top-1/2 left-1/2 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-zinc-400 bg-gradient-to-br from-zinc-200 to-zinc-300 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-500/70 active:from-zinc-300 active:to-zinc-400"
        />
      </div>
    </div>
  );
}
