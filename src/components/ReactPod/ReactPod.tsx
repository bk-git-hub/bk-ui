// 임시 데이터
const MOCK_ITEMS = [" ", "사진", "비디오", "설정", "노래 임의 재생"];

function ReactPod() {
  const currentIndex = 0; // 초기 인덱스는 0으로 고정

  return (
    // Body 스타일은 index.css나 전역 스타일에 적용
    // <body class="flex justify-center items-center min-h-screen bg-zinc-100">
    <div className="flex h-[500px] w-[300px] flex-col overflow-hidden rounded-[20px] border border-zinc-400 bg-zinc-200 p-4 shadow-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.3)]">
      {/* Display */}
      <div className="flex h-[45%] items-center justify-center rounded-2xl border-2 border-black bg-gradient-to-b from-slate-200 to-white p-5">
        <h1 className="text-2xl font-semibold text-zinc-800">
          {MOCK_ITEMS[currentIndex]}
        </h1>
      </div>

      {/* Click Wheel Area */}
      <div className="flex h-[55%] items-center justify-center bg-zinc-200">
        <div className="relative h-[200px] w-[200px] cursor-pointer rounded-full border-2 border-zinc-300 bg-gray-50 shadow-inner">
          {/* Buttons on the Wheel */}
          <button className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-semibold text-zinc-500">
            MENU
          </button>
          <button className="absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-zinc-500">
            ▶︎▶︎<span className="font-bold">|</span>
          </button>
          <button className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-zinc-500">
            |◀◀
          </button>
          <button className="absolute bottom-4 left-1/2 -translate-x-1/2 font-semibold text-zinc-500">
            ▶︎❚❚
          </button>

          {/* Center Button */}
          <div className="absolute top-1/2 left-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-zinc-400 bg-zinc-300 active:bg-zinc-400"></div>
        </div>
      </div>
    </div>
    // </body>
  );
}

export default ReactPod;
