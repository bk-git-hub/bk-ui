import { useReactPod } from "./ReactPodContext";

export default function Display() {
  const { index } = useReactPod();
  return (
    <div className="flex h-[45%] items-center justify-center rounded-2xl border-2 border-black bg-gradient-to-b from-slate-200 to-white p-5">
      <h2 className="text-5xl">{index}</h2>
    </div>
  );
}
