import ComponentViewer from "@/components/layout/component-viewer";
import LottoDemoPreview from "@/components/previews/LottoDemoPreview";
import { lottoUsageCode } from "@/snippets/lottoUsageCode";

export default function LottoDemoPage() {
  return (
    <ComponentViewer
      title="Lotto Draw"
      description="A configurable, accessible draw for any number of custom balls."
      component={<LottoDemoPreview />}
      usageCode={lottoUsageCode}
    />
  );
}
