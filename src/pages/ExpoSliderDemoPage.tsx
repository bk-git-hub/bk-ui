import ComponentViewer from "@/components/layout/component-viewer";
import ExpoSliderDemoPreview from "@/components/previews/ExpoSliderDemoPreview";
import { expoSliderDemoCode } from "@/snippets/expoSliderDemoCode";
import { expoSliderNextExportCode } from "@/snippets/expoSliderNextExportCode";
import { expoSliderReactExportCode } from "@/snippets/expoSliderReactExportCode";
import { expoSliderUsageCode } from "@/snippets/expoSliderUsageCode";

export default function ExpoSliderDemoPage() {
  return (
    <ComponentViewer
      title="Expo Slider"
      description="Explore the live Expo effect, then copy a complete React or Next.js integration."
      component={<ExpoSliderDemoPreview />}
      usageCode={expoSliderDemoCode}
      referenceCode={expoSliderUsageCode}
      reactExport={{
        code: expoSliderReactExportCode,
        language: "TSX",
        description:
          "Copy the framework-neutral core into a React or Vite project and include its Tailwind source.",
      }}
      nextJsExport={{
        code: expoSliderNextExportCode,
        language: "TSX",
        description:
          "Use the same core through its client entry and keep interactive composition behind a Client Component boundary.",
      }}
    />
  );
}
