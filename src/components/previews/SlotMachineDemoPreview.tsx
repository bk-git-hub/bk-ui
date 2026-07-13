import { useMemo, useState } from "react";
import { CircleHelp, SlidersHorizontal } from "lucide-react";
import { SlotMachine } from "@/components/SlotMachine";
import {
  createSlotReels,
  getSlotItemParts,
  parseSlotItems,
} from "./slot-machine-demo.util";

const DEFAULT_ITEMS = [
  "🍒 체리",
  "🍋 레몬",
  "🍇 포도",
  "🔔 벨",
  "⭐ 스타",
  "7️⃣ 세븐",
].join("\n");

const MIN_REELS = 2;
const MAX_REELS = 5;

function getFirstItems(items: readonly string[], reelCount: number) {
  return items.length > 0 && Number.isInteger(reelCount) && reelCount > 0
    ? Array.from({ length: reelCount }, () => items[0])
    : [];
}

export default function SlotMachineDemoPreview() {
  const [itemSource, setItemSource] = useState(DEFAULT_ITEMS);
  const [reelCount, setReelCount] = useState(3);
  const [configurationVersion, setConfigurationVersion] = useState(0);
  const items = useMemo(() => parseSlotItems(itemSource), [itemSource]);
  const reels = useMemo(
    () => createSlotReels(items, reelCount),
    [items, reelCount],
  );
  const [selectedItems, setSelectedItems] = useState<string[]>(() =>
    getFirstItems(parseSlotItems(DEFAULT_ITEMS), 3),
  );
  const isReelCountValid =
    Number.isInteger(reelCount) &&
    reelCount >= MIN_REELS &&
    reelCount <= MAX_REELS;
  const validationMessage =
    items.length === 0
      ? "슬롯 내용을 한 개 이상 입력해 주세요."
      : !isReelCountValid
        ? `릴 개수는 ${MIN_REELS}개부터 ${MAX_REELS}개 사이여야 합니다.`
        : null;

  const updateItemSource = (nextSource: string) => {
    const nextItems = parseSlotItems(nextSource);
    setItemSource(nextSource);
    setSelectedItems(getFirstItems(nextItems, reelCount));
    setConfigurationVersion((version) => version + 1);
  };

  const updateReelCount = (nextCount: number) => {
    setReelCount(nextCount);
    setSelectedItems(getFirstItems(items, nextCount));
    setConfigurationVersion((version) => version + 1);
  };

  return (
    <div className="h-full w-full overflow-y-auto rounded-lg bg-[#f4efe6] p-4 text-slate-900 sm:p-6">
      <div className="mx-auto grid min-h-full w-full max-w-5xl content-center gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#15201d] p-5 shadow-2xl shadow-emerald-950/25 sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-20 size-64 rounded-full bg-amber-300/10 blur-3xl"
          />
          <div className="relative">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.24em] text-amber-300 uppercase">
                  Arcade lab
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  오늘의 럭키 스핀
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-emerald-100/60">
                  원하는 기호를 채우고 나만의 슬롯을 돌려보세요.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-emerald-100/70">
                {reelCount} reels · {items.length} items
              </div>
            </div>

            <SlotMachine
              key={configurationVersion}
              reels={isReelCountValid ? reels : []}
              value={selectedItems}
              onValueChange={setSelectedItems}
              getItemLabel={(item) => item}
              renderItem={(item) => {
                const { symbol, label } = getSlotItemParts(item);
                return (
                  <>
                    <span className="block max-w-full truncate text-4xl leading-none sm:text-5xl">
                      {symbol}
                    </span>
                    {label && (
                      <span className="mt-3 block max-w-full truncate text-[0.65rem] font-black tracking-[0.14em] text-slate-500 uppercase sm:text-xs">
                        {label}
                      </span>
                    )}
                  </>
                );
              }}
              spinDuration={900}
              spinLabel="돌리기"
              respinLabel="한 번 더"
              spinningLabel="회전 중…"
              resetLabel="처음으로"
              disabled={Boolean(validationMessage)}
              aria-label="사용자 설정 슬롯 머신"
              className="border-white/10 bg-[#0b1210] shadow-black/30"
            />
          </div>
        </section>

        <aside className="rounded-[2rem] border border-[#ded5c7] bg-[#fffdf8] p-5 shadow-xl shadow-stone-900/5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">슬롯 편집기</h3>
              <p className="text-xs text-slate-500">
                변경 사항이 바로 반영됩니다.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label
                className="text-sm font-bold text-slate-700"
                htmlFor="slot-item-source"
              >
                슬롯 내용
              </label>
              <textarea
                id="slot-item-source"
                value={itemSource}
                onChange={(event) => updateItemSource(event.target.value)}
                aria-describedby="slot-item-source-help"
                rows={7}
                className="mt-2 w-full resize-y rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm leading-6 text-slate-900 transition outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
              <p
                className="mt-1.5 flex items-center gap-1.5 text-xs leading-5 text-slate-500"
                id="slot-item-source-help"
              >
                <CircleHelp aria-hidden="true" className="size-3.5 shrink-0" />
                줄바꿈이나 쉼표로 구분합니다. 현재 {items.length}개입니다.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  className="text-sm font-bold text-slate-700"
                  htmlFor="slot-reel-count"
                >
                  릴 개수
                </label>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                  {Number.isFinite(reelCount) ? reelCount : "–"}
                </span>
              </div>
              <input
                id="slot-reel-count"
                type="range"
                min={MIN_REELS}
                max={MAX_REELS}
                step={1}
                value={Number.isFinite(reelCount) ? reelCount : MIN_REELS}
                onChange={(event) =>
                  updateReelCount(event.currentTarget.valueAsNumber)
                }
                aria-invalid={!isReelCountValid}
                aria-describedby={
                  validationMessage ? "slot-machine-validation" : undefined
                }
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-rose-500 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <div
                aria-hidden="true"
                className="mt-2 flex justify-between text-[0.65rem] font-bold text-slate-400"
              >
                <span>{MIN_REELS}</span>
                <span>{MAX_REELS}</span>
              </div>
            </div>

            {validationMessage && (
              <p
                className="rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 font-semibold text-rose-700"
                id="slot-machine-validation"
                role="alert"
              >
                {validationMessage}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
