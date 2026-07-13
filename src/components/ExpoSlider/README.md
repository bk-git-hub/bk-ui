# Expo Slider

Swiper Expo의 중심 슬라이드/주변 프레임 대비를 BK-UI 방식으로 다시 만든 React + Tailwind 컴포넌트입니다. Swiper나 Next.js 런타임에 의존하지 않으며, 연속 progress를 이용해 프레임 확대, 이미지 패럴랙스, 흑백 깊이, 선택적 3D 회전을 조합합니다.

## 공개 경로

```tsx
import {
  ExpoSliderContent,
  ExpoSliderFrame,
  ExpoSliderImage,
  ExpoSliderNext,
  ExpoSliderPagination,
  ExpoSliderPrevious,
  ExpoSliderRoot,
  ExpoSliderSlide,
  ExpoSliderStatus,
  ExpoSliderViewport,
} from "@/components/ExpoSlider";
```

- 일반 React / Vite: `@/components/ExpoSlider`
- Next.js App Router: `@/components/ExpoSlider/client`

두 경로는 같은 React + Tailwind 코어를 사용합니다. `client.ts`는 구현을 복제하지 않고 `'use client'` 경계와 코어 재수출만 제공하며 `next/*` import는 없습니다.

## 기본 사용법

```tsx
import {
  ExpoSliderContent,
  ExpoSliderFrame,
  ExpoSliderImage,
  ExpoSliderNext,
  ExpoSliderPrevious,
  ExpoSliderRoot,
  ExpoSliderSlide,
  ExpoSliderStatus,
  ExpoSliderViewport,
} from "@/components/ExpoSlider";

const slides = [
  { src: "/photos/coast.webp", alt: "바다를 향한 빈 플랫폼", title: "Coast" },
  { src: "/photos/city.webp", alt: "비 온 뒤 네온 골목", title: "Night" },
];

export function Gallery() {
  return (
    <ExpoSliderRoot count={slides.length} loop aria-label="여행 사진">
      <ExpoSliderViewport className="min-h-80 bg-neutral-950">
        {slides.map((slide, index) => (
          <ExpoSliderSlide
            key={slide.src}
            index={index}
            aria-label={slide.title}
          >
            <ExpoSliderFrame>
              <ExpoSliderImage src={slide.src} alt={slide.alt} />
              <ExpoSliderContent className="flex items-end bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <h2 className="text-3xl font-semibold">{slide.title}</h2>
              </ExpoSliderContent>
            </ExpoSliderFrame>
          </ExpoSliderSlide>
        ))}
      </ExpoSliderViewport>

      <div className="flex items-center gap-4">
        <ExpoSliderPrevious aria-label="이전 슬라이드">이전</ExpoSliderPrevious>
        <ExpoSliderStatus />
        <ExpoSliderNext aria-label="다음 슬라이드">다음</ExpoSliderNext>
      </div>
    </ExpoSliderRoot>
  );
}
```

## 일반 React / Vite

`ExpoSlider` 폴더를 앱의 `src/components` 아래에 두고 위 예시처럼 React 진입점에서 가져옵니다. Tailwind가 `src/**/*.{js,ts,jsx,tsx}`를 탐색한다면 추가 설정은 필요하지 않습니다.

필요한 런타임 패키지는 React, `clsx`, `tailwind-merge`뿐입니다. Swiper나 애니메이션 라이브러리를 설치하지 않습니다.

## Next.js App Router

복합 컴포넌트의 상태와 이벤트 경계를 한눈에 알 수 있도록 갤러리 조합 파일을 Client Component로 두는 방식을 권장합니다.

```tsx
// app/gallery/expo-gallery.tsx
"use client";

import {
  ExpoSliderRoot,
  ExpoSliderViewport,
} from "@/components/ExpoSlider/client";

export function ExpoGallery() {
  return (
    <ExpoSliderRoot count={3}>
      <ExpoSliderViewport>{/* slides */}</ExpoSliderViewport>
    </ExpoSliderRoot>
  );
}
```

```tsx
// app/gallery/page.tsx — Server Component
import { ExpoGallery } from "./expo-gallery";

export default function Page() {
  return <ExpoGallery />;
}
```

렌더 중 `window`나 `document`를 읽지 않으며 포인터 관련 브라우저 API는 이벤트가 발생한 뒤에만 사용합니다. 따라서 서버 렌더와 초기 hydration 결과가 같습니다. Next.js를 의존성으로 추가하거나 전용 컴포넌트를 복제할 필요가 없습니다. 상태, 콜백, 함수형 `ExpoSliderStatus` children은 이 Client Component 안에서 정의하고 Server Component에서는 직렬화 가능한 슬라이드 데이터만 전달합니다.

Tailwind 소스 탐색 범위 안에 파일이 있어야 합니다.

- 앱의 `components` 또는 `src/components`로 복사한 경우 Tailwind의 기본 자동 탐색으로 충분합니다.
- 패키지나 모노레포의 자동 탐색 범위 밖에서 직접 소비한다면 Tailwind v4 전역 CSS에 소스를 등록합니다.

```css
@import "tailwindcss";
@source "../node_modules/your-ui-package/src/components/ExpoSlider";
```

Tailwind v3 프로젝트라면 `tailwind.config`의 `content`에 동일한 TS/TSX 경로를 추가합니다.

## 주요 API

| prop                     | 기본값       | 설명                                |
| ------------------------ | ------------ | ----------------------------------- |
| `value` / `defaultValue` | `0`          | 제어/비제어 활성 인덱스             |
| `onValueChange`          | -            | 값, 이전 값, 방향, 입력 소스를 전달 |
| `loop`                   | `true`       | 처음과 끝을 연결                    |
| `orientation`            | `horizontal` | `horizontal` 또는 `vertical`        |
| `slidesPerView`          | `1.5`        | 진행 축에서 보이는 슬라이드 수      |
| `gap`                    | `24`         | 슬라이드 사이 간격(px)              |
| `scaleFactor`            | `1.25`       | 주변 프레임의 최대 확대 비율        |
| `mediaScaleFactor`       | `1.125`      | 주변 이미지의 최대 확대 비율        |
| `parallax`               | `50`         | 이미지 패럴랙스 강도                |
| `rotation`               | `0`          | 주변 프레임의 최대 X/Y 회전 각도    |
| `grayscale`              | `true`       | 중심에서 멀어질수록 흑백 처리       |
| `disabled`               | `false`      | 모든 입력 비활성화                  |

`ExpoSliderSlide`에는 0부터 시작하는 `index`가 필요합니다. `ExpoSliderImage`의 `alt`는 필수입니다. 비활성 슬라이드는 `aria-hidden`과 `inert`로 포커스 순서에서 제외됩니다. 뷰포트는 방향키, `Home`, `End`, 포인터/터치 드래그를 지원하고 `prefers-reduced-motion`에서는 전환을 제거합니다.

슬라이드 안에서 드래그 시작을 막아야 하는 링크, 버튼 또는 편집 영역에는 `data-expo-slider-no-drag`를 지정할 수 있습니다.
