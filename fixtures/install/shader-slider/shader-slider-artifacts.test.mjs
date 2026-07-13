import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { sha256 } from "../../../scripts/component-artifacts/canonical-json.mjs";
import { buildArtifactPlan } from "../../../scripts/component-artifacts/generate.mjs";
import { parseCanonicalZip } from "../../../scripts/component-artifacts/test-helpers.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const manifestPath = resolve(
  rootDir,
  "registry/components/shader-slider.json",
);

const expectedPlanPaths = [
  "public/ai/shader-slider.md",
  "public/downloads/shader-slider-next.zip",
  "public/downloads/shader-slider-react.zip",
  "public/install/shader-slider.json",
  "public/r/shader-slider-tailwind-v3.json",
  "public/r/shader-slider.json",
];

const targetToArchivePath = (target) =>
  `components/${target.slice("@components/".length)}`;

async function loadShaderSliderArtifacts() {
  const { components, plan } = await buildArtifactPlan({
    rootDir,
    manifestPaths: [manifestPath],
  });
  assert.equal(components.length, 1);
  return { component: components[0], plan };
}

test("Shader Slider manifest pins the exact shared core and both Tailwind variants", async () => {
  const { component, plan } = await loadShaderSliderArtifacts();
  const { manifest } = component;

  assert.equal(
    manifest.sourceCommit,
    "9abab5bafae37adc13716b6072b6280c8b82f4f4",
  );
  assert.deepEqual(manifest.tailwind.supportedMajors, [3, 4]);
  assert.deepEqual(manifest.dependencies.common, ["clsx@^2.1.1"]);
  assert.deepEqual(manifest.dependencies.tailwind[3], [
    "tailwind-merge@2.6.0",
  ]);
  assert.deepEqual(manifest.dependencies.tailwind[4], [
    "tailwind-merge@^3.3.1",
  ]);
  assert.equal(manifest.react.tested, "19.2.7");
  assert.equal(manifest.next.tested, "16.2.10");
  assert.equal(
    manifest.next.clientBoundary,
    "src/components/ShaderSlider/client.ts",
  );
  assert.deepEqual([...plan.keys()], expectedPlanPaths);

  const representativeClasses = [
    "[touch-action:pan-y]",
    "focus-visible:ring-sky-400",
    "motion-reduce:transition-none",
    "select-none",
    "transition-[opacity,transform]",
  ];
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
  assert.doesNotMatch(source, /from\s+["'](?:@\/|next\/)/);
});

test("Shader Slider Registry items preserve exact source and compatibility metadata", async () => {
  const { component, plan } = await loadShaderSliderArtifacts();
  const variants = [
    {
      path: "public/r/shader-slider-tailwind-v3.json",
      major: 3,
      tested: "3.4.19",
      dependencies: ["clsx@^2.1.1", "tailwind-merge@2.6.0"],
    },
    {
      path: "public/r/shader-slider.json",
      major: 4,
      tested: "4.3.2",
      dependencies: ["clsx@^2.1.1", "tailwind-merge@^3.3.1"],
    },
  ];

  for (const variant of variants) {
    const item = JSON.parse(plan.get(variant.path));
    assert.equal(item.$schema, "https://ui.shadcn.com/schema/registry-item.json");
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
      assert.ok(registryFile, `Missing ${sourceFile.source} from ${variant.path}`);
      assert.deepEqual(
        Buffer.from(registryFile.content, "utf8"),
        sourceFile.content,
      );
    }
  }
});

test("Shader Slider React and Next ZIPs share core bytes and isolate the client boundary", async () => {
  const { component, plan } = await loadShaderSliderArtifacts();
  const react = parseCanonicalZip(
    plan.get("public/downloads/shader-slider-react.zip"),
  );
  const next = parseCanonicalZip(
    plan.get("public/downloads/shader-slider-next.zip"),
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
    .get("components/ShaderSlider/client.ts")
    .toString("utf8");
  assert.match(client, /^['"]use client['"];\r?\n/);
  assert.equal(react.has("components/ShaderSlider/client.ts"), false);
  assert.equal(react.has("examples/react-example.tsx"), true);
  assert.equal(next.has("examples/client-wrapper.tsx"), true);
  assert.equal(next.has("examples/page.tsx"), true);

  const reactExample = react.get("examples/react-example.tsx").toString("utf8");
  const nextClient = next.get("examples/client-wrapper.tsx").toString("utf8");
  const nextServer = next.get("examples/page.tsx").toString("utf8");
  for (const example of [reactExample, nextClient, nextServer]) {
    assert.doesNotMatch(example, /from\s+["']@\//);
  }
  assert.match(nextClient, /^"use client";/);
  assert.match(nextClient, /from "\.\.\/components\/ShaderSlider\/client"/);
  assert.match(nextServer, /from "\.\/client-wrapper"/);

  for (const archive of [react, next]) {
    assert.equal(archive.has("README.md"), true);
    assert.equal(archive.has("DISTRIBUTION-NOTICE.md"), true);
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

test("Shader Slider blocked descriptor exposes repository paths with verified hashes", async () => {
  const { component, plan } = await loadShaderSliderArtifacts();
  const descriptorBytes = plan.get("public/install/shader-slider.json");
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

  const ai = plan.get("public/ai/shader-slider.md").toString("utf8");
  assert.match(ai, /Status: `release-blocked`/);
  assert.doesNotMatch(ai, /https?:\/\/[^\s`)]+/i);
  assert.doesNotMatch(ai, /\b(?:npx|pnpm\s+dlx)\s+bk-ui@/i);
  assert.match(ai, /same-origin texture URLs or CORS headers/i);
  assert.match(ai, /mount-gated Client Component wrapper/i);
});

test("checked-in Shader Slider artifacts exactly match the deterministic plan", async () => {
  const { plan } = await loadShaderSliderArtifacts();

  for (const [relativePath, expected] of plan) {
    assert.deepEqual(
      await readFile(resolve(rootDir, relativePath)),
      expected,
      `${relativePath} is stale`,
    );
  }
});
