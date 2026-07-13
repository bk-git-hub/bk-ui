import path from "node:path";
import { pathToFileURL } from "node:url";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import {
  findAvailablePort,
  findChromePath,
  makeOutputDirectory,
  parseArgs,
  positiveInteger,
  round,
  startProductionPreview,
  summarizeRuns,
  writeJson,
} from "./tinder-perf-utils.mjs";

const LIGHTHOUSE_AUDITS = {
  performanceScore: (lhr) => (lhr.categories.performance.score ?? 0) * 100,
  firstContentfulPaintMs: (lhr) =>
    lhr.audits["first-contentful-paint"].numericValue,
  largestContentfulPaintMs: (lhr) =>
    lhr.audits["largest-contentful-paint"].numericValue,
  speedIndexMs: (lhr) => lhr.audits["speed-index"].numericValue,
  totalBlockingTimeMs: (lhr) => lhr.audits["total-blocking-time"].numericValue,
  cumulativeLayoutShift: (lhr) =>
    lhr.audits["cumulative-layout-shift"].numericValue,
  totalByteWeight: (lhr) => lhr.audits["total-byte-weight"].numericValue,
};

export async function runLighthouseAudit({
  url,
  runs,
  outputDirectory,
  chromePath,
}) {
  const lighthouseDirectory = path.join(outputDirectory, "lighthouse");
  const chrome = await puppeteer.launch({
    executablePath: chromePath || undefined,
    headless: true,
    args: [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-background-networking",
    ],
  });
  const debuggingPort = Number(new URL(chrome.wsEndpoint()).port);

  const results = [];
  try {
    for (let run = 1; run <= runs; run += 1) {
      process.stdout.write(`Lighthouse ${run}/${runs}... `);
      const result = await lighthouse(url, {
        port: debuggingPort,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance"],
        formFactor: "mobile",
        throttlingMethod: "simulate",
        disableStorageReset: false,
      });

      if (!result?.lhr)
        throw new Error(`Lighthouse run ${run} produced no result.`);

      const rawPath = path.join(
        lighthouseDirectory,
        `lighthouse-run-${String(run).padStart(2, "0")}.json`,
      );
      await writeJson(rawPath, result.lhr);
      results.push({
        run,
        ...Object.fromEntries(
          Object.entries(LIGHTHOUSE_AUDITS).map(([name, select]) => [
            name,
            round(select(result.lhr)),
          ]),
        ),
      });
      process.stdout.write("done\n");
    }
  } finally {
    await chrome.close();
  }

  const medianResult = summarizeRuns(
    results,
    Object.fromEntries(
      Object.keys(LIGHTHOUSE_AUDITS).map((name) => [name, (run) => run[name]]),
    ),
  );

  const summary = {
    configuration: {
      runs,
      profile: "Lighthouse mobile, simulated throttling",
      chromePath: chromePath || "Puppeteer default",
    },
    median: medianResult,
    runs: results,
  };
  await writeJson(path.join(lighthouseDirectory, "summary.json"), summary);
  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    runs: 5,
    path: "/components/tinder-swiper",
    output: "performance-results/tinder",
    label: "lighthouse",
  });
  const runs = positiveInteger(args.runs, "runs");
  const outputDirectory = await makeOutputDirectory(args.output, args.label);
  const port = await findAvailablePort(args.port);
  const chromePath = await findChromePath(args.chromePath);
  let previewServer = null;

  try {
    let targetUrl = args.url;
    if (!targetUrl) {
      process.stdout.write("Building the production app...\n");
      previewServer = await startProductionPreview({ outputDirectory, port });
      targetUrl = new URL(args.path, `${previewServer.origin}/`).href;
    }

    const summary = await runLighthouseAudit({
      url: targetUrl,
      runs,
      outputDirectory,
      chromePath,
    });
    await writeJson(path.join(outputDirectory, "summary.json"), {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      targetUrl,
      lighthouse: summary,
    });

    process.stdout.write(
      `\nLighthouse median: score ${summary.median.performanceScore}, ` +
        `LCP ${summary.median.largestContentfulPaintMs} ms, ` +
        `TBT ${summary.median.totalBlockingTimeMs} ms\n` +
        `Reports: ${outputDirectory}\n`,
    );
  } finally {
    await previewServer?.close();
  }
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
