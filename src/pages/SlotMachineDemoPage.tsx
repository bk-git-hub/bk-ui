import ComponentViewer from "@/components/layout/component-viewer";
import SlotMachineDemoPreview from "@/components/previews/SlotMachineDemoPreview";
import {
  slotMachineNextJsExportCode,
  slotMachineReactExportCode,
} from "@/snippets/slotMachineExportCode";
import {
  slotMachineDemoCode,
  slotMachineUsageCode,
} from "@/snippets/slotMachineUsageCode";

const reactExport = {
  code: slotMachineReactExportCode,
  language: "React TSX + CSS",
  description:
    "Copy the framework-neutral core files, install the two existing class helpers, and import the component CSS once in your React or Vite entry stylesheet.",
};

const nextJsExport = {
  code: slotMachineNextJsExportCode,
  language: "Next.js TSX + CSS",
  description:
    "Use the client entry for App Router interaction. Keep callbacks and renderers inside a Client Component, while the shared core remains free of next/* imports.",
};

export default function SlotMachineDemoPage() {
  return (
    <ComponentViewer
      title="Slot Machine"
      description="Edit and spin the interactive preview, inspect the core demo, then copy a complete usage or framework-specific export."
      component={<SlotMachineDemoPreview />}
      usageCode={slotMachineDemoCode}
      referenceCode={slotMachineUsageCode}
      reactExport={reactExport}
      nextJsExport={nextJsExport}
    />
  );
}
