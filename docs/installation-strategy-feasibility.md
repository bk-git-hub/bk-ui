# BK-UI installation strategy feasibility gate

Status: **fallback selected, public release on hold**

Decision date: 2026-07-13

Owner: shared BK-UI installation strategy

This document is the gate that must be satisfied before BK-UI presents any
installation command as publicly available. It is intentionally committed
before the shared registry, generator, UI, or Tinder artifacts are
implemented.

## Decision

### Branded `bk-ui@latest` CLI: NO-GO for this release

The desired commands are:

```sh
npx bk-ui@latest add tinder
pnpm dlx bk-ui@latest add tinder
```

They are not an honest current installation path:

- `npm view bk-ui` and `pnpm view bk-ui` return `E404`.
- The root package is a private Vite application at version `0.0.0`; it has no
  `bin`, `files`, CLI build, package exports, types, engines, peer dependencies,
  license, or publish metadata.
- A local tarball can prove that a future executable runs, but it cannot prove
  ownership of the npm name, the public `latest` dist-tag, registry access, or
  the exact `pnpm dlx bk-ui@latest` transport. pnpm documents `dlx` as fetching
  the requested package from a registry.
- External npm publication is explicitly outside this task.

Therefore BK-UI must not display either branded command as working. A future
CLI proposal must live in a separate package and pass its own release gate.

### Selected path: source registry plus generated fallback artifacts

BK-UI will use one component manifest to produce these channels:

1. A [shadcn GitHub source registry](https://ui.shadcn.com/docs/registry/github)
   rooted at `registry.json`. This is the preferred source installer after the
   registry commit is pushed because it does not require a BK-UI npm package or
   a registry server.
2. Full-commit GitHub permalinks for every canonical source file.
3. Self-contained React and Next.js ZIP archives generated at build/release
   time without adding a ZIP library to the product runtime.
4. Built component Registry JSON and a Copy for AI document generated from the
   same manifest and source files.

The future public commands use a full 40-character commit SHA:

```sh
npx --yes shadcn@4.13.0 add bk-git-hub/bk-ui/tinder#<40_SHA>
pnpm dlx shadcn@4.13.0 add bk-git-hub/bk-ui/tinder#<40_SHA>
```

`@latest` may be shown only as a convenience after the exact-version command
passes the release smoke test. Reproducible documentation and CI pin both the
installer version and the registry commit.

The source repository is public, but the current local `main` is 68 commits
ahead of `origin/main`. The current registry and component commits cannot be
resolved from GitHub until a separately authorized push. GitHub documents that
a commit ID, rather than a branch, makes a file link immutable.

## Public release hold

The technical artifact pipeline may be implemented and tested locally, but no
channel above is distribution-ready until all three conditions are met:

1. **License:** the repository has no tracked `LICENSE`, `COPYING`, `NOTICE`, or
   package license field. The project owner must choose the license. BK-UI must
   not invent MIT or another grant. Generated preview artifacts use
   `UNLICENSED` and state that redistribution is not granted. GitHub's
   [repository licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
   explains that a public repository without a license does not grant the
   usual reuse rights.
2. **Fixture gate:** all required clean-project cases below pass from generated
   artifacts.
3. **Remote gate:** the registry commit is pushed, then `registry validate`,
   `view`, `--dry-run`, and one full-SHA installation smoke test pass against
   the public GitHub address.

The UI must render the strategy as `local-verified` or `release-blocked` until
those conditions pass. It must not label a command or permalink as live.

## Compatibility contract

| Area                 | Contract                                                                                                                                                                                                | Gate evidence                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| React                | React `>=19 <20`; stable reference version is 19.2.7. Canary and Experimental APIs are excluded.                                                                                                        | Clean fixtures install React 19.2.7 and typecheck/build.                                                       |
| Next.js              | App Router client entry is `components/<Name>/client`; the common React core has no `next/*` import.                                                                                                    | Next 16.2.10 fixtures build, start, return HTML, hydrate without console errors, and complete one interaction. |
| Client boundary      | `client.ts` starts with `'use client'` and re-exports the same core. Server Components pass serializable data only. Callbacks and render functions stay in a client wrapper.                            | Source assertion plus server/client fixture.                                                                   |
| SSR/hydration        | Render output is deterministic. Browser APIs may run only in effects, event handlers, or their cleanup. `ssr: false` is not an installation requirement.                                                | Server render/build plus browser console check.                                                                |
| Tailwind v4          | Copy under a scanned local source directory. External/monorepo targets require stylesheet-relative `@source`.                                                                                           | Built CSS/computed style contains representative component utilities.                                          |
| Tailwind v3          | Target must match `content` globs.                                                                                                                                                                      | Fixture config includes the installed directory and built CSS contains representative utilities.               |
| npm/pnpm             | Both installers must be tested. Package-manager choice must not change installed source.                                                                                                                | Lockfile, installed dependency, source-tree, and output hashes are compared.                                   |
| Runtime dependencies | Manifest installs only component runtime dependencies. Host React/ReactDOM, Tailwind, and Next are requirements and are never silently upgraded.                                                        | Package manifest and lockfile assertions.                                                                      |
| Aliases              | Canonical component internals must use relative imports. Registry targets use `@components/` placeholders; generated ZIP examples use relative imports.                                                 | Fixture with a custom alias and fixture without an alias.                                                      |
| Collisions           | Dry-run writes nothing. Existing different files abort by default. Explicit overwrite is required.                                                                                                      | Lifecycle fixture assertions.                                                                                  |
| Idempotency          | Reinstalling the same ref produces no source or lockfile diff.                                                                                                                                          | Tree and lockfile hashes before/after rerun.                                                                   |
| Updates              | Pin a new SHA, run `view`, `--dry-run`, and `--diff`; preserve local edits unless overwrite is explicitly approved.                                                                                     | Versioned fixture with a modified target.                                                                      |
| ESM/types/export map | Not applicable to the adopted source-copy runtime. TS/TSX is compiled and typed by the host. A future branded CLI must be ESM with a shebang `bin`, explicit `exports`/`types`, `files`, and `engines`. | Future CLI-only gate.                                                                                          |

Next.js requires Client Component props to be serializable at the
[`'use client'` boundary](https://nextjs.org/docs/app/api-reference/directives/use-client).
Tailwind v4 scans local source automatically and uses
[`@source` for otherwise ignored/external paths](https://tailwindcss.com/docs/detecting-classes-in-source-files).

## Tailwind dependency split

One Registry item cannot safely install both Tailwind majors because the
runtime dependency differs:

- `tinder`: Tailwind v4, `clsx@^2.1.1`, `tailwind-merge@^3.3.1`.
- `tinder-tailwind-v3`: Tailwind v3, `clsx@^2.1.1`,
  `tailwind-merge@2.6.0`.

The [`tailwind-merge` project](https://github.com/dcastil/tailwind-merge)
states that v3 targets Tailwind v4 and that Tailwind v3 users must use v2.6.0.
When a component declares both majors, both items reference the same canonical
source blobs; only dependency and Tailwind guidance metadata differ. A
component may instead mark one major unsupported with a concrete reason. The
generator then omits that major's Registry item, install variant, command, and
fixture rows. It never rewrites classes or otherwise transforms canonical
source to simulate cross-major support.

## Shared manifest contract

Each component owns exactly one source manifest at:

```text
registry/components/<component-slug>.json
```

Required fields:

```text
schemaVersion
$schema
name
title
componentVersion
description
repository
sourceCommit
license.spdx
license.status
react.range
react.tested
next.tested
files[].source
files[].target
files[].type
files[].frameworks
dependencies.common[]
dependencies.tailwind.3[]
dependencies.tailwind.4[]
entrypoints.react
entrypoints.next
tailwind.supportedMajors[]
tailwind.3.supported
tailwind.4.supported
tailwind.<supported-major>.range
tailwind.<supported-major>.tested
tailwind.<supported-major>.itemName
tailwind.<supported-major>.scan
tailwind.<supported-major>.representativeClasses[]
tailwind.<unsupported-major>.reason
next.clientBoundary
next.serializableProps[]
constraints.ssr[]
constraints.accessibility[]
examples.react
examples.nextClient
examples.nextServer
```

Rules:

- `sourceCommit` is a full 40-character SHA and is never `main` or another
  moving ref.
- `files` contains component core only. Demo previews, mocks, remote demo
  assets, page-only icons, and benchmark code are excluded.
- Every target starts with the supported shadcn `@components/` placeholder.
  Path traversal, embedded/unknown placeholders, and absolute filesystem
  targets are invalid.
- `tailwind.supportedMajors` is an ordered subset of `[3, 4]`. Each listed
  major records its supported range and exact tested version. Each omitted
  major records `supported: false` and a non-empty reason, and has no
  major-specific dependencies.
- The source manifest does not own release status. Generated descriptors stay
  `release-blocked` until separate license, fixture, push, and remote-smoke
  evidence promotes them.
- File SHA-256 values, artifact SHA-256 values, Registry item content, ZIP
  contents, Copy for AI text, and public UI metadata are generated; component
  owners do not hand-maintain duplicates.
- Next may add a client entry and examples, but may not fork the common core or
  introduce `next/*` into it.
- SSR/hydration and accessibility constraints are component-owned manifest
  data and are copied into Registry metadata/docs, ZIP README/manifest, Copy
  for AI, and the install descriptor.

## Generated artifact contract

The shared generator consumes every component manifest and emits:

```text
registry.json
public/r/<supported-major-item-name>.json
public/downloads/<name>-react.zip
public/downloads/<name>-next.zip
public/ai/<name>.md
public/install/<name>.json
```

The implementation uses pinned Git blobs as source bytes, canonical LF JSON,
and an external-dependency-free STORE ZIP writer with fixed 1980 metadata.
Component owners run `pnpm artifacts:build -- --manifest
registry/components/<slug>.json` and the matching `artifacts:check`; this scoped
mode never reads or writes aggregate `registry.json`. Only the shared strategy
owner runs unscoped `pnpm artifacts:build` / `pnpm artifacts:check` after all
component inputs are committed and clean. Rendering and validation finish in
memory before write mode changes generated files.

`public/install/<name>.json` is the UI-facing descriptor. Its status is one of:

```text
release-blocked
local-verified
published
```

The current generator emits `release-blocked`. That descriptor contains
repository-relative artifact paths and hashes, but no install command, live
URL, moving branch, or unresolved placeholder. Promotion to `published` is a
separate two-commit release operation after the artifact commit is pushed and
verified by full SHA.

React ZIP contents:

```text
components/<Name>/<core files>
examples/react-example.tsx
README.md
manifest.json
DISTRIBUTION-NOTICE.md or LICENSE
```

Next ZIP contents add the client entry, client wrapper, and Server Component
example. The two archives share the exact same core bytes.

Copy for AI includes the exact source SHA, file and artifact hashes, dependency
matrix, target paths, entrypoints, Tailwind major selection, Next boundary,
and required validation commands. It must not tell an agent to use an
unpublished package or unresolved URL.

## Fixture gate

Public GO requires the Cartesian matrix below for every Tailwind major the
component declares supported, using fresh scaffolds and exact versions recorded
in a generated report. Tinder declares both majors and therefore has all eight
rows:

```text
Vite React × Tailwind 4 × npm
Vite React × Tailwind 4 × pnpm
Vite React × Tailwind 3.4 × npm
Vite React × Tailwind 3.4 × pnpm
Next App Router × Tailwind 4 × npm
Next App Router × Tailwind 4 × pnpm
Next App Router × Tailwind 3.4 × npm
Next App Router × Tailwind 3.4 × pnpm
```

A component declaring only Tailwind 4 has four rows: Vite/Next × npm/pnpm. An
unsupported major has no generated item and no fixture row; generating an item
whose utilities silently disappear is a gate failure.

Each fixture must:

1. Install one generated artifact into an otherwise clean scaffold.
2. Verify dependency and peer requirements without silently changing host
   React, ReactDOM, Tailwind, or Next versions.
3. Verify expected files, relative imports, client boundary, and file hashes.
4. Typecheck, run the component test, and produce a production build.
5. Verify representative Tailwind utilities are present.
6. For Next, start the production server, receive HTTP 200, confirm zero
   hydration errors, and exercise a swipe/button interaction.
7. Run dry-run, same-ref reinstall, modified-file conflict, explicit overwrite,
   and new-ref diff/update cases.

Local JSON/ZIP fixtures validate artifact contents and framework compatibility.
They do not replace the post-push GitHub-address smoke test.

## Version and update policy

- `schemaVersion` changes only when the manifest or generated descriptor shape
  changes. Breaking schema changes increment its major integer.
- `componentVersion` follows SemVer. A breaking component API increments major;
  compatible behavior or source additions increment minor; fixes increment
  patch.
- Public installation documentation pins both `shadcn` and the component
  commit. A release tag may be offered only after it resolves to the same
  commit and artifacts.
- Updates are review-first and never automatic: `view`, `--dry-run`, `--diff`,
  then explicit apply. Generated artifacts include before/after hashes.

## Ownership and allowed paths

The installation-strategy owner exclusively changes these shared paths:

```text
docs/installation-strategy-feasibility.md
package.json (artifact scripts only)
registry/schema/**
scripts/component-artifacts/**
src/components/layout/component-install-guide.tsx
src/components/layout/component-install-guide.test.tsx
src/components/layout/component-viewer.tsx
src/components/layout/component-viewer.test.tsx
```

The generator owns these derived paths. Component owners may run it and commit
the output for their manifest, but must not hand-edit generated bytes:

```text
registry.json
public/r/<component-item-names>.json
public/downloads/<component-slug>-react.zip
public/downloads/<component-slug>-next.zip
public/ai/<component-slug>.md
public/install/<component-slug>.json
```

A component follow-up may change only its component-specific paths:

```text
registry/components/<component-slug>.json
fixtures/install/<component-slug>/**
src/snippets/<component-specific-install-or-export-file>
src/pages/<component-page-and-test>
src/components/<Component>/README.md
```

It may reference canonical core files but must not modify shared schema,
generator, viewer, or another component. If the component's original delegated
scope explicitly authorizes its own core, the owner may make a narrowly scoped
cross-major compatibility fix, validate it, and update `sourceCommit`. Without
that authority it must mark the incompatible major unsupported. Source
transforms are not an alternative. The first shared implementation is Tinder.
Coverflow remains outside this scope.

## Future branded CLI gate

A future `bk-ui` CLI may be reconsidered only after all of the following are
approved and verified:

- a separately versioned non-private package with an executable `bin`;
- Node ESM, explicit `exports`, `types`, `files`, and `engines`;
- an explicit license and repository metadata;
- `npm pack --dry-run --json` plus packed-tarball Vite/Next fixtures;
- reserved npm package ownership, actual public version, and `latest` tag;
- both public `npx` and registry-backed `pnpm dlx` smoke tests;
- the same conflict, idempotency, dependency, and update guarantees as the
  source registry.

Until then, the branded commands remain examples of a future interface, not
installation instructions.
