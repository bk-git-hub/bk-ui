import { useState } from "react";
import ComponentViewer from "@/components/layout/component-viewer";
import TinderDemoPreview from "@/components/previews/TinderDemoPreview";
import {
  DEFAULT_TINDER_DEMO_CODE,
  DEFAULT_TINDER_DEMO_CONFIG,
  parseTinderDemoCode,
  type TinderDemoConfig,
} from "@/components/previews/tinder-demo.util";
import { tinderUsageCode } from "@/snippets/tinderUsageCode";

export default function TinderDemoPage() {
  const [code, setCode] = useState(DEFAULT_TINDER_DEMO_CODE);
  const [config, setConfig] = useState<TinderDemoConfig>(
    DEFAULT_TINDER_DEMO_CONFIG,
  );
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    const result = parseTinderDemoCode(nextCode);
    setCodeError(result.error);
    if (result.config) setConfig(result.config);
  };

  const resetCode = () => {
    setCode(DEFAULT_TINDER_DEMO_CODE);
    setConfig(DEFAULT_TINDER_DEMO_CONFIG);
    setCodeError(null);
  };

  return (
    <ComponentViewer
      title="Tinder Swiper"
      description="Edit the live JSON to customize cards and labels, then copy the complete component from Usage."
      component={<TinderDemoPreview config={config} />}
      usageCode={code}
      codeLanguage="LIVE JSON"
      codeError={codeError}
      onUsageCodeChange={handleCodeChange}
      onResetCode={resetCode}
      referenceCode={tinderUsageCode}
      showPreviewAlongsideCode
    />
  );
}
