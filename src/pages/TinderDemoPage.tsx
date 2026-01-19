import ComponentViewer from "@/components/layout/component-viewer";
import TinderDemoPreview from "@/components/previews/TinderDemoPreview";
import { tinderUsageCode } from "@/snippets/tinderUsageCode";

export default function TinderDemoPage() {
  return (
    <ComponentViewer
      title="Tinder Swiper"
      description="Interactive card stack with gesture-based swipe controls"
      component={<TinderDemoPreview />}
      usageCode={tinderUsageCode}
    />
  );
}
