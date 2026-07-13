import {
  access,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build, preview } from "vite";

export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function parseArgs(argv, defaults = {}) {
  const result = { ...defaults };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;

    const [rawKey, inlineValue] = argument.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );
    const next = argv[index + 1];

    if (inlineValue !== undefined) {
      result[key] = inlineValue;
    } else if (next && !next.startsWith("--")) {
      result[key] = next;
      index += 1;
    } else {
      result[key] = true;
    }
  }

  return result;
}

export function positiveInteger(value, name) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`--${name} must be a positive integer.`);
  }
  return parsed;
}

export function finiteNumber(value, name) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive number.`);
  }
  return parsed;
}

export function median(values) {
  const finiteValues = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (finiteValues.length === 0) return null;

  const middle = Math.floor(finiteValues.length / 2);
  return finiteValues.length % 2 === 0
    ? (finiteValues[middle - 1] + finiteValues[middle]) / 2
    : finiteValues[middle];
}

export function percentile(values, percentileValue) {
  const finiteValues = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (finiteValues.length === 0) return null;

  const index = Math.min(
    finiteValues.length - 1,
    Math.ceil((percentileValue / 100) * finiteValues.length) - 1,
  );
  return finiteValues[Math.max(0, index)];
}

export function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function safeLabel(value) {
  const label = String(value ?? "run")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return label || "run";
}

export async function makeOutputDirectory(baseDir, label) {
  const outputDirectory = path.resolve(
    projectRoot,
    baseDir,
    `${safeLabel(label)}-${timestamp()}`,
  );
  await mkdir(outputDirectory, { recursive: true });
  return outputDirectory;
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function findAvailablePort(requestedPort) {
  if (requestedPort !== undefined)
    return positiveInteger(requestedPort, "port");

  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) reject(error);
        else if (port) resolve(port);
        else reject(new Error("Could not allocate a preview port."));
      });
    });
  });
}

export async function startProductionPreview({ outputDirectory, port }) {
  const buildDirectory = path.join(outputDirectory, "dist");

  await build({
    root: projectRoot,
    logLevel: "warn",
    build: {
      outDir: buildDirectory,
      emptyOutDir: true,
    },
  });

  const previewServer = await preview({
    root: projectRoot,
    logLevel: "warn",
    build: { outDir: buildDirectory },
    preview: {
      host: "127.0.0.1",
      port,
      strictPort: true,
    },
  });

  return {
    buildDirectory,
    origin: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => {
        previewServer.httpServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    },
  };
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
    }),
  );
  return nestedFiles.flat();
}

function assetType(extension) {
  if ([".js", ".mjs"].includes(extension)) return "javascript";
  if (extension === ".css") return "css";
  if (
    [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"].includes(
      extension,
    )
  ) {
    return "image";
  }
  if ([".woff", ".woff2", ".ttf", ".otf"].includes(extension)) return "font";
  if (extension === ".html") return "html";
  return "other";
}

export async function collectBundleInventory(buildDirectory) {
  const files = await walkFiles(buildDirectory);
  const inventory = [];

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const type = assetType(extension);
    const fileStat = await stat(filePath);
    const shouldCompress = ["javascript", "css", "html", "svg"].includes(type);
    const gzipBytes = shouldCompress
      ? gzipSync(await readFile(filePath), { level: 9 }).byteLength
      : null;

    inventory.push({
      file: path.relative(buildDirectory, filePath).replaceAll(path.sep, "/"),
      type,
      rawBytes: fileStat.size,
      gzipBytes,
    });
  }

  inventory.sort((left, right) => right.rawBytes - left.rawBytes);
  const totals = {};
  for (const type of ["javascript", "css", "image", "font", "html", "other"]) {
    const typeFiles = inventory.filter((file) => file.type === type);
    totals[type] = {
      files: typeFiles.length,
      rawBytes: typeFiles.reduce((sum, file) => sum + file.rawBytes, 0),
      gzipBytes: typeFiles.reduce(
        (sum, file) => sum + (file.gzipBytes ?? 0),
        0,
      ),
    };
  }

  return {
    totals,
    all: {
      files: inventory.length,
      rawBytes: inventory.reduce((sum, file) => sum + file.rawBytes, 0),
    },
    files: inventory,
  };
}

export async function findChromePath(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.CHROME_PATH,
    process.platform === "win32"
      ? path.join(
          process.env.PROGRAMFILES ?? "",
          "Google/Chrome/Application/chrome.exe",
        )
      : null,
    process.platform === "win32"
      ? path.join(
          process.env["PROGRAMFILES(X86)"] ?? "",
          "Google/Chrome/Application/chrome.exe",
        )
      : null,
    process.platform === "win32"
      ? path.join(
          process.env.LOCALAPPDATA ?? "",
          "Google/Chrome/Application/chrome.exe",
        )
      : null,
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : null,
    process.platform === "linux" ? "/usr/bin/google-chrome" : null,
    process.platform === "linux" ? "/usr/bin/google-chrome-stable" : null,
    process.platform === "linux" ? "/usr/bin/chromium" : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Continue to the next known system Chrome location.
    }
  }

  return null;
}

export function summarizeRuns(runs, selectors) {
  return Object.fromEntries(
    Object.entries(selectors).map(([name, select]) => [
      name,
      round(median(runs.map(select))),
    ]),
  );
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${round(bytes, 0)} B`;
  if (bytes < 1024 ** 2) return `${round(bytes / 1024, 1)} KiB`;
  return `${round(bytes / 1024 ** 2, 2)} MiB`;
}

export function formatMilliseconds(milliseconds) {
  if (!Number.isFinite(milliseconds)) return "—";
  return milliseconds >= 1000
    ? `${round(milliseconds / 1000, 2)} s`
    : `${round(milliseconds, 0)} ms`;
}

export function formatPercent(value) {
  return Number.isFinite(value) ? `${round(value, 1)}%` : "—";
}

export async function readBaseline(filePath) {
  if (!filePath) return null;
  return JSON.parse(
    await readFile(path.resolve(projectRoot, filePath), "utf8"),
  );
}

export function comparisonRow(
  label,
  baseline,
  current,
  unit,
  higherIsBetter = false,
) {
  if (!Number.isFinite(baseline) || !Number.isFinite(current)) return null;
  const delta = current - baseline;
  const improvementPercent =
    baseline === 0
      ? null
      : ((higherIsBetter ? delta : -delta) / Math.abs(baseline)) * 100;

  return {
    label,
    baseline: round(baseline),
    current: round(current),
    delta: round(delta),
    improvementPercent: round(improvementPercent),
    unit,
    higherIsBetter,
  };
}

export async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
