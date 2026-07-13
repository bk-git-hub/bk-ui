import ComponentViewer from "@/components/layout/component-viewer";
import ShaderSliderDemoPreview from "@/components/previews/ShaderSliderDemoPreview";
import { shaderSliderUsageCode } from "@/snippets/shaderSliderUsageCode";

export default function ShaderSliderDemoPage() {
  return (
    <ComponentViewer
      title="Shader Slider"
      description="GPU-rendered image transitions with accessible React controls and a resilient DOM fallback."
      component={<ShaderSliderDemoPreview />}
      usageCode={shaderSliderUsageCode}
    />
  );
}
