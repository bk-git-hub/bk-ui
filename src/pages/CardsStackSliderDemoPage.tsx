import { useState } from "react";
import ComponentViewer from "@/components/layout/component-viewer";
import CardsStackSliderDemoPreview from "@/components/previews/CardsStackSliderDemoPreview";
import {
  DEFAULT_CARDS_STACK_SLIDER_DEMO_CODE,
  DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
  parseCardsStackSliderDemoCode,
  type CardsStackSliderDemoConfig,
} from "@/components/previews/cards-stack-slider-demo.util";
import {
  cardsStackSliderNextJsExport,
  cardsStackSliderReactExport,
} from "@/snippets/cardsStackSliderExportCode";
import { cardsStackSliderInstallDescriptor } from "@/snippets/cardsStackSliderInstallDescriptor";
import { cardsStackSliderUsageCode } from "@/snippets/cardsStackSliderUsageCode";

export default function CardsStackSliderDemoPage() {
  const [code, setCode] = useState(DEFAULT_CARDS_STACK_SLIDER_DEMO_CODE);
  const [config, setConfig] = useState<CardsStackSliderDemoConfig>(
    DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG,
  );
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    const result = parseCardsStackSliderDemoCode(nextCode);
    setCodeError(result.error);
    if (result.config) setConfig(result.config);
  };

  const handlePreviewConfigChange = (
    nextConfig: CardsStackSliderDemoConfig,
  ) => {
    setConfig(nextConfig);
    setCode(JSON.stringify(nextConfig, null, 2));
    setCodeError(null);
  };

  const resetCode = () => {
    setCode(DEFAULT_CARDS_STACK_SLIDER_DEMO_CODE);
    setConfig(DEFAULT_CARDS_STACK_SLIDER_DEMO_CONFIG);
    setCodeError(null);
  };

  return (
    <ComponentViewer
      title="Cards Stack Slider"
      description="Edit the live slider settings, try the card stack, then copy the React or Next.js integration you need."
      component={
        <CardsStackSliderDemoPreview
          config={config}
          onConfigChange={handlePreviewConfigChange}
        />
      }
      usageCode={code}
      codeLanguage="LIVE JSON"
      codeError={codeError}
      onUsageCodeChange={handleCodeChange}
      onResetCode={resetCode}
      referenceCode={cardsStackSliderUsageCode}
      referenceCodeLanguage="React TSX"
      reactExport={cardsStackSliderReactExport}
      nextJsExport={cardsStackSliderNextJsExport}
      installDescriptor={cardsStackSliderInstallDescriptor}
      showPreviewAlongsideCode
    />
  );
}
