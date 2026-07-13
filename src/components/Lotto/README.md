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
