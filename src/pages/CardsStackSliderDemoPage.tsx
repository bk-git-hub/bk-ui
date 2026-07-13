import ComponentViewer from "@/components/layout/component-viewer";
import CardsStackSliderDemoPreview from "@/components/previews/CardsStackSliderDemoPreview";
import { cardsStackSliderUsageCode } from "@/snippets/cardsStackSliderUsageCode";

export default function CardsStackSliderDemoPage() {
  return (
    <ComponentViewer
      title="Cards Stack Slider"
      description="A tactile, flippable card stack with drag, keyboard, and orientation controls."
      component={<CardsStackSliderDemoPreview />}
      usageCode={cardsStackSliderUsageCode}
    />
  );
}
