export const slotMachineDemoCode = `import { useState } from "react";
import { SlotMachine } from "@/components/SlotMachine";

const items = [
  "🍒 Cherry",
  "🍋 Lemon",
  "🍇 Grape",
  "🔔 Bell",
  "⭐ Star",
  "7️⃣ Seven",
];

const reels = Array.from({ length: 3 }, () => items);

export function SlotMachineDemo() {
  const [value, setValue] = useState(() => reels.map((reel) => reel[0]));

  return (
    <SlotMachine
      reels={reels}
      value={value}
      onValueChange={setValue}
      getItemLabel={(item) => item}
      renderItem={(item) => {
        const [symbol, ...labelParts] = item.split(" ");

        return (
          <span className="grid justify-items-center gap-2">
            <span className="text-5xl">{symbol}</span>
            <span className="text-xs font-bold uppercase">
              {labelParts.join(" ")}
            </span>
          </span>
        );
      }}
      spinDuration={1800}
      spinLabel="Spin"
      respinLabel="Spin again"
      leverLabel="Pull the lever"
      aria-label="Custom prize slot machine"
    />
  );
}`;

export const slotMachineUsageCode = `import { SlotMachine } from "@/components/SlotMachine";

const symbols = [
  { id: "cherry", icon: "🍒", label: "Cherry" },
  { id: "lemon", icon: "🍋", label: "Lemon" },
  { id: "grape", icon: "🍇", label: "Grape" },
  { id: "bell", icon: "🔔", label: "Bell" },
  { id: "seven", icon: "7️⃣", label: "Seven" },
];

const reels = Array.from({ length: 3 }, () => symbols);

export function PrizeSlot() {
  return (
    <SlotMachine
      reels={reels}
      onValueChange={(result) => console.log(result)}
      getItemLabel={(item) => item.label}
      getItemKey={(item, reelIndex) => \`\${item.id}-\${reelIndex}\`}
      renderItem={(item) => (
        <span className="text-5xl" title={item.label}>
          {item.icon}
        </span>
      )}
      spinLabel="Spin the reels"
      leverLabel="Pull the lever to spin"
      aria-label="Prize slot machine"
    />
  );
}`;
