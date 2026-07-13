import { useReactPod } from "./ReactPodContext";
import {
  BatteryIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  ShuffleIcon,
} from "./ReactPodIcons";
import { TRACKS } from "./reactPodState";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function StatusBar() {
  const { deviceName, state } = useReactPod();

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
      <span className="max-w-32 truncate">{deviceName}</span>
      <BatteryIcon className="h-4 w-4" aria-label="Battery full" />
    </div>
  );
}

function MainMenu() {
  const { menuItems, photoAlbums, state } = useReactPod();
  const isPhotosSelected = menuItems[state.menuIndex]?.id === "photos";
  const photoCovers = photoAlbums
    .map((album) => album.photos[0])
    .filter((photo) => photo !== undefined)
    .slice(0, 2);

  return (
    <div className="grid h-full grid-cols-[62%_38%] bg-white">
      <div className="py-1" role="listbox" aria-label="Main menu">
        {menuItems.map((item, index) => {
          const isSelected = index === state.menuIndex;
          return (
            <div
              key={`${item.id}-${index}`}
              role="option"
              aria-selected={isSelected}
              className={`flex h-8 items-center justify-between px-2 text-[12px] font-semibold ${
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
      <div
        className={`relative overflow-hidden ${
          isPhotosSelected
            ? "bg-slate-900"
            : "bg-gradient-to-br from-sky-100 via-blue-300 to-indigo-700"
        }`}
      >
        {isPhotosSelected && photoCovers.length > 0 ? (
          <div className="absolute inset-2 grid grid-cols-2 gap-1.5 rotate-2">
            {photoCovers.map((photo) => (
              <img
                key={photo.id}
                src={photo.src}
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
          {isPhotosSelected ? "PHOTOS" : "MUSIC"}
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
        className="h-full w-full object-cover"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pt-5 pb-1.5 text-white">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold">
              {photo.caption ?? album.title}
            </p>
            <p className="truncate text-[8px] text-white/70">{album.title}</p>
          </div>
          <span className="shrink-0 text-[8px] font-semibold tabular-nums text-white/80">
            {state.photoIndex + 1}/{album.photos.length}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}

function Songs() {
  const { state } = useReactPod();

  return (
    <div
      className="h-full overflow-hidden bg-white py-0.5"
      role="listbox"
      aria-label="Songs"
    >
      {TRACKS.map((track, index) => {
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
  const { state } = useReactPod();
  const track = TRACKS[state.currentTrackIndex];
  const progress = (state.progress / track.duration) * 100;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-slate-200 px-3 py-2 text-slate-900">
      <div className="flex min-h-0 flex-1 items-center gap-3">
        <div
          className="h-[76px] w-[76px] shrink-0 rounded-sm border border-black/20 shadow-md"
          style={{ background: track.artwork }}
          aria-label={`${track.album} artwork`}
          role="img"
        >
          <div className="flex h-full items-end p-1.5 text-[8px] font-bold tracking-wider text-white/90">
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
            <span>-{formatTime(track.duration - state.progress)}</span>
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
  const { deviceName } = useReactPod();
  const monogram = deviceName.trim().charAt(0).toUpperCase() || "R";

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
        5 songs · 16 min
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
        {state.screen === "photo-viewer" && <PhotoViewer />}
        {state.screen === "about" && <About />}
      </div>
    </div>
  );
}
