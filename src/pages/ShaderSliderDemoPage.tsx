import { useState } from "react";
import ComponentViewer from "@/components/layout/component-viewer";
import ShaderSliderDemoPreview from "@/components/previews/ShaderSliderDemoPreview";
import {
  DEFAULT_SHADER_SLIDER_DEMO_CODE,
  DEFAULT_SHADER_SLIDER_DEMO_CONFIG,
  formatShaderSliderDemoCode,
  parseShaderSliderDemoCode,
  type ShaderSliderDemoConfig,
} from "@/components/previews/shader-slider-demo.util";
import { shaderSliderNextJsExport } from "@/snippets/shaderSliderNextExportCode";
import { shaderSliderInstallDescriptor } from "@/snippets/shaderSliderInstallDescriptor";
import { shaderSliderReactExport } from "@/snippets/shaderSliderReactExportCode";
import { shaderSliderUsageCode } from "@/snippets/shaderSliderUsageCode";

export default function ShaderSliderDemoPage() {
  const [code, setCode] = useState(DEFAULT_SHADER_SLIDER_DEMO_CODE);
  const [config, setConfig] = useState<ShaderSliderDemoConfig>(
    DEFAULT_SHADER_SLIDER_DEMO_CONFIG,
  );
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    const result = parseShaderSliderDemoCode(nextCode);
    setCodeError(result.error);
    if (result.config) setConfig(result.config);
  };

  const handleConfigChange = (nextConfig: ShaderSliderDemoConfig) => {
    setConfig(nextConfig);
    setCode(formatShaderSliderDemoCode(nextConfig));
    setCodeError(null);
  };

  const resetCode = () => {
    setCode(DEFAULT_SHADER_SLIDER_DEMO_CODE);
    setConfig(DEFAULT_SHADER_SLIDER_DEMO_CONFIG);
    setCodeError(null);
  };

  return (
    <ComponentViewer
      title="Shader Slider"
      description="Edit the live shader settings, then copy the reusable React or Next.js integration from the export tabs."
      component={
        <ShaderSliderDemoPreview
          config={config}
          onConfigChange={handleConfigChange}
        />
      }
      usageCode={code}
      codeLanguage="LIVE JSON"
      codeError={codeError}
      onUsageCodeChange={handleCodeChange}
      onResetCode={resetCode}
      referenceCode={shaderSliderUsageCode}
      reactExport={shaderSliderReactExport}
      nextJsExport={shaderSliderNextJsExport}
      installDescriptor={shaderSliderInstallDescriptor}
      showPreviewAlongsideCode
    />
  );
}
