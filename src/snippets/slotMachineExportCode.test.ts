import { describe, expect, it } from "vitest";
import * as clientEntry from "@/components/SlotMachine/client";
import * as coreEntry from "@/components/SlotMachine";
import {
  slotMachineNextJsExportCode,
  slotMachineReactExportCode,
} from "./slotMachineExportCode";

const coreFiles = [
  "src/components/SlotMachine/SlotMachine.tsx",
  "src/components/SlotMachine/SlotMachineLever.tsx",
  "src/components/SlotMachine/useSlotMachine.ts",
  "src/components/SlotMachine/index.ts",
  "src/components/SlotMachine/styles.css",
];

const runtimePublicExports = Object.keys(coreEntry);

describe("SlotMachine export snippets", () => {
  it("documents a copy-ready React and Vite export without framework-specific boundaries", () => {
    coreFiles.forEach((file) => {
      expect(slotMachineReactExportCode).toContain(file);
    });

    runtimePublicExports.forEach((exportName) => {
      expect(slotMachineReactExportCode).toContain(exportName);
    });

    expect(slotMachineReactExportCode).toContain(
      'from "@/components/SlotMachine"',
    );
    expect(slotMachineReactExportCode).toContain(
      "pnpm add clsx tailwind-merge",
    );
    expect(slotMachineReactExportCode).toContain('@import "tailwindcss";');
    expect(slotMachineReactExportCode).toContain(
      '@import "./components/SlotMachine/styles.css";',
    );
    expect(slotMachineReactExportCode).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/SlotMachine";',
    );
    expect(slotMachineReactExportCode).not.toContain("use client");
    expect(slotMachineReactExportCode).not.toContain("/client");
    expect(slotMachineReactExportCode).not.toMatch(/from ["']next\//);
  });

  it("documents the real Next.js entry, wrapper, SSR contract, and Tailwind sources", () => {
    coreFiles.forEach((file) => {
      expect(slotMachineNextJsExportCode).toContain(file);
    });

    expect(slotMachineNextJsExportCode).toContain(
      "src/components/SlotMachine/client.ts",
    );
    expect(slotMachineNextJsExportCode).toContain(
      '"use client";\n\nexport * from "./index";',
    );
    expect(slotMachineNextJsExportCode).toContain(
      'from "@/components/SlotMachine/client"',
    );
    expect(slotMachineNextJsExportCode).toContain(
      "export function InteractiveSlotMachine()",
    );
    expect(slotMachineNextJsExportCode).toContain("onValueChange={(result)");
    expect(slotMachineNextJsExportCode).toContain("renderItem={(item)");
    expect(slotMachineNextJsExportCode).toContain("SSR / hydration");
    expect(slotMachineNextJsExportCode).toContain("deterministic");
    expect(slotMachineNextJsExportCode).toContain("serializable");
    expect(slotMachineNextJsExportCode).toContain("window or document");
    expect(slotMachineNextJsExportCode).toContain(
      '@import "../components/SlotMachine/styles.css";',
    );
    expect(slotMachineNextJsExportCode).toContain(
      '@source "../../node_modules/@your-scope/bk-ui/src/components/SlotMachine";',
    );
    expect(slotMachineNextJsExportCode).not.toMatch(/from ["']next\//);
  });

  it("keeps the client entry aligned with the framework-neutral public API", () => {
    expect(Object.keys(clientEntry).sort()).toEqual(
      Object.keys(coreEntry).sort(),
    );
  });
});
