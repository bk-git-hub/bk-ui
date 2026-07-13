import generatedDescriptor from "../../public/install/tinder.json";
import type { ComponentInstallDescriptor } from "@/components/layout/component-install-guide";

// The deterministic artifact generator validates this JSON before it reaches
// the UI. JSON imports widen discriminants, so keep the assertion at this one
// generated-data boundary instead of duplicating the descriptor by hand.
export const tinderInstallDescriptor =
  generatedDescriptor as ComponentInstallDescriptor;
