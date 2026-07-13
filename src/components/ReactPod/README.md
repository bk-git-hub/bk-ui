# ReactPod

`ReactPod`은 프레임워크 중립적인 React + Tailwind 컴포넌트입니다. 내부 입력에는 독립 공개 컴포넌트인 `ClickWheel`을 사용하며, `next/*` 또는 Next.js 런타임에 의존하지 않습니다.

## 일반 React / Vite

```tsx
import { ReactPod } from "@/components/ReactPod";

export function PlayerPreview() {
  return <ReactPod deviceName="My Pod" wheelSensitivity={1.25} />;
}
```

휠만 필요한 경우에는 `@/components/ClickWheel`에서 가져오고, 버튼 내용·ARIA·클래스·이벤트는 `buttonProps`로 바꿉니다. 자세한 예시는 [ClickWheel README](../ClickWheel/README.md)에 있습니다.

`wheelSensitivity`는 원형 드래그 민감도 배율이며 기본값은 `1`입니다. `0.5`–`2` 범위에서 값이 클수록 작은 원형 움직임에 더 빠르게 반응합니다. 키보드와 마우스 휠 입력은 항상 한 번에 한 단계씩 이동합니다.

## Next.js App Router

`ReactPod` 자체가 Client Component 경계를 제공하므로 Server Component에서 명시적인 client 진입점을 가져와 직렬화 가능한 props를 전달할 수 있습니다.

```tsx
// app/player/page.tsx
import { ReactPod } from "@/components/ReactPod/client";

export default function PlayerPage() {
  return <ReactPod deviceName="My Pod" wheelSensitivity={1.25} />;
}
```

렌더 중 `window`나 `document`에 접근하지 않아 SSR에 안전합니다. Next.js 전용 소스 복제나 런타임 의존성은 필요하지 않습니다.

## Tailwind CSS

컴포넌트를 소비 앱의 `src` 또는 `app` 아래에 복사하면 Tailwind CSS v4가 클래스를 자동 탐지합니다. 별도 모노레포 경로에서 직접 가져올 때는 전역 CSS에 두 소스 경로를 등록합니다.

```css
@import "tailwindcss";
@source "../packages/bk-ui/src/components/ReactPod";
@source "../packages/bk-ui/src/components/ClickWheel";
```
