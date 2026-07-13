export const reactPodUsageCode = `import {
  ReactPod,
  type ReactPodMenuItem,
} from "@/components/ReactPod";

const menuItems = [
  { id: "songs", label: "Library" },
  { id: "now-playing", label: "Now Playing" },
  { id: "about", label: "About This Pod" },
] satisfies readonly ReactPodMenuItem[];

export default function MusicPlayer() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <ReactPod
        deviceName="My Pod"
        menuItems={menuItems}
        wheelSensitivity={1.25}
      />
    </main>
  );
}`;
