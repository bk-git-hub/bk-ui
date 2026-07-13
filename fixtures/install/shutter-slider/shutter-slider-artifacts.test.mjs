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
  "registry/components/shutter-slider.json",
);

const expectedPlanPaths = [
  "public/ai/shutter-slider.md",
  "public/downloads/shutter-slider-next.zip",
  "public/downloads/shutter-slider-react.zip",
  "public/install/shutter-slider.json",
  "public/r/shutter-slider-tailwind-v3.json",
  "public/r/shutter-slider.json",
];

const expectedSourceGraph = [
  {
    source: "src/components/ShutterSlider/ShutterSlider.tsx",
    target: "@components/ShutterSlider/ShutterSlider.tsx",
    type: "registry:component",
    frameworks: ["next", "react"],
  },
  {
    source: "src/components/ShutterSlider/client.ts",
    target: "@components/ShutterSlider/client.ts",
    type: "registry:component",
    frameworks: ["next"],
  },
  {
    source: "src/components/ShutterSlider/index.ts",
    target: "@components/ShutterSlider/index.ts",
    type: "registry:component",
    frameworks: ["next", "react"],
  },
  {
    source: "src/components/ShutterSlider/useShutterSlider.ts",
    target: "@components/ShutterSlider/useShutterSlider.ts",
    type: "registry:hook",
    frameworks: ["next", "react"],
  },
];

const representativeClasses = [
  "[touch-action:pan-y]",
  "ease-[cubic-bezier(0.76,0,0.24,1)]",
  "focus-visible:ring-offset-slate-950",
  "motion-reduce:transition-none",
  "transition-[transform,opacity,filter]",
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

function assertNoFrameworkImports(source) {
  assert.doesNotMatch(source, /(?:from\s+|import\s*)["']@/);
  assert.doesNotMatch(source, /from\s+["']next\//);
}

let artifactsPromise;

function loadShutterArtifacts() {
  artifactsPromise ??= buildArtifactPlan({
    rootDir,
    manifestPaths: [manifestPath],
  }).then(({ components, plan }) => {
    assert.equal(components.length, 1);
    return { component: components[0], plan };
  });
  return artifactsPromise;
}

test("Shutter manifest pins the exact source graph and React, Next, and Tailwind contracts", async () => {
  const { component, plan } = await loadShutterArtifacts();
  const { manifest } = component;

  assert.equal(
    manifest.sourceCommit,
    "a4f7c1cdec909c9e09b2d18a3006c43f484f54f9",
  );
  assert.equal(manifest.title, "Shutter Slider");
  assert.equal(manifest.componentVersion, "0.1.0");
  assert.deepEqual(manifest.license, {
    spdx: "UNLICENSED",
    status: "pending",
  });
  assert.deepEqual(manifest.files, expectedSourceGraph);
  assert.deepEqual(manifest.entrypoints, {
    next: "src/components/ShutterSlider/client.ts",
    react: "src/components/ShutterSlider/index.ts",
  });
  assert.equal(manifest.react.range, ">=19.0.0 <20.0.0");
  assert.equal(manifest.react.tested, "19.2.7");
  assert.equal(manifest.next.tested, "16.2.10");
  assert.equal(
    manifest.next.clientBoundary,
    "src/components/ShutterSlider/client.ts",
  );
  assert.deepEqual(manifest.next.serializableProps, [
    "slides",
    "defaultValue",
    "loop",
    "stripCount",
    "orientation",
    "transitionDuration",
    "stagger",
    "dragThreshold",
    "disabled",
    "aria-label",
    "className",
  ]);

  assert.deepEqual(manifest.dependencies.common, ["clsx@^2.1.1"]);
  assert.deepEqual(manifest.dependencies.tailwind[3], ["tailwind-merge@2.6.0"]);
  assert.deepEqual(manifest.dependencies.tailwind[4], [
    "tailwind-merge@^3.3.1",
  ]);
  assert.deepEqual(manifest.tailwind.supportedMajors, [3, 4]);
  assert.deepEqual(manifest.tailwind[3], {
    supported: true,
    range: ">=3.4.0 <4.0.0",
    tested: "3.4.17",
    itemName: "shutter-slider-tailwind-v3",
    scan: "Add './components/ShutterSlider/**/*.{ts,tsx}' (or the equivalent installed path) to the content array in tailwind.config.js or tailwind.config.ts.",
    representativeClasses,
  });
  assert.deepEqual(manifest.tailwind[4], {
    supported: true,
    range: ">=4.0.0 <4.2.0",
    tested: "4.1.10",
    itemName: "shutter-slider",
    scan: "Files copied under the app source tree are detected automatically; for an external or ignored location, add a stylesheet-relative @source directive for './components/ShutterSlider' to the global Tailwind stylesheet.",
    representativeClasses,
  });

  const plannedPaths = [...plan.keys()];
  assert.deepEqual(plannedPaths, expectedPlanPaths);
  const allowlist = new Set(expectedPlanPaths);
  for (const path of plannedPaths.filter((path) =>
    path.includes("shutter-slider"),
  )) {
    assert.ok(allowlist.has(path), `Unexpected Shutter artifact path: ${path}`);
  }
  assert.equal(
    plannedPaths.filter((path) => path.includes("shutter-slider")).length,
    expectedPlanPaths.length,
  );

  for (const [name, source] of Object.entries(manifest.examples)) {
    assertTsxSyntax(source, `${name}.tsx`);
    assertNoFrameworkImports(source);
  }
  assert.match(manifest.examples.nextClient, /^"use client";/);

  const source = component.files
    .map((file) => file.content.toString("utf8"))
    .join("\n");
  assertNoFrameworkImports(source);
  for (const utility of representativeClasses) {
    assert.match(
      source,
      new RegExp(utility.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("Shutter Registry items preserve source bytes, compatibility, and constraints", async () => {
  const { component, plan } = await loadShutterArtifacts();
  const variants = [
    {
      path: "public/r/shutter-slider-tailwind-v3.json",
      name: "shutter-slider-tailwind-v3",
      major: 3,
      tested: "3.4.17",
      dependencies: ["clsx@^2.1.1", "tailwind-merge@2.6.0"],
    },
    {
      path: "public/r/shutter-slider.json",
      name: "shutter-slider",
      major: 4,
      tested: "4.1.10",
      dependencies: ["clsx@^2.1.1", "tailwind-merge@^3.3.1"],
    },
  ];

  for (const variant of variants) {
    const item = JSON.parse(plan.get(variant.path));
    assert.equal(item.name, variant.name);
    assert.equal(item.meta.bkUi.sourceCommit, component.manifest.sourceCommit);
    assert.equal(item.meta.bkUi.tailwind.major, variant.major);
    assert.equal(item.meta.bkUi.tailwind.tested, variant.tested);
    assert.deepEqual(item.dependencies, variant.dependencies);
    assert.deepEqual(
      item.meta.bkUi.entrypoints,
      component.manifest.entrypoints,
    );
    assert.deepEqual(item.meta.bkUi.react, component.manifest.react);
    assert.deepEqual(item.meta.bkUi.next, component.manifest.next);
    assert.deepEqual(item.meta.bkUi.license, component.manifest.license);
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
      assertNoFrameworkImports(registryFile.content);
    }
  }
});

test("Shutter React and Next ZIPs share core bytes and isolate the client boundary", async () => {
  const { component, plan } = await loadShutterArtifacts();
  const react = parseCanonicalZip(
    plan.get("public/downloads/shutter-slider-react.zip"),
  );
  const next = parseCanonicalZip(
    plan.get("public/downloads/shutter-slider-next.zip"),
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

  const client = next.get("components/ShutterSlider/client.ts");
  assert.equal(
    client.toString("utf8"),
    '"use client";\n\nexport * from "./index";\n',
  );
  assert.equal(react.has("components/ShutterSlider/client.ts"), false);
  assert.equal(react.has("examples/react-example.tsx"), true);
  assert.equal(next.has("examples/client-wrapper.tsx"), true);
  assert.equal(next.has("examples/page.tsx"), true);

  for (const [archive, framework, entrypoint] of [
    [react, "react", component.manifest.entrypoints.react],
    [next, "next", component.manifest.entrypoints.next],
  ]) {
    const archiveManifest = JSON.parse(archive.get("manifest.json"));
    assert.equal(archiveManifest.releaseStatus, "release-blocked");
    assert.equal(archiveManifest.framework, framework);
    assert.equal(archiveManifest.entrypoint, entrypoint);
    assert.equal(archiveManifest.sourceCommit, component.manifest.sourceCommit);
    assert.deepEqual(
      archiveManifest.constraints,
      component.manifest.constraints,
    );
    for (const file of archiveManifest.files) {
      assert.equal(sha256(archive.get(file.path)), file.sha256);
    }
  }
});

test("Shutter blocked descriptor and AI copy expose only verified repository resources", async () => {
  const { component, plan } = await loadShutterArtifacts();
  const descriptorBytes = plan.get("public/install/shutter-slider.json");
  const descriptorText = descriptorBytes.toString("utf8");
  const descriptor = JSON.parse(descriptorBytes);

  assert.equal(descriptor.status, "release-blocked");
  assert.equal(descriptor.sourceCommit, component.manifest.sourceCommit);
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

  const ai = plan.get("public/ai/shutter-slider.md").toString("utf8");
  assert.match(ai, /Status: `release-blocked`/);
  assert.match(ai, new RegExp(component.manifest.sourceCommit));
  assert.doesNotMatch(ai, /https?:\/\/[^\s`)]+/i);
  assert.doesNotMatch(ai, /\b(?:npx|pnpm\s+dlx)\s+bk-ui@/i);
  assert.match(
    ai,
    /matchMedia, animation frames, and timers are read only after hydration/,
  );

  for (const path of expectedPlanPaths.filter(
    (path) => path.includes("/downloads/") || path.includes("/r/"),
  )) {
    assert.match(ai, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(ai, new RegExp(sha256(plan.get(path))));
  }
});
