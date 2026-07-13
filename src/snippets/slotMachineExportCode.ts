export const slotMachineReactExportCode = `// React / Vite export
//
// Copy these exact framework-neutral core files together:
//   src/components/SlotMachine/SlotMachine.tsx
//   src/components/SlotMachine/SlotMachineLever.tsx
//   src/components/SlotMachine/useSlotMachine.ts
//   src/components/SlotMachine/index.ts
//   src/components/SlotMachine/styles.css
//
// Runtime helpers imported by the core:
//   pnpm add clsx tailwind-merge
//
// React, React DOM, and Tailwind CSS should already be configured by the app.

// src/components/SlotMachine/index.ts
export {
  SlotMachine,
  SlotMachineAction,
  SlotMachineRoot,
  SlotReel,
  SlotReelList,
  type SlotItemRenderer,
  type SlotMachineActionProps,
  type SlotMachineProps,
  type SlotMachineRootProps,
  type SlotReelListProps,
  type SlotReelProps,
} from "./SlotMachine";
export {
  SlotMachineLever,
  type SlotMachineLeverProps,
} from "./SlotMachineLever";
export {
  canSpinReels,
  createReelSpinSequence,
  selectSlotResults,
  useSlotMachine,
  type SlotRandomSource,
  type SlotValueChangeHandler,
  type UseSlotMachineOptions,
  type UseSlotMachineResult,
} from "./useSlotMachine";

// src/components/PrizeSlot.tsx
// Replace the @ alias with a relative path when your Vite app does not use it.
import { SlotMachine } from "@/components/SlotMachine";

const symbols = [
  { id: "cherry", icon: "🍒", label: "Cherry" },
  { id: "lemon", icon: "🍋", label: "Lemon" },
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
}

// Tailwind CSS v4: load Tailwind and the component animation stylesheet once.
// Local files below src are scanned automatically.
//
// src/index.css
@import "tailwindcss";
@import "./components/SlotMachine/styles.css";

// Tailwind CSS v4, package or workspace source consumed from node_modules:
// Paths are relative to src/index.css; adjust them when yours lives elsewhere.
//
// src/index.css
@import "tailwindcss";
@import "../node_modules/@your-scope/bk-ui/src/components/SlotMachine/styles.css";
@source "../node_modules/@your-scope/bk-ui/src/components/SlotMachine";
`;

export const slotMachineNextJsExportCode = `// Next.js App Router export
//
// Reuse the exact same React + Tailwind core and add only its client entry:
//   src/components/SlotMachine/SlotMachine.tsx
//   src/components/SlotMachine/SlotMachineLever.tsx
//   src/components/SlotMachine/useSlotMachine.ts
//   src/components/SlotMachine/index.ts
//   src/components/SlotMachine/styles.css
//   src/components/SlotMachine/client.ts
//
// Runtime helpers imported by the core:
//   pnpm add clsx tailwind-merge
//
// The entry below marks the existing public API as interactive. It does not
// duplicate the component and has no Next.js runtime dependency.

// src/components/SlotMachine/client.ts
"use client";

export * from "./index";

// src/app/game/interactive-slot-machine.tsx
// Define callbacks, renderers, and other function-valued props inside this
// Client Component instead of passing them through a Server Component boundary.
"use client";

import { SlotMachine } from "@/components/SlotMachine/client";

const symbols = [
  { id: "cherry", icon: "🍒", label: "Cherry" },
  { id: "lemon", icon: "🍋", label: "Lemon" },
  { id: "bell", icon: "🔔", label: "Bell" },
  { id: "seven", icon: "7️⃣", label: "Seven" },
];

const reels = Array.from({ length: 3 }, () => symbols);

export function InteractiveSlotMachine() {
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
}

// src/app/game/page.tsx remains a Server Component.
import { InteractiveSlotMachine } from "./interactive-slot-machine";

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <InteractiveSlotMachine />
    </main>
  );
}

// SSR / hydration
// - The shared core does not read window or document during render. Random
//   selection, timers, and pointer APIs run only after interaction, so disabling
//   SSR is unnecessary.
// - Keep reels, value, defaultValue, keys, labels, and rendered output
//   deterministic for the server render and the first client render.
// - Props crossing from a Server Component must be serializable. Keep
//   onValueChange, renderItem, getItemLabel, getItemKey, random, event handlers,
//   refs, and function-valued reelClassName inside the client wrapper above.

// Tailwind CSS v4, local copy under src/components:
//
// src/app/globals.css
@import "tailwindcss";
@import "../components/SlotMachine/styles.css";

// Tailwind CSS v4, package or workspace source consumed from node_modules:
// Paths are relative to src/app/globals.css; adjust them when yours lives elsewhere.
//
// src/app/globals.css
@import "tailwindcss";
@import "../../node_modules/@your-scope/bk-ui/src/components/SlotMachine/styles.css";
@source "../../node_modules/@your-scope/bk-ui/src/components/SlotMachine";
`;
