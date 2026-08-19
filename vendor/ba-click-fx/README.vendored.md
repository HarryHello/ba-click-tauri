# ba-click-fx (vendored)

This directory is a **vendored copy** of the `ba-click-fx` npm package
(fork: `HarryHello/ba-click-fx`, v1.3.0) — including the locally modified
`dist/` build where the click disk color is lightened to pale blue.

## Why vendored

The original `file:../ba-click-fx` dependency pointed at a sibling directory
outside this repository, so the app could **not** be built from a clean clone
or in CI. Shipping the built artifact here makes `npm ci && npm run tauri build`
self-contained.

Only the files that are actually published (per the package `files` field) are
kept: the four `dist/` bundles plus `package.json`, `LICENSE`, `README*` and
`THIRD_PARTY_NOTICES.md`. The vendored `package.json` is sanitized by
`npm run sync:vendor` (devDependencies/scripts/engines stripped — npm would
otherwise install the upstream devDeps like typescript/vite into this repo).

## How to update

After changing the fork and rebuilding it (`npm run build` inside
`../ba-click-fx`), run from this repository:

```bash
npm run sync:vendor
```

which copies `dist/` and the package metadata from `../ba-click-fx` back here
(preserving this file).
