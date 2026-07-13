import ComponentViewer from "@/components/layout/component-viewer";
import SlotMachineDemoPreview from "@/components/previews/SlotMachineDemoPreview";
import { slotMachineUsageCode } from "@/snippets/slotMachineUsageCode";

export default function SlotMachineDemoPage() {
  return (
    <ComponentViewer
      title="Slot Machine"
      description="An accessible slot machine with custom reels, renderers, and controlled state."
      component={<SlotMachineDemoPreview />}
      usageCode={slotMachineUsageCode}
    />
  );
}
