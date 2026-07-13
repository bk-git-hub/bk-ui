# Slicer Slider

Swiper Studio의 Slicer Slider와 비슷한 슬라이스 전환 경험을 React 상태, Pointer Events, 시맨틱 HTML, Tailwind CSS만으로 독립 구현한 clean-room compound component입니다. Swiper Studio의 프리미엄 소스, 코드 또는 내부 구현을 가져오거나 복사하지 않았습니다.

## 일반 React / Vite

```tsx
import {
  SlicerSliderNext,
  SlicerSliderPagination,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderStatus,
  SlicerSliderViewport,
} from "@/components/SlicerSlider";

<SlicerSliderRoot
  slides={slides}
  defaultValue={0}
  sliceCount={12}
  sliceDuration={640}
  staggerDelay={32}
  loop
  aria-label="추천 콘텐츠"
>
  <SlicerSliderViewport className="aspect-video">
    {slides.map((slide, index) => (
      <SlicerSliderSlide key={slide.id} index={index}>
        <h2 className="absolute inset-x-6 bottom-6 text-2xl font-semibold text-white">
          {slide.title}
        </h2>
      </SlicerSliderSlide>
    ))}
  </SlicerSliderViewport>

  <SlicerSliderPrevious>이전</SlicerSliderPrevious>
  <SlicerSliderNext>다음</SlicerSliderNext>
  <SlicerSliderPagination aria-label="슬라이드 선택" />
  <SlicerSliderStatus />
</SlicerSliderRoot>;
```

Vite를 포함한 일반 React 프로젝트에서는 위의 프레임워크 중립 진입점을 사용합니다. 컴포넌트 폴더를 프로젝트의 `src/components` 아래에 복사하면 Tailwind CSS v4의 기본 소스 탐색 범위에 포함됩니다.

## Next.js App Router

Next.js에서는 동일한 구현을 다시 복제하지 않고, `'use client'` 경계를 제공하는 `client` 진입점으로 가져옵니다.

```tsx
// app/gallery/slicer-gallery.tsx
"use client";

import {
  SlicerSliderNext,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderViewport,
} from "@/components/SlicerSlider/client";

export function SlicerGallery() {
  return (
    <SlicerSliderRoot slides={slides} aria-label="작품 갤러리">
      <SlicerSliderViewport className="aspect-video">
        {slides.map((slide, index) => (
          <SlicerSliderSlide key={slide.src} index={index}>
            <h2 className="absolute bottom-6 left-6 text-3xl font-bold text-white">
              {slide.title}
            </h2>
          </SlicerSliderSlide>
        ))}
      </SlicerSliderViewport>
      <SlicerSliderNext>다음</SlicerSliderNext>
    </SlicerSliderRoot>
  );
}
```

`client.ts` 자체가 Client Component 진입점이므로 단순히 렌더링할 때는 별도 래퍼가 필요하지 않습니다. 예시처럼 로컬 state나 함수형 callback을 사용하는 소비자 컴포넌트도 `'use client'`로 표시합니다. Root에 서버에서 값을 전달할 때 `slides`와 기타 props는 직렬화 가능한 데이터로 유지합니다.

컴포넌트를 앱 소스 안에 복사하면 Tailwind가 클래스를 자동 탐색합니다. 패키지나 워크스페이스의 `node_modules` 경로에서 직접 소비한다면 Tailwind CSS v4 전역 CSS에 실제 패키지 경로를 등록해야 합니다.

```css
@import "tailwindcss";
@source "../node_modules/bk-ui/src/components/SlicerSlider";
```

코어에는 `next/*` import나 Next.js 런타임 의존성이 없습니다. 렌더 중에는 `window`나 `document`를 읽지 않으며, reduced-motion 미디어 쿼리와 애니메이션 타이머는 마운트 이후 Effect에서만 연결해 SSR과 hydration의 첫 마크업을 동일하게 유지합니다.

## 주요 props

- `slides`: Root가 렌더링할 이미지 descriptor 목록입니다. 각 `Slide`의 children에는 제목이나 버튼 같은 소비자 소유 overlay만 둡니다.
- `sliceCount`: 화면을 나눌 조각 수입니다. 값이 클수록 슬라이스가 촘촘해집니다.
- `sliceDuration`: 각 슬라이스 전환 시간(ms)입니다.
- `staggerDelay`: 이웃한 슬라이스가 출발하는 시간 차(ms)입니다.
- `value`, `onValueChange`: 현재 인덱스를 외부에서 관리하는 controlled 방식입니다. `defaultValue`만 전달하면 내부 상태를 사용하는 uncontrolled 방식입니다.
- `loop`: 마지막과 첫 슬라이드를 이어 순환합니다.

`SlicerSliderRoot`가 상태와 설정을 공유하고, `Viewport`, `Slide`, `Previous`, `Next`, `Pagination`, `Status`를 필요한 배치로 조합합니다. 각 공개 컴포넌트는 `className`, 표준 HTML 속성, `aria-*`, `data-*`, 이벤트 핸들러를 전달받아 확장할 수 있습니다.

## 입력과 접근성

`SlicerSliderViewport`에 포커스가 있을 때 `ArrowLeft`와 `ArrowRight`로 이동하고, `Home`과 `End`로 처음·마지막 슬라이드에 접근할 수 있습니다. 이전·다음 버튼과 페이지네이션은 키보드로 조작할 수 있으며, `Status`는 현재 위치 변경을 보조 기술에 알립니다. 포인터와 터치 스와이프를 지원하고, 대화형 자식 요소에서 시작한 제스처는 해당 요소의 기본 조작을 우선합니다.

`prefers-reduced-motion: reduce`가 설정된 환경에서는 슬라이스 시차 애니메이션을 생략하거나 최소화해 즉시 전환합니다. 비활성 슬라이드는 보조 기술과 탭 순서에서 제외되어 현재 슬라이드에만 안전하게 접근할 수 있습니다.

## 참고 자료

- [Swiper Studio Slicer Slider](https://studio.swiperjs.com/templates/slicer-slider): 공개된 시각 동작을 확인하기 위한 제품 설명입니다.
- [Next.js `use client`](https://nextjs.org/docs/app/api-reference/directives/use-client): App Router의 Client Component 진입점 기준입니다.
- [Tailwind CSS 소스 탐색](https://tailwindcss.com/docs/detecting-classes-in-source-files): 외부 패키지를 `@source`로 등록하는 방법입니다.
