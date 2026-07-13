import { useState } from "react";
import {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
} from "@/components/CardsStackSlider";
import { CARDS_STACK_SLIDER_DATA } from "@/mocks/cardsStackSliderData";

type StackOrientation = "horizontal" | "vertical";

const ORIENTATIONS: ReadonlyArray<{
  value: StackOrientation;
  label: string;
}> = [
  { value: "horizontal", label: "가로" },
  { value: "vertical", label: "세로" },
];

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={`size-4 ${direction === "next" ? "rotate-180" : ""}`}
    >
      <path
        d="m14.5 5-7 7 7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CardsStackSliderDemoPreview() {
  const [orientation, setOrientation] =
    useState<StackOrientation>("horizontal");

  return (
    <div className="h-full w-full overflow-y-auto rounded-lg bg-[#e9e4dc] p-4 text-slate-950 sm:p-6">
      <CardsStackRoot
        count={CARDS_STACK_SLIDER_DATA.length}
        orientation={orientation}
        loop
        aria-label="여행 결제 카드"
        className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col gap-0 overflow-hidden rounded-[2rem] border border-white/70 bg-[#f7f4ee] shadow-2xl shadow-stone-900/10"
      >
        <div
          aria-hidden="true"
          className="absolute -top-28 -left-24 size-72 rounded-full bg-violet-300/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -right-24 -bottom-32 size-80 rounded-full bg-orange-200/50 blur-3xl"
        />

        <header className="relative flex w-full flex-wrap items-start justify-between gap-4 border-b border-stone-900/8 px-5 py-5 sm:px-8">
          <div>
            <p className="text-[0.65rem] font-black tracking-[0.28em] text-violet-700 uppercase">
              BK Passport · Wallet 03
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
              다음 여정을 고르세요
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              드래그하거나 화살표 키로 카드를 넘길 수 있어요.
            </p>
          </div>

          <fieldset>
            <legend className="sr-only">카드 이동 방향</legend>
            <div className="inline-flex rounded-full border border-stone-200 bg-white/80 p-1 shadow-sm">
              {ORIENTATIONS.map((item) => (
                <label
                  key={item.value}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-violet-500 has-focus-visible:ring-offset-2 ${
                    orientation === item.value
                      ? "bg-slate-950 text-white"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <input
                    type="radio"
                    name="cards-stack-orientation"
                    value={item.value}
                    checked={orientation === item.value}
                    onChange={() => setOrientation(item.value)}
                    className="sr-only"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
        </header>

        <div className="relative flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
          <CardsStackViewport className="w-full max-w-[25rem]">
            {CARDS_STACK_SLIDER_DATA.map((card, index) => (
              <CardsStackItem key={card.id} index={index}>
                <CardsStackFront
                  className={`overflow-hidden rounded-[1.75rem] border border-white/20 p-4 text-white shadow-2xl sm:p-6 ${card.gradientClassName}`}
                >
                  <div
                    aria-hidden="true"
                    className={`absolute -top-20 -right-12 size-52 rounded-full blur-3xl ${card.glowClassName}`}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 [background-image:repeating-linear-gradient(120deg,transparent_0_17px,rgba(255,255,255,.22)_18px)] opacity-20"
                  />

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.6rem] font-bold tracking-[0.26em] text-white/65 uppercase">
                          {card.edition}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-white/80">
                          {card.country}
                        </p>
                      </div>
                      <span className="text-sm font-black tracking-[0.2em]">
                        BK°
                      </span>
                    </div>

                    <div>
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-3xl font-black tracking-[-0.06em] sm:text-5xl">
                            {card.cityCode}
                          </p>
                          <p className="mt-1 text-xs font-bold tracking-[0.18em] text-white/70 uppercase">
                            {card.city}
                          </p>
                        </div>
                        <p className="pb-1 text-right text-xs font-semibold tracking-[0.12em] text-white/70">
                          {card.route}
                        </p>
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-4 border-t border-white/20 pt-3 sm:mt-5 sm:pt-4">
                        <div>
                          <p className="text-[0.55rem] font-bold tracking-[0.2em] text-white/55 uppercase">
                            Available
                          </p>
                          <p className="mt-1 text-base font-black tracking-tight sm:text-lg">
                            {card.balance}
                          </p>
                        </div>
                        <p className="font-mono text-[0.65rem] tracking-[0.12em] text-white/75">
                          •••• {card.cardNumber.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardsStackFront>

                <CardsStackBack
                  className={`overflow-hidden rounded-[1.75rem] border border-white/20 text-white shadow-2xl ${card.gradientClassName}`}
                >
                  <div className="flex h-full flex-col py-4 sm:py-6">
                    <div className="h-10 w-full bg-black/60 sm:h-12" />
                    <div className="flex flex-1 flex-col justify-between px-4 pt-3 sm:px-6 sm:pt-5">
                      <div>
                        <div className="flex items-center gap-2 rounded-md bg-white/90 p-2 text-slate-950">
                          <div className="h-7 flex-1 bg-[repeating-linear-gradient(0deg,#d6d3d1_0_2px,#fafaf9_2px_4px)]" />
                          <span className="font-mono text-xs font-bold">
                            {card.securityCode}
                          </span>
                        </div>
                        <p className="mt-2 text-[0.58rem] leading-4 text-white/60">
                          이 카드는 서명한 회원만 사용할 수 있습니다.
                        </p>
                      </div>

                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="font-mono text-xs tracking-[0.14em] text-white/80">
                            {card.cardNumber}
                          </p>
                          <div className="mt-2 flex gap-6 text-[0.55rem] font-bold tracking-[0.14em] text-white/55 uppercase">
                            <span>{card.cardholder}</span>
                            <span>Valid {card.validThrough}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[0.5rem] font-bold tracking-[0.18em] text-white/50 uppercase">
                            Global care
                          </p>
                          <p className="mt-1 text-[0.65rem] font-semibold">
                            {card.supportLine}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardsStackBack>
              </CardsStackItem>
            ))}
          </CardsStackViewport>

          <div className="mt-7 flex items-center gap-4">
            <CardsStackPrevious
              aria-label="이전 여행 카드"
              className="grid size-10 place-items-center rounded-full border border-stone-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowIcon direction="previous" />
            </CardsStackPrevious>
            <CardsStackStatus className="min-w-20 text-center font-mono text-xs font-bold tracking-[0.16em] text-stone-500" />
            <CardsStackNext
              aria-label="다음 여행 카드"
              className="grid size-10 place-items-center rounded-full border border-stone-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowIcon direction="next" />
            </CardsStackNext>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-stone-500">
            카드를 넘길 때 뒷면과 다음 여정이 자연스럽게 이어집니다.
          </p>
        </div>
      </CardsStackRoot>
    </div>
  );
}
