import { useState } from "react";
import {
  BaccaratPlayingCard,
  BaccaratSqueezeAction,
  BaccaratSqueezeBack,
  BaccaratSqueezeCard,
  BaccaratSqueezeFace,
  BaccaratSqueezeFold,
  BaccaratSqueezeHandle,
  BaccaratSqueezeHint,
  BaccaratSqueezeRoot,
  type BaccaratRank,
  type BaccaratSuit,
} from "@/components/Baccarat";

const RANKS: readonly BaccaratRank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

const SUITS: ReadonlyArray<{
  value: BaccaratSuit;
  label: string;
  symbol: string;
}> = [
  { value: "spades", label: "스페이드", symbol: "♠" },
  { value: "hearts", label: "하트", symbol: "♥" },
  { value: "diamonds", label: "다이아몬드", symbol: "♦" },
  { value: "clubs", label: "클럽", symbol: "♣" },
];

function getKoreanValueText(progress: number) {
  if (progress === 0) return "카드 숨김";
  if (progress === 1) return "카드 완전히 공개됨";
  return `카드 ${Math.round(progress * 100)}퍼센트 공개`;
}

export default function BaccaratSqueezeDemoPreview() {
  const [rank, setRank] = useState<BaccaratRank>("8");
  const [suit, setSuit] = useState<BaccaratSuit>("diamonds");
  const [progress, setProgress] = useState(0);
  const selectedSuit = SUITS.find((item) => item.value === suit) ?? SUITS[0];
  const state =
    progress === 0 ? "SQUEEZE" : progress === 1 ? "OPEN" : "PEEKING";

  const changeRank = (nextRank: BaccaratRank) => {
    setRank(nextRank);
    setProgress(0);
  };

  const changeSuit = (nextSuit: BaccaratSuit) => {
    setSuit(nextSuit);
    setProgress(0);
  };

  return (
    <div className="h-full w-full overflow-y-auto rounded-lg bg-[#062d27] text-white">
      <div className="relative min-h-full overflow-hidden p-4 sm:p-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 12%, rgba(71,196,156,.32), transparent 36%), repeating-linear-gradient(120deg, rgba(255,255,255,.025) 0 1px, transparent 1px 7px)",
          }}
        />

        <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col">
          <header className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.28em] text-emerald-300 uppercase">
                Live table · no. 07
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                바카라 카드 스퀴즈
              </h2>
            </div>
            <div className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-[10px] font-black tracking-[0.2em] text-amber-200">
              {state}
            </div>
          </header>

          <div className="grid flex-1 items-center gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <main className="flex min-w-0 flex-col items-center justify-center">
              <div className="mb-4 flex items-center gap-3 text-xs font-bold tracking-[0.16em] text-emerald-200/75 uppercase">
                <span className="h-px w-10 bg-emerald-200/25" />
                Player · Card 02
                <span className="h-px w-10 bg-emerald-200/25" />
              </div>

              <BaccaratSqueezeRoot
                value={progress}
                onValueChange={(nextProgress) => setProgress(nextProgress)}
                revealThreshold={0.68}
                getValueText={getKoreanValueText}
                revealAnnouncement={`${selectedSuit.label} ${rank} 카드가 공개됐습니다.`}
                aria-label="플레이어의 두 번째 카드"
              >
                <BaccaratSqueezeCard
                  className="w-[13.5rem] sm:w-60"
                  concealedLabel="숨겨진 플레이어 카드. 오른쪽 아래 모서리를 안쪽으로 드래그하거나 화살표 키를 사용하세요."
                >
                  <BaccaratSqueezeBack />
                  <BaccaratSqueezeFace>
                    <BaccaratPlayingCard
                      rank={rank}
                      suit={suit}
                      aria-label={`${selectedSuit.label} ${rank}`}
                    />
                  </BaccaratSqueezeFace>
                  <BaccaratSqueezeFold />
                  <BaccaratSqueezeHandle />
                </BaccaratSqueezeCard>

                <div className="w-full max-w-64 space-y-3">
                  <div
                    aria-hidden="true"
                    className="h-1 overflow-hidden rounded-full bg-white/10"
                  >
                    <div
                      className="h-full rounded-full bg-amber-300 transition-[width] duration-150 motion-reduce:transition-none"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <BaccaratSqueezeHint className="min-h-5 text-emerald-100/75" />
                </div>

                <BaccaratSqueezeAction />
              </BaccaratSqueezeRoot>
            </main>

            <aside className="rounded-3xl border border-white/10 bg-black/15 p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black">카드 설정</h3>
                <span className="text-xs font-bold text-amber-200">
                  {selectedSuit.symbol} {rank}
                </span>
              </div>

              <div className="mt-5">
                <label
                  className="text-[11px] font-bold tracking-[0.16em] text-emerald-200/65 uppercase"
                  htmlFor="baccarat-rank"
                >
                  Rank
                </label>
                <select
                  id="baccarat-rank"
                  value={rank}
                  onChange={(event) =>
                    changeRank(event.currentTarget.value as BaccaratRank)
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0c3b34] px-3 text-sm font-bold text-white outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-300/25"
                >
                  {RANKS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="mt-5">
                <legend className="text-[11px] font-bold tracking-[0.16em] text-emerald-200/65 uppercase">
                  Suit
                </legend>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {SUITS.map((item) => {
                    const active = item.value === suit;
                    const red =
                      item.value === "hearts" || item.value === "diamonds";
                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-label={item.label}
                        aria-pressed={active}
                        onClick={() => changeSuit(item.value)}
                        className={`grid aspect-square place-items-center rounded-xl border text-xl transition outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                          active
                            ? "border-amber-300 bg-amber-200/15 shadow-sm"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        } ${red ? "text-rose-300" : "text-white"}`}
                      >
                        {item.symbol}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-5 rounded-2xl border border-white/8 bg-white/5 p-3 text-xs leading-5 text-emerald-100/65">
                <p>드래그가 어렵다면 “바로 공개” 버튼을 사용하세요.</p>
                <p className="mt-1">키보드: 화살표 · Home · End</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
