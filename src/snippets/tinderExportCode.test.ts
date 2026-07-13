import { describe, expect, it } from "vitest";
import tinderManifest from "../../registry/components/tinder.json";
import {
  tinderNextJsExport,
  tinderNextJsExportFiles,
  tinderReactExport,
  tinderReactExportFiles,
} from "./tinderExportCode";

const importPathForEntrypoint = (entrypoint: string) => {
  const componentPath = entrypoint
    .replace(/^src\/components\//, "")
    .replace(/\/index\.tsx$/, "")
    .replace(/\.ts$/, "");

  return `../components/${componentPath}`;
};

describe("Tinder framework exports", () => {
  it("uses the canonical React entrypoint and manifest example", () => {
    const [reactFile] = tinderReactExportFiles;
    const reactEntrypoint = importPathForEntrypoint(
      tinderManifest.entrypoints.react,
    );

    expect(reactFile).toEqual({
      path: "src/App.tsx",
      code: tinderManifest.examples.react.trim(),
    });
    expect(reactFile.code).toContain(`from "${reactEntrypoint}"`);
    expect(tinderReactExport.code).toBe(
      `// FILE: ${reactFile.path}\n${reactFile.code}`,
    );
  });

  it("uses the canonical client entrypoint as two valid App Router files", () => {
    const [clientFile, serverFile] = tinderNextJsExportFiles;
    const clientEntrypoint = importPathForEntrypoint(
      tinderManifest.entrypoints.next,
    );

    expect(clientFile).toEqual({
      path: "src/app/client-wrapper.tsx",
      code: tinderManifest.examples.nextClient.trim(),
    });
    expect(serverFile).toEqual({
      path: "src/app/page.tsx",
      code: tinderManifest.examples.nextServer.trim(),
    });
    expect(clientFile.code).toMatch(/^"use client";/);
    expect(clientFile.code).toContain(`from "${clientEntrypoint}"`);
    expect(serverFile.code).not.toContain('"use client"');
    expect(serverFile.code).toContain('from "./client-wrapper"');
    expect(tinderNextJsExport.code).toBe(
      [
        `// FILE: ${clientFile.path}\n${clientFile.code}`,
        `// FILE: ${serverFile.path}\n${serverFile.code}`,
      ].join("\n\n"),
    );
  });

  it("keeps the entrypoint sources in the expected framework graphs", () => {
    const reactEntry = tinderManifest.files.find(
      ({ source }) => source === tinderManifest.entrypoints.react,
    );
    const nextEntry = tinderManifest.files.find(
      ({ source }) => source === tinderManifest.entrypoints.next,
    );

    expect(reactEntry?.frameworks).toEqual(["react", "next"]);
    expect(nextEntry?.frameworks).toEqual(["next"]);
  });
});
