import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFxConfig,
  buildFxParams,
  DISK_EMISSION_ALPHA_SCALE,
  DISK_EMISSION_SCALE,
  SHARDS_HDR_SCALE,
} from '../src/fx-config.js';
import { DEFAULT_SETTINGS } from '../src/settings.js';

test('buildFxConfig maps persisted settings to BAClickFX config', () => {
  const config = buildFxConfig(DEFAULT_SETTINGS);

  assert.equal(config.clickEnabled, true);
  assert.equal(config.trailEnabled, true);
  assert.equal(config.scale, 1);
  assert.equal(config.clickTimeScale, 1);
  assert.equal(config.trailAlways, true);
  assert.equal(config.inputSamplingRate, 60);
  assert.equal(config.maxDpr, 2); // balanced preset
});

test('buildFxConfig option resolution uses the panel enabled toggle', () => {
  const config = buildFxConfig({ ...DEFAULT_SETTINGS, enabled: false });
  assert.equal(config.clickEnabled, false);
  assert.equal(config.trailEnabled, false);
});

test('buildFxConfig applies quality presets', () => {
  assert.equal(buildFxConfig({ ...DEFAULT_SETTINGS, quality: 'low' }).maxDpr, 1);
  assert.equal(buildFxConfig({ ...DEFAULT_SETTINGS, quality: 'high' }).maxDpr, 2);
  // Unknown quality should fall back to balanced instead of blowing up.
  assert.equal(buildFxConfig({ ...DEFAULT_SETTINGS, quality: 'nope' }).maxDpr, 2);
});

test('buildFxParams maps persisted settings to fx params', () => {
  const params = buildFxParams({ ...DEFAULT_SETTINGS, trailWidth: 6, bloom: 2, opacity: 0.35 });

  assert.equal(params['trail.width'], 6);
  assert.equal(params['trail.geometryWidth'], 6);
  assert.equal(params['bloom.intensity'], 2);
  assert.equal(params['bloom.resolutionScale'], 0.3); // balanced preset
});

test('opacity is applied uniformly to disk + shards only', () => {
  const id = 0.35;
  const low = buildFxParams({ ...DEFAULT_SETTINGS, opacity: 0.2 });
  const high = buildFxParams({ ...DEFAULT_SETTINGS, opacity: 1 });

  const expected = (scale, v) => +(scale * v).toFixed(3);
  assert.equal(low['bloom.diskEmission'], expected(DISK_EMISSION_SCALE, 0.2));
  assert.equal(low['bloom.diskEmissionAlpha'], expected(DISK_EMISSION_ALPHA_SCALE, 0.2));
  assert.equal(low['shards.hdrIntensity'], expected(SHARDS_HDR_SCALE, 0.2));

  // Trail width and bloom intensity must NOT be affected by opacity.
  assert.equal(low['trail.width'], high['trail.width']);
  assert.equal(low['bloom.intensity'], high['bloom.intensity']);

  // Disk + shards must change.
  assert.notEqual(low['bloom.diskEmission'], high['bloom.diskEmission']);
  assert.notEqual(low['shards.hdrIntensity'], high['shards.hdrIntensity']);

  // Default 35% opacity keeps the documented values stable.
  const def = buildFxParams({ ...DEFAULT_SETTINGS, opacity: id });
  assert.equal(def['bloom.diskEmission'], expected(DISK_EMISSION_SCALE, id));
  assert.equal(def['bloom.diskEmissionAlpha'], expected(DISK_EMISSION_ALPHA_SCALE, id));
  assert.equal(def['shards.hdrIntensity'], expected(SHARDS_HDR_SCALE, id));
});
