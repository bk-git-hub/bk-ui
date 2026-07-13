# Shutter Slider

Swiper의 Shutter Slider가 보여 주는 셔터 전환 경험을 참고하되, React 상태와 Pointer Events, 시맨틱 HTML, Tailwind CSS만으로 독립 구현한 clean-room compound component입니다. 외부 슬라이더의 소스 코드나 내부 구현을 복사하거나 포함하지 않습니다.

## Vite / 일반 React

```tsx
import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
} from "@/components/ShutterSlider";

const stories = [
  {
    image: { src: "/photos/river.webp", alt: "해 질 무렵의 강" },
    title: "푸른 시간",
  },
  {
    image: { src: "/photos/alley.webp", alt: "비에 젖은 골목" },
    title: "비가 남긴 빛",
  },
];

<ShutterSliderRoot
  slides={stories.map((story) => story.image)}
  stripCount={5}
  orientation="vertical"
  transitionDuration={820}
  stagger={52}
  loop
  aria-label="여행 기록"
  className="overflow-hidden rounded-3xl bg-slate-950 text-white"
>
  <ShutterSliderViewport className="aspect-video">
    {stories.map((story, index) => (
      <ShutterSliderSlide key={story.image.src} index={index}>
        <h2 className="absolute bottom-20 left-8 text-4xl font-black">
          {story.title}
        </h2>
      </ShutterSliderSlide>
    ))}
  </ShutterSliderViewport>

  <ShutterSliderPrevious>이전</ShutterSliderPrevious>
  <ShutterSliderNext>다음</ShutterSliderNext>
  <ShutterSliderPagination aria-label="장면 선택" />
  <ShutterSliderStatus />
</ShutterSliderRoot>;
```

`slides`는 이미지 렌더링을 위한 descriptor 목록이고, 각 `ShutterSliderSlide`에는 제목이나 링크처럼 소비자가 소유하는 overlay 콘텐츠를 둡니다. 모든 공개 컴포넌트는 `className`, 표준 HTML 속성, `aria-*`, `data-*`, 이벤트 핸들러로 확장할 수 있습니다.

Vite 프로젝트에서는 위 파일들을 앱의 `src/components/ShutterSlider`에 복사하고 `@` alias를 `src`에 연결하면 됩니다. 별도의 Swiper 런타임이나 스타일 패키지는 필요하지 않습니다.

## Next.js App Router

`client.ts`는 `"use client"` 경계만 선언한 뒤 같은 코어를 다시 export합니다. Next 전용 컴포넌트 복제본이나 `next/dynamic`, `ssr: false` import는 만들지 않습니다. App Router에서는 명시적인 `@/components/ShutterSlider/client` 공개 경로를 사용하세요. 다음처럼 소비 파일이 `useState`, 이벤트 콜백 등 상호작용 상태를 직접 조합한다면 그 파일에도 `"use client"`를 선언합니다.

```tsx
"use client";

import { useState } from "react";
import {
  ShutterSliderNext,
  ShutterSliderPagination,
  ShutterSliderPrevious,
  ShutterSliderRoot,
  ShutterSliderSlide,
  ShutterSliderStatus,
  ShutterSliderViewport,
  type ShutterSliderOrientation,
} from "@/components/ShutterSlider/client";

const stories = [
  {
    image: { src: "/photos/river.webp", alt: "해 질 무렵의 강" },
    title: "푸른 시간",
  },
  {
    image: { src: "/photos/alley.webp", alt: "비에 젖은 골목" },
    title: "비가 남긴 빛",
  },
];

export default function TravelSlider() {
  const [orientation, setOrientation] =
    useState<ShutterSliderOrientation>("vertical");

  return (
    <section>
      <button
        type="button"
        onClick={() =>
          setOrientation((current) =>
            current === "vertical" ? "horizontal" : "vertical",
          )
        }
      >
        셔터 방향 전환
      </button>

      <ShutterSliderRoot
        slides={stories.map((story) => story.image)}
        orientation={orientation}
        stripCount={5}
        loop
        aria-label="여행 기록"
        className="overflow-hidden rounded-3xl bg-slate-950 text-white"
      >
        <ShutterSliderViewport className="aspect-video">
          {stories.map((story, index) => (
            <ShutterSliderSlide key={story.image.src} index={index}>
              <h2 className="absolute bottom-20 left-8 text-4xl font-black">
                {story.title}
              </h2>
            </ShutterSliderSlide>
          ))}
        </ShutterSliderViewport>
        <ShutterSliderPrevious>이전</ShutterSliderPrevious>
        <ShutterSliderNext>다음</ShutterSliderNext>
        <ShutterSliderPagination />
        <ShutterSliderStatus />
      </ShutterSliderRoot>
    </section>
  );
}
```

상태나 이벤트를 직접 소유하지 않고 직렬화 가능한 props로 Shutter Slider를 렌더링만 하는 App Router 파일은 Server Component로 남겨 둘 수 있습니다. 이미지 descriptor와 `defaultValue`처럼 첫 화면에 영향을 주는 값은 서버와 클라이언트에서 같게 유지하세요. 코어는 서버 렌더 중 브라우저 전역을 요구하지 않고, 미디어 쿼리와 애니메이션 스케줄링은 hydration 이후에 동기화하므로 초기 마크업을 안정적으로 유지합니다. 소비자 children에서도 렌더 중 `window`나 현재 시각 같은 비결정적 값을 사용하지 않으면 별도의 SSR 우회가 필요하지 않습니다.

정적인 `ReactNode` children은 Server Component에서 전달할 수 있지만, `onValueChange`, `getLabel`, DOM 이벤트·ref, `ShutterSliderStatus`의 render-function children처럼 함수인 props를 조합하는 파일은 반드시 Client Component로 두세요.

## Tailwind CSS v4 소스 탐색

컴포넌트 파일을 Vite 또는 Next 앱의 `src`나 `app` 안에 복사하면 Tailwind CSS v4가 클래스 소스를 자동으로 탐색합니다. 컴포넌트를 별도 패키지로 설치해 앱의 기본 탐색 범위 밖에서 가져오는 경우에는 앱의 `globals.css`에서 실제 패키지 위치를 기준으로 `@source`를 추가합니다.

```css
@import "tailwindcss";
@source "../node_modules/@your-scope/bk-ui/src/components/ShutterSlider";
```

경로는 `globals.css`의 위치와 패키지 배포 구조에 맞게 조정합니다. 이는 Tailwind의 빌드 타임 소스 등록이며 Next 런타임 의존성을 추가하지 않습니다.

## API

### `ShutterSliderRoot`

- `slides`: `{ src, alt, srcSet?, sizes?, fit?, position?, crossOrigin?, referrerPolicy? }` 형태의 이미지 목록입니다.
- `stripCount`: 셔터 조각 수입니다. 기본값은 `5`이며 `2`부터 `16` 사이로 보정됩니다.
- `orientation`: 셔터가 나뉘는 방향입니다. `"vertical"` 또는 `"horizontal"`이며 기본값은 `"vertical"`입니다.
- `transitionDuration`: 각 조각의 이동 시간(ms)입니다. 기본값은 `900`입니다.
- `stagger`: 이웃한 조각이 출발하는 시간 차(ms)입니다. 기본값은 `0`입니다.
- `value`, `onValueChange`: 현재 인덱스를 외부에서 관리하는 controlled 방식입니다. `onValueChange`는 새 인덱스와 `{ previousValue, direction, source }`를 전달합니다.
- `defaultValue`: 내부 상태를 사용하는 uncontrolled 방식의 최초 인덱스입니다.
- `loop`: 마지막 장면과 첫 장면을 연결합니다. 기본값은 `true`입니다.
- `dragThreshold`: 가로 드래그가 이동으로 판정되는 최소 거리(px)입니다. 기본값은 `48`입니다.
- `disabled`: 모든 이동 입력을 비활성화합니다.

### Compound components

- `ShutterSliderViewport`: 이미지와 셔터 조각을 렌더링하고 키보드·포인터 입력을 받습니다.
- `ShutterSliderSlide`: `index`에 대응하는 overlay 콘텐츠입니다. 활성 상태와 전환 상태는 `data-active`, `data-state`로 노출됩니다.
- `ShutterSliderPrevious`, `ShutterSliderNext`: 이전·다음 장면으로 이동하는 버튼입니다.
- `ShutterSliderPagination`: 각 장면으로 바로 이동하는 버튼 목록입니다. `getLabel(index, slide)`로 접근 가능한 이름을 바꿀 수 있습니다.
- `ShutterSliderStatus`: 기본 위치 문자열을 알리거나 render function으로 `{ value, count, slide }`를 받아 표시 형식을 바꿉니다.

`orientation`은 셔터 조각의 시각적 배열을 정합니다. 드래그 탐색은 페이지의 세로 스크롤과 충돌하지 않도록 두 방향 모두 가로 제스처를 사용합니다.

## 접근성

Root는 carousel, 각 Slide는 slide 의미를 제공하며 비활성 콘텐츠는 `aria-hidden`과 `inert`로 보조 기술 및 탭 순서에서 제외됩니다. Viewport에 포커스가 있을 때 `ArrowLeft`와 `ArrowRight`로 이동하고 `Home`, `End`로 처음과 마지막 장면에 접근할 수 있습니다. 이전·다음 버튼과 페이지네이션은 네이티브 `button`이라 키보드로 조작할 수 있고, Status는 `role="status"`와 `aria-live="polite"`로 위치 변경을 알립니다.

이미지의 `alt`는 슬라이드의 기본 접근 가능한 이름에 사용됩니다. overlay가 장면을 더 정확히 설명한다면 각 `ShutterSliderSlide`에 별도의 `aria-label`을 전달하세요. `prefers-reduced-motion: reduce` 환경에서는 셔터 시차와 콘텐츠 전환을 생략해 즉시 이동합니다. 링크나 버튼 등 대화형 요소에서 시작한 포인터 동작은 해당 요소의 기본 조작을 우선합니다.
