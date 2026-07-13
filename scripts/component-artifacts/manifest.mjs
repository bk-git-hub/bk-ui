import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { posix } from "node:path";
import ts from "typescript";

import { compareUtf8, sha256 } from "./canonical-json.mjs";

const MANIFEST_SCHEMA = "../schema/component-manifest.schema.json";
const MANIFEST_KEYS = [
  "$schema",
  "schemaVersion",
  "name",
  "title",
  "componentVersion",
  "description",
  "repository",
  "sourceCommit",
  "license",
  "react",
  "next",
  "files",
  "dependencies",
  "entrypoints",
  "tailwind",
  "constraints",
  "examples",
];
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FULL_SHA = /^[0-9a-f]{40}$/;
const SAFE_PATH_SEGMENT = /^[A-Za-z0-9_.-]+$/;
const DEPENDENCY =
  /^((?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*))@([~^]?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;
const HOST_PACKAGES = new Set(["next", "react", "react-dom", "tailwindcss"]);
const MAX_MANIFEST_BYTES = 256 * 1024;
const MAX_SOURCE_BYTES = 1024 * 1024;

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function objectAt(value, path, keys) {
  if (!isPlainObject(value)) fail(path, "must be an object");
  const actual = Object.keys(value).sort(compareUtf8);
  const expected = [...keys].sort(compareUtf8);
  if (actual.join("\0") !== expected.join("\0")) {
    fail(path, `expected exactly these fields: ${expected.join(", ")}`);
  }
  return value;
}

function nonEmptyString(value, path, maxLength = 4096) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maxLength ||
    /[\0\r]/.test(value)
  ) {
    fail(
      path,
      `must be a non-empty LF-only string of at most ${maxLength} characters`,
    );
  }
  return value;
}

function exactArray(value, path, { min = 0, max = 100 } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    fail(path, `must contain between ${min} and ${max} items`);
  }
  return value;
}

function uniqueStrings(values, path) {
  const seen = new Set();
  for (const [index, value] of values.entries()) {
    nonEmptyString(value, `${path}[${index}]`);
    const key = value.toLowerCase();
    if (seen.has(key)) fail(path, `contains a duplicate value: ${value}`);
    seen.add(key);
  }
}

function safeRelativePath(value, path) {
  nonEmptyString(value, path, 512);
  if (
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[A-Za-z]:/.test(value)
  ) {
    fail(path, "must be a POSIX repo-relative path");
  }
  const segments = value.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        !SAFE_PATH_SEGMENT.test(segment),
    ) ||
    posix.normalize(value) !== value
  ) {
    fail(path, "contains an unsafe or non-canonical path segment");
  }
  return value;
}

function safeTarget(value, path) {
  nonEmptyString(value, path, 512);
  if (!value.startsWith("@components/")) {
    fail(path, "must start with the @components/ placeholder");
  }
  safeRelativePath(value.slice("@components/".length), path);
  if (value.slice("@components/".length).includes("@")) {
    fail(path, "contains an embedded placeholder");
  }
  return value;
}

function semver(value, path) {
  nonEmptyString(value, path, 128);
  if (!SEMVER.test(value)) fail(path, "must be a valid SemVer version");
  return value;
}

function validateRepository(value, path) {
  nonEmptyString(value, path, 256);
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(path, "must be a valid URL");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(url.pathname)
  ) {
    fail(
      path,
      "must be an HTTPS github.com owner/repository URL without credentials or a suffix",
    );
  }
  return value.replace(/\.git$/, "").replace(/\/$/, "");
}

function repositoryFromOrigin(rootDir) {
  const origin = runGit(rootDir, ["config", "--get", "remote.origin.url"], {
    encoding: "utf8",
  }).trim();
  const match = origin.match(
    /^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/,
  );
  if (!match)
    fail("git remote.origin.url", "must point to a GitHub repository");
  return `https://github.com/${match[1]}`;
}

function validateDependencyList(value, path) {
  const dependencies = exactArray(value, path, { max: 50 });
  uniqueStrings(dependencies, path);
  const packages = new Map();
  for (const [index, dependency] of dependencies.entries()) {
    const match = dependency.match(DEPENDENCY);
    if (!match) {
      fail(
        `${path}[${index}]`,
        "must be an npm package with an explicit safe SemVer version or range",
      );
    }
    const [, packageName, version] = match;
    if (HOST_PACKAGES.has(packageName)) {
      fail(
        `${path}[${index}]`,
        `${packageName} is a host requirement, not an installed dependency`,
      );
    }
    if (packages.has(packageName))
      fail(path, `contains ${packageName} more than once`);
    packages.set(packageName, version);
  }
  return packages;
}

function validateTailwindMajor(value, path, major, componentName) {
  if (!isPlainObject(value) || typeof value.supported !== "boolean") {
    fail(path, "must declare supported as true or false");
  }

  if (!value.supported) {
    objectAt(value, path, ["supported", "reason"]);
    nonEmptyString(value.reason, `${path}.reason`, 512);
    return { supported: false, reason: value.reason };
  }

  objectAt(value, path, [
    "supported",
    "range",
    "tested",
    "itemName",
    "scan",
    "representativeClasses",
  ]);
  nonEmptyString(value.range, `${path}.range`, 128);
  semver(value.tested, `${path}.tested`);
  if (Number(value.tested.split(".")[0]) !== major) {
    fail(`${path}.tested`, `must be a Tailwind ${major} release`);
  }
  if (!SLUG.test(value.itemName))
    fail(`${path}.itemName`, "must be a kebab-case slug");
  const expectedItemName =
    major === 4 ? componentName : `${componentName}-tailwind-v3`;
  if (value.itemName !== expectedItemName) {
    fail(`${path}.itemName`, `must be ${expectedItemName}`);
  }
  nonEmptyString(value.scan, `${path}.scan`, 2048);
  const representativeClasses = exactArray(
    value.representativeClasses,
    `${path}.representativeClasses`,
    {
      min: 1,
      max: 20,
    },
  );
  uniqueStrings(representativeClasses, `${path}.representativeClasses`);
  return {
    ...value,
    representativeClasses: [...representativeClasses].sort(compareUtf8),
  };
}

function runGit(rootDir, args, { encoding } = {}) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) {
    const detail = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString("utf8").trim()
      : String(result.stderr ?? "").trim();
    throw new Error(`git ${args[0]} failed${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout;
}

function assertCommit(rootDir, sourceCommit) {
  const type = runGit(rootDir, ["cat-file", "-t", sourceCommit], {
    encoding: "utf8",
  }).trim();
  if (type !== "commit") fail("sourceCommit", "must resolve to a Git commit");
  const ancestor = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", sourceCommit, "HEAD"],
    {
      cwd: rootDir,
      windowsHide: true,
    },
  );
  if (ancestor.status !== 0)
    fail("sourceCommit", "must be an ancestor of the current HEAD");
}

function readPinnedSource(rootDir, sourceCommit, sourcePath) {
  const tree = runGit(rootDir, [
    "ls-tree",
    "-z",
    sourceCommit,
    "--",
    sourcePath,
  ]);
  const record = tree.toString("utf8").replace(/\0$/, "");
  const match = record.match(/^([0-7]{6}) (blob) ([0-9a-f]{40})\t(.+)$/);
  if (!match || match[4] !== sourcePath) {
    fail(
      `files.${sourcePath}`,
      "does not resolve to one regular blob at sourceCommit",
    );
  }
  if (match[1] !== "100644")
    fail(`files.${sourcePath}`, "must have Git mode 100644");

  const content = runGit(rootDir, ["cat-file", "blob", match[3]]);
  if (content.length > MAX_SOURCE_BYTES) {
    fail(`files.${sourcePath}`, `exceeds ${MAX_SOURCE_BYTES} bytes`);
  }
  return { blobSha: match[3], content, sha256: sha256(content) };
}

function assertWorkingTreeMatches(rootDir, sourcePath, blobSha) {
  let working;
  try {
    working = runGit(
      rootDir,
      ["hash-object", `--path=${sourcePath}`, sourcePath],
      {
        encoding: "utf8",
      },
    ).trim();
  } catch {
    fail(`files.${sourcePath}`, "is missing from the working tree");
  }
  if (working !== blobSha) {
    fail(
      `files.${sourcePath}`,
      "working-tree content differs from the pinned sourceCommit blob",
    );
  }
}

function packageNameFromSpecifier(specifier) {
  if (specifier.startsWith("@"))
    return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

function importSpecifiers(sourceFile) {
  const specifiers = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

function resolveInternalImport(sourcePath, specifier, knownSources) {
  const base = posix.normalize(
    posix.join(posix.dirname(sourcePath), specifier),
  );
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.css`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ];
  return candidates.find((candidate) => knownSources.has(candidate));
}

function assertImports(record, knownSources, declaredPackages) {
  const usedPackages = new Set();
  if (!/\.(?:ts|tsx)$/.test(record.source)) return usedPackages;
  const scriptKind = record.source.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    record.source,
    record.content.toString("utf8"),
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  for (const specifier of importSpecifiers(sourceFile)) {
    if (specifier.startsWith(".")) {
      if (!resolveInternalImport(record.source, specifier, knownSources)) {
        fail(
          `files.${record.source}`,
          `cannot resolve relative import ${specifier} inside the manifest graph`,
        );
      }
      continue;
    }
    if (
      specifier.startsWith("/") ||
      specifier.startsWith("@/") ||
      specifier.startsWith("~/")
    ) {
      fail(
        `files.${record.source}`,
        `uses unsupported alias import ${specifier}`,
      );
    }
    const packageName = packageNameFromSpecifier(specifier);
    if (packageName === "next") {
      fail(`files.${record.source}`, "must not import next or next/*");
    }
    if (packageName !== "react" && !declaredPackages.has(packageName)) {
      fail(
        `files.${record.source}`,
        `imports undeclared package ${packageName}`,
      );
    }
    if (packageName !== "react") usedPackages.add(packageName);
  }
  return usedPackages;
}

function assertClientBoundary(record) {
  const sourceFile = ts.createSourceFile(
    record.source,
    record.content.toString("utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const first = sourceFile.statements[0];
  if (
    !first ||
    !ts.isExpressionStatement(first) ||
    !ts.isStringLiteral(first.expression) ||
    first.expression.text !== "use client"
  ) {
    fail(
      `files.${record.source}`,
      "must begin with an exact 'use client' directive",
    );
  }
  const hasRelativeExport = sourceFile.statements.some(
    (statement) =>
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith("."),
  );
  if (!hasRelativeExport) {
    fail(
      `files.${record.source}`,
      "must re-export the common core through a relative path",
    );
  }
}

export function validateManifestStructure(manifest, { manifestName } = {}) {
  objectAt(manifest, "manifest", MANIFEST_KEYS);
  if (manifest.$schema !== MANIFEST_SCHEMA)
    fail("$schema", `must be ${MANIFEST_SCHEMA}`);
  if (manifest.schemaVersion !== 1) fail("schemaVersion", "must be 1");
  if (!SLUG.test(manifest.name)) fail("name", "must be a kebab-case slug");
  if (manifestName && manifestName !== `${manifest.name}.json`) {
    fail("name", `must match manifest filename ${manifestName}`);
  }
  nonEmptyString(manifest.title, "title", 128);
  semver(manifest.componentVersion, "componentVersion");
  nonEmptyString(manifest.description, "description", 1024);
  manifest.repository = validateRepository(manifest.repository, "repository");
  if (!FULL_SHA.test(manifest.sourceCommit))
    fail("sourceCommit", "must be a lowercase full 40-character SHA");

  objectAt(manifest.license, "license", ["spdx", "status"]);
  if (
    manifest.license.spdx !== "UNLICENSED" ||
    manifest.license.status !== "pending"
  ) {
    fail(
      "license",
      "must remain UNLICENSED/pending until a separate approved release receipt exists",
    );
  }

  objectAt(manifest.react, "react", ["range", "tested"]);
  nonEmptyString(manifest.react.range, "react.range", 128);
  semver(manifest.react.tested, "react.tested");
  objectAt(manifest.next, "next", [
    "tested",
    "clientBoundary",
    "serializableProps",
  ]);
  semver(manifest.next.tested, "next.tested");
  safeRelativePath(manifest.next.clientBoundary, "next.clientBoundary");
  const serializableProps = exactArray(
    manifest.next.serializableProps,
    "next.serializableProps",
    {
      min: 1,
      max: 30,
    },
  );
  uniqueStrings(serializableProps, "next.serializableProps");

  const files = exactArray(manifest.files, "files", { min: 1, max: 50 });
  const sourceKeys = new Set();
  const targetKeys = new Set();
  let componentDirectory;
  const normalizedFiles = files.map((file, index) => {
    const path = `files[${index}]`;
    objectAt(file, path, ["source", "target", "type", "frameworks"]);
    safeRelativePath(file.source, `${path}.source`);
    if (
      !file.source.startsWith("src/components/") ||
      file.source.startsWith("src/components/previews/")
    ) {
      fail(
        `${path}.source`,
        "must be inside one canonical src/components/<Component> core directory",
      );
    }
    const directory = file.source.split("/").slice(0, 3).join("/");
    componentDirectory ??= directory;
    if (directory !== componentDirectory)
      fail(`${path}.source`, `must stay inside ${componentDirectory}`);
    safeTarget(file.target, `${path}.target`);
    const sourceKey = file.source.toLowerCase();
    const targetKey = file.target.toLowerCase();
    if (sourceKeys.has(sourceKey))
      fail(`${path}.source`, "duplicates another source path");
    if (targetKeys.has(targetKey))
      fail(`${path}.target`, "duplicates another target path");
    sourceKeys.add(sourceKey);
    targetKeys.add(targetKey);
    if (
      ![
        "registry:component",
        "registry:hook",
        "registry:lib",
        "registry:file",
      ].includes(file.type)
    ) {
      fail(`${path}.type`, "is not a supported shadcn Registry file type");
    }
    const frameworks = exactArray(file.frameworks, `${path}.frameworks`, {
      min: 1,
      max: 2,
    });
    if (
      frameworks.some((framework) => !["react", "next"].includes(framework))
    ) {
      fail(`${path}.frameworks`, "may contain only react and next");
    }
    uniqueStrings(frameworks, `${path}.frameworks`);
    if (frameworks.includes("react") && !frameworks.includes("next")) {
      fail(
        `${path}.frameworks`,
        "React core files must be shared byte-for-byte with Next.js",
      );
    }
    if (
      !frameworks.includes("react") &&
      file.source !== manifest.next.clientBoundary
    ) {
      fail(
        `${path}.frameworks`,
        "the client boundary is the only permitted Next-only source file",
      );
    }
    return { ...file, frameworks: [...frameworks].sort(compareUtf8) };
  });

  objectAt(manifest.dependencies, "dependencies", ["common", "tailwind"]);
  objectAt(manifest.dependencies.tailwind, "dependencies.tailwind", ["3", "4"]);
  const commonDependencies = validateDependencyList(
    manifest.dependencies.common,
    "dependencies.common",
  );
  const majorDependencies = {
    3: validateDependencyList(
      manifest.dependencies.tailwind["3"],
      "dependencies.tailwind.3",
    ),
    4: validateDependencyList(
      manifest.dependencies.tailwind["4"],
      "dependencies.tailwind.4",
    ),
  };
  for (const major of [3, 4]) {
    for (const packageName of majorDependencies[major].keys()) {
      if (commonDependencies.has(packageName)) {
        fail(
          `dependencies.tailwind.${major}`,
          `${packageName} conflicts with dependencies.common`,
        );
      }
    }
  }

  objectAt(manifest.entrypoints, "entrypoints", ["react", "next"]);
  safeRelativePath(manifest.entrypoints.react, "entrypoints.react");
  safeRelativePath(manifest.entrypoints.next, "entrypoints.next");
  const fileBySource = new Map(
    normalizedFiles.map((file) => [file.source, file]),
  );
  if (
    !fileBySource.get(manifest.entrypoints.react)?.frameworks.includes("react")
  ) {
    fail("entrypoints.react", "must reference a declared React file");
  }
  if (
    !fileBySource.get(manifest.entrypoints.next)?.frameworks.includes("next")
  ) {
    fail("entrypoints.next", "must reference a declared Next.js file");
  }
  if (manifest.next.clientBoundary !== manifest.entrypoints.next) {
    fail("next.clientBoundary", "must equal entrypoints.next");
  }

  objectAt(manifest.tailwind, "tailwind", ["supportedMajors", "3", "4"]);
  const supportedMajors = exactArray(
    manifest.tailwind.supportedMajors,
    "tailwind.supportedMajors",
    {
      min: 1,
      max: 2,
    },
  );
  if (
    supportedMajors.some((major) => major !== 3 && major !== 4) ||
    [...supportedMajors].sort().join(",") !== supportedMajors.join(",") ||
    new Set(supportedMajors).size !== supportedMajors.length
  ) {
    fail(
      "tailwind.supportedMajors",
      "must be an ordered unique subset of [3, 4]",
    );
  }
  const tailwind = {
    supportedMajors: [...supportedMajors],
    3: validateTailwindMajor(
      manifest.tailwind["3"],
      "tailwind.3",
      3,
      manifest.name,
    ),
    4: validateTailwindMajor(
      manifest.tailwind["4"],
      "tailwind.4",
      4,
      manifest.name,
    ),
  };
  for (const major of [3, 4]) {
    const isListed = supportedMajors.includes(major);
    if (tailwind[major].supported !== isListed) {
      fail(
        `tailwind.${major}.supported`,
        "must agree with tailwind.supportedMajors",
      );
    }
    if (!isListed && majorDependencies[major].size > 0) {
      fail(
        `dependencies.tailwind.${major}`,
        "must be empty when that Tailwind major is unsupported",
      );
    }
    const mergeVersion = majorDependencies[major].get("tailwind-merge");
    if (isListed && mergeVersion) {
      const expected = major === 3 ? "2.6.0" : "^3.3.1";
      if (mergeVersion !== expected) {
        fail(
          `dependencies.tailwind.${major}`,
          `tailwind-merge must use ${expected} for Tailwind ${major}`,
        );
      }
    }
  }

  objectAt(manifest.constraints, "constraints", ["ssr", "accessibility"]);
  const constraints = {};
  for (const key of ["ssr", "accessibility"]) {
    constraints[key] = exactArray(
      manifest.constraints[key],
      `constraints.${key}`,
      {
        min: 1,
        max: 20,
      },
    );
    uniqueStrings(constraints[key], `constraints.${key}`);
    for (const [index, value] of constraints[key].entries()) {
      nonEmptyString(value, `constraints.${key}[${index}]`, 1024);
    }
    constraints[key] = [...constraints[key]].sort(compareUtf8);
  }

  objectAt(manifest.examples, "examples", [
    "react",
    "nextClient",
    "nextServer",
  ]);
  for (const key of ["react", "nextClient", "nextServer"]) {
    nonEmptyString(manifest.examples[key], `examples.${key}`, 65536);
  }

  return {
    ...manifest,
    files: normalizedFiles.sort((left, right) =>
      compareUtf8(left.target, right.target),
    ),
    dependencies: {
      common: [...manifest.dependencies.common].sort(compareUtf8),
      tailwind: {
        3: [...manifest.dependencies.tailwind["3"]].sort(compareUtf8),
        4: [...manifest.dependencies.tailwind["4"]].sort(compareUtf8),
      },
    },
    tailwind,
    constraints,
  };
}

export async function loadManifest(
  manifestPath,
  { rootDir, verifyGit = true } = {},
) {
  if (!rootDir) throw new Error("loadManifest requires rootDir");
  const bytes = await readFile(manifestPath);
  if (bytes.length > MAX_MANIFEST_BYTES)
    throw new Error(`${manifestPath} exceeds ${MAX_MANIFEST_BYTES} bytes`);
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${manifestPath}: invalid JSON (${error.message})`);
  }
  const manifestName = manifestPath.replace(/\\/g, "/").split("/").at(-1);
  const manifest = validateManifestStructure(parsed, { manifestName });

  if (manifest.repository !== repositoryFromOrigin(rootDir)) {
    fail("repository", "must match the configured GitHub origin repository");
  }
  if (verifyGit) assertCommit(rootDir, manifest.sourceCommit);

  const records = manifest.files.map((file) => {
    const pinned = readPinnedSource(
      rootDir,
      manifest.sourceCommit,
      file.source,
    );
    if (verifyGit)
      assertWorkingTreeMatches(rootDir, file.source, pinned.blobSha);
    return { ...file, ...pinned };
  });
  const knownSources = new Set(records.map((record) => record.source));
  const declaredPackages = new Set(
    [
      ...manifest.dependencies.common,
      ...manifest.dependencies.tailwind["3"],
      ...manifest.dependencies.tailwind["4"],
    ].map((dependency) => dependency.match(DEPENDENCY)[1]),
  );
  const importedPackages = new Set();
  for (const record of records) {
    for (const packageName of assertImports(
      record,
      knownSources,
      declaredPackages,
    )) {
      importedPackages.add(packageName);
    }
  }
  for (const packageName of importedPackages) {
    if (
      manifest.dependencies.common.some((dependency) =>
        dependency.startsWith(`${packageName}@`),
      )
    ) {
      continue;
    }
    for (const major of manifest.tailwind.supportedMajors) {
      if (
        !manifest.dependencies.tailwind[String(major)].some((dependency) =>
          dependency.startsWith(`${packageName}@`),
        )
      ) {
        fail(
          "dependencies",
          `${packageName} must be available to every supported Tailwind major`,
        );
      }
    }
  }
  assertClientBoundary(
    records.find((record) => record.source === manifest.next.clientBoundary),
  );

  return { manifest, files: records };
}

export async function loadManifests(manifestPaths, options) {
  const normalizedPaths = [...manifestPaths].sort(compareUtf8);
  const loaded = [];
  const names = new Set();
  const itemNames = new Set();
  for (const manifestPath of normalizedPaths) {
    const component = await loadManifest(manifestPath, options);
    if (names.has(component.manifest.name))
      fail("name", `duplicates ${component.manifest.name}`);
    names.add(component.manifest.name);
    for (const major of component.manifest.tailwind.supportedMajors) {
      const itemName = component.manifest.tailwind[major].itemName;
      if (itemNames.has(itemName))
        fail("tailwind.itemName", `duplicates ${itemName}`);
      itemNames.add(itemName);
    }
    loaded.push(component);
  }
  return loaded;
}

export const manifestInternals = {
  dependencyPattern: DEPENDENCY,
  repositoryFromOrigin,
  safeRelativePath,
  safeTarget,
};
