import { useState } from "react";
import ComponentViewer from "@/components/layout/component-viewer";
import ShutterSliderDemoPreview from "@/components/previews/ShutterSliderDemoPreview";
import {
  DEFAULT_SHUTTER_SLIDER_DEMO_CODE,
  DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
  parseShutterSliderDemoCode,
  type ShutterSliderDemoConfig,
} from "@/components/previews/shutter-slider-demo.util";
import {
  shutterSliderNextJsExport,
  shutterSliderReactExport,
} from "@/snippets/shutterSliderExportCode";
import { shutterSliderUsageCode } from "@/snippets/shutterSliderUsageCode";

export default function ShutterSliderDemoPage() {
  const [code, setCode] = useState(DEFAULT_SHUTTER_SLIDER_DEMO_CODE);
  const [config, setConfig] = useState<ShutterSliderDemoConfig>(
    DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
  );
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    const result = parseShutterSliderDemoCode(nextCode);
    setCodeError(result.error);
    if (result.config) setConfig(result.config);
  };

  const handlePreviewConfigChange = (nextConfig: ShutterSliderDemoConfig) => {
    setConfig(nextConfig);
    setCode(JSON.stringify(nextConfig, null, 2));
    setCodeError(null);
  };

  const resetCode = () => {
    setCode(DEFAULT_SHUTTER_SLIDER_DEMO_CODE);
    setConfig(DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG);
    setCodeError(null);
  };

  return (
    <ComponentViewer
      title="Shutter Slider"
      description="Edit the live shutter settings, preview every transition, then copy framework-ready React or Next.js exports."
      component={
        <ShutterSliderDemoPreview
          config={config}
          onConfigChange={handlePreviewConfigChange}
        />
      }
      usageCode={code}
      codeLanguage="LIVE JSON"
      codeError={codeError}
      onUsageCodeChange={handleCodeChange}
      onResetCode={resetCode}
      referenceCode={shutterSliderUsageCode}
      reactExport={shutterSliderReactExport}
      nextJsExport={shutterSliderNextJsExport}
      showPreviewAlongsideCode
    />
  );
}
