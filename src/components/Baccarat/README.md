# Baccarat Squeeze

바카라의 카드 스퀴즈를 포인터, 터치, 키보드로 표현하는 compound component입니다. 카드 결과와 제스처 상태를 분리해 카드 앞면·뒷면·접힘 효과·안내·대체 버튼을 필요한 방식으로 조합할 수 있습니다.

## 공개 경로

- 일반 React·Vite: `@/components/Baccarat`
- Next.js App Router: `@/components/Baccarat/client`

두 경로는 같은 React + Tailwind 코어를 내보냅니다. `client` 진입점은 `'use client'` 경계만 추가하며 컴포넌트를 복제하거나 `next/*` 모듈에 의존하지 않습니다. 복사해서 사용할 때는 `src/components/Baccarat` 폴더 전체를 유지하세요.

## 일반 React / Vite

```tsx
import {
  BaccaratPlayingCard,
  BaccaratSqueezeAction,
  BaccaratSqueezeBack,
  BaccaratSqueezeCard,
  BaccaratSqueezeFace,
  BaccaratSqueezeFold,
  BaccaratSqueezeHandle,
  BaccaratSqueezeHint,
  BaccaratSqueezeRoot,
} from "@/components/Baccarat";

export function PlayerCard() {
  return (
    <BaccaratSqueezeRoot
      corner="bottom-right"
      revealThreshold={0.68}
      onReveal={() => console.log("revealed")}
    >
      <BaccaratSqueezeCard>
        <BaccaratSqueezeBack />
        <BaccaratSqueezeFace>
          <BaccaratPlayingCard rank="8" suit="diamonds" />
        </BaccaratSqueezeFace>
        <BaccaratSqueezeFold />
        <BaccaratSqueezeHandle />
      </BaccaratSqueezeCard>
      <BaccaratSqueezeHint />
      <BaccaratSqueezeAction />
    </BaccaratSqueezeRoot>
  );
}
```

## Next.js App Router

App Router에서는 `'use client'`가 선언된 전용 진입점으로 가져옵니다. 아래처럼 로컬 상태나 `onReveal`, `onValueChange`, `getValueText` 같은 함수 prop을 정의하는 소비자 파일도 Client Component여야 합니다.

```tsx
"use client";

import {
  BaccaratPlayingCard,
  BaccaratSqueezeAction,
  BaccaratSqueezeBack,
  BaccaratSqueezeCard,
  BaccaratSqueezeFace,
  BaccaratSqueezeFold,
  BaccaratSqueezeHandle,
  BaccaratSqueezeHint,
  BaccaratSqueezeRoot,
} from "@/components/Baccarat/client";

export function PlayerCard() {
  return (
    <BaccaratSqueezeRoot onReveal={() => console.log("revealed")}>
      <BaccaratSqueezeCard>
        <BaccaratSqueezeBack />
        <BaccaratSqueezeFace>
          <BaccaratPlayingCard rank="8" suit="diamonds" />
        </BaccaratSqueezeFace>
        <BaccaratSqueezeFold />
        <BaccaratSqueezeHandle />
      </BaccaratSqueezeCard>
      <BaccaratSqueezeHint />
      <BaccaratSqueezeAction />
    </BaccaratSqueezeRoot>
  );
}
```

Server Component에서도 `@/components/Baccarat/client`를 직접 렌더할 수 있지만 서버에서 클라이언트 경계를 넘겨주는 prop은 문자열·숫자처럼 직렬화 가능한 값이어야 합니다. 함수 prop이 필요하면 위 예시처럼 별도의 Client Component 래퍼에서 정의하세요. `dynamic(..., { ssr: false })`는 필요하지 않습니다.

### Tailwind 클래스 탐색

컴포넌트를 Next.js 프로젝트의 `src/components/Baccarat`에 복사하면 Tailwind CSS 4의 자동 탐색 범위에 들어가므로 일반적으로 추가 설정이 없습니다. 설치된 패키지, 모노레포 공유 패키지처럼 자동 탐색에서 제외된 경로의 소스를 직접 소비한다면 `app/globals.css`에서 실제 상대 경로를 명시하세요. 다음은 프로젝트 루트의 `node_modules/bk-ui`를 참조하는 예시입니다.

```css
@import "tailwindcss";
@source "../node_modules/bk-ui/src/components/Baccarat";
```

Tailwind CSS 3을 사용하는 프로젝트라면 `tailwind.config.ts`의 `content`에 App Router와 컴포넌트 경로를 포함합니다.

```ts
content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
];
```

## SSR 및 hydration

공용 코어는 렌더 중 `window`나 `document`를 읽지 않습니다. 포인터 좌표, pointer capture, `requestAnimationFrame` 같은 브라우저 API는 사용자 이벤트 또는 Effect 정리 경로에서만 실행되므로 서버 렌더와 첫 hydration 마크업이 동일한 props에서 안정적으로 유지됩니다.

## 동작과 제어

카드의 네 모서리 어디서든 드래그를 시작할 수 있으며 실제 시작 코너에서 반대 방향으로 직선 경계가 이동하는 대각선 스퀴즈가 이어집니다. `corner`는 초기 표시 방향을 정하는 기본값이며, 포인터·터치에서는 시작 위치가 우선합니다. 카드 높이의 중앙 영역에 있는 왼쪽 또는 오른쪽 긴 변에서 시작하면 수직 경계가 수평으로 이동하며 해당 옆면부터 부드럽게 열립니다. `edgeHitArea`로 양쪽 옆면의 포인터 감지 폭을 조절할 수 있으며 기본값은 카드 너비의 `20%`입니다.

`value`와 `onValueChange`로 진행률을 제어할 수 있고, 비제어 방식에서는 `defaultValue`를 사용합니다. 진행률은 `0`부터 `1` 사이이며 루트의 `data-state`, `data-origin`, `data-corner`, `--squeeze-progress`에도 노출됩니다. 변경·커밋·공개 콜백의 detail에는 실제 입력 원점인 `origin`과 감지된 `corner`가 전달됩니다.

키보드에서는 방향키로 진행률을 조절하고, `Home`/`Escape`로 다시 가리며, `End`/`Enter`/`Space`로 완전히 공개합니다. 드래그를 대신할 수 있도록 `BaccaratSqueezeAction`도 함께 제공하는 것을 권장합니다.

## 보안 주의사항

이 컴포넌트는 시각적 공개 효과이지 보안 경계가 아닙니다. 실제 베팅 결과를 공개 전까지 비밀로 유지해야 한다면 서버가 허용 시점 이전에는 카드 값을 브라우저에 전달하지 않아야 합니다.
