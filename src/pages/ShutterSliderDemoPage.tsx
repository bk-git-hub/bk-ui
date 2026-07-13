import ComponentViewer from "@/components/layout/component-viewer";
import ShutterSliderDemoPreview from "@/components/previews/ShutterSliderDemoPreview";
import { shutterSliderUsageCode } from "@/snippets/shutterSliderUsageCode";

export default function ShutterSliderDemoPage() {
  return (
    <ComponentViewer
      title="Shutter Slider"
      description="A cinematic image slider that opens each Korean travel scene through configurable shutter strips."
      component={<ShutterSliderDemoPreview />}
      usageCode={shutterSliderUsageCode}
    />
  );
}
