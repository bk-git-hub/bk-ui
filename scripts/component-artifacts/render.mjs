import { canonicalJson, compareUtf8, sha256 } from "./canonical-json.mjs";
import { createStoredZip } from "./zip-store.mjs";

const REGISTRY_SCHEMA = "https://ui.shadcn.com/schema/registry.json";
const REGISTRY_ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";
const REPOSITORY_PATH_PREFIX = "@components/";

function targetPath(target) {
  if (!target.startsWith(REPOSITORY_PATH_PREFIX)) {
    throw new Error(`Unexpected Registry target: ${target}`);
  }
  return `components/${target.slice(REPOSITORY_PATH_PREFIX.length)}`;
}

function itemDependencies(component, major) {
  return [
    ...component.manifest.dependencies.common,
    ...component.manifest.dependencies.tailwind[String(major)],
  ].sort(compareUtf8);
}

function fileMetadata(component) {
  return component.files.map((file) => ({
    source: file.source,
    target: file.target,
    type: file.type,
    frameworks: file.frameworks,
    gitBlob: file.blobSha,
    sha256: file.sha256,
  }));
}

function bkUiMetadata(component, major) {
  const { manifest } = component;
  return {
    schemaVersion: manifest.schemaVersion,
    componentVersion: manifest.componentVersion,
    sourceCommit: manifest.sourceCommit,
    license: manifest.license,
    react: manifest.react,
    next: manifest.next,
    tailwind: {
      major,
      range: manifest.tailwind[major].range,
      tested: manifest.tailwind[major].tested,
      scan: manifest.tailwind[major].scan,
      representativeClasses: manifest.tailwind[major].representativeClasses,
    },
    entrypoints: manifest.entrypoints,
    constraints: manifest.constraints,
    files: fileMetadata(component),
  };
}

function registryDocs(component, major) {
  const { manifest } = component;
  return [
    `Tailwind ${major}: ${manifest.tailwind[major].scan}`,
    "",
    "SSR and hydration constraints:",
    markdownList(manifest.constraints.ssr),
    "",
    "Accessibility constraints:",
    markdownList(manifest.constraints.accessibility),
  ].join("\n");
}

function registryItem(component, major, { inline }) {
  const { manifest } = component;
  const variant = manifest.tailwind[major];
  const item = {
    name: variant.itemName,
    type: "registry:ui",
    title: `${manifest.title} (Tailwind ${major})`,
    description: manifest.description,
    dependencies: itemDependencies(component, major),
    registryDependencies: [],
    docs: registryDocs(component, major),
    files: component.files.map((file) => ({
      path: file.source,
      type: file.type,
      target: file.target,
      ...(inline ? { content: file.content.toString("utf8") } : {}),
    })),
    meta: { bkUi: bkUiMetadata(component, major) },
  };
  return inline ? { $schema: REGISTRY_ITEM_SCHEMA, ...item } : item;
}

function zipFileManifest(component, framework) {
  const { manifest } = component;
  const includedFiles = component.files.filter((file) =>
    file.frameworks.includes(framework),
  );
  return {
    schemaVersion: 1,
    name: manifest.name,
    title: manifest.title,
    componentVersion: manifest.componentVersion,
    framework,
    sourceCommit: manifest.sourceCommit,
    releaseStatus: "release-blocked",
    license: manifest.license,
    react: manifest.react,
    next: manifest.next,
    tailwind: Object.fromEntries(
      manifest.tailwind.supportedMajors.map((major) => [
        String(major),
        {
          range: manifest.tailwind[major].range,
          tested: manifest.tailwind[major].tested,
          dependencies: itemDependencies(component, major),
          scan: manifest.tailwind[major].scan,
          representativeClasses: manifest.tailwind[major].representativeClasses,
        },
      ]),
    ),
    entrypoint: manifest.entrypoints[framework === "next" ? "next" : "react"],
    constraints: manifest.constraints,
    files: includedFiles.map((file) => ({
      source: file.source,
      path: targetPath(file.target),
      gitBlob: file.blobSha,
      sha256: file.sha256,
    })),
  };
}

function markdownList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function zipReadme(component, framework) {
  const { manifest } = component;
  const frameworkName =
    framework === "next" ? "Next.js App Router" : "React/Vite";
  const entrypoint = targetPath(
    component.files.find(
      (file) =>
        file.source ===
        manifest.entrypoints[framework === "next" ? "next" : "react"],
    ).target,
  );
  const variants = manifest.tailwind.supportedMajors
    .map((major) => {
      const tailwind = manifest.tailwind[major];
      return [
        `### Tailwind ${major}`,
        "",
        `- Supported range: \`${tailwind.range}\` (tested \`${tailwind.tested}\`)`,
        `- Install: \`${itemDependencies(component, major).join(" ")}\``,
        `- Source discovery: ${tailwind.scan}`,
      ].join("\n");
    })
    .join("\n\n");

  return Buffer.from(
    [
      `# ${manifest.title} for ${frameworkName}`,
      "",
      "> Release blocked: BK-UI does not yet declare redistribution license terms. This archive is a deterministic local verification artifact, not a published release.",
      "",
      `Pinned source commit: \`${manifest.sourceCommit}\``,
      `Entry point after copying: \`${entrypoint}\``,
      "",
      "Copy the `components/` directory into a Tailwind-scanned local source directory, then choose exactly one supported Tailwind dependency set below.",
      "",
      variants,
      "",
      "## SSR and hydration constraints",
      "",
      markdownList(manifest.constraints.ssr),
      "",
      "## Accessibility constraints",
      "",
      markdownList(manifest.constraints.accessibility),
      "",
      framework === "next"
        ? "Keep callbacks, render functions, and other non-serializable props inside the included Client Component wrapper. Pass only serializable data from Server Components."
        : "The React entry uses the same canonical core bytes as the Next.js archive.",
      "",
      "See `manifest.json` for exact file SHA-256 values and `examples/` for integration code.",
      "",
    ].join("\n"),
    "utf8",
  );
}

function distributionNotice(component) {
  return Buffer.from(
    [
      "# Distribution notice",
      "",
      `Component: ${component.manifest.title}`,
      `Pinned source: ${component.manifest.sourceCommit}`,
      "License status: UNLICENSED / pending project-owner decision.",
      "",
      "No redistribution license or public-release permission is granted by this generated notice. Do not present this verification artifact as a published BK-UI release.",
      "",
    ].join("\n"),
    "utf8",
  );
}

function renderZip(component, framework) {
  const files = component.files.filter((file) =>
    file.frameworks.includes(framework),
  );
  const entries = files.map((file) => ({
    name: targetPath(file.target),
    data: file.content,
  }));
  entries.push(
    {
      name: "manifest.json",
      data: canonicalJson(zipFileManifest(component, framework)),
    },
    { name: "README.md", data: zipReadme(component, framework) },
    { name: "DISTRIBUTION-NOTICE.md", data: distributionNotice(component) },
  );
  if (framework === "react") {
    entries.push({
      name: "examples/react-example.tsx",
      data: Buffer.from(component.manifest.examples.react),
    });
  } else {
    entries.push(
      {
        name: "examples/client-wrapper.tsx",
        data: Buffer.from(component.manifest.examples.nextClient),
      },
      {
        name: "examples/page.tsx",
        data: Buffer.from(component.manifest.examples.nextServer),
      },
    );
  }
  return createStoredZip(entries);
}

function codeFence(content) {
  const runs = content.match(/`+/g) ?? [];
  const length = Math.max(3, ...runs.map((run) => run.length + 1));
  return "`".repeat(length);
}

function copyForAi(component, leafHashes) {
  const { manifest } = component;
  const lines = [
    `# Copy for AI: ${manifest.title}`,
    "",
    "Status: `release-blocked` — use only the exact embedded source below for local verification. Do not claim that an npm package, GitHub permalink, ZIP release, or Registry command is publicly available.",
    "",
    `Component version: \`${manifest.componentVersion}\``,
    `Pinned source commit: \`${manifest.sourceCommit}\``,
    `React: \`${manifest.react.range}\` (tested \`${manifest.react.tested}\`)`,
    `Next.js tested: \`${manifest.next.tested}\``,
    "",
    "## Artifact integrity",
    "",
    ...Object.entries(leafHashes)
      .sort(([left], [right]) => compareUtf8(left, right))
      .map(([path, hash]) => `- \`${path}\`: \`${hash}\``),
    "",
    "## Tailwind variants",
    "",
  ];
  for (const major of manifest.tailwind.supportedMajors) {
    const tailwind = manifest.tailwind[major];
    lines.push(
      `### Tailwind ${major}`,
      "",
      `- Range: \`${tailwind.range}\`; tested: \`${tailwind.tested}\``,
      `- Dependencies: \`${itemDependencies(component, major).join(" ")}\``,
      `- Registry item: \`${tailwind.itemName}\``,
      `- Source discovery: ${tailwind.scan}`,
      "",
    );
  }
  for (const major of [3, 4]) {
    if (!manifest.tailwind[major].supported) {
      lines.push(
        `Tailwind ${major} is unsupported: ${manifest.tailwind[major].reason}`,
        "",
      );
    }
  }
  lines.push(
    "## SSR and hydration constraints",
    "",
    markdownList(manifest.constraints.ssr),
    "",
    "## Accessibility constraints",
    "",
    markdownList(manifest.constraints.accessibility),
    "",
    "## Canonical source",
    "",
  );
  for (const file of component.files) {
    const content = file.content.toString("utf8");
    const fence = codeFence(content);
    const language = file.source.endsWith(".css")
      ? "css"
      : file.source.endsWith(".tsx")
        ? "tsx"
        : "ts";
    lines.push(
      `### ${file.target}`,
      "",
      `Source: \`${file.source}\`  `,
      `SHA-256: \`${file.sha256}\``,
      "",
      `${fence}${language}`,
      content.replace(/\r\n?/g, "\n").replace(/\n*$/, ""),
      fence,
      "",
    );
  }
  lines.push(
    "## React/Vite example",
    "",
    `${codeFence(manifest.examples.react)}tsx`,
    manifest.examples.react.replace(/\r\n?/g, "\n").replace(/\n*$/, ""),
    codeFence(manifest.examples.react),
    "",
    "## Next.js App Router examples",
    "",
    `${codeFence(manifest.examples.nextClient)}tsx`,
    manifest.examples.nextClient.replace(/\r\n?/g, "\n").replace(/\n*$/, ""),
    codeFence(manifest.examples.nextClient),
    "",
    `${codeFence(manifest.examples.nextServer)}tsx`,
    manifest.examples.nextServer.replace(/\r\n?/g, "\n").replace(/\n*$/, ""),
    codeFence(manifest.examples.nextServer),
    "",
    "## Required verification",
    "",
    "- Typecheck and production-build the consuming project.",
    "- Confirm the selected Tailwind major emits the representative utilities from the manifest.",
    "- For Next.js, render production HTML, hydrate without console errors, and exercise one interaction.",
    "- Recompute every file and artifact SHA-256 before using the result.",
    "",
  );
  return Buffer.from(lines.join("\n"), "utf8");
}

function resource(kind, label, repositoryPath, hash, framework) {
  return {
    kind,
    label,
    repositoryPath,
    sha256: hash,
    ...(framework ? { framework } : {}),
  };
}

function installDescriptor(component, leafHashes, aiPath, aiHash) {
  const { manifest } = component;
  const sourceResources = component.files.map((file) =>
    resource("source", file.target, file.source, file.sha256),
  );
  const zipResources = [
    resource(
      "zip",
      "React/Vite source ZIP",
      `public/downloads/${manifest.name}-react.zip`,
      leafHashes[`public/downloads/${manifest.name}-react.zip`],
      "react",
    ),
    resource(
      "zip",
      "Next.js App Router source ZIP",
      `public/downloads/${manifest.name}-next.zip`,
      leafHashes[`public/downloads/${manifest.name}-next.zip`],
      "nextjs",
    ),
  ];
  return {
    schemaVersion: 1,
    name: manifest.name,
    title: manifest.title,
    componentVersion: manifest.componentVersion,
    sourceCommit: manifest.sourceCommit,
    status: "release-blocked",
    statusMessage:
      "Public installation is blocked until license terms are approved, the fixture gate passes, and the artifact commit is pushed and verified by full SHA.",
    defaultVariantId: `tailwind-${manifest.tailwind.supportedMajors.includes(4) ? 4 : manifest.tailwind.supportedMajors[0]}`,
    constraints: manifest.constraints,
    variants: manifest.tailwind.supportedMajors.map((major) => {
      const variant = manifest.tailwind[major];
      const registryPath = `public/r/${variant.itemName}.json`;
      return {
        id: `tailwind-${major}`,
        label: `Tailwind ${major}`,
        tailwindMajor: major,
        range: variant.range,
        tested: variant.tested,
        dependencies: itemDependencies(component, major),
        notes: [
          variant.scan,
          ...manifest.constraints.ssr,
          ...manifest.constraints.accessibility,
        ],
        resources: [
          ...sourceResources,
          resource(
            "registry",
            `${variant.itemName} Registry JSON`,
            registryPath,
            leafHashes[registryPath],
          ),
          ...zipResources,
          resource("copy-for-ai", "Copy for AI", aiPath, aiHash),
        ],
      };
    }),
  };
}

export function renderArtifactPlan(
  components,
  { includeRegistry = true } = {},
) {
  const plan = new Map();
  if (includeRegistry) {
    const registry = {
      $schema: REGISTRY_SCHEMA,
      name: "bk-ui",
      homepage: "https://github.com/bk-git-hub/bk-ui",
      items: components.flatMap((component) =>
        component.manifest.tailwind.supportedMajors.map((major) =>
          registryItem(component, major, { inline: false }),
        ),
      ),
    };
    registry.items.sort((left, right) => compareUtf8(left.name, right.name));
    plan.set("registry.json", canonicalJson(registry));
  }

  for (const component of components) {
    const { manifest } = component;
    const leafHashes = {};
    for (const major of manifest.tailwind.supportedMajors) {
      const item = registryItem(component, major, { inline: true });
      const path = `public/r/${manifest.tailwind[major].itemName}.json`;
      const bytes = canonicalJson(item);
      plan.set(path, bytes);
      leafHashes[path] = sha256(bytes);
    }

    for (const framework of ["react", "next"]) {
      const path = `public/downloads/${manifest.name}-${framework}.zip`;
      const bytes = renderZip(component, framework);
      plan.set(path, bytes);
      leafHashes[path] = sha256(bytes);
    }

    const aiPath = `public/ai/${manifest.name}.md`;
    const aiBytes = copyForAi(component, leafHashes);
    const aiHash = sha256(aiBytes);
    plan.set(aiPath, aiBytes);

    const descriptorPath = `public/install/${manifest.name}.json`;
    plan.set(
      descriptorPath,
      canonicalJson(installDescriptor(component, leafHashes, aiPath, aiHash)),
    );
  }

  return new Map(
    [...plan.entries()].sort(([left], [right]) => compareUtf8(left, right)),
  );
}

export const renderInternals = {
  registryItem,
  targetPath,
  zipFileManifest,
};
