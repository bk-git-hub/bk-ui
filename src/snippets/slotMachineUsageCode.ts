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
      aria-label="Prize slot machine"
    />
  );
}`;
