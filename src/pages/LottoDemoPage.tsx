import ComponentViewer from "@/components/layout/component-viewer";
import LottoDemoPreview from "@/components/previews/LottoDemoPreview";
import { lottoDemoCode } from "@/snippets/lottoDemoCode";
import { lottoNextExport } from "@/snippets/lottoNextExportCode";
import { lottoReactExport } from "@/snippets/lottoReactExportCode";
import { lottoUsageCode } from "@/snippets/lottoUsageCode";

export default function LottoDemoPage() {
  return (
    <ComponentViewer
      title="Lotto Draw"
      description="A configurable, accessible draw for any number of custom balls."
      component={<LottoDemoPreview />}
      usageCode={lottoDemoCode}
      referenceCode={lottoUsageCode}
      reactExport={lottoReactExport}
      nextJsExport={lottoNextExport}
    />
  );
}
