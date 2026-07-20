import { useReactPod } from "./ReactPodContext";
import {
  BatteryIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  ShuffleIcon,
} from "./ReactPodIcons";
import ReactPodCoverflow from "./ReactPodCoverflow";
import {
  ReactPodCardsStackSlider,
  ReactPodExpoSlider,
  ReactPodSlicerSlider,
} from "./ReactPodSliderScreens";

function formatTime(seconds: number) {
  const wholeSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0;
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function StatusBar() {
  const { deviceName, menuItems, photoAlbums, state } = useReactPod();
  const albumTitle = photoAlbums[state.albumIndex]?.title;
  const coverflowTitle =
    menuItems.find((item) => item.id === "coverflow")?.label ?? "Coverflow";
  const sliderTitle = menuItems.find((item) => item.id === state.screen)?.label;
  const title =
    state.screen === "coverflow"
      ? coverflowTitle
      : state.screen === "slicer-slider" ||
          state.screen === "expo-slider" ||
          state.screen === "cards-stack-slider"
        ? (sliderTitle ?? deviceName)
        : state.screen === "photo-albums"
          ? "Photos"
          : state.screen === "photo-grid" || state.screen === "photo-viewer"
            ? (albumTitle ?? deviceName)
            : deviceName;

  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-b border-slate-400 bg-gradient-to-b from-white to-slate-300 px-2 text-[11px] font-semibold text-slate-800">
      <span
        className="flex w-8 items-center gap-1"
        aria-label={state.isPlaying ? "Playing" : "Paused"}
      >
        {state.isPlaying ? (
          <PlayIcon className="h-3 w-3" />
        ) : (
          <PauseIcon className="h-3 w-3" />
        )}
      </span>
      <span className="max-w-32 truncate">{title}</span>
      <BatteryIcon className="h-4 w-4" aria-label="Battery full" />
    </div>
  );
}

function MainMenu() {
  const {
    coverflowAlbums,
    menuItems,
    photoAlbums,
    sliderItems,
    state,
    tracks,
  } = useReactPod();
  const isPhotosSelected = menuItems[state.menuIndex]?.id === "photos";
  const isCoverflowSelected = menuItems[state.menuIndex]?.id === "coverflow";
  const isSliderSelected =
    menuItems[state.menuIndex]?.id === "slicer-slider" ||
    menuItems[state.menuIndex]?.id === "expo-slider" ||
    menuItems[state.menuIndex]?.id === "cards-stack-slider";
  const photoCovers = photoAlbums
    .flatMap((album) => {
      const photo = album.photos[0];
      return photo ? [{ albumId: album.id, photo }] : [];
    })
    .slice(0, 2);
  const coverflowCovers = coverflowAlbums.slice(0, 2).map((album) => ({
    id: album.id,
    src: album.coverSrc,
  }));
  const musicCovers = tracks
    .flatMap((track) =>
      track.artworkSrc ? [{ id: String(track.id), src: track.artworkSrc }] : [],
    )
    .slice(0, 2);
  const sliderCovers = sliderItems.slice(0, 2).map((item) => ({
    id: String(item.id),
    src: item.imageSrc,
  }));
  const previewCovers = isPhotosSelected
    ? photoCovers.map(({ albumId, photo }) => ({
        id: albumId,
        src: photo.src,
      }))
    : isCoverflowSelected
      ? coverflowCovers
      : isSliderSelected
        ? sliderCovers
        : musicCovers;
  const previewLabel = isPhotosSelected
    ? "PHOTOS"
    : isCoverflowSelected
      ? "COVERS"
      : isSliderSelected
        ? "SLIDES"
        : "MUSIC";
  const visibleItemCount = 6;
  const menuStart = Math.max(
    0,
    Math.min(
      state.menuIndex - 2,
      Math.max(0, menuItems.length - visibleItemCount),
    ),
  );

  return (
    <div className="grid h-full grid-cols-[62%_38%] bg-white">
      <div className="overflow-hidden" role="listbox" aria-label="Main menu">
        <div
          className="py-1 transition-transform duration-150 motion-reduce:transition-none"
          style={{ transform: `translateY(-${menuStart * 28}px)` }}
        >
          {menuItems.map((item, index) => {
            const isSelected = index === state.menuIndex;
            return (
              <div
                key={`${item.id}-${index}`}
                role="option"
                aria-selected={isSelected}
                className={`flex h-7 items-center justify-between px-2 text-[11px] font-semibold ${
                  isSelected
                    ? "bg-gradient-to-b from-blue-400 to-blue-700 text-white"
                    : "text-slate-900"
                }`}
              >
                <span className="min-w-0 truncate">{item.label}</span>
                {isSelected && (
                  <ChevronRightIcon className="h-4 w-4 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className={`relative overflow-hidden ${
          previewCovers.length > 0
            ? "bg-slate-900"
            : "bg-gradient-to-br from-sky-100 via-blue-300 to-indigo-700"
        }`}
      >
        {previewCovers.length > 0 ? (
          <div className="absolute inset-2 grid rotate-2 grid-cols-2 gap-1.5">
            {previewCovers.map((cover) => (
              <img
                key={cover.id}
                src={cover.src}
                alt=""
                className="h-full min-h-0 w-full rounded-sm border border-white/50 object-cover shadow-md"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="absolute -right-7 -bottom-7 h-32 w-32 rounded-full bg-white/20" />
            <div className="absolute top-7 left-3 h-16 w-16 rotate-12 rounded-2xl bg-white/30 shadow-lg backdrop-blur-sm" />
          </>
        )}
        <span className="absolute right-2 bottom-2 text-[10px] font-bold tracking-widest text-white/80">
          {previewLabel}
        </span>
      </div>
    </div>
  );
}

function PhotoAlbums() {
  const { photoAlbums, state } = useReactPod();

  if (photoAlbums.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-white to-slate-200 px-5 text-center text-slate-700">
        <p className="text-sm font-bold">No Albums</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Add photos with the photoAlbums prop.
        </p>
      </div>
    );
  }

  const visibleAlbumCount = 3;
  const visibleAlbumStart = Math.max(
    0,
    Math.min(
      state.albumIndex - 1,
      Math.max(0, photoAlbums.length - visibleAlbumCount),
    ),
  );
  const visibleAlbums = photoAlbums.slice(
    visibleAlbumStart,
    visibleAlbumStart + visibleAlbumCount,
  );

  return (
    <div
      className="h-full overflow-hidden bg-white py-1"
      role="listbox"
      aria-label="Photo albums"
    >
      {visibleAlbums.map((album, visibleIndex) => {
        const index = visibleAlbumStart + visibleIndex;
        const isSelected = index === state.albumIndex;
        const cover = album.photos[0];

        return (
          <div
            key={album.id}
            role="option"
            aria-selected={isSelected}
            aria-posinset={index + 1}
            aria-setsize={photoAlbums.length}
            className={`flex h-[48px] items-center gap-2 px-2 ${
              isSelected
                ? "bg-gradient-to-b from-blue-400 to-blue-700 text-white"
                : "text-slate-900"
            }`}
          >
            {cover ? (
              <img
                src={cover.src}
                alt=""
                className="h-9 w-11 shrink-0 rounded-sm border border-black/20 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-9 w-11 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-slate-100 text-[8px] text-slate-400">
                EMPTY
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] leading-tight font-bold">
                {album.title}
              </p>
              <p
                className={`text-[9px] ${
                  isSelected ? "text-blue-100" : "text-slate-500"
                }`}
              >
                {album.photos.length} Photos
              </p>
            </div>
            {isSelected && <ChevronRightIcon className="h-4 w-4 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function PhotoGrid() {
  const { photoAlbums, state } = useReactPod();
  const album = photoAlbums[state.albumIndex];

  if (!album || album.photos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 px-5 text-center text-xs font-semibold text-slate-300">
        No photos in this album.
      </div>
    );
  }

  const columnCount = 5;
  const pageSize = 15;
  const pageStart = Math.floor(state.photoIndex / pageSize) * pageSize;
  const visiblePhotos = album.photos.slice(pageStart, pageStart + pageSize);
  const selectedPhoto = album.photos[state.photoIndex];
  const rows = Array.from(
    { length: Math.ceil(visiblePhotos.length / columnCount) },
    (_, rowIndex) =>
      visiblePhotos.slice(rowIndex * columnCount, (rowIndex + 1) * columnCount),
  );

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div
        className="grid min-h-0 flex-1 grid-cols-5 grid-rows-3 gap-1 p-1.5"
        role="grid"
        aria-label={`${album.title} photos`}
        aria-colcount={columnCount}
        aria-rowcount={Math.ceil(album.photos.length / columnCount)}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={pageStart + rowIndex * columnCount}
            role="row"
            aria-rowindex={Math.floor(pageStart / columnCount) + rowIndex + 1}
            className="contents"
          >
            {row.map((photo, columnIndex) => {
              const index = pageStart + rowIndex * columnCount + columnIndex;
              const isSelected = index === state.photoIndex;

              return (
                <div
                  key={photo.id}
                  role="gridcell"
                  aria-label={`${photo.caption ?? photo.alt}, ${index + 1} of ${album.photos.length}`}
                  aria-selected={isSelected}
                  aria-colindex={columnIndex + 1}
                  className={`relative min-h-0 overflow-hidden rounded-[2px] bg-slate-800 transition-transform ${
                    isSelected
                      ? "z-10 scale-[1.06] ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-950"
                      : "border border-white/20 opacity-75"
                  }`}
                >
                  <img
                    src={photo.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex h-[22px] shrink-0 items-center justify-between gap-2 border-t border-white/15 bg-gradient-to-b from-slate-700 to-slate-950 px-2">
        <p className="min-w-0 truncate text-[9px] font-semibold">
          {selectedPhoto.caption ?? selectedPhoto.alt}
        </p>
        <span className="shrink-0 text-[8px] font-semibold text-white/70 tabular-nums">
          {state.photoIndex + 1}/{album.photos.length}
        </span>
      </div>
      <span className="sr-only" role="status">
        {selectedPhoto.caption ?? selectedPhoto.alt}, photo{" "}
        {state.photoIndex + 1} of {album.photos.length}
      </span>
    </div>
  );
}

function PhotoViewer() {
  const { photoAlbums, state } = useReactPod();
  const album = photoAlbums[state.albumIndex];
  const photo = album?.photos[state.photoIndex];

  if (!album || !photo) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 px-5 text-center text-xs font-semibold text-slate-300">
        No photos in this album.
      </div>
    );
  }

  return (
    <figure
      className="relative h-full overflow-hidden bg-black"
      aria-live="polite"
      aria-label={`${album.title}, photo ${state.photoIndex + 1} of ${album.photos.length}`}
    >
      <img
        src={photo.src}
        alt={photo.alt}
        className="h-full w-full object-contain"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pt-5 pb-1.5 text-white">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold">
              {photo.caption ?? album.title}
            </p>
            <p className="truncate text-[8px] text-white/70">{album.title}</p>
          </div>
          <span className="shrink-0 text-[8px] font-semibold text-white/80 tabular-nums">
            {state.photoIndex + 1}/{album.photos.length}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}

function Songs() {
  const { state, tracks } = useReactPod();

  if (tracks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-white to-slate-200 px-5 text-center text-slate-700">
        <p className="text-sm font-bold">No Songs</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Add songs with the tracks prop.
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-hidden bg-white py-0.5"
      role="listbox"
      aria-label="Songs"
    >
      {tracks.map((track, index) => {
        const isSelected = index === state.songIndex;
        return (
          <div
            key={track.id}
            role="option"
            aria-selected={isSelected}
            className={`flex h-[32px] items-center justify-between px-2 ${
              isSelected
                ? "bg-gradient-to-b from-blue-400 to-blue-700 text-white"
                : "text-slate-900"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-[12px] leading-tight font-semibold">
                {track.title}
              </p>
              <p
                className={`truncate text-[9px] ${isSelected ? "text-blue-100" : "text-slate-500"}`}
              >
                {track.artist}
              </p>
            </div>
            {isSelected && <ChevronRightIcon className="h-4 w-4 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function NowPlaying() {
  const { state, tracks } = useReactPod();
  const track = tracks[state.currentTrackIndex];

  if (!track) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-white to-slate-200 px-5 text-center text-slate-700">
        <p className="text-sm font-bold">Nothing Playing</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Add songs with the tracks prop.
        </p>
      </div>
    );
  }

  const duration = Math.max(0, track.duration);
  const progress =
    duration === 0 ? 0 : Math.min(100, (state.progress / duration) * 100);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-slate-200 px-3 py-2 text-slate-900">
      <div className="flex min-h-0 flex-1 items-center gap-3">
        <div
          className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-sm border border-black/20 shadow-md"
          style={{
            background:
              track.artwork ??
              "linear-gradient(145deg, #172554 5%, #7c3aed 55%, #f472b6)",
          }}
          aria-label={track.artworkAlt ?? `${track.album} artwork`}
          role="img"
        >
          {track.artworkSrc && (
            <img
              src={track.artworkSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-5 text-[8px] font-bold tracking-wider text-white/90">
            {track.album.toUpperCase()}
          </div>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold">{track.title}</p>
          <p className="truncate text-[11px] text-slate-600">{track.artist}</p>
          <p className="truncate text-[10px] text-slate-500">{track.album}</p>
          <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-blue-700">
            {state.isShuffling && <ShuffleIcon className="h-3 w-3" />}
            {state.isPlaying ? "PLAYING" : "PAUSED"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div>
          <div className="h-2 overflow-hidden rounded-full border border-slate-500 bg-white shadow-inner">
            <div
              className="h-full bg-gradient-to-b from-blue-400 to-blue-700 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-0.5 flex justify-between text-[9px] font-medium tabular-nums">
            <span>{formatTime(state.progress)}</span>
            <span>-{formatTime(duration - state.progress)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-600">
          <span>VOL</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-400">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${state.volume}%` }}
            />
          </div>
          <span className="w-6 text-right tabular-nums">{state.volume}</span>
        </div>
      </div>
    </div>
  );
}

function About() {
  const { deviceName, tracks } = useReactPod();
  const monogram = deviceName.trim().charAt(0).toUpperCase() || "R";
  const totalMinutes = Math.round(
    tracks.reduce((total, track) => total + track.duration, 0) / 60,
  );

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-white to-slate-200 px-5 text-center text-slate-800">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-700 text-xl font-black text-white shadow-md">
        {monogram}
      </div>
      <p className="text-sm font-bold">{deviceName}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
        A click-wheel music player built with React Context, pointer gestures,
        and keyboard controls.
      </p>
      <p className="mt-2 text-[9px] font-semibold text-slate-400">
        {tracks.length} {tracks.length === 1 ? "song" : "songs"} ·{" "}
        {totalMinutes} min
      </p>
    </div>
  );
}

export default function Display() {
  const { state } = useReactPod();

  return (
    <div className="flex h-[45%] flex-col overflow-hidden rounded-lg border-2 border-slate-700 bg-white shadow-[inset_0_0_8px_rgba(0,0,0,0.22)]">
      <StatusBar />
      <div className="min-h-0 flex-1">
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
      </div>
    </div>
  );
}
