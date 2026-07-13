import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { sha256 } from "../../../scripts/component-artifacts/canonical-json.mjs";
import { buildArtifactPlan } from "../../../scripts/component-artifacts/generate.mjs";
import { parseCanonicalZip } from "../../../scripts/component-artifacts/test-helpers.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manifestPath = resolve(
  rootDir,
  "registry/components/cards-stack-slider.json",
);

const expectedPlanPaths = [
  "public/ai/cards-stack-slider.md",
  "public/downloads/cards-stack-slider-next.zip",
  "public/downloads/cards-stack-slider-react.zip",
  "public/install/cards-stack-slider.json",
  "public/r/cards-stack-slider-tailwind-v3.json",
  "public/r/cards-stack-slider.json",
];

const representativeClasses = [
  "[backface-visibility:hidden]",
  "[perspective:1200px]",
  "[touch-action:pan-y]",
  "aspect-[19/12]",
  "ease-[cubic-bezier(0.22,0.75,0.18,1)]",
  "motion-reduce:transition-none",
  "will-change-transform",
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

function loadCardsStackSliderArtifacts() {
  artifactsPromise ??= buildArtifactPlan({
    rootDir,
    manifestPaths: [manifestPath],
  }).then(({ components, plan }) => {
    assert.equal(components.length, 1);
    return { component: components[0], plan };
  });
  return artifactsPromise;
}

test("Cards Stack Slider manifest pins its React/Next graph and Tailwind variants", async () => {
  const { component, plan } = await loadCardsStackSliderArtifacts();
  const { manifest } = component;

  assert.equal(
    manifest.sourceCommit,
    "fecaf6502f823c379eedfbeb3e1b3e256040ff5e",
  );
  assert.equal(manifest.title, "Cards Stack Slider");
  assert.equal(manifest.react.tested, "19.2.7");
  assert.equal(manifest.next.tested, "16.2.10");
  assert.equal(
    manifest.next.clientBoundary,
    "src/components/CardsStackSlider/client.ts",
  );
  assert.deepEqual(manifest.tailwind.supportedMajors, [3, 4]);
  assert.deepEqual(manifest.dependencies.common, ["clsx@^2.1.1"]);
  assert.deepEqual(manifest.dependencies.tailwind[3], ["tailwind-merge@2.6.0"]);
  assert.deepEqual(manifest.dependencies.tailwind[4], [
    "tailwind-merge@^3.3.1",
  ]);
  assert.deepEqual([...plan.keys()], expectedPlanPaths);

  for (const [name, source] of Object.entries(manifest.examples)) {
    assertTsxSyntax(source, `${name}.tsx`);
    assert.doesNotMatch(source, /(?:from\s+|import\s*)["']@\//);
    assert.doesNotMatch(source, /from\s+["']next\//);
  }
  assert.match(manifest.examples.nextClient, /^"use client";/);
  assert.match(manifest.examples.react, /CardsStackPrevious/);
  assert.match(manifest.examples.react, /CardsStackNext/);

  for (const major of [3, 4]) {
    assert.deepEqual(
      manifest.tailwind[major].representativeClasses,
      representativeClasses,
    );
  }
  const source = component.files
    .map((file) => file.content.toString("utf8"))
    .join("\n");
  for (const utility of representativeClasses) {
    assert.match(
      source,
      new RegExp(utility.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("Cards Stack Slider Registry items preserve source and compatibility metadata", async () => {
  const { component, plan } = await loadCardsStackSliderArtifacts();
  const variants = [
    {
      path: "public/r/cards-stack-slider-tailwind-v3.json",
      major: 3,
      tested: "3.4.19",
      dependencies: ["clsx@^2.1.1", "tailwind-merge@2.6.0"],
    },
    {
      path: "public/r/cards-stack-slider.json",
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
      representativeClasses,
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

test("Cards Stack Slider ZIPs share core bytes and isolate the client boundary", async () => {
  const { component, plan } = await loadCardsStackSliderArtifacts();
  const react = parseCanonicalZip(
    plan.get("public/downloads/cards-stack-slider-react.zip"),
  );
  const next = parseCanonicalZip(
    plan.get("public/downloads/cards-stack-slider-next.zip"),
  );

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

  const client = next
    .get("components/CardsStackSlider/client.ts")
    .toString("utf8");
  assert.match(client, /^"use client";\r?\n/);
  assert.equal(react.has("components/CardsStackSlider/client.ts"), false);
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
    assert.equal(archive.has("README.md"), true);
    assert.equal(archive.has("DISTRIBUTION-NOTICE.md"), true);
    for (const file of archiveManifest.files) {
      assert.equal(sha256(archive.get(file.path)), file.sha256);
    }
  }
});

test("Cards Stack Slider blocked descriptor exposes only verified repository resources", async () => {
  const { component, plan } = await loadCardsStackSliderArtifacts();
  const descriptorBytes = plan.get("public/install/cards-stack-slider.json");
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

  const ai = plan.get("public/ai/cards-stack-slider.md").toString("utf8");
  assert.match(ai, /Status: `release-blocked`/);
  assert.doesNotMatch(ai, /https?:\/\/[^\s`)]+/i);
  assert.doesNotMatch(ai, /\b(?:npx|pnpm\s+dlx)\s+bk-ui@/i);
  assert.match(ai, /function-valued CardsStackStatus children/);
});
