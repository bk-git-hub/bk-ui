import ClickWheel from "./ClickWheel";
import Display from "./Display";
import { ReactPodProvider } from "./ReactPodProvider";

function ReactPod() {
  return (
    <ReactPodProvider>
      <div className="flex h-[500px] w-[300px] shrink-0 flex-col overflow-hidden rounded-[26px] border border-zinc-400 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-300 p-4 shadow-[0_24px_50px_rgba(15,23,42,0.35),inset_0_0_15px_rgba(0,0,0,0.18)]">
        <Display />
        <ClickWheel />
      </div>
    </ReactPodProvider>
  );
}

export default ReactPod;
