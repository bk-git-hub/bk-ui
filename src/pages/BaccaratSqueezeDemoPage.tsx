import { useState } from "react";
import ComponentViewer from "@/components/layout/component-viewer";
import BaccaratSqueezeDemoPreview from "@/components/previews/BaccaratSqueezeDemoPreview";
import {
  DEFAULT_BACCARAT_SQUEEZE_DEMO_CODE,
  DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG,
  parseBaccaratSqueezeDemoCode,
  type BaccaratSqueezeDemoConfig,
} from "@/components/previews/baccarat-squeeze-demo.util";
import {
  baccaratSqueezeNextJsExport,
  baccaratSqueezeReactExport,
} from "@/snippets/baccaratSqueezeExportCode";
import { baccaratSqueezeUsageCode } from "@/snippets/baccaratSqueezeUsageCode";

export default function BaccaratSqueezeDemoPage() {
  const [code, setCode] = useState(DEFAULT_BACCARAT_SQUEEZE_DEMO_CODE);
  const [config, setConfig] = useState<BaccaratSqueezeDemoConfig>(
    DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG,
  );
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    const result = parseBaccaratSqueezeDemoCode(nextCode);
    setCodeError(result.error);
    if (result.config) setConfig(result.config);
  };

  const handlePreviewConfigChange = (nextConfig: BaccaratSqueezeDemoConfig) => {
    setConfig(nextConfig);
    setCode(JSON.stringify(nextConfig, null, 2));
    setCodeError(null);
  };

  const resetCode = () => {
    setCode(DEFAULT_BACCARAT_SQUEEZE_DEMO_CODE);
    setConfig(DEFAULT_BACCARAT_SQUEEZE_DEMO_CONFIG);
    setCodeError(null);
  };

  return (
    <ComponentViewer
      title="Baccarat Squeeze"
      description="Edit the live card and squeeze settings, try every corner or side, then copy framework-ready React or Next.js exports."
      component={
        <BaccaratSqueezeDemoPreview
          config={config}
          onConfigChange={handlePreviewConfigChange}
        />
      }
      usageCode={code}
      codeLanguage="LIVE JSON"
      codeError={codeError}
      onUsageCodeChange={handleCodeChange}
      onResetCode={resetCode}
      referenceCode={baccaratSqueezeUsageCode}
      showPreviewAlongsideCode
      reactExport={baccaratSqueezeReactExport}
      nextJsExport={baccaratSqueezeNextJsExport}
    />
  );
}
