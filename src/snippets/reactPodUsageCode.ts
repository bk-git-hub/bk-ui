export const reactPodUsageCode = `import {
  ReactPod,
  type ReactPodCoverflowAlbum,
  type ReactPodMenuItem,
  type ReactPodSliderItem,
  type ReactPodTrack,
} from "@/components/ReactPod";

const menuItems = [
  { id: "songs", label: "Library" },
  { id: "now-playing", label: "Now Playing" },
  { id: "coverflow", label: "Coverflow" },
  { id: "slicer-slider", label: "Slicer Slider" },
  { id: "expo-slider", label: "Expo Slider" },
  { id: "cards-stack-slider", label: "Cards Stack" },
  { id: "about", label: "About This Pod" },
] satisfies readonly ReactPodMenuItem[];

const tracks = [
  {
    id: "streetlights",
    title: "Streetlights",
    artist: "Night Drive",
    album: "Night Drive",
    duration: 214,
    src: "/audio/streetlights.mp3",
    artworkSrc: "/albums/night-drive.webp",
    artworkAlt: "Blue city lights on the Night Drive album cover",
  },
] satisfies readonly ReactPodTrack[];

const coverflowAlbums = [
  {
    id: "night-drive",
    title: "Night Drive",
    coverSrc: "/albums/night-drive.webp",
    coverAlt: "Blue city lights on the Night Drive album cover",
    tracks: [
      { id: "night-drive-1", title: "Streetlights" },
      { id: "night-drive-2", title: "Last Exit" },
    ],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

// One serializable data set powers all three slider screens. Each slider keeps
// its own interaction and transition behavior while the ClickWheel supplies
// rotate, previous, next, and select commands.
const sliderItems = [
  {
    id: "platform-blue",
    title: "Platform Blue",
    description: "A quiet platform opening onto the East Sea.",
    imageSrc: "/slider/platform-blue.webp",
    imageAlt: "An empty railway platform facing a bright blue sea",
    imageObjectPosition: "center 48%",
  },
  {
    id: "after-rain",
    title: "After Rain",
    description: "Neon reflected through a narrow city alley.",
    imageSrc: "/slider/after-rain.webp",
    imageAlt: "A bicycle beside a neon-lit alley after rain",
  },
] satisfies readonly ReactPodSliderItem[];

export default function MusicPlayer() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <ReactPod
        deviceName="My Pod"
        menuItems={menuItems}
        tracks={tracks}
        coverflowAlbums={coverflowAlbums}
        sliderItems={sliderItems}
        wheelSensitivity={1.25}
      />
    </main>
  );
}`;
