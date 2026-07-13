export const tinderUsageCode = `
import {
  TinderRoot,
  TinderLikeButton,
  TinderCard,
  TinderNopeButton,
  TinderResetButton,
  TinderEmptyFallback,
} from "@/components/Tinder";

<div className="flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gray-100 p-4">
  <TinderRoot cards={SAMPLE_CARDS}>
    {({ visibleCards, currentIndex }) => (
      <>
        <div className="relative h-[450px] w-80 md:h-[550px] md:w-96">
          {visibleCards.map(({ item: card, index }) => (
            <TinderCard key={card.id} index={index} className="h-full w-full">
              <img
                src={card.image.src}
                srcSet={card.image.srcSet}
                sizes="(max-width: 374px) calc(100vw - 2rem), 343px"
                alt=""
                aria-hidden="true"
                draggable={false}
                decoding="async"
                fetchPriority={index === currentIndex ? "high" : "auto"}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
              />
              <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                <h3 className="text-2xl font-bold">
                  {card.name}, {card.age}
                </h3>
              </div>
            </TinderCard>
          ))}
          <TinderEmptyFallback>
            <div className="p-4 text-center">
              <h2 className="text-xl font-bold text-black">
                모든 카드를 확인했습니다!
              </h2>
              <TinderResetButton className="mt-10 cursor-pointer rounded-full bg-black p-4 text-white">
                RESET
              </TinderResetButton>
            </div>
          </TinderEmptyFallback>
        </div>

        <div className="mt-8 flex space-x-8">
          <TinderNopeButton className="cursor-pointer rounded-full bg-white p-4 shadow-xl transition-transform active:scale-95">
            Nope
          </TinderNopeButton>
          <TinderLikeButton className="cursor-pointer rounded-full bg-white p-4 shadow-xl transition-transform active:scale-95">
            Like
          </TinderLikeButton>
        </div>
      </>
    )}
  </TinderRoot>
</div>
`;
