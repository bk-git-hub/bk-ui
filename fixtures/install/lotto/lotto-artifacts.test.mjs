import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { sha256 } from "../../../scripts/component-artifacts/canonical-json.mjs";
import { buildArtifactPlan } from "../../../scripts/component-artifacts/generate.mjs";
import { parseCanonicalZip } from "../../../scripts/component-artifacts/test-helpers.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manifestPath = resolve(rootDir, "registry/components/lotto.json");

const expectedPlanPaths = [
  "public/ai/lotto.md",
  "public/downloads/lotto-next.zip",
  "public/downloads/lotto-react.zip",
  "public/install/lotto.json",
  "public/r/lotto.json",
];

const targetToArchivePath = (target) =>
  `components/${target.slice("@components/".length)}`;

function assertTsxSyntax(source, fileName) {
  const diagnostics =
    ts
      .transpileModule(source, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
        fileName,
        reportDiagnostics: true,
      })
      .diagnostics?.filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
      ) ?? [];

  assert.deepEqual(
    diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    ),
    [],
  );
}

let artifactsPromise;

function loadLottoArtifacts() {
  artifactsPromise ??= buildArtifactPlan({
    rootDir,
    manifestPaths: [manifestPath],
  }).then(({ components, plan }) => {
    assert.equal(components.length, 1);
    return { component: components[0], plan };
  });
  return artifactsPromise;
}

test("Lotto manifest pins the complete React core and isolated Next entry", async () => {
  const { component, plan } = await loadLottoArtifacts();
  const { manifest } = component;

  assert.equal(
    manifest.sourceCommit,
    "8cb1677b64f5934db933c15a602ae45741c5bbd3",
  );
  assert.deepEqual(manifest.tailwind.supportedMajors, [4]);
  assert.equal(manifest.tailwind[3].supported, false);
  assert.deepEqual(manifest.dependencies.common, ["lucide-react@^0.542.0"]);
  assert.deepEqual(manifest.dependencies.tailwind[3], []);
  assert.deepEqual(manifest.dependencies.tailwind[4], [
    "tailwind-merge@^3.3.1",
  ]);
  assert.equal(manifest.react.tested, "19.2.7");
  assert.equal(manifest.next.tested, "16.2.10");
  assert.equal(manifest.next.clientBoundary, "src/components/Lotto/client.ts");
  assert.equal(manifest.title, "Lotto Draw");
  assert.deepEqual([...plan.keys()], expectedPlanPaths);

  for (const [name, source] of Object.entries(manifest.examples)) {
    assertTsxSyntax(source, `${name}.tsx`);
    assert.doesNotMatch(source, /(?:from\s+|import\s*)["']@\//);
    assert.doesNotMatch(source, /from\s+["']next\//);
  }
  assert.match(manifest.examples.nextClient, /^"use client";/);

  const commonFiles = manifest.files.filter((file) =>
    file.frameworks.includes("react"),
  );
  const nextOnlyFiles = manifest.files.filter(
    (file) => !file.frameworks.includes("react"),
  );
  assert.equal(commonFiles.length, 6);
  assert.deepEqual(
    nextOnlyFiles.map((file) => file.source),
    ["src/components/Lotto/client.ts"],
  );

  const source = component.files
    .map((file) => file.content.toString("utf8"))
    .join("\n");
  for (const utility of manifest.tailwind[4].representativeClasses) {
    assert.match(
      source,
      new RegExp(utility.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
  assert.doesNotMatch(source, /from ["']@\//);
  assert.doesNotMatch(source, /from ["']next\//);
});

test("Lotto Registry JSON embeds exact source and install constraints", async () => {
  const { component, plan } = await loadLottoArtifacts();
  const item = JSON.parse(plan.get("public/r/lotto.json"));

  assert.equal(item.meta.bkUi.tailwind.major, 4);
  assert.equal(item.meta.bkUi.tailwind.tested, "4.3.2");
  assert.deepEqual(item.dependencies, [
    "lucide-react@^0.542.0",
    "tailwind-merge@^3.3.1",
  ]);
  assert.deepEqual(
    item.meta.bkUi.tailwind.representativeClasses,
    component.manifest.tailwind[4].representativeClasses,
  );
  assert.deepEqual(item.meta.bkUi.constraints, component.manifest.constraints);
  assert.match(item.docs, /SSR and hydration constraints:/);
  assert.match(item.docs, /Accessibility constraints:/);

  for (const sourceFile of component.files) {
    const registryFile = item.files.find(
      (file) => file.path === sourceFile.source,
    );
    assert.ok(registryFile, `Missing ${sourceFile.source} from lotto.json`);
    assert.deepEqual(
      Buffer.from(registryFile.content, "utf8"),
      sourceFile.content,
    );
  }
});

test("Lotto React and Next ZIPs share core bytes without aliases", async () => {
  const { component, plan } = await loadLottoArtifacts();
  const react = parseCanonicalZip(plan.get("public/downloads/lotto-react.zip"));
  const next = parseCanonicalZip(plan.get("public/downloads/lotto-next.zip"));

  for (const sourceFile of component.files) {
    const archivePath = targetToArchivePath(sourceFile.target);
    if (sourceFile.frameworks.includes("react")) {
      assert.deepEqual(react.get(archivePath), sourceFile.content);
      assert.deepEqual(next.get(archivePath), sourceFile.content);
      assert.deepEqual(react.get(archivePath), next.get(archivePath));
    } else {
      assert.equal(react.has(archivePath), false);
      assert.deepEqual(next.get(archivePath), sourceFile.content);
    }
  }

  const client = next.get("components/Lotto/client.ts").toString("utf8");
  assert.match(client, /^"use client";\r?\n/);
  assert.equal(react.has("components/Lotto/client.ts"), false);
  assert.equal(react.has("examples/react-example.tsx"), true);
  assert.equal(next.has("examples/client-wrapper.tsx"), true);
  assert.equal(next.has("examples/page.tsx"), true);

  for (const archive of [react, next]) {
    const archiveManifest = JSON.parse(archive.get("manifest.json"));
    assert.equal(archiveManifest.releaseStatus, "release-blocked");
    assert.equal(archiveManifest.license.spdx, "UNLICENSED");
    assert.deepEqual(
      archiveManifest.constraints,
      component.manifest.constraints,
    );
    assert.match(
      archive.get("DISTRIBUTION-NOTICE.md").toString("utf8"),
      /No redistribution license .* is granted/i,
    );
    for (const file of archiveManifest.files) {
      assert.equal(sha256(archive.get(file.path)), file.sha256);
    }
  }
});

test("Lotto blocked install metadata never advertises an unavailable command", async () => {
  const { component, plan } = await loadLottoArtifacts();
  const descriptorBytes = plan.get("public/install/lotto.json");
  const descriptorText = descriptorBytes.toString("utf8");
  const descriptor = JSON.parse(descriptorBytes);

  assert.equal(descriptor.status, "release-blocked");
  assert.deepEqual(
    descriptor.variants.map((variant) => variant.tailwindMajor),
    [4],
  );
  assert.doesNotMatch(descriptorText, /"(?:commands?|url|href)"\s*:/i);
  assert.doesNotMatch(descriptorText, /https?:\/\//i);
  assert.doesNotMatch(descriptorText, /\b(?:npx|pnpm\s+dlx)\s+bk-ui@/i);

  const sourceByPath = new Map(
    component.files.map((file) => [file.source, file.content]),
  );
  for (const variant of descriptor.variants) {
    assert.ok(
      variant.notes.includes(
        component.manifest.tailwind[variant.tailwindMajor].scan,
      ),
    );
    for (const resource of variant.resources) {
      const bytes =
        resource.kind === "source"
          ? sourceByPath.get(resource.repositoryPath)
          : plan.get(resource.repositoryPath);
      assert.ok(bytes, `Missing in-memory resource ${resource.repositoryPath}`);
      assert.equal(sha256(bytes), resource.sha256);
    }
  }

  const ai = plan.get("public/ai/lotto.md").toString("utf8");
  assert.match(ai, /Status: `release-blocked`/);
  assert.match(ai, /Tailwind 3 is unsupported/);
  assert.match(ai, /Lotto does not require ssr: false/);
  assert.doesNotMatch(ai, /https?:\/\/[^\s`)]+/i);
  assert.doesNotMatch(ai, /\b(?:npx|pnpm\s+dlx)\s+bk-ui@/i);
});
