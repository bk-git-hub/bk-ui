# SlotMachine

`SlotMachine`은 릴 데이터와 렌더링을 소비자가 정의하는 재사용 가능한 슬롯 머신 컴포넌트입니다. 문자열뿐 아니라 객체, 아이콘, 커스텀 JSX를 사용할 수 있으며 controlled/uncontrolled 상태를 모두 지원합니다.

```tsx
import { SlotMachine } from "@/components/SlotMachine";

const items = ["🍒 Cherry", "🍋 Lemon", "🔔 Bell", "7️⃣ Seven"];

<SlotMachine
  reels={[items, items, items]}
  onValueChange={(result) => console.log(result)}
  renderItem={(item) => <strong>{item}</strong>}
  spinLabel="Spin"
/>;
```

각 릴에 서로 다른 배열을 전달할 수 있습니다. `value`와 `onValueChange`를 함께 사용하면 결과를 외부에서 제어할 수 있고, `defaultValue`는 비제어 초기값으로 사용됩니다. `SlotMachineRoot`, `SlotReelList`, `SlotReel`, `SlotMachineAction`, `useSlotMachine`도 개별 export되어 별도 조합이 가능합니다.
