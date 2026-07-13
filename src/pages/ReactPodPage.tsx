import ReactPod from "@/components/ReactPod/ReactPod";
import ComponentViewer from "@/components/layout/component-viewer";

const usageCode = `import ReactPod from "@/components/ReactPod/ReactPod";

export default function MusicPlayer() {
  return <ReactPod />;
}`;

export default function ReactPodPage() {
  return (
    <ComponentViewer
      title="ReactPod"
      description="A retro music player with click-wheel navigation and playback controls."
      component={
        <div className="flex h-full w-full items-center justify-center overflow-auto bg-gradient-to-br from-slate-100 via-sky-100 to-indigo-200 p-6">
          <ReactPod />
        </div>
      }
      usageCode={usageCode}
    />
  );
}
