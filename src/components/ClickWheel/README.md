# ClickWheel

`ClickWheel`은 ReactPod의 원형 입력부만 분리한 React + Tailwind 컴포넌트입니다. React 상태와 Pointer Events만 사용하며, Next.js 런타임이나 별도 제스처 라이브러리에 의존하지 않습니다. `useClickWheelController`로 메뉴, 슬라이더, 갤러리, 미디어 UI의 명령을 같은 입력 계약에 연결할 수 있습니다. MENU, 이전, 가운데 선택, 다음, 재생/일시정지 버튼은 각각 내용·ARIA·클래스·HTML 속성과 이벤트를 바꿀 수 있습니다.

## 일반 React / Vite

`ClickWheel` 폴더를 프로젝트의 컴포넌트 디렉터리에 복사한 뒤 폴더 진입점에서 가져옵니다.

```tsx
import { useState } from "react";
import { ClickWheel, useClickWheelController } from "@/components/ClickWheel";

export function PlayerControls() {
  const [value, setValue] = useState(0);
  const [playing, setPlaying] = useState(false);
  const wheelBindings = useClickWheelController({
    navigate: (direction) =>
      setValue((current) => Math.max(0, Math.min(9, current + direction))),
    back: () => setValue(0),
    home: () => setValue(0),
    select: () => console.log("selected", value),
    playPause: () => setPlaying((current) => !current),
  });

  return (
    <ClickWheel
      {...wheelBindings}
      sensitivity={1.25}
      buttonProps={{
        menu: {
          children: "BACK",
          "aria-label": "이전 화면",
          className: "text-indigo-600",
        },
        select: {
          children: "OK",
          "aria-label": "선택 확인",
          className: "grid place-items-center font-bold",
        },
        playPause: {
          children: playing ? "PAUSE" : "PLAY",
          "aria-label": playing ? "일시정지" : "재생",
          "aria-pressed": playing,
        },
      }}
    />
  );
}
```

`navigate(direction, detail)`은 원형 회전, 방향키, 마우스 휠을 `-1 | 1` 명령으로 통합합니다. `previous`와 `next`를 생략하면 해당 버튼도 기본적으로 `navigate(-1)`과 `navigate(1)`을 사용합니다. 트랙 건너뛰기처럼 의미가 다르면 controller의 `previous`와 `next`를 별도로 지정하면 됩니다. `detail.source`는 `rotate | previous | next` 중 하나입니다.

controller는 현재 인덱스, loop, clamp, debounce, 애니메이션 queue를 소유하지 않습니다. 이 정책은 연결되는 메뉴나 슬라이더가 결정하므로 서로 다른 UI를 같은 ClickWheel에 연결해도 고유 동작이 유지됩니다. `disabled`를 controller에 전달하면 반환된 모든 binding이 입력을 무시하고 ClickWheel도 비활성화됩니다. 기존의 `onRotate`, `onMenu` 등 저수준 callback을 직접 전달하는 방식도 그대로 지원합니다.

루트에는 `div`의 표준 속성과 이벤트를 전달할 수 있습니다. `buttonProps`의 각 항목에는 `button` 속성, `children`, `className`, `aria-*`, `data-*`, `ref`, 네이티브 이벤트를 전달할 수 있습니다. 버튼의 `onClick`이 `preventDefault()`를 호출하면 대응하는 의미 callback은 실행하지 않습니다. `wheelDrag`를 사용하면 해당 버튼에서 시작한 포인터 이동을 휠 회전으로 처리할지 선택할 수 있습니다.

포인터나 키보드로 누르는 동안 해당 버튼에는 `data-pressing`이 설정되어 기본 축소·밝기·inset shadow 피드백이 적용됩니다. MENU·재생 버튼에서 회전 드래그가 시작되면 눌림 상태는 즉시 해제되며, 소비자는 `buttonProps.*.className`의 `data-pressing:*` Tailwind 클래스로 깊이와 색상을 덮어쓸 수 있습니다. 이 순간 상태는 재생 여부를 나타내는 `aria-pressed`와 독립적입니다.

`sensitivity`는 원형 포인터 드래그 민감도 배율입니다. 기본값은 `1`, 허용 범위는 `0.5`–`2`이며 값이 클수록 작은 회전에도 빠르게 반응합니다. 방향키와 마우스 휠은 이 값과 관계없이 입력 한 번에 한 단계씩 이동합니다. 범위를 벗어난 유한한 값은 안전하게 제한되고 `NaN`과 `Infinity`는 기본값을 사용합니다.

## Next.js App Router

코어 구현은 일반 React와 동일합니다. 이벤트 함수를 정의하는 소비자 컴포넌트만 Client Component로 만들고 명시적인 client 진입점을 사용합니다.

```tsx
// app/player/player-wheel.tsx
"use client";

import { useState } from "react";
import {
  ClickWheel,
  useClickWheelController,
} from "@/components/ClickWheel/client";

export function PlayerWheel() {
  const [index, setIndex] = useState(0);
  const wheelBindings = useClickWheelController({
    navigate: (direction) => setIndex((current) => current + direction),
    back: () => setIndex(0),
    select: () => console.log(index),
  });

  return <ClickWheel {...wheelBindings} />;
}
```

```tsx
// app/player/page.tsx — Server Component 유지
import { PlayerWheel } from "./player-wheel";

export default function PlayerPage() {
  return <PlayerWheel />;
}
```

`ClickWheel.tsx`와 `client.ts`에는 `'use client'` 경계가 포함되어 있습니다. 렌더 중에는 `window`, `document`, `ResizeObserver`를 읽지 않으므로 서버 렌더링 결과가 결정적이며 hydration에 안전합니다. `next/*` import나 Next.js 의존성은 없습니다.

## Tailwind CSS

Tailwind CSS v4에서 폴더를 소비 앱의 `src` 또는 `app` 아래에 복사하면 클래스가 자동 탐지됩니다. 모노레포 패키지나 `node_modules` 밖의 별도 소스 경로에서 가져오는 경우에만 전역 CSS에서 실제 위치를 등록합니다.

```css
@import "tailwindcss";
@source "../packages/bk-ui/src/components/ClickWheel";
```

클래스 병합에는 저장소 표준인 `clsx`와 `tailwind-merge`를 사용합니다. 이 저장소에는 이미 설치되어 있으며, 복사 대상 프로젝트에는 두 패키지가 필요합니다.

## 입력 방식

- 휠 드래그 또는 마우스 휠: `onRotate(-1 | 1)`
- 방향키: 회전
- `Enter`: 가운데 선택
- `Escape`: MENU
- `Home`: MENU 길게 누르기 동작
- `Space`: 재생/일시정지
- MENU 짧게 누르기와 길게 누르기, MENU·재생 버튼에서 시작한 드래그는 서로 구분됩니다.
