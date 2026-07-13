# LottoDraw

`LottoDraw<T>`는 공의 데이터 타입, 전체 목록, 추첨 개수와 결과 상태를 소비자가 제어할 수 있는 비복원 추첨 컴포넌트입니다.

```tsx
import { LottoDraw } from "@/components/Lotto";

const balls = Array.from({ length: 45 }, (_, index) => ({
  id: index + 1,
  label: String(index + 1),
}));

export function LottoExample() {
  return (
    <LottoDraw
      items={balls}
      drawCount={6}
      getItemKey={(ball) => ball.id}
      getItemLabel={(ball) => ball.label}
      renderBall={(ball) => ball.label}
      onValueChange={(result) => console.log(result)}
    />
  );
}
```

`value`, `defaultValue`, `onValueChange`로 결과를 controlled 또는 uncontrolled 방식으로 사용할 수 있습니다. 완전히 다른 UI가 필요하면 `useLottoDraw<T>`와 `LottoRoot`, `LottoBallList`, `LottoBall`, `LottoAction` primitive를 조합합니다. 테스트나 시드 기반 추첨에서는 `random` prop에 난수 함수를 주입할 수 있습니다.

`drawCount`는 1 이상이고 `items.length` 이하여야 합니다. 범위를 벗어나면 추첨 버튼이 비활성화되며 결과는 생성되지 않습니다.

## 원형 추첨기 UI

`LottoMachine<T>`는 추첨 상태와 분리된 표현 컴포넌트입니다. 전체 공은 투명한 원형 챔버에 표시하고 `drawnItems`는 기계 하단의 결과 트레이에 표시합니다.

```tsx
import { LottoAction, LottoMachine, useLottoDraw } from "@/components/Lotto";

const balls = Array.from({ length: 45 }, (_, index) => index + 1);

export function LottoMachineExample() {
  const { drawnItems, draw, canDraw } = useLottoDraw({
    items: balls,
    drawCount: 6,
  });

  return (
    <>
      <LottoMachine items={balls} drawnItems={drawnItems} resultCount={6} />
      <LottoAction disabled={!canDraw} onClick={draw}>
        추첨하기
      </LottoAction>
    </>
  );
}
```

`spinning` prop으로 챔버의 혼합 상태를 표현할 수 있고, `renderBall`, `getItemKey`, `getItemLabel`, `ballClassName`으로 임의 타입의 공을 렌더링합니다. 혼합 중에는 각 공에 중력, 공기 분사, 원형 벽과 공 사이의 충돌이 독립적으로 적용되며, 혼합을 멈추면 공이 바닥으로 자연스럽게 가라앉습니다. `motionSeed`로 같은 초기 배치와 움직임을 재현할 수 있고, 이 물리 효과는 추첨 난수를 소비하지 않습니다. 사용자가 모션 감소를 요청한 환경에서는 정적인 배치로 표시합니다.
