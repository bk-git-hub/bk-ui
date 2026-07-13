import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { compareUtf8, sha256 } from "./canonical-json.mjs";
import { loadManifests } from "./manifest.mjs";
import { applyArtifactPlan } from "./output.mjs";
import { renderArtifactPlan } from "./render.mjs";

export const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

async function defaultManifestPaths(rootDir) {
  const directory = resolve(rootDir, "registry/components");
  let names;
  try {
    names = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return names
    .filter((name) => name.endsWith(".json"))
    .sort(compareUtf8)
    .map((name) => resolve(directory, name));
}

export async function buildArtifactPlan({
  rootDir = repositoryRoot,
  manifestPaths,
  verifyGit = true,
} = {}) {
  const paths = manifestPaths ?? (await defaultManifestPaths(rootDir));
  if (paths.length === 0) throw new Error("No component manifests were found");
  const components = await loadManifests(paths, { rootDir, verifyGit });
  return { components, plan: renderArtifactPlan(components) };
}

export async function runGenerator({
  rootDir = repositoryRoot,
  manifestPaths,
  mode = "check",
  verifyGit = true,
} = {}) {
  const { components, plan } = await buildArtifactPlan({
    rootDir,
    manifestPaths,
    verifyGit,
  });
  const result = await applyArtifactPlan(plan, { rootDir, mode });
  return {
    components: components.map(({ manifest }) => manifest.name),
    artifacts: [...plan.entries()].map(([path, bytes]) => ({
      path,
      sha256: sha256(bytes),
    })),
    ...result,
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      check: { type: "boolean" },
      write: { type: "boolean" },
      manifest: { type: "string", multiple: true },
    },
    strict: true,
  });
  if (values.check && values.write)
    throw new Error("Choose either --check or --write");
  const mode = values.write ? "write" : "check";
  const manifestPaths = values.manifest?.map((path) =>
    resolve(repositoryRoot, path),
  );
  const result = await runGenerator({ mode, manifestPaths });
  if (mode === "check" && result.changed.length > 0) {
    console.error(
      `Generated artifacts are stale:\n${result.changed.map((path) => `- ${path}`).join("\n")}`,
    );
    process.exitCode = 1;
    return;
  }
  const action = mode === "write" ? "Generated" : "Verified";
  console.log(
    `${action} ${result.artifacts.length} artifacts for ${result.components.join(", ")}.`,
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
