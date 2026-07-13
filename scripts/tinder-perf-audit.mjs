import { writeFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import {
  collectBundleInventory,
  comparisonRow,
  findAvailablePort,
  findChromePath,
  finiteNumber,
  formatBytes,
  formatMilliseconds,
  formatPercent,
  makeOutputDirectory,
  parseArgs,
  percentile,
  positiveInteger,
  projectRoot,
  readBaseline,
  round,
  startProductionPreview,
  summarizeRuns,
  writeJson,
} from "./tinder-perf-utils.mjs";
import { runLighthouseAudit } from "./tinder-lighthouse.mjs";

const DEFAULT_PATH = "/components/tinder-swiper";
const FRAME_BUDGET_MS = 1000 / 60;

function networkSummary(responses, origin) {
  const completed = responses.filter((response) => !response.failed);
  const select = (predicate) => completed.filter(predicate);
  const sumBytes = (items) =>
    items.reduce((total, response) => total + response.encodedDataLength, 0);
  const sameOrigin = select(
    (response) => new URL(response.url).origin === origin,
  );
  const images = select((response) => response.resourceType === "Image");
  const javascript = select((response) => response.resourceType === "Script");
  const css = select((response) => response.resourceType === "Stylesheet");

  return {
    requestCount: completed.length,
    failedRequestCount: responses.length - completed.length,
    transferBytes: sumBytes(completed),
    sameOriginBytes: sumBytes(sameOrigin),
    thirdPartyBytes: sumBytes(completed) - sumBytes(sameOrigin),
    imageBytes: sumBytes(images),
    javascriptBytes: sumBytes(javascript),
    cssBytes: sumBytes(css),
  };
}

async function measureSwipe(page) {
  const card = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".cursor-grab"))
      .filter((element) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && rect.width > 0 && rect.height > 0;
      })
      .sort(
        (left, right) =>
          Number(getComputedStyle(right).zIndex) -
          Number(getComputedStyle(left).zIndex),
      );
    const rect = cards[0]?.getBoundingClientRect();
    return rect
      ? {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          dragDistance: Math.min(180, rect.width * 0.45),
        }
      : null;
  });
  if (!card) return { available: false };

  await page.evaluate(() => {
    const measurement = {
      active: true,
      startedAt: performance.now(),
      previousTimestamp: null,
      frameDurations: [],
      longTasks: [],
      observer: null,
    };
    measurement.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        measurement.longTasks.push(entry.duration);
      }
    });
    try {
      measurement.observer.observe({ type: "longtask" });
    } catch {
      // Long Task API is not available in every browser mode.
    }
    const recordFrame = (timestamp) => {
      if (measurement.previousTimestamp !== null) {
        measurement.frameDurations.push(
          timestamp - measurement.previousTimestamp,
        );
      }
      measurement.previousTimestamp = timestamp;
      if (measurement.active) requestAnimationFrame(recordFrame);
    };
    requestAnimationFrame(recordFrame);
    window.__tinderSwipeMeasurement = measurement;
  });

  await page.mouse.move(card.x, card.y);
  await page.mouse.down();
  const dragSteps = 24;
  for (let step = 1; step <= dragSteps; step += 1) {
    await page.mouse.move(
      card.x + (card.dragDistance * step) / dragSteps,
      card.y,
    );
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
  await page.mouse.up();
  await new Promise((resolve) => setTimeout(resolve, 600));

  const measurement = await page.evaluate(() => {
    const result = window.__tinderSwipeMeasurement;
    result.active = false;
    result.observer?.disconnect();
    return {
      durationMs: performance.now() - result.startedAt,
      frameDurations: result.frameDurations,
      longTasks: result.longTasks,
    };
  });
  const p95FrameMs = percentile(measurement.frameDurations, 95);
  const overBudgetFrames = measurement.frameDurations.filter(
    (duration) => duration > FRAME_BUDGET_MS + 0.5,
  ).length;

  return {
    available: true,
    interaction: "pointer drag and fly-out",
    durationMs: measurement.durationMs,
    frameCount: measurement.frameDurations.length,
    p95FrameMs,
    maxFrameMs:
      measurement.frameDurations.length > 0
        ? Math.max(...measurement.frameDurations)
        : null,
    overBudgetFrames,
    overBudgetPercent:
      measurement.frameDurations.length === 0
        ? null
        : (overBudgetFrames / measurement.frameDurations.length) * 100,
    longTaskCount: measurement.longTasks.length,
    longTaskTotalMs: measurement.longTasks.reduce(
      (sum, duration) => sum + duration,
      0,
    ),
  };
}

async function measurePage({ browser, url, run, cpuSlowdown, throttle }) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const client = await page.createCDPSession();
  const requests = new Map();
  const responses = [];

  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Emulation.setCPUThrottlingRate", { rate: cpuSlowdown });
  if (throttle) {
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      connectionType: "cellular4g",
    });
  }

  client.on("Network.requestWillBeSent", (event) => {
    requests.set(event.requestId, {
      url: event.request.url,
      resourceType: event.type,
    });
  });
  client.on("Network.loadingFinished", (event) => {
    const request = requests.get(event.requestId);
    if (request) {
      responses.push({
        ...request,
        encodedDataLength: event.encodedDataLength,
        failed: false,
      });
    }
  });
  client.on("Network.loadingFailed", (event) => {
    const request = requests.get(event.requestId);
    if (request) {
      responses.push({
        ...request,
        encodedDataLength: 0,
        failed: true,
        errorText: event.errorText,
      });
    }
  });

  await page.evaluateOnNewDocument(() => {
    window.__tinderPerf = { paints: {}, lcpMs: null };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__tinderPerf.paints[entry.name] = entry.startTime;
        }
      }).observe({ type: "paint", buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        window.__tinderPerf.lcpMs = entries.at(-1)?.startTime ?? null;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Paint observers are best-effort; navigation timing remains available.
    }
  });

  try {
    const startedAt = Date.now();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 120_000 });
    await page.waitForSelector("h1", { timeout: 30_000 });
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    const timing = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      return {
        firstContentfulPaintMs:
          window.__tinderPerf?.paints?.["first-contentful-paint"] ?? null,
        largestContentfulPaintMs: window.__tinderPerf?.lcpMs ?? null,
        domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
        loadEventMs: navigation?.loadEventEnd ?? null,
      };
    });
    const loadNetwork = networkSummary(responses, new URL(url).origin);

    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      isMobile: false,
    });
    await page.waitForSelector(".cursor-grab", {
      visible: true,
      timeout: 30_000,
    });
    const interaction = await measureSwipe(page);
    await new Promise((resolve) => setTimeout(resolve, 250));

    return {
      run,
      wallTimeMs: Date.now() - startedAt,
      timing: Object.fromEntries(
        Object.entries(timing).map(([name, value]) => [name, round(value)]),
      ),
      network: loadNetwork,
      interaction: Object.fromEntries(
        Object.entries(interaction).map(([name, value]) => [
          name,
          typeof value === "number" ? round(value) : value,
        ]),
      ),
      responses,
    };
  } finally {
    await context.close();
  }
}

function buildComparison(baseline, summary) {
  if (!baseline) return [];
  const rows = [
    comparisonRow(
      "JavaScript (gzip)",
      baseline.bundle?.totals?.javascript?.gzipBytes,
      summary.bundle?.totals?.javascript?.gzipBytes,
      "bytes",
    ),
    comparisonRow(
      "Network transfer",
      baseline.pageLoad?.median?.transferBytes,
      summary.pageLoad?.median?.transferBytes,
      "bytes",
    ),
    comparisonRow(
      "Initial page JavaScript transfer",
      baseline.pageLoad?.median?.javascriptBytes,
      summary.pageLoad?.median?.javascriptBytes,
      "bytes",
    ),
    comparisonRow(
      "Image transfer",
      baseline.pageLoad?.median?.imageBytes,
      summary.pageLoad?.median?.imageBytes,
      "bytes",
    ),
    comparisonRow(
      "Lighthouse LCP",
      baseline.lighthouse?.median?.largestContentfulPaintMs,
      summary.lighthouse?.median?.largestContentfulPaintMs,
      "ms",
    ),
    comparisonRow(
      "Lighthouse TBT",
      baseline.lighthouse?.median?.totalBlockingTimeMs,
      summary.lighthouse?.median?.totalBlockingTimeMs,
      "ms",
    ),
    comparisonRow(
      "Lighthouse score",
      baseline.lighthouse?.median?.performanceScore,
      summary.lighthouse?.median?.performanceScore,
      "score",
      true,
    ),
    comparisonRow(
      "Pointer-drag swipe p95 frame",
      baseline.interaction?.median?.p95FrameMs,
      summary.interaction?.median?.p95FrameMs,
      "ms",
    ),
  ];
  return rows.filter(Boolean);
}

function formatComparisonValue(value, unit) {
  if (unit === "bytes") return formatBytes(value);
  if (unit === "ms") return formatMilliseconds(value);
  return Number.isFinite(value) ? String(round(value, 1)) : "—";
}

function createMarkdown(summary) {
  const bundle = summary.bundle.totals;
  const network = summary.pageLoad.median;
  const lighthouse = summary.lighthouse.median;
  const interaction = summary.interaction.median;
  const lines = [
    "# Tinder slider performance report",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    `Target: \`${summary.targetUrl}\``,
    "",
    "| Metric | Median / size |",
    "| --- | ---: |",
    `| Total built JavaScript, including lazy chunks (raw) | ${formatBytes(bundle.javascript.rawBytes)} |`,
    `| Total built JavaScript, including lazy chunks (gzip) | ${formatBytes(bundle.javascript.gzipBytes)} |`,
    `| CSS bundle (gzip) | ${formatBytes(bundle.css.gzipBytes)} |`,
    `| Page network transfer | ${formatBytes(network.transferBytes)} |`,
    `| Initial page JavaScript transfer | ${formatBytes(network.javascriptBytes)} |`,
    `| Image network transfer | ${formatBytes(network.imageBytes)} |`,
    `| Lighthouse performance | ${lighthouse.performanceScore} / 100 |`,
    `| Lighthouse FCP | ${formatMilliseconds(lighthouse.firstContentfulPaintMs)} |`,
    `| Lighthouse LCP | ${formatMilliseconds(lighthouse.largestContentfulPaintMs)} |`,
    `| Lighthouse TBT | ${formatMilliseconds(lighthouse.totalBlockingTimeMs)} |`,
    `| Pointer-drag swipe p95 frame | ${formatMilliseconds(interaction.p95FrameMs)} |`,
    `| Pointer-drag swipe frames over 16.7 ms | ${formatPercent(interaction.overBudgetPercent)} |`,
  ];

  if (summary.comparison.length > 0) {
    lines.push(
      "",
      "## Baseline comparison",
      "",
      "Positive improvement means the current result is better.",
      "",
      "| Metric | Baseline | Current | Improvement |",
      "| --- | ---: | ---: | ---: |",
      ...summary.comparison.map(
        (row) =>
          `| ${row.label} | ${formatComparisonValue(row.baseline, row.unit)} | ` +
          `${formatComparisonValue(row.current, row.unit)} | ` +
          `${formatPercent(row.improvementPercent)} |`,
      ),
    );
  }

  lines.push(
    "",
    "## Measurement profile",
    "",
    `- Repetitions: ${summary.configuration.runs}; all headline timings are medians.`,
    `- Page-load viewport: ${summary.configuration.pageLoadViewport}.`,
    `- Pointer-drag viewport: ${summary.configuration.interactionViewport}.`,
    `- Page-load throttling: ${summary.configuration.networkProfile}.`,
    `- CPU slowdown: ${summary.configuration.cpuSlowdown}x.`,
    "- Lighthouse: mobile profile with simulated throttling.",
    "",
  );
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    runs: 5,
    path: DEFAULT_PATH,
    output: "performance-results/tinder",
    label: "audit",
    cpu: 4,
    throttle: true,
  });
  const runs = positiveInteger(args.runs, "runs");
  const cpuSlowdown = finiteNumber(args.cpu, "cpu");
  const throttle = args.throttle !== "false" && args.throttle !== false;
  const outputDirectory = await makeOutputDirectory(args.output, args.label);
  const port = await findAvailablePort(args.port);
  const chromePath = await findChromePath(args.chromePath);
  const baseline = await readBaseline(args.baseline);
  let previewServer = null;
  let browser = null;

  try {
    let targetUrl = args.url;
    let bundle = null;
    if (!targetUrl) {
      process.stdout.write("Building the production app...\n");
      previewServer = await startProductionPreview({ outputDirectory, port });
      targetUrl = new URL(args.path, `${previewServer.origin}/`).href;
      bundle = await collectBundleInventory(previewServer.buildDirectory);
      await writeJson(
        path.join(outputDirectory, "bundle-inventory.json"),
        bundle,
      );
    } else if (args.dist) {
      bundle = await collectBundleInventory(
        path.resolve(projectRoot, args.dist),
      );
      await writeJson(
        path.join(outputDirectory, "bundle-inventory.json"),
        bundle,
      );
    } else {
      throw new Error(
        "--url requires --dist so bundle metrics remain comparable.",
      );
    }

    browser = await puppeteer.launch({
      executablePath: chromePath || undefined,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
      ],
    });

    const pageRuns = [];
    for (let run = 1; run <= runs; run += 1) {
      process.stdout.write(`Page load and swipe ${run}/${runs}... `);
      const result = await measurePage({
        browser,
        url: targetUrl,
        run,
        cpuSlowdown,
        throttle,
      });
      pageRuns.push(result);
      await writeJson(
        path.join(
          outputDirectory,
          "page",
          `page-run-${String(run).padStart(2, "0")}.json`,
        ),
        result,
      );
      process.stdout.write("done\n");
    }

    await browser.close();
    browser = null;

    const pageLoadMedian = summarizeRuns(pageRuns, {
      firstContentfulPaintMs: (run) => run.timing.firstContentfulPaintMs,
      largestContentfulPaintMs: (run) => run.timing.largestContentfulPaintMs,
      domContentLoadedMs: (run) => run.timing.domContentLoadedMs,
      loadEventMs: (run) => run.timing.loadEventMs,
      transferBytes: (run) => run.network.transferBytes,
      imageBytes: (run) => run.network.imageBytes,
      javascriptBytes: (run) => run.network.javascriptBytes,
      cssBytes: (run) => run.network.cssBytes,
      requestCount: (run) => run.network.requestCount,
      failedRequestCount: (run) => run.network.failedRequestCount,
    });
    const interactionRuns = pageRuns
      .map((run) => run.interaction)
      .filter((interaction) => interaction.available);
    const interactionMedian = summarizeRuns(interactionRuns, {
      p95FrameMs: (run) => run.p95FrameMs,
      maxFrameMs: (run) => run.maxFrameMs,
      overBudgetPercent: (run) => run.overBudgetPercent,
      longTaskCount: (run) => run.longTaskCount,
      longTaskTotalMs: (run) => run.longTaskTotalMs,
    });
    const allFrameP95Values = interactionRuns.map((run) => run.p95FrameMs);
    interactionMedian.p95AcrossRunsMs = round(
      percentile(allFrameP95Values, 95),
    );
    interactionMedian.availableRuns = interactionRuns.length;

    const lighthouse = await runLighthouseAudit({
      url: targetUrl,
      runs,
      outputDirectory,
      chromePath,
    });
    const summary = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      targetUrl,
      configuration: {
        runs,
        pageLoadViewport: "390x844 @2x DPR",
        interactionViewport: "1280x720 @1x DPR",
        cpuSlowdown,
        networkProfile: throttle ? "1.6 Mbps / 150 ms RTT" : "unthrottled",
        coldCache: true,
        chromePath: chromePath || "Puppeteer default",
      },
      bundle,
      pageLoad: {
        median: pageLoadMedian,
        runs: pageRuns.map(({ responses, ...run }) => run),
      },
      interaction: {
        median: interactionMedian,
        runs: interactionRuns,
      },
      lighthouse,
      comparison: [],
    };
    summary.comparison = buildComparison(baseline, summary);

    const summaryPath = path.join(outputDirectory, "summary.json");
    await writeJson(summaryPath, summary);
    await writeFile(
      path.join(outputDirectory, "summary.md"),
      createMarkdown(summary),
      "utf8",
    );

    process.stdout.write(
      `\nMedian results\n` +
        `  Total built JS gzip: ${formatBytes(bundle.totals.javascript.gzipBytes)}\n` +
        `  Initial JS transfer: ${formatBytes(pageLoadMedian.javascriptBytes)}\n` +
        `  Network: ${formatBytes(pageLoadMedian.transferBytes)}\n` +
        `  Images: ${formatBytes(pageLoadMedian.imageBytes)}\n` +
        `  LCP: ${formatMilliseconds(lighthouse.median.largestContentfulPaintMs)}\n` +
        `  TBT: ${formatMilliseconds(lighthouse.median.totalBlockingTimeMs)}\n` +
        `  Pointer-drag swipe p95 frame: ${formatMilliseconds(interactionMedian.p95FrameMs)}\n` +
        `Reports: ${outputDirectory}\n`,
    );
  } finally {
    await browser?.close();
    await previewServer?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
