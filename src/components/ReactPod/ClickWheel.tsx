import { useClickWheel } from "./useClickWheel";

export default function ClickWheel() {
  const { wheelRef, wheelProps } = useClickWheel();

  return (
    <div className="flex h-[55%] items-center justify-center bg-zinc-200">
      <div
        ref={wheelRef}
        className="relative h-[200px] w-[200px] cursor-pointer touch-none rounded-full border-2 border-zinc-300 bg-gray-50 shadow-inner select-none"
        {...wheelProps}
      >
        {/* 버튼들은 현재 아무 기능이 없음 */}
        <button className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-semibold text-zinc-500">
          MENU
        </button>
        <button className="absolute top-1/2 right-4 h-8 w-8 -translate-y-1/2 text-sm font-semibold text-zinc-500">
          <img
            src="/reactpod/next.svg"
            alt="previous"
            className="h-full w-full object-contain"
          />
        </button>
        <button className="absolute top-1/2 left-4 h-8 w-8 -translate-y-1/2 text-sm font-semibold text-zinc-500">
          <img
            src="/reactpod/prev.svg"
            alt="previous"
            className="h-full w-full object-contain"
          />
        </button>
        <button className="absolute bottom-4 left-1/2 -translate-x-1/2 font-semibold text-zinc-500">
          ▶︎❚❚
        </button>
        <div className="absolute top-1/2 left-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-zinc-400 bg-zinc-300 active:bg-zinc-400"></div>
      </div>
    </div>
  );
}
