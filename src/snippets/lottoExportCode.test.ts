import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lottoNextExportCode } from "./lottoNextExportCode";
import { lottoReactExportCode } from "./lottoReactExportCode";

const coreFiles = [
  "LottoDraw.tsx",
  "LottoMachine.tsx",
  "useLottoDraw.ts",
  "useLottoMachinePhysics.ts",
  "lottoMachinePhysics.ts",
  "index.ts",
] as const;

describe("Lotto export snippets", () => {
  it("lists every real framework-neutral Lotto core file", () => {
    for (const file of coreFiles) {
      const publicPath = `src/components/Lotto/${file}`;
      const localFile = resolve(process.cwd(), publicPath);

      expect(existsSync(localFile), publicPath).toBe(true);
      expect(lottoReactExportCode).toContain(publicPath);
      expect(lottoNextExportCode).toContain(publicPath);
    }
  });

  it("provides a copyable React and Vite integration", () => {
    expect(lottoReactExportCode).toContain(
      "pnpm add lucide-react@^0.542.0 tailwind-merge@^3.3.1",
    );
    expect(lottoReactExportCode).toContain(
      "pnpm add -D tailwindcss@4.3.2 @tailwindcss/vite@4.3.2",
    );
    expect(lottoReactExportCode).toContain('from "@tailwindcss/vite"');
    expect(lottoReactExportCode).toContain(
      "LottoAction, LottoMachine, useLottoDraw",
    );
    expect(lottoReactExportCode).toContain('from "./Lotto"');
    expect(lottoReactExportCode).toContain("stylesheet-");
    expect(lottoReactExportCode).toContain("relative @source");
    expect(lottoReactExportCode).toContain("prefers-reduced-motion: reduce");
    expect(lottoReactExportCode).toContain("window.clearTimeout");
    expect(lottoReactExportCode).not.toContain("@your-scope");
  });

  it("uses the same core behind a safe Next.js App Router boundary", () => {
    expect(lottoNextExportCode).toContain('"use client";');
    expect(lottoNextExportCode).toContain(
      "src/components/Lotto/client.ts",
    );
    expect(lottoNextExportCode).toContain(
      'from "../../components/Lotto/client"',
    );
    expect(lottoNextExportCode).toContain(
      "app/page.tsx remains a Server Component",
    );
    expect(lottoNextExportCode).toContain("SSR / hydration");
    expect(lottoNextExportCode).toContain("deterministic on server and client");
    expect(lottoNextExportCode).toContain("not serializable across");
    expect(lottoNextExportCode).toContain("dynamic import with ssr: false");
    expect(lottoNextExportCode).toContain("@tailwindcss/postcss");
    expect(lottoNextExportCode).toContain("stylesheet-");
    expect(lottoNextExportCode).toContain("relative @source");
    expect(lottoNextExportCode).not.toContain("@/components/Lotto");
    expect(lottoNextExportCode).not.toContain("@your-scope");
    expect(lottoNextExportCode).not.toMatch(/from ["']next\//);
  });

  it("does not present a blocked BK-UI command as installable", () => {
    for (const source of [lottoReactExportCode, lottoNextExportCode]) {
      expect(source).toContain("release-blocked");
      expect(source).not.toMatch(/\b(?:npx|pnpm\s+dlx)\s+bk-ui@/);
    }
  });
});
