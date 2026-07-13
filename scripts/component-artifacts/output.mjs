import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

function outputPath(rootDir, relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.startsWith("/") ||
    relativePath.includes("\\") ||
    relativePath
      .split("/")
      .some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(`Unsafe artifact output path: ${relativePath}`);
  }
  const absolute = resolve(rootDir, relativePath);
  const fromRoot = relative(resolve(rootDir), absolute);
  if (fromRoot.startsWith("..") || resolve(rootDir, fromRoot) !== absolute) {
    throw new Error(`Artifact output escapes the repository: ${relativePath}`);
  }
  return absolute;
}

async function differs(path, expected) {
  try {
    const actual = await readFile(path);
    return !actual.equals(expected);
  } catch (error) {
    if (error.code === "ENOENT") return true;
    throw error;
  }
}

export async function applyArtifactPlan(plan, { rootDir, mode }) {
  if (mode !== "check" && mode !== "write")
    throw new Error(`Unknown artifact mode: ${mode}`);
  const changed = [];
  for (const [relativePath, bytes] of plan) {
    const absolutePath = outputPath(rootDir, relativePath);
    if (await differs(absolutePath, bytes))
      changed.push({ relativePath, absolutePath, bytes });
  }

  if (mode === "check") {
    return {
      changed: changed.map(({ relativePath }) => relativePath),
      written: [],
    };
  }

  for (const { absolutePath } of changed)
    await mkdir(dirname(absolutePath), { recursive: true });
  for (const { absolutePath, bytes } of changed)
    await writeFile(absolutePath, bytes);
  return {
    changed: changed.map(({ relativePath }) => relativePath),
    written: changed.map(({ relativePath }) => relativePath),
  };
}
