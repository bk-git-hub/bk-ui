import ComponentViewer from "@/components/layout/component-viewer";
import SlicerSliderDemoPreview from "@/components/previews/SlicerSliderDemoPreview";
import { slicerSliderUsageCode } from "@/snippets/slicerSliderUsageCode";

export default function SlicerSliderDemoPage() {
  return (
    <ComponentViewer
      title="Slicer Slider"
      description="An editorial image slider that reveals each scene through staggered, accessible ribbon transitions."
      component={<SlicerSliderDemoPreview />}
      usageCode={slicerSliderUsageCode}
    />
  );
}
