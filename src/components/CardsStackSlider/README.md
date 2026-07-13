# CardsStackSlider

Swiper의 별도 플러그인 없이 React 상태, Pointer Events, Tailwind 유틸리티만으로 구성한 3D 카드 스택 compound component입니다. 현재 카드는 드래그를 따라 움직이고, 지나간 카드는 뒷면을 보이며, 다음 카드는 원호를 따라 앞으로 이동합니다.

## 공개 경로

- React 및 Vite: `@/components/CardsStackSlider`
- Next.js App Router: `@/components/CardsStackSlider/client`

두 경로는 같은 React + Tailwind 코어를 사용합니다. `client.ts`는 구현을 복제하지 않고 `"use client"` 경계와 코어 재수출만 제공합니다. 현재 저장소는 private 앱이므로 npm 패키지 subpath는 공개 API로 약속하지 않습니다.

## React / Vite

`CardsStackSlider` 폴더를 소비 앱의 `src/components` 아래에 복사하고 기본 진입점에서 가져옵니다. 런타임 보조 의존성으로 `clsx`와 `tailwind-merge`가 필요합니다.

```tsx
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

<CardsStackRoot count={cards.length} orientation="horizontal" loop>
  <CardsStackViewport>
    {cards.map((card, index) => (
      <CardsStackItem key={card.id} index={index}>
        <CardsStackFront>{card.title}</CardsStackFront>
        <CardsStackBack>{card.details}</CardsStackBack>
      </CardsStackItem>
    ))}
  </CardsStackViewport>

  <div className="flex items-center gap-4">
    <CardsStackPrevious>Previous</CardsStackPrevious>
    <CardsStackStatus />
    <CardsStackNext>Next</CardsStackNext>
  </div>
</CardsStackRoot>;
```

## Next.js App Router

상호작용이 있는 조합 파일은 Client Component로 만들고 `/client` 진입점을 사용합니다. 상태와 콜백을 이 경계 안에서 정의하면 Server Component에서는 직렬화 가능한 카드 데이터만 전달할 수 있습니다.

```tsx
// app/cards/cards-gallery.tsx
"use client";

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
} from "@/components/CardsStackSlider/client";

interface Card {
  id: string;
  title: string;
  details: string;
}

export function CardsGallery({ cards }: { cards: Card[] }) {
  const [value, setValue] = useState(0);

  return (
    <CardsStackRoot
      count={cards.length}
      value={value}
      onValueChange={setValue}
      aria-label="추천 카드"
    >
      <CardsStackViewport>
        {cards.map((card, index) => (
          <CardsStackItem key={card.id} index={index}>
            <CardsStackFront>{card.title}</CardsStackFront>
            <CardsStackBack>{card.details}</CardsStackBack>
          </CardsStackItem>
        ))}
      </CardsStackViewport>
      <div className="flex items-center gap-4">
        <CardsStackPrevious>이전</CardsStackPrevious>
        <CardsStackStatus />
        <CardsStackNext>다음</CardsStackNext>
      </div>
    </CardsStackRoot>
  );
}
```

```tsx
// app/cards/page.tsx — Server Component
import { CardsGallery } from "./cards-gallery";

const cards = [
  { id: "one", title: "첫 카드", details: "첫 카드 설명" },
  { id: "two", title: "둘째 카드", details: "둘째 카드 설명" },
];

export default function CardsPage() {
  return <CardsGallery cards={cards} />;
}
```

정적인 직렬화 가능 props만 사용하면 Server Component가 `/client` 진입점의 컴포넌트를 바로 렌더할 수도 있습니다. `onValueChange`, DOM 이벤트 핸들러, 함수형 `CardsStackStatus` children은 서버 경계를 넘기지 말고 Client Component 안에서 정의합니다. 상위 `page.tsx` 전체에 `"use client"`를 추가할 필요는 없습니다. 자세한 경계 규칙은 [Next.js `use client` 공식 문서](https://nextjs.org/docs/app/api-reference/directives/use-client)를 참고합니다.

## Tailwind 클래스 탐색

컴포넌트를 소비 앱의 `src`, `app`, `components`처럼 이미 탐색되는 폴더에 복사했다면 별도 설정이 필요하지 않습니다. 외부 워크스페이스나 기본 탐색에서 제외된 경로의 소스를 직접 소비할 때만 실제 위치를 등록합니다.

Tailwind CSS v4에서는 전역 CSS 파일을 기준으로 상대 경로를 지정합니다.

```css
/* app/globals.css */
@import "tailwindcss";
@source "../vendor/BK-UI/src/components/CardsStackSlider";
```

Tailwind CSS v3에서는 프로젝트 루트 기준 경로를 `content`에 포함합니다.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./vendor/BK-UI/src/components/CardsStackSlider/**/*.{js,ts,jsx,tsx}",
  ],
} satisfies Config;
```

경로는 소비 프로젝트의 실제 배치에 맞게 조정합니다. Tailwind v4의 외부 소스 등록은 [공식 source detection 문서](https://tailwindcss.com/docs/detecting-classes-in-source-files), v3의 설정은 [공식 content configuration 문서](https://v3.tailwindcss.com/docs/content-configuration)를 참고합니다.

## 상태와 동작

`value`, `defaultValue`, `onValueChange`로 controlled 또는 uncontrolled 상태를 선택할 수 있습니다. `orientation`은 `horizontal`과 `vertical`을 지원하며, 첫 이전·다음 카드가 가로에서는 좌우, 세로에서는 위아래에 자리합니다. 카드 크기 대비 기본 간격은 `sideOffset={64}`이고 필요하면 조정할 수 있습니다. `loop`, `visibleCount`, `dragThreshold`, `velocityThreshold`, `touchRatio`, `transitionDuration`으로 나머지 동작을 조정합니다. 3장 이상일 때 `loop`가 순환 동작을 활성화하고, 2장 이하는 안정적인 양 끝 탐색으로 동작합니다.

한 번의 드래그로 여러 카드를 연속해서 통과할 수 있고, 손을 놓으면 가장 가까운 카드로 스냅됩니다. `loop={false}`일 때는 바로 다음 카드가 아니라 실제 덱의 처음과 끝에서만 탄성이 적용됩니다.

`CardsStackViewport`에 포커스가 있을 때 방향에 맞는 화살표 키로 이동할 수 있습니다. 이전·다음 버튼은 키보드와 터치 사용자를 위한 대체 조작 수단이며, 비활성 카드는 `inert`와 `aria-hidden`으로 상호작용에서 제외됩니다. 카드 안에서 드래그를 시작하지 않아야 하는 요소에는 `data-cards-stack-no-drag`를 추가합니다.

## SSR과 hydration

코어에는 `next/*` import나 Next.js 런타임 의존성이 없습니다. 초기 렌더는 `window` 또는 `document`를 읽지 않으며, Pointer Events, 타이머, `matchMedia`, animation frame은 상호작용 또는 effect 이후에만 사용합니다. 따라서 별도의 `dynamic(..., { ssr: false })` 없이 서버 렌더링할 수 있고, 같은 props로 hydration-safe한 초기 마크업을 만듭니다.
