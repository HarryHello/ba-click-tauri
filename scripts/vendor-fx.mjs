/**
 * Sync the vendored copy of the ba-click-fx npm package (vendor/ba-click-fx)
 * with the local fork checkout (../ba-click-fx).
 *
 * Run: node scripts/vendor-fx.mjs   (or: npm run sync:vendor)
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(repoRoot, '..', 'ba-click-fx');
const dst = join(repoRoot, 'vendor', 'ba-click-fx');

const distFiles = [
  'ba-click-fx.js',
  'ba-click-fx.cjs',
  'ba-click-fx.iife.js',
  'ba-click-fx.d.ts',
];
const extraFiles = [
  'package.json',
  'LICENSE',
  'README.md',
  'README.en.md',
  'THIRD_PARTY_NOTICES.md',
];

if (!existsSync(srcRoot)) {
  console.error(`Cannot find source checkout: ${srcRoot}`);
  process.exit(1);
}

rmSync(join(dst, 'dist'), { recursive: true, force: true });
mkdirSync(join(dst, 'dist'), { recursive: true });

let copied = 0;

for (const file of distFiles) {
  const from = join(srcRoot, 'dist', file);
  if (!existsSync(from)) {
    console.warn(`skip missing dist/${file}`);
    continue;
  }
  cpSync(from, join(dst, 'dist', file));
  copied += 1;
}

for (const file of extraFiles) {
  const from = join(srcRoot, file);
  if (!existsSync(from)) continue;
  cpSync(from, join(dst, file));
  copied += 1;
}

// Strip devDependencies/scripts/engines from the vendored manifest: npm 11
// installs the devDependencies of a `file:` dependency, pulling typescript /
// playwright / vite into this repo for no reason.
const manifestPath = join(dst, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
for (const key of ['devDependencies', 'scripts', 'engines', 'prepack', 'prepublishOnly']) {
  delete manifest[key];
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Vendored ba-click-fx (${copied} files) ${srcRoot} -> ${dst}`);
