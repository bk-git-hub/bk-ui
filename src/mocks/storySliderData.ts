export interface StorySliderDemoItem {
  id: string;
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  duration: number;
  imagePositionClassName?: string;
  accentClassName: string;
}

export interface StorySliderDemoGroup {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  timeLabel: string;
  ringClassName: string;
  stories: readonly StorySliderDemoItem[];
}

export const STORY_SLIDER_GROUPS: readonly StorySliderDemoGroup[] = [
  {
    id: "slow-seoul",
    name: "Slow Seoul",
    handle: "@slow.seoul",
    avatar: "/reactpod/photos/han-river.webp",
    timeLabel: "12m",
    ringClassName: "from-orange-300 via-rose-500 to-violet-600",
    stories: [
      {
        id: "river-hour",
        image: "/reactpod/photos/han-river.webp",
        alt: "한강과 서울 스카이라인이 노을빛에 물든 풍경",
        eyebrow: "18:42 · 한강",
        title: "도시가 천천히\n빛을 켜는 시간",
        description: "오늘의 서울은 서두르지 않아도 괜찮다고 말해요.",
        badge: "CITY NOTE 01",
        duration: 5600,
        accentClassName: "bg-orange-300",
      },
      {
        id: "neon-walk",
        image: "/reactpod/photos/neon-alley.webp",
        alt: "네온사인이 빛나는 서울의 밤 골목",
        eyebrow: "22:08 · 을지로",
        title: "낮보다 선명한\n밤의 골목",
        description: "작은 간판과 오래된 벽 사이에서 새 장면을 찾았어요.",
        badge: "NIGHT WALK",
        duration: 4800,
        imagePositionClassName: "object-[52%_center]",
        accentClassName: "bg-fuchsia-400",
      },
    ],
  },
  {
    id: "weekend-club",
    name: "Weekend Club",
    handle: "@weekend.club",
    avatar: "/reactpod/photos/seaside-picnic.webp",
    timeLabel: "34m",
    ringClassName: "from-amber-300 via-orange-500 to-pink-500",
    stories: [
      {
        id: "picnic-list",
        image: "/reactpod/photos/seaside-picnic.webp",
        alt: "바닷가 피크닉 담요 위 귤과 카메라, 책",
        eyebrow: "WEEKEND LIST · 04",
        title: "귤 세 개, 필름 한 롤,\n그리고 좋아하는 음악",
        description: "이번 주말에 필요한 건 생각보다 많지 않았어요.",
        badge: "SAVE THIS",
        duration: 6200,
        imagePositionClassName: "object-[56%_center]",
        accentClassName: "bg-amber-300",
      },
      {
        id: "blue-platform",
        image: "/reactpod/photos/sea-platform.webp",
        alt: "짙푸른 바다 위에 놓인 작은 플랫폼",
        eyebrow: "COAST LOG · 11:20",
        title: "파도 사이에 만든\n작은 정류장",
        description: "아무 일도 일어나지 않는 장면을 오래 바라봤어요.",
        badge: "SLOW TRIP",
        duration: 5200,
        accentClassName: "bg-cyan-300",
      },
      {
        id: "tidal-map",
        image: "/shader-slider/tidal-glass.webp",
        alt: "푸른 파도와 해를 기하학적으로 표현한 일러스트",
        eyebrow: "TIDAL MAP · 3/3",
        title: "다음 파도는\n어디로 갈까",
        description:
          "손가락을 옆으로 밀어 다음 크리에이터의 이야기를 만나보세요.",
        badge: "KEEP MOVING",
        duration: 4600,
        imagePositionClassName: "object-[70%_center]",
        accentClassName: "bg-teal-300",
      },
    ],
  },
  {
    id: "after-dark",
    name: "After Dark",
    handle: "@after.dark",
    avatar: "/shader-slider/electric-bloom.webp",
    timeLabel: "1h",
    ringClassName: "from-cyan-300 via-violet-500 to-fuchsia-500",
    stories: [
      {
        id: "electric-bloom",
        image: "/shader-slider/electric-bloom.webp",
        alt: "보랏빛 우주를 가로지르는 빛의 꽃 일러스트",
        eyebrow: "SIGNAL 07 · LIVE",
        title: "어둠 속에서만\n보이는 궤도",
        description: "오늘 밤의 신호를 가장 먼저 발견한 사람에게.",
        badge: "NEW SIGNAL",
        duration: 5000,
        imagePositionClassName: "object-[72%_center]",
        accentClassName: "bg-violet-300",
      },
      {
        id: "afterlight",
        image: "/shader-slider/afterlight.webp",
        alt: "달빛 아래 겹쳐진 산 능선 일러스트",
        eyebrow: "AFTERLIGHT · 02",
        title: "불이 꺼진 뒤에도\n남아 있는 것",
        description: "조용한 장면은 오래 머물수록 더 많은 이야기를 보여줘요.",
        badge: "LISTEN CLOSE",
        duration: 5800,
        imagePositionClassName: "object-[66%_center]",
        accentClassName: "bg-indigo-300",
      },
      {
        id: "solar-drift",
        image: "/shader-slider/solar-drift.webp",
        alt: "붉은 사막과 태양을 추상적으로 표현한 일러스트",
        eyebrow: "LAST LIGHT · 18:55",
        title: "태양이 남긴\n가장 긴 문장",
        description: "마지막 스토리에서는 재생이 멈추고 다시 볼 수 있어요.",
        badge: "THE END",
        duration: 5400,
        imagePositionClassName: "object-[68%_center]",
        accentClassName: "bg-rose-300",
      },
    ],
  },
];
