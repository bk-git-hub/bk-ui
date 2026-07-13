# BK-UI component artifact manifest

Each installable component owns `registry/components/<slug>.json` and points
`$schema` to `../schema/component-manifest.schema.json`.

The manifest is source data, not release evidence. It pins canonical component
files to a full Git commit, declares framework and Tailwind compatibility, and
provides integration examples plus SSR/hydration and accessibility constraints.
The generator always emits `release-blocked` until a separate release process
has license approval, fixture evidence, a pushed artifact commit, and a remote
full-SHA smoke test.

## Tailwind majors

`tailwind.supportedMajors` is an ordered subset of `[3, 4]`.

- A supported major requires `supported`, `range`, `tested`, `itemName`, `scan`,
  and `representativeClasses`.
- An unsupported major requires only `supported: false` and a concrete `reason`.
- `dependencies.tailwind.<major>` must be empty for an unsupported major.
- Tailwind 3 uses `tailwind-merge@2.6.0`; Tailwind 4 uses
  `tailwind-merge@^3.3.1` when the component imports that package.
- The generator never transforms canonical source. It omits every Registry
  item, install variant, command, and fixture row for an unsupported major.

Each supported major also needs Vite and Next.js fixtures under both npm and
pnpm. An owner may declare support only after its representative utilities are
present and its full matrix passes.

## Canonical graph

- Every file is a regular `100644` blob at `sourceCommit`, and the working tree
  must match that pinned blob after Git clean filters.
- All component files stay in one `src/components/<Component>/` directory.
- React files are the common React/Next core. The `clientBoundary` is the only
  Next-only file and begins with an exact `'use client'` directive.
- Internal imports are relative. `next/*`, project aliases, undeclared runtime
  dependencies, previews, mocks, assets, and benchmark files are rejected.
- Targets start with the official shadcn `@components/` placeholder.

## Commands

```sh
pnpm artifacts:test
pnpm artifacts:build -- --manifest registry/components/<slug>.json
pnpm artifacts:check -- --manifest registry/components/<slug>.json
```

An explicit `--manifest` run is component-scoped and never reads or writes the
aggregate `registry.json`. Only the installation-strategy owner runs the
unscoped `pnpm artifacts:build` / `pnpm artifacts:check` after component inputs
are committed and clean.

Generated JSON, ZIP, Markdown, and install descriptors must not be hand-edited.
The release-blocked outputs contain repository-relative paths and hashes, never
fake public commands or unresolved URLs.
