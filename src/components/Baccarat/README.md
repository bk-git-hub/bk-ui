# Baccarat Squeeze

바카라의 카드 스퀴즈를 포인터, 터치, 키보드로 표현하는 compound component입니다. 카드 결과와 제스처 상태를 분리해 카드 앞면·뒷면·접힘 효과·안내·대체 버튼을 필요한 방식으로 조합할 수 있습니다.

## 기본 사용법

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
</BaccaratSqueezeRoot>;
```

카드의 네 모서리 어디서든 드래그를 시작할 수 있으며 실제 시작 코너에서 반대 방향으로 직선 경계가 이동하는 대각선 스퀴즈가 이어집니다. `corner`는 초기 표시 방향을 정하는 기본값이며, 포인터·터치에서는 시작 위치가 우선합니다. 카드 높이의 중앙 영역에 있는 왼쪽 또는 오른쪽 긴 변에서 시작하면 수직 경계가 수평으로 이동하며 해당 옆면부터 부드럽게 열립니다. `edgeHitArea`로 양쪽 옆면의 포인터 감지 폭을 조절할 수 있으며 기본값은 카드 너비의 `20%`입니다.

`value`와 `onValueChange`로 진행률을 제어할 수 있고, 비제어 방식에서는 `defaultValue`를 사용합니다. 진행률은 `0`부터 `1` 사이이며 루트의 `data-state`, `data-origin`, `data-corner`, `--squeeze-progress`에도 노출됩니다. 변경·커밋·공개 콜백의 detail에는 실제 입력 원점인 `origin`과 감지된 `corner`가 전달됩니다.

키보드에서는 방향키로 진행률을 조절하고, `Home`/`Escape`로 다시 가리며, `End`/`Enter`/`Space`로 완전히 공개합니다. 드래그를 대신할 수 있도록 `BaccaratSqueezeAction`도 함께 제공하는 것을 권장합니다.

## 보안 주의사항

이 컴포넌트는 시각적 공개 효과이지 보안 경계가 아닙니다. 실제 베팅 결과를 공개 전까지 비밀로 유지해야 한다면 서버가 허용 시점 이전에는 카드 값을 브라우저에 전달하지 않아야 합니다.
