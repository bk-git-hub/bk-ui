# CardsStackSlider

Swiper의 별도 플러그인 없이 React 상태, Pointer Events, Tailwind 유틸리티만으로 구성한 3D 카드 스택 compound component입니다. 현재 카드는 드래그를 따라 움직이고, 지나간 카드는 뒷면을 보이며, 다음 카드는 원호를 따라 앞으로 이동합니다.

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

`value`, `defaultValue`, `onValueChange`로 controlled 또는 uncontrolled 상태를 선택할 수 있습니다. `orientation`은 `horizontal`과 `vertical`을 지원하며, `loop`, `visibleCount`, `dragThreshold`, `velocityThreshold`, `touchRatio`, `transitionDuration`으로 동작을 조정합니다. 3장 이상일 때 `loop`가 순환 동작을 활성화하고, 2장 이하는 안정적인 양 끝 탐색으로 동작합니다.

`CardsStackViewport`에 포커스가 있을 때 방향에 맞는 화살표 키로 이동할 수 있습니다. 이전·다음 버튼은 키보드와 터치 사용자를 위한 대체 조작 수단이며, 비활성 카드는 `inert`와 `aria-hidden`으로 상호작용에서 제외됩니다. 카드 안에서 드래그를 시작하지 않아야 하는 요소에는 `data-cards-stack-no-drag`를 추가합니다.
