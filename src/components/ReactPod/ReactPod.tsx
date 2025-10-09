import ClickWheel from "./ClickWheel";
import Display from "./Display";
import { ReactPodProvider } from "./ReactPodContext";

function ReactPod() {
  return (
    <ReactPodProvider>
      <div className="flex h-[500px] w-[300px] flex-col overflow-hidden rounded-[20px] border border-zinc-400 bg-zinc-200 p-4 shadow-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.3)]">
        <Display />
        <ClickWheel />
      </div>
    </ReactPodProvider>
  );
}

export default ReactPod;
