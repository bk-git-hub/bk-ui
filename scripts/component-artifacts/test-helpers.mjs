import { sha256 } from "./canonical-json.mjs";

export function sampleManifest(overrides = {}) {
  const manifest = {
    $schema: "../schema/component-manifest.schema.json",
    schemaVersion: 1,
    name: "demo",
    title: "Demo",
    componentVersion: "1.0.0",
    description: "A deterministic demo component.",
    repository: "https://github.com/bk-git-hub/bk-ui",
    sourceCommit: "a".repeat(40),
    license: { spdx: "UNLICENSED", status: "pending" },
    react: { range: ">=19 <20", tested: "19.2.7" },
    next: {
      tested: "16.2.10",
      clientBoundary: "src/components/Demo/client.ts",
      serializableProps: [
        "Pass plain serializable items from a Server Component.",
      ],
    },
    files: [
      {
        source: "src/components/Demo/index.tsx",
        target: "@components/Demo/index.tsx",
        type: "registry:component",
        frameworks: ["react", "next"],
      },
      {
        source: "src/components/Demo/client.ts",
        target: "@components/Demo/client.ts",
        type: "registry:component",
        frameworks: ["next"],
      },
    ],
    dependencies: {
      common: ["clsx@^2.1.1"],
      tailwind: {
        3: ["tailwind-merge@2.6.0"],
        4: ["tailwind-merge@^3.3.1"],
      },
    },
    entrypoints: {
      react: "src/components/Demo/index.tsx",
      next: "src/components/Demo/client.ts",
    },
    tailwind: {
      supportedMajors: [3, 4],
      3: {
        supported: true,
        range: ">=3.4.0 <4",
        tested: "3.4.17",
        itemName: "demo-tailwind-v3",
        scan: "Include components/Demo in content globs.",
        representativeClasses: ["p-4"],
      },
      4: {
        supported: true,
        range: ">=4.0.0 <5",
        tested: "4.3.2",
        itemName: "demo",
        scan: "Keep components/Demo under a scanned source or add @source.",
        representativeClasses: ["p-4"],
      },
    },
    constraints: {
      ssr: [
        "Use deterministic initial props and avoid render-time browser globals.",
      ],
      accessibility: ["Keep keyboard controls and visible focus styles."],
    },
    examples: {
      react:
        'import { Demo } from "./components/Demo";\n\nexport function App() {\n  return <Demo />;\n}\n',
      nextClient:
        '\"use client\";\n\nimport { Demo } from "./components/Demo/client";\n\nexport function DemoClient() {\n  return <Demo />;\n}\n',
      nextServer:
        'import { DemoClient } from "./DemoClient";\n\nexport default function Page() {\n  return <DemoClient />;\n}\n',
    },
  };
  return deepMerge(manifest, overrides);
}

function deepMerge(value, overrides) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides))
    return overrides ?? value;
  if (
    Object.prototype.hasOwnProperty.call(overrides, "supported") &&
    overrides.supported !== value?.supported
  ) {
    return overrides;
  }
  const result = { ...value };
  for (const [key, override] of Object.entries(overrides)) {
    result[key] =
      value[key] &&
      typeof value[key] === "object" &&
      !Array.isArray(value[key]) &&
      override &&
      typeof override === "object" &&
      !Array.isArray(override)
        ? deepMerge(value[key], override)
        : override;
  }
  return result;
}

export function sampleComponent(manifest) {
  const contents = {
    "src/components/Demo/index.tsx": Buffer.from(
      '\"use client\";\n\nimport { clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function Demo() {\n  return <div className={twMerge(clsx("p-4"))}>Demo</div>;\n}\n',
    ),
    "src/components/Demo/client.ts": Buffer.from(
      '\"use client\";\n\nexport * from "./index";\n',
    ),
  };
  return {
    manifest,
    files: manifest.files.map((file, index) => {
      const content = contents[file.source];
      return {
        ...file,
        content,
        blobSha: String(index + 1).repeat(40),
        sha256: sha256(content),
      };
    }),
  };
}

export function parseCanonicalZip(archive) {
  const eocdOffset = archive.length - 22;
  if (eocdOffset < 0 || archive.readUInt32LE(eocdOffset) !== 0x06054b50) {
    throw new Error("Missing terminal EOCD");
  }
  if (archive.readUInt16LE(eocdOffset + 20) !== 0)
    throw new Error("ZIP comment is not empty");
  const count = archive.readUInt16LE(eocdOffset + 10);
  const centralSize = archive.readUInt32LE(eocdOffset + 12);
  const centralOffset = archive.readUInt32LE(eocdOffset + 16);
  if (centralOffset + centralSize !== eocdOffset)
    throw new Error("Central directory size mismatch");

  const files = new Map();
  let central = centralOffset;
  for (let index = 0; index < count; index += 1) {
    if (archive.readUInt32LE(central) !== 0x02014b50)
      throw new Error("Invalid central header");
    const flags = archive.readUInt16LE(central + 8);
    const method = archive.readUInt16LE(central + 10);
    const time = archive.readUInt16LE(central + 12);
    const date = archive.readUInt16LE(central + 14);
    const size = archive.readUInt32LE(central + 24);
    const nameLength = archive.readUInt16LE(central + 28);
    const extraLength = archive.readUInt16LE(central + 30);
    const commentLength = archive.readUInt16LE(central + 32);
    const mode = archive.readUInt32LE(central + 38);
    const localOffset = archive.readUInt32LE(central + 42);
    const name = archive
      .subarray(central + 46, central + 46 + nameLength)
      .toString("utf8");
    if (
      flags !== 0x0800 ||
      method !== 0 ||
      time !== 0 ||
      date !== 0x0021 ||
      extraLength !== 0 ||
      commentLength !== 0 ||
      mode !== (0o100644 << 16) >>> 0
    ) {
      throw new Error(`Non-canonical central metadata for ${name}`);
    }
    if (archive.readUInt32LE(localOffset) !== 0x04034b50)
      throw new Error(`Invalid local header for ${name}`);
    const localNameLength = archive.readUInt16LE(localOffset + 26);
    const localExtraLength = archive.readUInt16LE(localOffset + 28);
    if (localExtraLength !== 0)
      throw new Error(`Local extra field for ${name}`);
    const dataOffset = localOffset + 30 + localNameLength;
    files.set(
      name,
      Buffer.from(archive.subarray(dataOffset, dataOffset + size)),
    );
    central += 46 + nameLength;
  }
  if (central !== eocdOffset)
    throw new Error("Central directory did not end at EOCD");
  return files;
}
