import type { ShutterSliderImage } from "@/components/ShutterSlider";

export interface ShutterSliderDemoStory {
  readonly id: string;
  readonly image: ShutterSliderImage;
  readonly chapter: string;
  readonly title: string;
  readonly englishTitle: string;
  readonly description: string;
  readonly location: string;
  readonly moment: string;
  readonly accentClassName: string;
}

export const SHUTTER_SLIDER_DATA = [
  {
    id: "han-river-blue-hour",
    image: {
      src: "/reactpod/photos/han-river.webp",
      alt: "해 질 무렵 다리의 불빛이 비치는 한강 산책로",
      position: "center",
    },
    chapter: "Scene 01 · Seoul",
    title: "강의 푸른 시간",
    englishTitle: "Blue hour, Han River",
    description:
      "낮의 열기가 가라앉고 도시의 불빛이 물 위에 길게 번지는 시간. 서울은 강을 따라 천천히 밤이 된다.",
    location: "Han River · Seoul",
    moment: "20:17 / Summer",
    accentClassName: "text-sky-200",
  },
  {
    id: "neon-after-rain",
    image: {
      src: "/reactpod/photos/neon-alley.webp",
      alt: "비에 젖은 네온 골목과 가게 앞에 세워진 자전거",
      position: "center",
    },
    chapter: "Scene 02 · Night walk",
    title: "비가 남긴 네온",
    englishTitle: "Neon after rain",
    description:
      "문 닫을 시간을 잊은 골목에서 붉고 푸른 간판이 젖은 길 위로 겹친다. 밤 산책은 여기서 시작된다.",
    location: "Backstreet · Seoul",
    moment: "23:42 / Monsoon",
    accentClassName: "text-rose-200",
  },
  {
    id: "sea-platform",
    image: {
      src: "/reactpod/photos/sea-platform.webp",
      alt: "철길 너머 푸른 바다를 마주한 빈 승강장과 벤치",
      position: "center",
    },
    chapter: "Scene 03 · East coast",
    title: "바다를 기다리는 역",
    englishTitle: "The station facing east",
    description:
      "기차가 떠난 뒤에도 벤치는 수평선을 향해 남아 있다. 파도와 다음 열차 사이, 잠깐의 고요를 기록한다.",
    location: "East Coast · Korea",
    moment: "11:08 / Autumn",
    accentClassName: "text-cyan-100",
  },
  {
    id: "seaside-picnic",
    image: {
      src: "/reactpod/photos/seaside-picnic.webp",
      alt: "노을 진 해변의 담요 위에 놓인 귤과 카메라, 책과 음악 플레이어",
      position: "center",
    },
    chapter: "Scene 04 · Island note",
    title: "귤빛 오후의 재생 목록",
    englishTitle: "A tangerine afternoon",
    description:
      "한 장의 사진과 오래된 노래, 막 껍질을 벗긴 귤. 섬의 하루는 가장 단순한 것들로 오래 기억된다.",
    location: "Seaside · Jeju",
    moment: "17:26 / Late fall",
    accentClassName: "text-amber-200",
  },
] as const satisfies readonly ShutterSliderDemoStory[];

export const SHUTTER_SLIDER_IMAGES: readonly ShutterSliderImage[] =
  SHUTTER_SLIDER_DATA.map((story) => story.image);
