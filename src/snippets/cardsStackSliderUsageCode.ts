export const cardsStackSliderUsageCode = `import {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
} from "@/components/CardsStackSlider";

const cards = [
  { id: "seoul", city: "SEOUL", route: "ICN · GMP · SEL" },
  { id: "lisbon", city: "LISBON", route: "LIS · CAS · SIN" },
  { id: "reykjavik", city: "REYKJAVÍK", route: "KEF · REK · VIK" },
];

export default function TravelWallet() {
  return (
    <CardsStackRoot
      count={cards.length}
      orientation="horizontal"
      loop
      aria-label="Travel cards"
    >
      <CardsStackViewport className="h-80 w-full max-w-md">
        {cards.map((card, index) => (
          <CardsStackItem key={card.id} index={index}>
            <CardsStackFront className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-700 p-6 text-white">
              <p className="text-xs tracking-[0.2em] text-white/60">
                BK PASSPORT
              </p>
              <h2 className="mt-20 text-5xl font-black">{card.city}</h2>
              <p className="mt-2 text-sm text-white/70">{card.route}</p>
            </CardsStackFront>
            <CardsStackBack className="rounded-3xl bg-slate-950 p-6 text-white">
              <div className="mt-4 h-12 bg-black" />
              <p className="mt-8 text-sm text-white/70">
                Global support · +82 2 120
              </p>
            </CardsStackBack>
          </CardsStackItem>
        ))}
      </CardsStackViewport>

      <div className="mt-6 flex items-center justify-center gap-4">
        <CardsStackPrevious>Previous</CardsStackPrevious>
        <CardsStackStatus />
        <CardsStackNext>Next</CardsStackNext>
      </div>
    </CardsStackRoot>
  );
}`;
