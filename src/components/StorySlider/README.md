# Story Slider

Instagram/Snapchat 스타일의 그룹형 스토리 뷰어다. Swiper나 Next.js 런타임에 의존하지 않고 React 상태, Pointer Events, `requestAnimationFrame`, Tailwind 유틸리티만 사용한다.

React 19+의 `ref` as prop 타입을 기준으로 한다. React 18 프로젝트까지 지원해야 한다면 공개 primitive의 ref 경계를 `forwardRef`로 감싸는 별도 호환 작업이 필요하다.

Swiper의 Stories Slider가 제공하는 핵심 경험을 참고하되 구현은 BK-UI의 compound component 방식으로 새로 구성했다.

## 특징

- 크리에이터 그룹과 그룹별 스토리 진행 막대
- 스토리별 자동 재생 시간과 마지막 스토리 종료 처리
- 화면 왼쪽/오른쪽 탭, 길게 누르기 일시정지, 그룹 간 좌우 스와이프
- 이전/다음, 재생/정지 버튼과 `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Space` 키
- controlled/uncontrolled 값, loop, disabled, per-story duration
- active story만 접근성 트리에 노출하고 나머지는 `inert` 처리
- `prefers-reduced-motion`, 문서 visibility, hover, focus에 따른 재생 정지
- 자식 render function으로 active/paused/progress 상태를 받아 이미지와 비디오를 자유롭게 구성

## 공개 경로

안정적인 공개 진입점은 다음 하나다.

```tsx
import {
  StorySliderRoot,
  StorySliderViewport,
  StorySliderGroup,
  StorySliderItem,
} from "@/components/StorySlider";
```

`index.ts`와 상호작용 구현에는 React의 `'use client'` 경계가 선언되어 있다. Vite와 일반 React 빌드에서는 무해하고, Next.js App Router에서는 이 진입점을 Client Component 경계로 인식한다. `next/*` import나 Next.js 런타임 의존성은 없다.

`groupCounts[groupIndex]`는 해당 `StorySliderGroup` 안에 렌더한 `StorySliderItem` 개수와 일치해야 한다. 모든 primitive는 해당 HTML 요소의 표준 속성, `aria-*`, `data-*`, `className`, `style`, `ref`를 전달한다.

## 일반 React / Vite

`src/components/StorySlider` 폴더를 프로젝트 안으로 복사하고 `clsx`, `tailwind-merge`가 없다면 설치한다.

```bash
pnpm add clsx tailwind-merge
```

아래 `@/components/StorySlider`는 이 저장소의 `@ -> src` alias를 사용한다. 기본 Vite 프로젝트라면 `vite.config.ts`와 `tsconfig`에 같은 alias를 추가하거나 복사한 위치에 맞는 상대 경로로 바꾼다.

```tsx
import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderPlayback,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderViewport,
} from "@/components/StorySlider";

const groups = [
  ["/stories/one.webp", "/stories/two.webp"],
  ["/stories/three.webp"],
];

export function Stories() {
  return (
    <StorySliderRoot groupCounts={groups.map((group) => group.length)}>
      <StorySliderViewport className="h-[680px] w-auto rounded-3xl">
        {groups.map((stories, groupIndex) => (
          <StorySliderGroup key={groupIndex} index={groupIndex}>
            {stories.map((src, itemIndex) => (
              <StorySliderItem key={src} index={itemIndex}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </StorySliderItem>
            ))}
            <StorySliderProgress className="absolute inset-x-0 top-0 z-10 m-4" />
          </StorySliderGroup>
        ))}
      </StorySliderViewport>
      <StorySliderPlayback className="mt-4 bg-black px-4 text-white">
        {({ paused }) => (paused ? "Play" : "Pause")}
      </StorySliderPlayback>
    </StorySliderRoot>
  );
}
```

## Next.js App Router

같은 `StorySlider` 폴더를 `src/components/StorySlider`에 두고 같은 공개 경로로 import한다. 컴포넌트 자체가 client boundary를 제공하므로 별도 Next.js 어댑터나 복제본은 필요 없다.

상태와 이벤트 핸들러를 직접 소유하는 사용 컴포넌트는 일반적인 App Router 규칙대로 파일 상단에 `'use client'`를 둔다.

```tsx
// src/components/ProductStories.tsx
"use client";

import { useState } from "react";
import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderPlayback,
  StorySliderRoot,
  StorySliderViewport,
  type StorySliderValue,
} from "@/components/StorySlider";

export function ProductStories() {
  const [value, setValue] = useState<StorySliderValue>({
    groupIndex: 0,
    itemIndex: 0,
  });

  return (
    <StorySliderRoot
      groupCounts={[2, 1]}
      value={value}
      onValueChange={(nextValue) => setValue(nextValue)}
    >
      <StorySliderViewport>
        <StorySliderGroup index={0}>
          <StorySliderItem index={0}>First story</StorySliderItem>
          <StorySliderItem index={1}>Second story</StorySliderItem>
        </StorySliderGroup>
        <StorySliderGroup index={1}>
          <StorySliderItem index={0}>Third story</StorySliderItem>
        </StorySliderGroup>
      </StorySliderViewport>
      <StorySliderPlayback>
        {({ paused }) => (paused ? "Play" : "Pause")}
      </StorySliderPlayback>
    </StorySliderRoot>
  );
}
```

그 뒤 Server Component인 `app/page.tsx`에서는 함수를 prop으로 넘기지 말고 완성된 client wrapper를 렌더한다.

특히 `onValueChange`, `onPlaybackEnd`, 함수형 `duration`, `StorySliderItem`/`StorySliderPlayback`/`StorySliderStatus`의 render-function children은 React Server Component 경계를 직접 통과할 수 없는 함수 값이다. 이 값들은 위 예시처럼 client wrapper 안에서 선언한다. 숫자 `duration`, `groupCounts`, 문자열/일반 JSX처럼 직렬화 가능한 값만 Server Component에서 Client Component로 전달한다.

```tsx
import { ProductStories } from "@/components/ProductStories";

export default function Page() {
  return <ProductStories />;
}
```

브라우저 전역은 effect나 이벤트 안에서만 접근하므로 서버 렌더와 첫 hydration markup이 같다. reduced-motion과 visibility 상태는 hydration 뒤 effect에서 동기화된다.

### Tailwind 소스 탐색

컴포넌트를 Next.js/Vite 프로젝트의 `src` 또는 `app` 아래로 복사하면 Tailwind v4의 기본 자동 탐색 범위에 포함된다. 패키지나 프로젝트 밖의 공유 폴더에서 import한다면 전역 CSS에 소스를 명시한다.

```css
@import "tailwindcss";
@source "../node_modules/your-ui-package/dist";
```

`@source` 경로는 이 선언을 작성한 CSS 파일을 기준으로 한 상대 경로다.

Tailwind v3 프로젝트라면 `tailwind.config.ts`의 `content`에 복사한 경로를 넣는다.

```ts
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/StorySlider/**/*.{js,ts,jsx,tsx}",
  ],
};
```

기존 `content` 배열을 대체하지 말고 프로젝트의 pages/components 경로와 함께 병합한다.

동적으로 조합한 색상 클래스는 Tailwind가 찾지 못할 수 있으므로 완전한 클래스 문자열을 데이터에 저장하거나 safelist/source에 포함한다.

## 주요 API

### `StorySliderRoot`

| prop                     | 기본값                            | 설명                                                     |
| ------------------------ | --------------------------------- | -------------------------------------------------------- |
| `groupCounts`            | 필수                              | 각 그룹의 스토리 개수                                    |
| `value` / `defaultValue` | `{ groupIndex: 0, itemIndex: 0 }` | controlled/uncontrolled 현재 위치                        |
| `onValueChange`          | -                                 | 다음 값과 `source`, `direction`, `previousValue` 전달    |
| `duration`               | `5000`                            | 밀리초 또는 `(value) => milliseconds`                    |
| `autoplay`               | `true`                            | 초기 자동 진행 여부. `false`여도 재생 버튼으로 시작 가능 |
| `loop`                   | `false`                           | 마지막 그룹 뒤 첫 그룹으로 순환                          |
| `disabled`               | `false`                           | 포인터, 키보드, 버튼, 자동 진행을 모두 비활성화          |
| `onPlaybackEnd`          | -                                 | non-loop 마지막 스토리가 끝날 때 호출                    |
| `swipeThreshold`         | `0.18`                            | 그룹 스와이프가 확정되는 viewport 비율                   |
| `tapPreviousRatio`       | `0.35`                            | 이전 탭 영역의 왼쪽 비율                                 |
| `longPressDelay`         | `200`                             | 탭으로 처리하지 않을 누름 시간                           |
| `transitionDuration`     | `480`                             | 그룹 전환 시간(ms)                                       |

### Compound components

- `StorySliderViewport`: 9:16 포커스/키보드/포인터 영역
- `StorySliderGroup`: `index`가 필요한 크리에이터 그룹
- `StorySliderItem`: 그룹 안의 `index` 기반 스토리. render function은 `{ active, paused, progress }`를 받는다.
- `StorySliderProgress`: 활성 그룹의 segmented progress. `trackClassName`과 `indicatorClassName`으로 각 막대를 확장한다.
- `StorySliderPrevious` / `StorySliderNext`: 접근 가능한 명시적 이동 버튼
- `StorySliderPlayback`: render function으로 `{ paused }`를 받는 재생/정지 버튼
- `StorySliderStatus`: 현재 그룹/스토리 상태 live region

고급 제어에는 공개 hook `useStorySlider`를 사용할 수 있다. 값 정규화와 탐색 계산은 `normalizeStorySliderValue`, `getStorySliderStep`, `getStorySliderGroupPosition`으로 내보낸다. 스타일/테스트 계약에는 `data-slot="story-slider-*"`, `data-state`, `data-paused`, `data-dragging` 속성을 사용할 수 있다.

## 비디오

`StorySliderItem`의 render function으로 active/paused를 받아 `<video>`의 재생 상태를 동기화할 수 있다. 브라우저 autoplay 정책 때문에 `video.play()`의 rejected promise를 처리하고, muted 또는 사용자 재생 버튼을 제공해야 한다. 영상 metadata duration을 쓰려면 값을 상태에 보관해 `StorySliderRoot duration={(value) => ...}`에 전달한다.

## 접근성 메모

- 자동 재생에는 항상 `StorySliderPlayback`을 함께 제공한다.
- 이미지 `alt`, 그룹과 root의 명확한 `aria-label`을 제공한다.
- focus가 carousel 내부로 들어오면 자동 재생이 정지되며 명시적으로 다시 재생할 때까지 유지된다.
- hover와 pointer hold는 남은 시간을 보존한 채 일시 정지된다.
- reduced-motion 사용자는 초기 hydration 뒤 자동 재생이 정지된다.
