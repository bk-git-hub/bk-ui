import ComponentViewer from "@/components/layout/component-viewer";
import StorySliderDemoPreview from "@/components/previews/StorySliderDemoPreview";
import { storySliderUsageCode } from "@/snippets/storySliderUsageCode";

export default function StorySliderDemoPage() {
  return (
    <ComponentViewer
      title="Story Slider"
      description="Instagram-style stories with grouped progress, autoplay, hold-to-pause, tap, swipe, and keyboard controls."
      component={<StorySliderDemoPreview />}
      usageCode={storySliderUsageCode}
    />
  );
}
