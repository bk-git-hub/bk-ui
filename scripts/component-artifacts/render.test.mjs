import assert from "node:assert/strict";
import test from "node:test";

import { sha256 } from "./canonical-json.mjs";
import { validateManifestStructure } from "./manifest.mjs";
import { renderArtifactPlan } from "./render.mjs";
import {
  parseCanonicalZip,
  sampleComponent,
  sampleManifest,
} from "./test-helpers.mjs";

function rendered(overrides) {
  const manifest = validateManifestStructure(sampleManifest(overrides), {
    manifestName: "demo.json",
  });
  return renderArtifactPlan([sampleComponent(manifest)]);
}

test("renderer produces source Registry, flat items, framework ZIPs, AI, and descriptor", () => {
  const plan = rendered();
  assert.deepEqual(
    [...plan.keys()],
    [
      "public/ai/demo.md",
      "public/downloads/demo-next.zip",
      "public/downloads/demo-react.zip",
      "public/install/demo.json",
      "public/r/demo-tailwind-v3.json",
      "public/r/demo.json",
      "registry.json",
    ],
  );

  const rootRegistry = JSON.parse(plan.get("registry.json"));
  assert.deepEqual(
    rootRegistry.items.map((item) => item.name),
    ["demo", "demo-tailwind-v3"],
  );
  const flat = JSON.parse(plan.get("public/r/demo.json"));
  assert.equal(flat.$schema, "https://ui.shadcn.com/schema/registry-item.json");
  assert.equal(flat.meta.bkUi.tailwind.major, 4);
  assert.deepEqual(flat.meta.bkUi.constraints.accessibility, [
    "Keep keyboard controls and visible focus styles.",
  ]);
  assert.match(flat.docs, /SSR and hydration constraints/);
  assert.match(flat.docs, /Accessibility constraints/);
  assert.equal(
    flat.files.some((file) => file.content.includes("Demo")),
    true,
  );

  const descriptor = JSON.parse(plan.get("public/install/demo.json"));
  assert.equal(descriptor.status, "release-blocked");
  assert.equal(descriptor.defaultVariantId, "tailwind-4");
  assert.deepEqual(
    descriptor.variants.map((variant) => variant.tailwindMajor),
    [3, 4],
  );
  assert.equal(
    descriptor.variants.some((variant) => "commands" in variant),
    false,
  );
  for (const variant of descriptor.variants) {
    for (const resource of variant.resources) {
      assert.match(resource.sha256, /^[0-9a-f]{64}$/);
      assert.equal("url" in resource, false);
    }
  }
});

test("React and Next ZIPs share exact core bytes and carry framework-specific boundaries", () => {
  const plan = rendered();
  const react = parseCanonicalZip(plan.get("public/downloads/demo-react.zip"));
  const next = parseCanonicalZip(plan.get("public/downloads/demo-next.zip"));
  assert.deepEqual(
    react.get("components/Demo/index.tsx"),
    next.get("components/Demo/index.tsx"),
  );
  assert.equal(react.has("components/Demo/client.ts"), false);
  assert.equal(next.has("components/Demo/client.ts"), true);
  assert.equal(react.has("examples/react-example.tsx"), true);
  assert.equal(next.has("examples/client-wrapper.tsx"), true);
  assert.equal(next.has("examples/page.tsx"), true);
  const nextManifest = JSON.parse(next.get("manifest.json"));
  assert.deepEqual(nextManifest.constraints.ssr, [
    "Use deterministic initial props and avoid render-time browser globals.",
  ]);
  assert.equal(nextManifest.releaseStatus, "release-blocked");
});

test("unsupported Tailwind majors emit no Registry item or install variant", () => {
  const plan = rendered({
    dependencies: { tailwind: { 3: [] } },
    tailwind: {
      supportedMajors: [4],
      3: {
        supported: false,
        reason: "A required utility is unavailable in Tailwind 3.",
      },
    },
  });
  assert.equal(plan.has("public/r/demo-tailwind-v3.json"), false);
  const rootRegistry = JSON.parse(plan.get("registry.json"));
  assert.deepEqual(
    rootRegistry.items.map((item) => item.name),
    ["demo"],
  );
  const descriptor = JSON.parse(plan.get("public/install/demo.json"));
  assert.deepEqual(
    descriptor.variants.map((variant) => variant.tailwindMajor),
    [4],
  );
  assert.match(
    plan.get("public/ai/demo.md").toString(),
    /Tailwind 3 is unsupported/,
  );
});

test("artifact rendering is deterministic and uses a one-way hash graph", () => {
  const first = rendered();
  const second = rendered();
  assert.deepEqual([...first.entries()], [...second.entries()]);

  const ai = first.get("public/ai/demo.md").toString();
  assert.doesNotMatch(ai, /bk-ui@latest|<SHA>|\{\{/);
  assert.match(ai, new RegExp(sha256(first.get("public/r/demo.json"))));
  assert.match(
    ai,
    new RegExp(sha256(first.get("public/downloads/demo-react.zip"))),
  );

  const descriptorBytes = first.get("public/install/demo.json");
  const descriptor = JSON.parse(descriptorBytes);
  assert.equal(
    JSON.stringify(descriptor).includes(sha256(descriptorBytes)),
    false,
  );
  const aiHash = sha256(first.get("public/ai/demo.md"));
  assert.equal(JSON.stringify(descriptor).includes(aiHash), true);
});
