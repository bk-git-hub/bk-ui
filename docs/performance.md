# Tinder slider performance measurement

The latest checked-in before/after results are documented in
[tinder-performance-results.md](./tinder-performance-results.md).

The Tinder slider audit builds and serves the production app, opens the slider at a fixed mobile viewport, and records repeatable medians instead of a single best run.

## Full audit

Run the full audit directly from the repository root:

```sh
node scripts/tinder-perf-audit.mjs --label baseline
```

The default five runs collect:

- raw and gzip-compressed JavaScript/CSS sizes across the full build;
- initial-page JavaScript transfer, reported separately from lazy chunks;
- cold-cache network bytes by resource type under a fixed mobile throttle;
- FCP/LCP navigation timings;
- p95 frame time, frames over 16.7 ms, and long tasks during an actual pointer-drag swipe and fly-out;
- Lighthouse mobile performance, FCP, LCP, Speed Index, TBT, CLS, and total byte weight.

Raw reports and a shareable `summary.json` and `summary.md` are written under `performance-results/tinder/<label>-<timestamp>/`. The production build used for the measurement is stored beside the reports, so every size in the summary is auditable.

Cold page-load metrics use a 390×844 mobile viewport at 2× DPR. The interaction trace then switches the same loaded page to 1280×720 so the repository's desktop-only card sizing remains measurable without mixing another navigation into the network totals.

Useful options:

```sh
node scripts/tinder-perf-audit.mjs --runs 7 --label baseline
node scripts/tinder-perf-audit.mjs --runs 7 --label optimized --baseline performance-results/tinder/baseline-<timestamp>/summary.json
node scripts/tinder-perf-audit.mjs --runs 3 --cpu 1 --throttle=false --label local-smoke
```

`--baseline` adds an improvement table to both summary formats. Positive percentages mean the current result is better. Use the same machine, Chrome version, run count, and options for both measurements.

## Lighthouse only

For a faster loading-only check:

```sh
node scripts/tinder-lighthouse.mjs --runs 5 --label lighthouse
```

Both scripts use an available local port automatically. Set `--chrome-path` or the `CHROME_PATH` environment variable to pin an exact Chrome executable. By default they prefer a system Chrome and fall back to the installed tooling's browser discovery.

## Suggested package scripts

If package aliases are desired, add these entries without changing the underlying commands:

```json
{
  "perf:tinder": "node scripts/tinder-perf-audit.mjs",
  "perf:tinder:lighthouse": "node scripts/tinder-lighthouse.mjs"
}
```

## Reporting improvements

Use the baseline comparison from `summary.md`, and state the test profile. For example:

> Responsive image delivery reduced median card-image transfer from X to Y (Z%) and improved mobile Lighthouse LCP from A to B (C seconds, D%), measured over seven cold-cache production runs.

Do not combine a cold-cache Lighthouse metric with an unthrottled warm-cache interaction metric without naming both profiles.
