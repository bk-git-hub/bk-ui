import { execFileSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { cpus } from "node:os";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import puppeteer from "puppeteer";
import { build as viteBuild } from "vite";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const resultDirectory = resolve(projectRoot, "performance-results");
const benchmarkOutDirectory = resolve(projectRoot, ".perf-dist");
const benchmarkEntry = resolve(
  projectRoot,
  "benchmarks",
  "coverflow",
  "index.html",
);
const REPORT_SCHEMA_VERSION = 2;
const HARNESS = Object.freeze({
  id: "bk-ui-coverflow-wheel-drag",
  version: 2,
  wheelBursts: 40,
  wheelEventsPerBurst: 3,
  wheelDeltaY: 18,
  dragSteps: 60,
  dragStepIntervalMs: 16,
  wheelSettleMs: 150,
  dragSettleMs: 750,
});

const options = parseOptions(process.argv.slice(2));

function parseOptions(args) {
  const values = {};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) continue;

    const [rawName, inlineValue] = argument.slice(2).split("=", 2);
    if (rawName.startsWith("no-") && inlineValue === undefined) {
      values[rawName.slice(3)] = false;
      continue;
    }

    if (inlineValue !== undefined) {
      values[rawName] = inlineValue;
      continue;
    }

    const nextArgument = args[index + 1];
    if (nextArgument && !nextArgument.startsWith("--")) {
      values[rawName] = nextArgument;
      index += 1;
    } else {
      values[rawName] = true;
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const parsed = {
    label: sanitizeLabel(String(values.label ?? `run-${timestamp}`)),
    runs: toPositiveInteger(values.runs ?? 5, "runs"),
    cpu: toPositiveNumber(values.cpu ?? 4, "cpu"),
    items: toPositiveInteger(values.items ?? 30, "items"),
    port: toPositiveInteger(values.port ?? 4173, "port"),
    assets: String(values.assets ?? "fixture"),
    headed: toBoolean(values.headed ?? false, "headed"),
    skipBuild: toBoolean(values["skip-build"] ?? false, "skip-build"),
    connect: toOptionalString(values.connect, "connect"),
  };

  if (!new Set(["fixture", "real"]).has(parsed.assets)) {
    throw new Error("--assets must be either 'fixture' or 'real'.");
  }
  if (parsed.items > 500) {
    throw new Error("--items must be 500 or fewer.");
  }

  return parsed;
}

function sanitizeLabel(value) {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  if (!sanitized) throw new Error("--label must contain a valid character.");
  return sanitized;
}

function toPositiveInteger(value, name) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`--${name} must be a positive integer.`);
  }
  return number;
}

function toPositiveNumber(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`--${name} must be a positive number.`);
  }
  return number;
}

function toBoolean(value, name) {
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  throw new Error(
    `--${name} must be a boolean (true/false, 1/0, yes/no, or on/off).`,
  );
}

function toOptionalString(value, name) {
  if (value === undefined || value === null || value === false) return null;
  if (value === true) {
    throw new Error(`--${name} requires a value.`);
  }

  const normalized = String(value).trim();
  if (!normalized) {
    throw new Error(`--${name} requires a non-empty value.`);
  }

  return normalized;
}

async function fileExists(path) {
  try {
    await access(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findBrowserExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined,
    process.platform === "win32"
      ? "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
      : undefined,
    process.platform === "win32"
      ? `${process.env.LOCALAPPDATA ?? ""}/Google/Chrome/Application/chrome.exe`
      : undefined,
    process.platform === "win32"
      ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
      : undefined,
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined,
    process.platform === "linux" ? "/usr/bin/google-chrome" : undefined,
    process.platform === "linux" ? "/usr/bin/chromium" : undefined,
  ].filter(Boolean);

  try {
    candidates.unshift(puppeteer.executablePath());
  } catch {
    // The bundled Chrome download is optional; system browser paths follow.
  }

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  throw new Error(
    "Chrome or Edge was not found. Set PUPPETEER_EXECUTABLE_PATH or run `pnpm exec puppeteer browsers install chrome`.",
  );
}

function getGitMetadata() {
  const runGit = (args) =>
    execFileSync("git", args, {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

  try {
    return {
      revision: runGit(["rev-parse", "--short", "HEAD"]),
      dirty: runGit(["status", "--porcelain"]).length > 0,
    };
  } catch {
    return { revision: "unknown", dirty: true };
  }
}

function percentile(values, ratio) {
  const sorted = values
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (sorted.length === 0) return null;

  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  );
  return sorted[index];
}

function median(values) {
  const sorted = values
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (sorted.length === 0) return null;

  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function maximum(values) {
  const finiteValues = values.filter(Number.isFinite);
  return finiteValues.length === 0 ? null : Math.max(...finiteValues);
}

function percentage(count, total) {
  if (!Number.isFinite(count) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  return round((count / total) * 100);
}

function metricMap(metrics) {
  return Object.fromEntries(
    (metrics.metrics ?? []).map(({ name, value }) => [name, value]),
  );
}

function millisecondsDelta(before, after, name) {
  if (!Number.isFinite(before[name]) || !Number.isFinite(after[name])) {
    return null;
  }
  return round((after[name] - before[name]) * 1000);
}

async function installPageObservers(page) {
  await page.evaluateOnNewDocument(() => {
    const listenerStats = {
      wheelAdds: 0,
      wheelRemoves: 0,
      keyAdds: 0,
      keyRemoves: 0,
      pointerAdds: 0,
      pointerRemoves: 0,
    };
    const nativeAddEventListener = EventTarget.prototype.addEventListener;
    const nativeRemoveEventListener = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function addEventListener(
      type,
      listener,
      eventOptions,
    ) {
      if (type === "wheel") listenerStats.wheelAdds += 1;
      if (type === "keydown") listenerStats.keyAdds += 1;
      if (
        [
          "mousemove",
          "mouseup",
          "touchmove",
          "touchend",
          "touchcancel",
        ].includes(type)
      ) {
        listenerStats.pointerAdds += 1;
      }
      return nativeAddEventListener.call(this, type, listener, eventOptions);
    };

    EventTarget.prototype.removeEventListener = function removeEventListener(
      type,
      listener,
      eventOptions,
    ) {
      if (type === "wheel") listenerStats.wheelRemoves += 1;
      if (type === "keydown") listenerStats.keyRemoves += 1;
      if (
        [
          "mousemove",
          "mouseup",
          "touchmove",
          "touchend",
          "touchcancel",
        ].includes(type)
      ) {
        listenerStats.pointerRemoves += 1;
      }
      return nativeRemoveEventListener.call(this, type, listener, eventOptions);
    };

    const state = {
      frames: [],
      longTasks: [],
      lcp: [],
      running: false,
      lastFrame: null,
      animationFrame: 0,
      measurementStart: null,
      longTaskSupported: false,
      lcpSupported: false,
    };

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          state.longTasks.push({
            startTime: entry.startTime,
            duration: entry.duration,
          });
        }
      }).observe({ type: "longtask", buffered: true });
      state.longTaskSupported = true;
    } catch {
      // Long Task API is not supported in every browser build.
    }

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          state.lcp.push(entry.startTime);
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      state.lcpSupported = true;
    } catch {
      // LCP is optional for interaction-only runs.
    }

    const tick = (time) => {
      if (!state.running) return;
      if (state.lastFrame !== null) state.frames.push(time - state.lastFrame);
      state.lastFrame = time;
      state.animationFrame = requestAnimationFrame(tick);
    };

    window.__coverflowBenchmark = {
      listenerStats,
      start() {
        state.frames = [];
        state.longTasks = [];
        state.lastFrame = null;
        state.measurementStart = performance.now();
        state.running = true;
        state.animationFrame = requestAnimationFrame(tick);
        return { ...listenerStats };
      },
      stop() {
        const measurementEnd = performance.now();
        state.running = false;
        cancelAnimationFrame(state.animationFrame);
        return {
          frames: [...state.frames],
          longTasks: state.longTasks.filter(
            ({ startTime, duration }) =>
              state.measurementStart !== null &&
              startTime + duration >= state.measurementStart &&
              startTime <= measurementEnd,
          ),
          lcp: [...state.lcp],
          longTaskSupported: state.longTaskSupported,
          lcpSupported: state.lcpSupported,
          listenerStats: { ...listenerStats },
        };
      },
    };
  });
}

async function configureAssets(page, fixtureImage) {
  const network = {
    imageRequests: 0,
    coverflowSourceRequests: 0,
    coverflowNetworkHops: 0,
    imageResponseBytes: 0,
  };

  page.on("request", (request) => {
    if (request.resourceType() !== "image") return;
    network.imageRequests += 1;
    if (request.url().includes("picsum.photos/seed/")) {
      network.coverflowSourceRequests += 1;
    }
    if (request.url().includes("picsum.photos")) {
      network.coverflowNetworkHops += 1;
    }
  });

  page.on("response", (response) => {
    if (response.request().resourceType() !== "image") return;
    const contentLength = Number(response.headers()["content-length"] ?? 0);
    if (Number.isFinite(contentLength)) {
      network.imageResponseBytes += contentLength;
    }
  });

  if (options.assets === "fixture") {
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      if (request.url().includes("picsum.photos")) {
        await request.respond({
          status: 200,
          contentType: "image/png",
          headers: {
            "cache-control": "no-store",
            "content-length": String(fixtureImage.byteLength),
          },
          body: fixtureImage,
        });
        return;
      }
      if (request.resourceType() === "font") {
        await request.abort();
        return;
      }
      await request.continue();
    });
  }

  return network;
}

async function wait(milliseconds) {
  await new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds),
  );
}

function contentType(path) {
  return (
    {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    }[extname(path)] ?? "application/octet-stream"
  );
}

async function startStaticServer(root, port) {
  const normalizedRoot = resolve(root);
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const relativePath = decodeURIComponent(requestUrl.pathname).replace(
        /^\/+/,
        "",
      );
      const requestedPath = resolve(
        normalizedRoot,
        relativePath || "index.html",
      );
      if (!requestedPath.startsWith(normalizedRoot)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      const body = await readFile(requestedPath);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": contentType(requestedPath),
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(port, "127.0.0.1", resolvePromise);
  });
  return server;
}

async function measureRun(browser, browserUrl, fixtureImage, runNumber) {
  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();
    const client = await page.createCDPSession();

    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await client.send("Emulation.setCPUThrottlingRate", { rate: options.cpu });
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Performance.enable");
    await installPageObservers(page);
    const network = await configureAssets(page, fixtureImage);

    const startedAt = performance.now();
    await page.goto(browserUrl, {
      waitUntil: options.assets === "fixture" ? "networkidle0" : "networkidle2",
      timeout: 60_000,
    });
    await page.waitForSelector("[data-coverflow-benchmark] .touch-none", {
      timeout: 15_000,
    });
    let initialImagesReady = true;
    try {
      await page.waitForFunction(
        () => {
          const root = document.querySelector(
            "[data-coverflow-benchmark] .touch-none",
          );
          if (!root) return false;

          const displayedImages = [...root.querySelectorAll("img")].filter(
            (image) => {
              const style = getComputedStyle(image);
              const bounds = image.getBoundingClientRect();
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                bounds.width > 0 &&
                bounds.height > 0
              );
            },
          );
          return (
            displayedImages.length > 0 &&
            displayedImages.every(
              (image) => image.complete && image.naturalWidth > 0,
            )
          );
        },
        { timeout: 15_000 },
      );
    } catch (error) {
      initialImagesReady = false;
      if (options.assets === "fixture") {
        throw new Error(
          "Fixture images did not become ready within 15 seconds.",
          { cause: error },
        );
      }
    }
    await wait(250);

    const loadWallTimeMs = round(performance.now() - startedAt);
    const initialNetwork = { ...network };
    const load = await page.evaluate(() => {
      const root = document.querySelector(
        "[data-coverflow-benchmark] .touch-none",
      );
      const cards = root ? [...root.children] : [];
      const images = root ? [...root.querySelectorAll("img")] : [];
      const navigation = performance.getEntriesByType("navigation")[0];
      const benchmark = window.__coverflowBenchmark.stop();

      return {
        navigationMs: navigation?.duration ?? null,
        domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
        loadEventMs: navigation?.loadEventEnd ?? null,
        lcpMs: benchmark.lcpSupported ? (benchmark.lcp.at(-1) ?? null) : null,
        cardCount: cards.length,
        visibleCardCount: cards.filter(
          (card) => getComputedStyle(card).display !== "none",
        ).length,
        imageElementCount: images.length,
        completedImageCount: images.filter(
          (image) => image.complete && image.naturalWidth > 0,
        ).length,
      };
    });

    const beforeMetrics = metricMap(
      await client.send("Performance.getMetrics"),
    );
    const listenerStart = await page.evaluate(() =>
      window.__coverflowBenchmark.start(),
    );

    const wheelDurations = await page.evaluate(
      async ({ bursts, eventsPerBurst, deltaY }) => {
        const target = document.querySelector(
          "[data-coverflow-benchmark] .touch-none",
        )?.parentElement;
        if (!target) throw new Error("Coverflow wheel target was not found.");

        const durations = [];
        for (let burst = 0; burst < bursts; burst += 1) {
          for (
            let eventIndex = 0;
            eventIndex < eventsPerBurst;
            eventIndex += 1
          ) {
            const startedAt = performance.now();
            target.dispatchEvent(
              new WheelEvent("wheel", {
                deltaY,
                bubbles: true,
                cancelable: true,
              }),
            );
            durations.push(performance.now() - startedAt);
          }
          await new Promise(requestAnimationFrame);
        }
        return durations;
      },
      {
        bursts: HARNESS.wheelBursts,
        eventsPerBurst: HARNESS.wheelEventsPerBurst,
        deltaY: HARNESS.wheelDeltaY,
      },
    );

    const wheelObserved = await page.evaluate(() =>
      window.__coverflowBenchmark.stop(),
    );
    await wait(HARNESS.wheelSettleMs);

    const touchArea = await page.$("[data-coverflow-benchmark] .touch-none");
    const bounds = await touchArea?.boundingBox();
    if (!bounds) throw new Error("Coverflow drag target was not measurable.");

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    await page.mouse.move(centerX + 120, centerY);
    await page.evaluate(() => window.__coverflowBenchmark.start());
    await page.mouse.down();
    for (let step = 1; step <= HARNESS.dragSteps; step += 1) {
      await page.mouse.move(centerX + 120 - step * 4, centerY);
      await wait(HARNESS.dragStepIntervalMs);
    }
    await page.mouse.up();
    await wait(HARNESS.dragSettleMs);

    const dragObserved = await page.evaluate(() =>
      window.__coverflowBenchmark.stop(),
    );
    const afterMetrics = metricMap(await client.send("Performance.getMetrics"));
    await client.send("HeapProfiler.collectGarbage").catch(() => undefined);
    const runtimeMetrics = metricMap(
      await client.send("Performance.getMetrics"),
    );

    const frames = [...wheelObserved.frames, ...dragObserved.frames].filter(
      (duration) => Number.isFinite(duration) && duration > 0,
    );
    const longTaskSupported =
      wheelObserved.longTaskSupported && dragObserved.longTaskSupported;
    const longTasks = [
      ...wheelObserved.longTasks,
      ...dragObserved.longTasks,
    ].filter(({ duration }) => Number.isFinite(duration));
    const listenerEnd = dragObserved.listenerStats;

    return {
      run: runNumber,
      load: {
        ...Object.fromEntries(
          Object.entries(load).map(([name, value]) => [name, round(value)]),
        ),
        initialImagesReady,
        wallTimeMs: loadWallTimeMs,
        ...initialNetwork,
      },
      interaction: {
        frameCount: frames.length,
        frameP50Ms: round(percentile(frames, 0.5)),
        frameP95Ms: round(percentile(frames, 0.95)),
        frameP99Ms: round(percentile(frames, 0.99)),
        frameMaxMs: round(maximum(frames)),
        framesOver20MsPercent: percentage(
          frames.filter((duration) => duration > 20).length,
          frames.length,
        ),
        framesOver33MsPercent: percentage(
          frames.filter((duration) => duration > 33.34).length,
          frames.length,
        ),
        wheelHandlerP50Ms: round(percentile(wheelDurations, 0.5), 3),
        wheelHandlerP95Ms: round(percentile(wheelDurations, 0.95), 3),
        wheelHandlerMaxMs: round(maximum(wheelDurations), 3),
        longTaskCount: longTaskSupported ? longTasks.length : null,
        longTaskTotalMs: longTaskSupported
          ? round(longTasks.reduce((total, task) => total + task.duration, 0))
          : null,
        longTaskMaxMs: longTaskSupported
          ? round(maximum(longTasks.map(({ duration }) => duration)))
          : null,
        taskDurationMs: millisecondsDelta(
          beforeMetrics,
          afterMetrics,
          "TaskDuration",
        ),
        scriptDurationMs: millisecondsDelta(
          beforeMetrics,
          afterMetrics,
          "ScriptDuration",
        ),
        layoutDurationMs: millisecondsDelta(
          beforeMetrics,
          afterMetrics,
          "LayoutDuration",
        ),
        styleDurationMs: millisecondsDelta(
          beforeMetrics,
          afterMetrics,
          "RecalcStyleDuration",
        ),
        listenerAdds:
          listenerEnd.wheelAdds -
          listenerStart.wheelAdds +
          (listenerEnd.keyAdds - listenerStart.keyAdds) +
          (listenerEnd.pointerAdds - listenerStart.pointerAdds),
        listenerRemoves:
          listenerEnd.wheelRemoves -
          listenerStart.wheelRemoves +
          (listenerEnd.keyRemoves - listenerStart.keyRemoves) +
          (listenerEnd.pointerRemoves - listenerStart.pointerRemoves),
      },
      runtime: {
        jsHeapUsedBytes: round(runtimeMetrics.JSHeapUsedSize),
        nodes: round(runtimeMetrics.Nodes),
        eventListeners: round(runtimeMetrics.JSEventListeners),
      },
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}
function summarizeRuns(runs) {
  const aggregate = (selector) => round(median(runs.map(selector)));

  return {
    aggregation: "median across runs",
    load: {
      navigationMs: aggregate((run) => run.load.navigationMs),
      lcpMs: aggregate((run) => run.load.lcpMs),
      initialImagesReadyPercent: percentage(
        runs.filter((run) => run.load.initialImagesReady).length,
        runs.length,
      ),
      wallTimeMs: aggregate((run) => run.load.wallTimeMs),
      cardCount: aggregate((run) => run.load.cardCount),
      visibleCardCount: aggregate((run) => run.load.visibleCardCount),
      imageElementCount: aggregate((run) => run.load.imageElementCount),
      completedImageCount: aggregate((run) => run.load.completedImageCount),
      coverflowSourceRequests: aggregate(
        (run) => run.load.coverflowSourceRequests,
      ),
      imageResponseBytes: aggregate((run) => run.load.imageResponseBytes),
    },
    interaction: {
      frameP50Ms: aggregate((run) => run.interaction.frameP50Ms),
      frameP95Ms: aggregate((run) => run.interaction.frameP95Ms),
      frameP99Ms: aggregate((run) => run.interaction.frameP99Ms),
      frameMaxMs: aggregate((run) => run.interaction.frameMaxMs),
      framesOver20MsPercent: aggregate(
        (run) => run.interaction.framesOver20MsPercent,
      ),
      framesOver33MsPercent: aggregate(
        (run) => run.interaction.framesOver33MsPercent,
      ),
      wheelHandlerP95Ms: aggregate((run) => run.interaction.wheelHandlerP95Ms),
      longTaskCount: aggregate((run) => run.interaction.longTaskCount),
      longTaskTotalMs: aggregate((run) => run.interaction.longTaskTotalMs),
      taskDurationMs: aggregate((run) => run.interaction.taskDurationMs),
      scriptDurationMs: aggregate((run) => run.interaction.scriptDurationMs),
      layoutDurationMs: aggregate((run) => run.interaction.layoutDurationMs),
      styleDurationMs: aggregate((run) => run.interaction.styleDurationMs),
      listenerAdds: aggregate((run) => run.interaction.listenerAdds),
      listenerRemoves: aggregate((run) => run.interaction.listenerRemoves),
    },
    runtime: {
      jsHeapUsedBytes: aggregate((run) => run.runtime.jsHeapUsedBytes),
      nodes: aggregate((run) => run.runtime.nodes),
      eventListeners: aggregate((run) => run.runtime.eventListeners),
    },
  };
}

function formatMetric(value, unit = "") {
  if (!Number.isFinite(value)) return "n/a";
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "n/a";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${round(bytes / 1024)} KiB`;
  return `${round(bytes / 1024 ** 2)} MiB`;
}

function sumMetrics(...values) {
  if (!values.every(Number.isFinite)) return null;
  return round(values.reduce((total, value) => total + value, 0));
}

function renderMarkdown(report) {
  const { metadata, summary } = report;
  return `# Coverflow benchmark: ${metadata.label}

- Generated: ${metadata.generatedAt}
- Browser: ${metadata.browser} (${metadata.browserMode})
- Host: ${metadata.platform}, ${metadata.cpuModel}
- Runs: ${metadata.runs} (${summary.aggregation})
- Conditions: ${metadata.viewport.width}x${metadata.viewport.height}, CPU ${metadata.cpuThrottle}x, ${metadata.assets} assets, ${metadata.items} items
- Harness: ${metadata.harness.id}@${metadata.harness.version} (schema ${metadata.schemaVersion})
- Git: ${metadata.git.revision}${metadata.git.dirty ? " (dirty)" : ""}

| Metric | Result |
| --- | ---: |
| LCP | ${formatMetric(summary.load.lcpMs, "ms")} |
| Initial image readiness | ${formatMetric(summary.load.initialImagesReadyPercent, "%")} |
| Mounted cards | ${formatMetric(summary.load.cardCount)} |
| Visible cards | ${formatMetric(summary.load.visibleCardCount)} |
| Image elements / completed | ${formatMetric(summary.load.imageElementCount)} / ${formatMetric(summary.load.completedImageCount)} |
| Coverflow image requests | ${formatMetric(summary.load.coverflowSourceRequests)} |
| Image response bytes | ${formatBytes(summary.load.imageResponseBytes)} |
| p95 active frame time | ${formatMetric(summary.interaction.frameP95Ms, "ms")} |
| Active frames over 20 ms | ${formatMetric(summary.interaction.framesOver20MsPercent, "%")} |
| Active frames over 33.34 ms | ${formatMetric(summary.interaction.framesOver33MsPercent, "%")} |
| p95 burst wheel handler | ${formatMetric(summary.interaction.wheelHandlerP95Ms, "ms")} |
| Main-thread task time | ${formatMetric(summary.interaction.taskDurationMs, "ms")} |
| Script time | ${formatMetric(summary.interaction.scriptDurationMs, "ms")} |
| Style + layout time | ${formatMetric(sumMetrics(summary.interaction.styleDurationMs, summary.interaction.layoutDurationMs), "ms")} |
| Long tasks / total | ${formatMetric(summary.interaction.longTaskCount)} / ${formatMetric(summary.interaction.longTaskTotalMs, "ms")} |
| Listener add / remove during interaction | ${formatMetric(summary.interaction.listenerAdds)} / ${formatMetric(summary.interaction.listenerRemoves)} |
| JS heap used | ${formatBytes(summary.runtime.jsHeapUsedBytes)} |
| DOM nodes | ${formatMetric(summary.runtime.nodes)} |
`;
}
async function main() {
  const fixtureImage =
    options.assets === "fixture"
      ? await readFile(resolve(projectRoot, "public", "BKUI.png"))
      : null;
  const ownsBrowser = !options.connect;
  let executablePath = null;
  let server = null;
  let browser = null;
  let operationError = null;

  try {
    if (!options.skipBuild) {
      process.stdout.write("Building the dedicated Coverflow benchmark...\n");
      await viteBuild({
        root: projectRoot,
        configFile: resolve(projectRoot, "vite.config.ts"),
        logLevel: "warn",
        build: {
          outDir: benchmarkOutDirectory,
          emptyOutDir: true,
          rollupOptions: { input: benchmarkEntry },
        },
      });
    }

    executablePath = options.connect ? null : await findBrowserExecutable();
    server = await startStaticServer(benchmarkOutDirectory, options.port);
    browser = options.connect
      ? await puppeteer.connect({ browserURL: options.connect })
      : await puppeteer.launch({
          executablePath,
          headless: !options.headed,
        });

    const browserUrl = `http://127.0.0.1:${options.port}/benchmarks/coverflow/index.html?items=${options.items}`;
    const runs = [];

    for (let runNumber = 1; runNumber <= options.runs; runNumber += 1) {
      process.stdout.write(`Running ${runNumber}/${options.runs}...\n`);
      runs.push(await measureRun(browser, browserUrl, fixtureImage, runNumber));
    }

    const hostCpus = cpus();
    const report = {
      metadata: {
        schemaVersion: REPORT_SCHEMA_VERSION,
        harness: { ...HARNESS },
        label: options.label,
        generatedAt: new Date().toISOString(),
        browser: await browser.version(),
        browserExecutable: executablePath,
        browserMode: options.connect
          ? "connected"
          : options.headed
            ? "headed"
            : "headless",
        headless: options.connect ? null : !options.headed,
        node: process.version,
        platform: `${process.platform}-${process.arch}`,
        cpuModel: hostCpus[0]?.model?.trim() || "unknown",
        logicalCpuCount: hostCpus.length || null,
        runs: options.runs,
        cpuThrottle: options.cpu,
        viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
        assets: options.assets,
        items: options.items,
        git: getGitMetadata(),
      },
      summary: summarizeRuns(runs),
      runs,
    };

    await mkdir(resultDirectory, { recursive: true });
    const jsonPath = resolve(resultDirectory, `${options.label}.json`);
    const markdownPath = resolve(resultDirectory, `${options.label}.md`);
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(markdownPath, renderMarkdown(report), "utf8");

    process.stdout.write(`${renderMarkdown(report)}\n`);
    process.stdout.write(`JSON: ${jsonPath}\nMarkdown: ${markdownPath}\n`);
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    const cleanupErrors = [];

    if (browser) {
      try {
        if (ownsBrowser) await browser.close();
        else await browser.disconnect();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }

    if (server) {
      try {
        await new Promise((resolvePromise, rejectPromise) => {
          server.close((error) =>
            error ? rejectPromise(error) : resolvePromise(),
          );
        });
      } catch (error) {
        cleanupErrors.push(error);
      }
    }

    if (cleanupErrors.length > 0) {
      if (operationError) {
        for (const error of cleanupErrors) {
          console.error("Benchmark cleanup warning:", error);
        }
      } else {
        throw new AggregateError(cleanupErrors, "Benchmark cleanup failed.");
      }
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
