import ComponentViewer from "@/components/layout/component-viewer";
import ExpoSliderDemoPreview from "@/components/previews/ExpoSliderDemoPreview";
import { expoSliderUsageCode } from "@/snippets/expoSliderUsageCode";

export default function ExpoSliderDemoPage() {
  return (
    <ComponentViewer
      title="Expo Slider"
      description="A focused gallery with expanding edge frames, grayscale depth, and continuous parallax."
      component={<ExpoSliderDemoPreview />}
      usageCode={expoSliderUsageCode}
    />
  );
}
