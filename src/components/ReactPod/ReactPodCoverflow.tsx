import { useEffect, useRef, type KeyboardEvent } from "react";
import { Coverflow, CoverflowItem, LazyImage } from "@/components/Coverflow";
import { useReactPod } from "./ReactPodContext";

export function ReactPodCoverflow() {
  const { back, coverflowAlbums, coverflowAriaLabel, goToMainMenu } =
    useReactPod();
  const screenRef = useRef<HTMLElement>(null);
  const coverflowAlbumKey = JSON.stringify(
    coverflowAlbums.map((album) => album.id),
  );

  useEffect(() => {
    const screen = screenRef.current;
    const activeElement = screen?.ownerDocument.activeElement;
    if (activeElement && screen?.contains(activeElement)) return;

    const initialFocus =
      screen?.querySelector<HTMLElement>('[data-slot="coverflow-viewport"]') ??
      screen;
    initialFocus?.focus();
  }, [coverflowAlbumKey]);

  const focusClickWheel = (screen: HTMLElement) => {
    screen
      .closest<HTMLElement>('[data-slot="react-pod"]')
      ?.querySelector<HTMLElement>('[data-slot="click-wheel"]')
      ?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;

    if (event.key === "Escape") {
      event.preventDefault();
      back();
      focusClickWheel(event.currentTarget);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToMainMenu();
      focusClickWheel(event.currentTarget);
    }
  };

  return (
    <section
      ref={screenRef}
      aria-label={`${coverflowAriaLabel} screen`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black outline-none"
    >
      {coverflowAlbums.length === 0 ? (
        <div
          role="status"
          className="px-6 text-center text-xs font-semibold text-slate-300"
        >
          <p>No Coverflow Albums</p>
          <p className="mt-1 text-[9px] font-normal text-slate-500">
            Add albums with the coverflowAlbums prop.
          </p>
        </div>
      ) : (
        <Coverflow
          aria-label={coverflowAriaLabel}
          className="flex h-full origin-center scale-[0.875] items-center justify-center [&_[data-slot=coverflow-close-trigger]]:size-12"
        >
          {coverflowAlbums.map((album, index) => (
            <CoverflowItem
              key={album.id}
              aria-label={`Show details for ${album.title}`}
              flipLabel={`Show details for ${album.title}`}
              closeLabel={`Close details for ${album.title}`}
              className="aspect-square w-full bg-black"
              backContent={
                <section
                  aria-label={`${album.title} track list`}
                  className="flex aspect-square w-full flex-col overflow-hidden rounded-md bg-gradient-to-br from-slate-800 via-slate-950 to-black p-3 text-left text-white shadow-2xl"
                >
                  <p className="text-[10px] font-bold tracking-[0.18em] text-sky-300 uppercase">
                    Track list
                  </p>
                  <h2 className="mt-1 truncate pr-10 text-sm font-bold">
                    {album.title}
                  </h2>
                  <ol className="mt-2 min-h-0 flex-1 space-y-1 overflow-hidden">
                    {album.tracks.map((track, trackIndex) => (
                      <li
                        key={track.id}
                        className="flex gap-1.5 text-[10px] leading-tight text-slate-200"
                      >
                        <span className="w-3 shrink-0 text-right text-slate-500">
                          {trackIndex + 1}
                        </span>
                        <span className="truncate">{track.title}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              }
            >
              <LazyImage
                src={album.coverSrc}
                alt={album.coverAlt}
                isPriority={index < 3}
              />
            </CoverflowItem>
          ))}
        </Coverflow>
      )}
    </section>
  );
}

export default ReactPodCoverflow;
