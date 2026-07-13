import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { applyArtifactPlan } from "./output.mjs";

test("check mode is read-only and write mode becomes idempotent", async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), "bk-ui-output-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const plan = new Map([
    ["public/r/demo.json", Buffer.from("{}\n")],
    ["registry.json", Buffer.from('{"name":"bk-ui"}\n')],
  ]);

  const stale = await applyArtifactPlan(plan, { rootDir, mode: "check" });
  assert.deepEqual(stale.changed, ["public/r/demo.json", "registry.json"]);
  await assert.rejects(
    () => readFile(join(rootDir, "registry.json")),
    /ENOENT/,
  );

  const written = await applyArtifactPlan(plan, { rootDir, mode: "write" });
  assert.deepEqual(written.written, ["public/r/demo.json", "registry.json"]);
  assert.equal(
    (await readFile(join(rootDir, "registry.json"))).toString(),
    '{"name":"bk-ui"}\n',
  );

  const clean = await applyArtifactPlan(plan, { rootDir, mode: "check" });
  assert.deepEqual(clean.changed, []);
});

test("output paths cannot escape the repository", async () => {
  await assert.rejects(
    () =>
      applyArtifactPlan(new Map([["../escape", Buffer.alloc(0)]]), {
        rootDir: process.cwd(),
        mode: "check",
      }),
    /Unsafe artifact output path/,
  );
});
