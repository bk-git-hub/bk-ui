import { describe, expect, it } from "vitest";
import * as coreEntry from "@/components/Baccarat";
import {
  baccaratSqueezeNextJsExport,
  baccaratSqueezeReactExport,
} from "./baccaratSqueezeExportCode";

const usedPublicExports = [
  "BaccaratPlayingCard",
  "BaccaratSqueezeAction",
  "BaccaratSqueezeBack",
  "BaccaratSqueezeCard",
  "BaccaratSqueezeFace",
  "BaccaratSqueezeFold",
  "BaccaratSqueezeHandle",
  "BaccaratSqueezeHint",
  "BaccaratSqueezeRoot",
] as const;

describe("Baccarat Squeeze export snippets", () => {
  it("documents the current React and Vite public entry", () => {
    expect(baccaratSqueezeReactExport.language).toBe("React TSX");
    expect(baccaratSqueezeReactExport.description).toEqual(
      expect.stringContaining("Tailwind v4"),
    );
    expect(baccaratSqueezeReactExport.description).toEqual(
      expect.stringContaining("clsx, lucide-react, and tailwind-merge"),
    );

    const code = baccaratSqueezeReactExport.code;
    expect(code).toContain("src/components/Baccarat/BaccaratSqueeze.tsx");
    expect(code).toContain("src/components/Baccarat/useCardSqueeze.ts");
    expect(code).toContain("src/components/Baccarat/index.ts");
    expect(code).toContain('from "@/components/Baccarat"');
    expect(code).toContain("pnpm add clsx lucide-react tailwind-merge");

    usedPublicExports.forEach((exportName) => {
      expect(coreEntry).toHaveProperty(exportName);
      expect(code).toContain(exportName);
    });

    ["BaccaratRank", "BaccaratSuit", "SqueezeCorner"].forEach((typeExport) => {
      expect(code).toContain(typeExport);
    });

    expect(code).toContain("Tailwind CSS v4");
    expect(code).toContain("Tailwind CSS v3");
    expect(code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/Baccarat"',
    );
    expect(code).not.toContain('from "@/components/Baccarat/client"');
    expect(code).not.toMatch(/from ["']next\//);
  });

  it("documents the real Next.js client entry and boundary constraints", () => {
    expect(baccaratSqueezeNextJsExport.language).toBe("Next.js TSX");
    expect(baccaratSqueezeNextJsExport.description).toEqual(
      expect.stringContaining("serializable"),
    );
    expect(baccaratSqueezeNextJsExport.description).toEqual(
      expect.stringContaining("SSR/hydration-safe"),
    );

    const code = baccaratSqueezeNextJsExport.code;
    expect(code).toContain("src/components/Baccarat/client.ts");
    expect(code).toContain('"use client";');
    expect(code).toContain('export * from "./index";');
    expect(code).toContain('from "@/components/Baccarat/client"');
    expect(code).toContain("pnpm add clsx lucide-react tailwind-merge");
    expect(code).toContain("SSR / hydration");
    expect(code).toContain("serializable");
    expect(code).toContain("window or document");
    expect(code).toContain("dynamic(..., { ssr: false })");
    expect(code).toContain("Tailwind CSS v4");
    expect(code).toContain("Tailwind CSS v3");
    expect(code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/Baccarat"',
    );
    expect(code).not.toMatch(/from ["']next\//);
  });
});
