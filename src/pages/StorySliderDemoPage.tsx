import ComponentViewer from "@/components/layout/component-viewer";
import StorySliderDemoPreview from "@/components/previews/StorySliderDemoPreview";
import { storySliderDemoCode } from "@/snippets/storySliderDemoCode";
import { storySliderNextExportCode } from "@/snippets/storySliderNextExportCode";
import { storySliderReactExportCode } from "@/snippets/storySliderReactExportCode";
import { storySliderUsageCode } from "@/snippets/storySliderUsageCode";

export default function StorySliderDemoPage() {
  return (
    <ComponentViewer
      title="Story Slider"
      description="Explore the interactive stories, then copy the core API for React or a client-safe App Router wrapper for Next.js."
      component={<StorySliderDemoPreview />}
      usageCode={storySliderDemoCode}
      referenceCode={storySliderUsageCode}
      reactExport={{
        code: storySliderReactExportCode,
        language: "React TSX",
        description:
          "Copy the three framework-neutral core files, install the two class helpers, and include their Tailwind source.",
      }}
      nextJsExport={{
        code: storySliderNextExportCode,
        language: "Next.js TSX",
        description:
          "Use the same core through its use client entrypoint and keep state, callbacks, and render functions inside a client wrapper.",
      }}
    />
  );
}
