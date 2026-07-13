import generatedDescriptor from "../../public/install/shader-slider.json";
import type { ComponentInstallDescriptor } from "@/components/layout/component-install-guide";

// The artifact generator validates this JSON before it reaches the UI. Keep
// the assertion at this generated-data boundary instead of duplicating it.
export const shaderSliderInstallDescriptor =
  generatedDescriptor as ComponentInstallDescriptor;
