import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { sha256 } from "../../../scripts/component-artifacts/canonical-json.mjs";
import { buildArtifactPlan } from "../../../scripts/component-artifacts/generate.mjs";
import { parseCanonicalZip } from "../../../scripts/component-artifacts/test-helpers.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manifestPath = resolve(rootDir, "registry/components/tinder.json");

const expectedPlanPaths = [
  "public/ai/tinder.md",
  "public/downloads/tinder-next.zip",
  "public/downloads/tinder-react.zip",
  "public/install/tinder.json",
  "public/r/tinder-tailwind-v3.json",
  "public/r/tinder.json",
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

function loadTinderArtifacts() {
  artifactsPromise ??= buildArtifactPlan({
    rootDir,
    manifestPaths: [manifestPath],
  }).then(({ components, plan }) => {
    assert.equal(components.length, 1);
    return { component: components[0], plan };
  });
  return artifactsPromise;
}

test("Tinder manifest pins the exact shared React/Next graph and both Tailwind variants", async () => {
  const { component, plan } = await loadTinderArtifacts();
  const { manifest } = component;

  assert.equal(
    manifest.sourceCommit,
    "35d17dd9e1c04f4f35d9cf72f2c2574ebfceff0c",
  );
  assert.deepEqual(manifest.tailwind.supportedMajors, [3, 4]);
  assert.deepEqual(manifest.dependencies.common, ["clsx@^2.1.1"]);
  assert.deepEqual(manifest.dependencies.tailwind[3], ["tailwind-merge@2.6.0"]);
  assert.deepEqual(manifest.dependencies.tailwind[4], [
    "tailwind-merge@^3.3.1",
  ]);
  assert.equal(manifest.react.tested, "19.2.7");
  assert.equal(manifest.next.tested, "16.2.10");
  assert.equal(manifest.next.clientBoundary, "src/components/Tinder/client.ts");
  assert.equal(manifest.title, "Tinder Swiper");
  assert.deepEqual([...plan.keys()], expectedPlanPaths);

  for (const [name, source] of Object.entries(manifest.examples)) {
    assertTsxSyntax(source, `${name}.tsx`);
    assert.doesNotMatch(source, /(?:from\s+|import\s*)["']@\//);
    assert.doesNotMatch(source, /from\s+["']next\//);
  }
  assert.match(manifest.examples.nextClient, /^"use client";/);

  for (const major of [3, 4]) {
    assert.deepEqual(manifest.tailwind[major].representativeClasses, [
      "-rotate-12",
      "[touch-action:none]",
      "duration-300",
      "opacity-0",
      "select-none",
      "transition-transform",
      "will-change-transform",
    ]);
  }
  const source = component.files
    .map((file) => file.content.toString("utf8"))
    .join("\n");
  for (const utility of manifest.tailwind[3].representativeClasses) {
    assert.match(
      source,
      new RegExp(utility.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("Tinder Registry items carry exact source, compatibility, and constraint metadata", async () => {
  const { component, plan } = await loadTinderArtifacts();
  const variants = [
    {
      path: "public/r/tinder-tailwind-v3.json",
      major: 3,
      tested: "3.4.17",
      dependencies: ["clsx@^2.1.1", "tailwind-merge@2.6.0"],
    },
    {
      path: "public/r/tinder.json",
      major: 4,
      tested: "4.3.2",
      dependencies: ["clsx@^2.1.1", "tailwind-merge@^3.3.1"],
    },
  ];

  for (const variant of variants) {
    const item = JSON.parse(plan.get(variant.path));
    assert.equal(item.meta.bkUi.tailwind.major, variant.major);
    assert.equal(item.meta.bkUi.tailwind.tested, variant.tested);
    assert.deepEqual(item.dependencies, variant.dependencies);
    assert.deepEqual(
      item.meta.bkUi.tailwind.representativeClasses,
      component.manifest.tailwind[variant.major].representativeClasses,
    );
    assert.deepEqual(
      item.meta.bkUi.constraints,
      component.manifest.constraints,
    );
    assert.match(item.docs, /SSR and hydration constraints:/);
    assert.match(item.docs, /Accessibility constraints:/);

    for (const sourceFile of component.files) {
      const registryFile = item.files.find(
        (file) => file.path === sourceFile.source,
      );
      assert.ok(
        registryFile,
        `Missing ${sourceFile.source} from ${variant.path}`,
      );
      assert.deepEqual(
        Buffer.from(registryFile.content, "utf8"),
        sourceFile.content,
      );
    }
  }
});

test("Tinder React and Next ZIPs share core bytes and isolate the client boundary", async () => {
  const { component, plan } = await loadTinderArtifacts();
  const react = parseCanonicalZip(
    plan.get("public/downloads/tinder-react.zip"),
  );
  const next = parseCanonicalZip(plan.get("public/downloads/tinder-next.zip"));

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

  const client = next.get("components/Tinder/client.ts").toString("utf8");
  assert.match(client, /^"use client";\r?\n/);
  assert.equal(react.has("components/Tinder/client.ts"), false);
  assert.equal(react.has("examples/react-example.tsx"), true);
  assert.equal(next.has("examples/client-wrapper.tsx"), true);
  assert.equal(next.has("examples/page.tsx"), true);

  for (const archive of [react, next]) {
    const archiveManifest = JSON.parse(archive.get("manifest.json"));
    assert.equal(archiveManifest.releaseStatus, "release-blocked");
    assert.deepEqual(
      archiveManifest.constraints,
      component.manifest.constraints,
    );
    for (const file of archiveManifest.files) {
      assert.equal(sha256(archive.get(file.path)), file.sha256);
    }
  }
});

test("Tinder blocked descriptor exposes only repository paths with verified hashes", async () => {
  const { component, plan } = await loadTinderArtifacts();
  const descriptorBytes = plan.get("public/install/tinder.json");
  const descriptorText = descriptorBytes.toString("utf8");
  const descriptor = JSON.parse(descriptorBytes);

  assert.equal(descriptor.status, "release-blocked");
  assert.deepEqual(
    descriptor.variants.map((variant) => variant.tailwindMajor),
    [3, 4],
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

  const ai = plan.get("public/ai/tinder.md").toString("utf8");
  assert.match(ai, /Status: `release-blocked`/);
  assert.doesNotMatch(ai, /https?:\/\/[^\s`)]+/i);
  assert.doesNotMatch(ai, /\b(?:npx|pnpm\s+dlx)\s+bk-ui@/i);
  assert.match(
    ai,
    /The current core does not disable its imperative swipe animation/,
  );
});
