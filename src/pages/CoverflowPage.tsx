import { useState } from "react";
import ComponentViewer from "@/components/layout/component-viewer";
import CoverflowDemoPreview from "@/components/previews/CoverflowDemoPreview";
import {
  DEFAULT_COVERFLOW_DEMO_CODE,
  DEFAULT_COVERFLOW_DEMO_CONFIG,
  parseCoverflowDemoCode,
  type CoverflowDemoConfig,
} from "@/components/previews/coverflow-demo.util";
import { coverflowUsageCode } from "@/snippets/coverflowUsageCode";

export default function CoverflowPage() {
  const [code, setCode] = useState(DEFAULT_COVERFLOW_DEMO_CODE);
  const [config, setConfig] = useState<CoverflowDemoConfig>(
    DEFAULT_COVERFLOW_DEMO_CONFIG,
  );
  const [codeError, setCodeError] = useState<string | null>(null);
  const [previewRevision, setPreviewRevision] = useState(0);

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    const result = parseCoverflowDemoCode(nextCode);
    setCodeError(result.error);
    if (result.config) setConfig(result.config);
  };

  const handlePreviewConfigChange = (nextConfig: CoverflowDemoConfig) => {
    setConfig(nextConfig);
    setCode(JSON.stringify(nextConfig, null, 2));
    setCodeError(null);
  };

  const resetCode = () => {
    setCode(DEFAULT_COVERFLOW_DEMO_CODE);
    setConfig(DEFAULT_COVERFLOW_DEMO_CONFIG);
    setCodeError(null);
    setPreviewRevision((revision) => revision + 1);
  };

  return (
    <ComponentViewer
      title="Coverflow"
      description="Edit the live album JSON, flip a cover for its track list, or copy the complete React example from Usage."
      component={
        <CoverflowDemoPreview
          key={previewRevision}
          config={config}
          onConfigChange={handlePreviewConfigChange}
        />
      }
      usageCode={code}
      codeLanguage="LIVE JSON"
      codeError={codeError}
      onUsageCodeChange={handleCodeChange}
      onResetCode={resetCode}
      referenceCode={coverflowUsageCode}
      showPreviewAlongsideCode
      previewClassName="overflow-hidden bg-black p-0"
    />
  );
}
