import ComponentViewer from "@/components/layout/component-viewer";
import BaccaratSqueezeDemoPreview from "@/components/previews/BaccaratSqueezeDemoPreview";
import { baccaratSqueezeUsageCode } from "@/snippets/baccaratSqueezeUsageCode";

export default function BaccaratSqueezeDemoPage() {
  return (
    <ComponentViewer
      title="Baccarat Squeeze"
      description="Peel back a card corner with pointer, touch, or keyboard controls."
      component={<BaccaratSqueezeDemoPreview />}
      usageCode={baccaratSqueezeUsageCode}
    />
  );
}
