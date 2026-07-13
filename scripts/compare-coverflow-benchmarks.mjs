import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const argumentsList = process.argv.slice(2);
const positional = [];
let outputPath;

for (let index = 0; index < argumentsList.length; index += 1) {
  const argument = argumentsList[index];
  if (argument === "--output") {
    outputPath = argumentsList[index + 1];
    index += 1;
  } else if (argument.startsWith("--output=")) {
    outputPath = argument.slice("--output=".length);
  } else {
    positional.push(argument);
  }
}

if (positional.length !== 2) {
  console.error(
    "Usage: node scripts/compare-coverflow-benchmarks.mjs <before.json> <after.json> [--output report.md]",
  );
  process.exit(1);
}

const [beforePath, afterPath] = positional.map((path) => resolve(path));
const before = JSON.parse(await readFile(beforePath, "utf8"));
const after = JSON.parse(await readFile(afterPath, "utf8"));

const comparisonConditions = [
  [
    "schema version",
    before.metadata.schemaVersion,
    after.metadata.schemaVersion,
  ],
  [
    "harness",
    before.metadata.harness
      ? JSON.stringify(before.metadata.harness)
      : undefined,
    after.metadata.harness ? JSON.stringify(after.metadata.harness) : undefined,
  ],
  ["browser", before.metadata.browser, after.metadata.browser],
  ["browser mode", before.metadata.browserMode, after.metadata.browserMode],
  ["headless", before.metadata.headless, after.metadata.headless],
  ["platform", before.metadata.platform, after.metadata.platform],
  ["CPU model", before.metadata.cpuModel, after.metadata.cpuModel],
  [
    "logical CPU count",
    before.metadata.logicalCpuCount,
    after.metadata.logicalCpuCount,
  ],
  ["Node.js", before.metadata.node, after.metadata.node],
  ["run count", before.metadata.runs, after.metadata.runs],
  ["CPU throttle", before.metadata.cpuThrottle, after.metadata.cpuThrottle],
  ["asset mode", before.metadata.assets, after.metadata.assets],
  ["item count", before.metadata.items, after.metadata.items],
  [
    "viewport",
    before.metadata.viewport
      ? JSON.stringify(before.metadata.viewport)
      : undefined,
    after.metadata.viewport
      ? JSON.stringify(after.metadata.viewport)
      : undefined,
  ],
];
const mismatches = comparisonConditions.filter(
  ([, beforeValue, afterValue]) =>
    beforeValue === undefined ||
    afterValue === undefined ||
    beforeValue !== afterValue,
);
if (mismatches.length > 0) {
  throw new Error(
    `Benchmark conditions differ:\n${mismatches
      .map(
        ([name, beforeValue, afterValue]) =>
          `- ${name}: ${beforeValue} !== ${afterValue}`,
      )
      .join("\n")}`,
  );
}

const metrics = [
  ["LCP", "load.lcpMs", "ms"],
  ["Mounted cards", "load.cardCount", ""],
  ["Completed images", "load.completedImageCount", ""],
  ["Coverflow image requests", "load.coverflowSourceRequests", ""],
  ["p95 active frame time", "interaction.frameP95Ms", "ms"],
  ["Active frames over 20 ms", "interaction.framesOver20MsPercent", "%"],
  ["p95 burst wheel handler", "interaction.wheelHandlerP95Ms", "ms"],
  ["Main-thread task time", "interaction.taskDurationMs", "ms"],
  ["Script time", "interaction.scriptDurationMs", "ms"],
  ["Style time", "interaction.styleDurationMs", "ms"],
  ["Layout time", "interaction.layoutDurationMs", "ms"],
  ["Long-task total", "interaction.longTaskTotalMs", "ms"],
  ["Listener additions", "interaction.listenerAdds", ""],
  ["JS heap", "runtime.jsHeapUsedBytes", "bytes"],
  ["DOM nodes", "runtime.nodes", ""],
];

function readMetric(report, path) {
  return path
    .split(".")
    .reduce((value, segment) => value?.[segment], report.summary);
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function improvement(beforeValue, afterValue) {
  if (!Number.isFinite(beforeValue) || !Number.isFinite(afterValue))
    return "n/a";
  if (beforeValue === 0) return afterValue === 0 ? "0%" : "n/a";
  return `${round(((beforeValue - afterValue) / beforeValue) * 100)}%`;
}

function format(value, unit) {
  if (!Number.isFinite(value)) return "n/a";
  if (unit === "bytes") return `${round(value / 1024 / 1024)} MiB`;
  return `${value}${unit ? ` ${unit}` : ""}`;
}

const rows = metrics.map(([label, path, unit]) => {
  const beforeValue = readMetric(before, path);
  const afterValue = readMetric(after, path);
  return `| ${label} | ${format(beforeValue, unit)} | ${format(afterValue, unit)} | ${improvement(beforeValue, afterValue)} |`;
});

const markdown = `# Coverflow benchmark comparison

- Before: ${before.metadata.label} (${before.metadata.generatedAt})
- After: ${after.metadata.label} (${after.metadata.generatedAt})
- Conditions: ${after.metadata.viewport.width}x${after.metadata.viewport.height}, CPU ${after.metadata.cpuThrottle}x, ${after.metadata.assets} assets, ${after.metadata.items} items

| Metric | Before | After | Reduction |
| --- | ---: | ---: | ---: |
${rows.join("\n")}

Reduction uses \`(before - after) / before * 100\`. For percentage metrics, also report the absolute percentage-point change when publishing results.
`;

process.stdout.write(markdown);

if (outputPath) {
  const resolvedOutputPath = resolve(outputPath);
  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, markdown, "utf8");
  process.stdout.write(`\nSaved: ${resolvedOutputPath}\n`);
}
