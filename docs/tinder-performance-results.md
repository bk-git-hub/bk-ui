# Tinder slider performance results

Measured on 2026-07-13 with the reproducible audit in
[`scripts/tinder-perf-audit.mjs`](../scripts/tinder-perf-audit.mjs).

## Compared revisions

- Baseline: `1b3f872` (`test: add test code for coverflow component`)
- Optimized: `c26e79c` (`test: add repeatable Tinder performance audits`)

Both revisions were checked out in separate clean detached worktrees. This
kept unrelated work in the shared `main` worktree out of the measurement.

## Results

| Metric                                               |  Baseline | Optimized |            Improvement |
| ---------------------------------------------------- | --------: | --------: | ---------------------: |
| Total built JavaScript, including lazy chunks (gzip) | 328.1 KiB | 134.0 KiB |         59.15% smaller |
| Initial-page JavaScript transfer                     | 329.1 KiB | 102.5 KiB |         68.85% smaller |
| Total page transfer                                  | 859.3 KiB | 388.0 KiB |         54.85% smaller |
| Image transfer                                       | 474.0 KiB | 226.7 KiB |         52.17% smaller |
| Lighthouse LCP median                                |    8.74 s |    3.89 s | 4.85 s / 55.45% faster |
| Lighthouse TBT median                                |    2.75 s |    109 ms |  2.64 s / 96.03% lower |
| Lighthouse performance score                         |        38 |        85 |             +47 points |
| Pointer-drag p95 frame time                          |   33.3 ms |   17.3 ms | 16.0 ms / 48.05% lower |

The 500-card windowing test also reduces `TinderCard` creation from 500
components per index update to 3 visible components, a 99.4% reduction. This
is a deterministic render-count assertion rather than a wall-clock benchmark.

## Measurement profile

- Five cold-cache runs per revision; headline values are medians.
- Node.js 24.14.0 and Google Chrome 150.0.7871.102 on the same Windows host.
- Page load: 390×844 viewport at 2× DPR, 4× CPU slowdown, 1.6 Mbps download,
  750 Kbps upload, and 150 ms RTT.
- Lighthouse: mobile form factor with simulated throttling.
- Pointer interaction: the already-loaded page is resized to 1280×720, then
  Chrome performs a 24-step pointer drag and fly-out under the same CPU
  slowdown.

The current mobile layout gives the card container zero dimensions below the
desktop breakpoint, so the mobile LCP describes the route shell rather than
the card image. Image transfer is reported separately, and the pointer trace
uses the visible desktop layout. Do not present the LCP result as an image-LCP
improvement until the mobile layout is fixed and remeasured.

## Portfolio-ready summary

> Split route and syntax-highlighter loading and added responsive card images,
> reducing initial JavaScript transfer by 68.9% and total page transfer by
> 54.9%. Across five cold-cache mobile Lighthouse runs, median LCP improved by
> 4.85 seconds (8.74 s to 3.89 s) and TBT fell by 96.0%, while an automated
> pointer-drag trace reduced p95 frame time from 33.3 ms to 17.3 ms.
