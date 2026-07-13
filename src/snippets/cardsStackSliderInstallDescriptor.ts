import generatedDescriptor from "../../public/install/cards-stack-slider.json";
import type { ComponentInstallDescriptor } from "@/components/layout/component-install-guide";

// The deterministic generator validates this JSON before it reaches the UI.
// JSON imports widen discriminants, so keep the assertion at this generated
// data boundary instead of duplicating the descriptor by hand.
export const cardsStackSliderInstallDescriptor =
  generatedDescriptor as ComponentInstallDescriptor;
