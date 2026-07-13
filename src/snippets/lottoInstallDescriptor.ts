import generatedDescriptor from "../../public/install/lotto.json";
import type { ComponentInstallDescriptor } from "@/components/layout/component-install-guide";

// The artifact generator validates this JSON before the viewer consumes it.
// Keep the assertion at this generated-data boundary so the UI never carries a
// second hand-maintained copy of paths, hashes, compatibility, or release state.
export const lottoInstallDescriptor =
  generatedDescriptor as ComponentInstallDescriptor;
