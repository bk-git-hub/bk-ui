export const reactPodUsageCode = `import {
  ReactPod,
  type ReactPodCoverflowAlbum,
  type ReactPodMenuItem,
} from "@/components/ReactPod";

const menuItems = [
  { id: "songs", label: "Library" },
  { id: "now-playing", label: "Now Playing" },
  { id: "coverflow", label: "Coverflow" },
  { id: "about", label: "About This Pod" },
] satisfies readonly ReactPodMenuItem[];

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

export default function MusicPlayer() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <ReactPod
        deviceName="My Pod"
        menuItems={menuItems}
        coverflowAlbums={coverflowAlbums}
        wheelSensitivity={1.25}
      />
    </main>
  );
}`;
