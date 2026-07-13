# SlotMachine

`SlotMachine`은 릴 데이터와 렌더링을 소비자가 정의하는 재사용 가능한 슬롯 머신 컴포넌트입니다. 문자열뿐 아니라 객체, 아이콘, 커스텀 JSX를 사용할 수 있으며 controlled/uncontrolled 상태를 모두 지원합니다. 회전 중에는 여러 기호가 지나가는 감속 트랙이 표시되고, 기본 제공 레버는 포인터 드래그와 키보드 조작을 지원합니다.

React + Tailwind 코어는 한 벌만 유지합니다. 일반 React/Vite의 공개 경로는 `@/components/SlotMachine`, Next.js App Router의 클라이언트 공개 경로는 `@/components/SlotMachine/client`입니다. `client` 진입점은 동일한 코어를 다시 export할 뿐이며 `next/*` import나 Next.js 런타임 의존성을 추가하지 않습니다.

## 일반 React / Vite

컴포넌트 폴더를 프로젝트의 `src/components` 아래에 복사하고 프레임워크 중립 진입점에서 가져옵니다.

```tsx
import { SlotMachine } from "@/components/SlotMachine";

const items = ["🍒 Cherry", "🍋 Lemon", "🔔 Bell", "7️⃣ Seven"];

<SlotMachine
  reels={[items, items, items]}
  onValueChange={(result) => console.log(result)}
  renderItem={(item) => <strong>{item}</strong>}
  spinLabel="Spin"
  leverLabel="Pull the lever"
/>;
```

릴과 레버 애니메이션에는 컴포넌트 전용 CSS가 필요합니다. Vite의 전역 CSS에서 함께 불러옵니다.

```css
/* src/index.css */
@import "tailwindcss";
@import "./components/SlotMachine/styles.css";
```

폴더가 `src` 아래에 있으면 Tailwind CSS v4가 클래스 이름을 자동 탐색하므로 별도 `content`나 `@source` 설정이 필요하지 않습니다.

## Next.js App Router

직렬화 가능한 props만 사용하는 간단한 경우에는 Server Component에서 `client` 진입점을 바로 렌더링할 수 있습니다.

```tsx
// app/game/page.tsx
import { SlotMachine } from "@/components/SlotMachine/client";

const items = ["🍒 Cherry", "🍋 Lemon", "🔔 Bell", "7️⃣ Seven"];

export default function Page() {
  return (
    <SlotMachine
      reels={[items, items, items]}
      spinLabel="Spin"
      leverLabel="Pull the lever"
      aria-label="Prize slot machine"
    />
  );
}
```

`onValueChange`, `renderItem`, `getItemLabel`, `getItemKey`, 함수형 `reelClassName`, `random`, DOM 이벤트 핸들러처럼 함수인 props는 Server Component 경계를 통과할 수 없습니다. 이런 props가 필요하면 소비자 쪽의 작은 Client Component 안에서 정의합니다.

```tsx
// app/game/interactive-slot-machine.tsx
"use client";

import { SlotMachine } from "@/components/SlotMachine/client";

const items = ["🍒 Cherry", "🍋 Lemon", "🔔 Bell", "7️⃣ Seven"];

export function InteractiveSlotMachine() {
  return (
    <SlotMachine
      reels={[items, items, items]}
      onValueChange={(result) => console.log(result)}
      renderItem={(item) => <strong>{item}</strong>}
    />
  );
}
```

Next의 전역 CSS에서도 전용 스타일을 한 번 불러옵니다.

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "../components/SlotMachine/styles.css";
```

컴포넌트를 앱 소스 안에 복사하면 Tailwind가 클래스를 자동 탐색합니다. 워크스페이스나 `node_modules`의 BK-UI 소스를 직접 소비한다면 전역 CSS에 실제 경로를 등록합니다. 아래 경로는 `src/app/globals.css` 기준이며, 파일 위치가 다르면 상대 경로도 함께 조정합니다.

```css
@import "tailwindcss";
@import "../../node_modules/bk-ui/src/components/SlotMachine/styles.css";
@source "../../node_modules/bk-ui/src/components/SlotMachine";
```

## SSR과 hydration

코어는 렌더 중 `window`나 `document`를 읽지 않습니다. 포인터 캡처는 이벤트 핸들러 안에서만 사용하고, 난수와 타이머는 사용자가 회전을 시작한 뒤에만 실행하며, 남은 타이머는 Effect cleanup에서 정리합니다. 같은 props로 생성한 서버/클라이언트 첫 마크업은 동일합니다.

소비자가 제공하는 `renderItem`, `getItemLabel`, `getItemKey`, 함수형 `reelClassName`도 첫 렌더에서는 결정적이어야 합니다. 이 함수 안에서 `Date.now()`, `Math.random()`, 브라우저 전역처럼 서버와 클라이언트에서 다른 값을 읽으면 hydration 불일치가 생길 수 있습니다.

## API 구성

각 릴에 서로 다른 배열을 전달할 수 있습니다. `value`와 `onValueChange`를 함께 사용하면 결과를 외부에서 제어할 수 있고, `defaultValue`는 비제어 초기값으로 사용됩니다. 레버가 필요 없는 배치에서는 `showLever={false}`를 전달할 수 있습니다. `SlotMachineRoot`, `SlotReelList`, `SlotReel`, `SlotMachineAction`, `SlotMachineLever`, `useSlotMachine`도 개별 export되어 별도 조합이 가능합니다.
