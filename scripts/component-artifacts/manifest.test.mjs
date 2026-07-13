import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadManifest, validateManifestStructure } from "./manifest.mjs";
import { sampleManifest } from "./test-helpers.mjs";

test("manifest structure normalizes a supported Tailwind 3/4 contract", () => {
  const manifest = validateManifestStructure(sampleManifest(), {
    manifestName: "demo.json",
  });
  assert.deepEqual(manifest.tailwind.supportedMajors, [3, 4]);
  assert.equal(manifest.tailwind[3].tested, "3.4.17");
  assert.equal(manifest.tailwind[4].itemName, "demo");
  assert.deepEqual(manifest.constraints.ssr, [
    "Use deterministic initial props and avoid render-time browser globals.",
  ]);
});

test("manifest structure permits an honest unsupported major and omits its dependencies", () => {
  const manifest = validateManifestStructure(
    sampleManifest({
      dependencies: { tailwind: { 3: [] } },
      tailwind: {
        supportedMajors: [4],
        3: {
          supported: false,
          reason: "Tailwind 3 does not emit a required utility.",
        },
      },
    }),
    { manifestName: "demo.json" },
  );
  assert.deepEqual(manifest.tailwind.supportedMajors, [4]);
  assert.equal(manifest.tailwind[3].supported, false);
});

test("manifest structure rejects ambiguous paths, host dependencies, and self-approved licenses", () => {
  assert.throws(
    () =>
      validateManifestStructure(
        sampleManifest({
          files: [
            {
              ...sampleManifest().files[0],
              target: "@components/../escape.ts",
            },
          ],
        }),
        { manifestName: "demo.json" },
      ),
    /unsafe|canonical/,
  );
  assert.throws(
    () =>
      validateManifestStructure(
        sampleManifest({ dependencies: { common: ["react@19.2.7"] } }),
        {
          manifestName: "demo.json",
        },
      ),
    /host requirement/,
  );
  assert.throws(
    () =>
      validateManifestStructure(
        sampleManifest({ license: { spdx: "MIT", status: "approved" } }),
        { manifestName: "demo.json" },
      ),
    /UNLICENSED\/pending/,
  );
  assert.throws(
    () =>
      validateManifestStructure(
        sampleManifest({
          tailwind: {
            supportedMajors: [4],
            3: { supported: false, reason: "Unsupported." },
          },
        }),
        { manifestName: "demo.json" },
      ),
    /must be empty/,
  );
  assert.throws(
    () =>
      validateManifestStructure(
        sampleManifest({
          files: sampleManifest().files.map((file, index) =>
            index === 0 ? { ...file, frameworks: ["react"] } : file,
          ),
        }),
        { manifestName: "demo.json" },
      ),
    /shared byte-for-byte/,
  );
});

async function createGitFixture(t, { indexSource, clientSource } = {}) {
  const rootDir = await mkdtemp(join(tmpdir(), "bk-ui-manifest-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const componentDir = join(rootDir, "src/components/Demo");
  const manifestDir = join(rootDir, "registry/components");
  await mkdir(componentDir, { recursive: true });
  await mkdir(manifestDir, { recursive: true });
  await writeFile(
    join(componentDir, "index.tsx"),
    indexSource ??
      '\"use client\";\n\nimport { clsx } from "clsx";\nexport * from "./useDemo";\nexport function Demo() { return <div className={clsx("p-4")}>Demo</div>; }\n',
  );
  await writeFile(
    join(componentDir, "useDemo.ts"),
    'import { useState } from "react";\nexport function useDemo() { return useState(false); }\n',
  );
  await writeFile(
    join(componentDir, "client.ts"),
    clientSource ?? '\"use client\";\n\nexport * from "./index";\n',
  );
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf8",
      windowsHide: true,
    }).trim();
  git("init", "-q");
  git("config", "user.email", "fixture@example.com");
  git("config", "user.name", "Fixture");
  git("config", "core.autocrlf", "false");
  git("remote", "add", "origin", "https://github.com/bk-git-hub/bk-ui.git");
  git("add", "src/components/Demo");
  git("-c", "commit.gpgsign=false", "commit", "-qm", "fixture");
  const sourceCommit = git("rev-parse", "HEAD");
  const files = [
    {
      source: "src/components/Demo/index.tsx",
      target: "@components/Demo/index.tsx",
      type: "registry:component",
      frameworks: ["react", "next"],
    },
    {
      source: "src/components/Demo/useDemo.ts",
      target: "@components/Demo/useDemo.ts",
      type: "registry:hook",
      frameworks: ["react", "next"],
    },
    {
      source: "src/components/Demo/client.ts",
      target: "@components/Demo/client.ts",
      type: "registry:component",
      frameworks: ["next"],
    },
  ];
  const manifest = sampleManifest({
    sourceCommit,
    files,
    dependencies: { tailwind: { 3: [], 4: [] } },
  });
  const manifestPath = join(manifestDir, "demo.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { rootDir, manifestPath, componentDir };
}

test("loadManifest reads pinned regular Git blobs and detects a dirty source", async (t) => {
  const fixture = await createGitFixture(t);
  const loaded = await loadManifest(fixture.manifestPath, {
    rootDir: fixture.rootDir,
  });
  assert.equal(loaded.files.length, 3);
  assert.match(loaded.files[0].sha256, /^[0-9a-f]{64}$/);

  await writeFile(
    join(fixture.componentDir, "index.tsx"),
    "export const changed = true;\n",
  );
  await assert.rejects(
    () => loadManifest(fixture.manifestPath, { rootDir: fixture.rootDir }),
    /working-tree content differs/,
  );
});

test("loadManifest rejects aliases, next runtime imports, and a missing client boundary", async (t) => {
  await t.test("alias", async (t) => {
    const fixture = await createGitFixture(t, {
      indexSource:
        'import { helper } from "@/helper";\nexport const Demo = helper;\n',
    });
    await assert.rejects(
      () => loadManifest(fixture.manifestPath, { rootDir: fixture.rootDir }),
      /alias import/,
    );
  });
  await t.test("next import", async (t) => {
    const fixture = await createGitFixture(t, {
      indexSource: 'import Link from "next/link";\nexport const Demo = Link;\n',
    });
    await assert.rejects(
      () => loadManifest(fixture.manifestPath, { rootDir: fixture.rootDir }),
      /must not import next/,
    );
  });
  await t.test("client directive", async (t) => {
    const fixture = await createGitFixture(t, {
      clientSource: 'export * from "./index";\n',
    });
    await assert.rejects(
      () => loadManifest(fixture.manifestPath, { rootDir: fixture.rootDir }),
      /must begin with an exact 'use client'/,
    );
  });
});
