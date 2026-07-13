import ComponentViewer from "@/components/layout/component-viewer";
import SlicerSliderDemoPreview from "@/components/previews/SlicerSliderDemoPreview";
import { slicerSliderDemoCode } from "@/snippets/slicerSliderDemoCode";
import { slicerSliderNextJsExport } from "@/snippets/slicerSliderNextExportCode";
import { slicerSliderReactExport } from "@/snippets/slicerSliderReactExportCode";
import { slicerSliderUsageCode } from "@/snippets/slicerSliderUsageCode";

export default function SlicerSliderDemoPage() {
  return (
    <ComponentViewer
      title="Slicer Slider"
      description="An editorial image slider with keyboard, pointer, and staggered ribbon transitions. Copy the framework-neutral core into React/Vite or use its client entry in Next.js App Router."
      component={<SlicerSliderDemoPreview />}
      usageCode={slicerSliderDemoCode}
      referenceCode={slicerSliderUsageCode}
      reactExport={slicerSliderReactExport}
      nextJsExport={slicerSliderNextJsExport}
    />
  );
}
