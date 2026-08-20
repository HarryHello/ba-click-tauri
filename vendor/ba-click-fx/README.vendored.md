# ba-click-fx (vendored)

This directory is a **frozen vendored copy** of the `ba-click-fx` npm package
(fork: `HarryHello/ba-click-fx`, v1.3.1) — including the locally modified
`dist/` build where the click disk color is lightened to pale blue.

## Why vendored

The original `file:../ba-click-fx` dependency pointed at a sibling directory
outside this repository, so the app could **not** be built from a clean clone
or in CI. Shipping the built artifact here makes `npm ci && npm run tauri build`
self-contained.

This copy is intentionally **frozen**: the Tauri app does not follow upstream
`ba-click-fx` automatically and has no sync script that reaches outside this
repository. Future upstream changes will not affect this app unless someone
explicitly updates the files in `vendor/ba-click-fx` and commits them.

Only the files that are actually published (per the package `files` field) are
kept: `dist/ba-click-fx.js`, `dist/config.js`, `dist/worker.js` and their
`.d.ts` files, plus `package.json`, `LICENSE`, `README*` and
`THIRD_PARTY_NOTICES.md`. The vendored `package.json` is sanitized
(devDependencies/scripts/engines stripped — npm would otherwise install the
upstream devDeps like typescript/vite into this repo).

## How to update manually

If you ever need to move to a newer `ba-click-fx` version:

1. Build the new version outside this repository.
2. Replace the corresponding files under `dist/` and update `package.json`
   (and this note) to match the new published `files` list.
3. Run `npm install` if the package metadata changes.
4. Commit the updated vendored files.

There is intentionally no `sync:vendor` script anymore.