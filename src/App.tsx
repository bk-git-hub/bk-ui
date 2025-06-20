// src/App.tsx

import { Tinder } from "@/components/Tinder";

// 재사용을 위해 샘플 데이터를 정의합니다.
const SAMPLE_CARDS = [
  {
    id: "1",
    name: "Jennifer",
    age: 24,
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "David",
    age: 28,
    image:
      "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=1740&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Sophia",
    age: 26,
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Michael",
    age: 30,
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: "5",
    name: "Emily",
    age: 22,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop",
  },
];

function App() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-gray-100 p-4">
      {/* 1. Tinder.Root가 모든 것을 감싸고, cards 데이터를 주입합니다. */}
      <Tinder.Root cards={SAMPLE_CARDS}>
        {/* 카드가 표시될 영역의 크기와 위치를 지정합니다. */}
        <div className="relative h-[450px] w-80 md:h-[550px] md:w-96">
          {/* 2. 데이터를 map으로 순회하며 Tinder.Card를 렌더링합니다. */}
          {SAMPLE_CARDS.map((card, i) => (
            <Tinder.Card
              key={card.id}
              index={i} // ◀️ 카드의 순서를 알려주는 index prop은 필수입니다.
              className="h-full w-full bg-cover bg-center" // ◀️ 커스텀 스타일링
              style={{ backgroundImage: `url(${card.image})` }}
            >
              {/* 3. Card 내부에 원하는 컨텐츠를 자유롭게 넣을 수 있습니다. */}
              <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                <h3 className="text-2xl font-bold">
                  {card.name}, {card.age}
                </h3>
              </div>
            </Tinder.Card>
          ))}
        </div>

        {/* 4. 컨트롤 버튼들을 원하는 위치에 배치합니다. */}
        <div className="mt-8 flex space-x-8">
          <Tinder.NopeButton className="rounded-full bg-white p-4 shadow-xl transition-transform active:scale-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Tinder.NopeButton>
          <Tinder.LikeButton className="rounded-full bg-white p-4 shadow-xl transition-transform active:scale-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </Tinder.LikeButton>
        </div>
      </Tinder.Root>
    </div>
  );
}

export default App;
