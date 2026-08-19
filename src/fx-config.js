// Shared BAClickFX configuration and tuning.
//
// Both the OffscreenCanvas worker (src/fx-worker.js) and the main-thread
// fallback (src/main.js) import from here, so the effect tuning only lives in
// one place. Adjust brightness / trail / bloom in this single file.

import { DEFAULT_SETTINGS, QUALITY_PRESETS } from './settings.js';

export const FX_BASE_OPTIONS = {
  inputSource: 'manual',
  renderingMode: 'enhanced',
  clickEnabled: true,
  trailEnabled: true,
  trailAlways: true,
  inputSamplingRate: 60,
  maxDpr: 2,
  overlayAlphaLimit: 0.85,
};

// Opacity applies only to the click disk + shards (the trail and the rings
// stay opaque). These factors are the single source of truth shared by the
// management panel and the two render paths.
export const DISK_EMISSION_SCALE = 1.0;
export const DISK_EMISSION_ALPHA_SCALE = 0.6;
export const SHARDS_HDR_SCALE = 5.99;

// Map persisted panel settings -> BAClickFX config (updateConfig) parameters.
// Pure function; shared by the worker, the main-thread fallback and the panel
// so the mapping only lives in one place.
export function buildFxConfig(settings) {
  const quality = QUALITY_PRESETS[settings.quality] ?? QUALITY_PRESETS.balanced;
  return {
    clickEnabled: settings.enabled,
    trailEnabled: settings.enabled,
    scale: settings.scale,
    clickTimeScale: settings.clickTime,
    trailAlways: settings.trailAlways,
    inputSamplingRate: settings.refreshRate,
    maxDpr: quality.maxDpr,
  };
}

// Map persisted panel settings -> BAClickFX fx params (setFxParams).
export function buildFxParams(settings) {
  const quality = QUALITY_PRESETS[settings.quality] ?? QUALITY_PRESETS.balanced;
  return {
    'bloom.intensity': settings.bloom,
    'trail.width': settings.trailWidth,
    'trail.geometryWidth': settings.trailWidth,
    'bloom.resolutionScale': quality.resolutionScale,
    'bloom.diskEmission': +(DISK_EMISSION_SCALE * settings.opacity).toFixed(3),
    'bloom.diskEmissionAlpha': +(DISK_EMISSION_ALPHA_SCALE * settings.opacity).toFixed(3),
    'shards.hdrIntensity': +(SHARDS_HDR_SCALE * settings.opacity).toFixed(3),
  };
}

// Apply the shared effect tuning. `settings` defaults to the persisted
// defaults so a freshly constructed BAClickFX instance starts from the same
// values the panel would send — making "factory reset" and startup converge.
export function applyFxPatches(fx, settings = DEFAULT_SETTINGS) {
  // Software-bloom cost reduction without dropping the glow.
  fx.setFxParam('bloom.diffusion', 5);

  // Click: soft, semi-transparent pale centre disk instead of a white blob.
  // Default opacity is 35% and only affects the disk + shards.
  fx.setFxParam('bloom.clickEmissionScale', 0.4);

  // Trail: water-drop shape — thicker, brighter head that tapers behind.
  fx.setFxParam('trail.outerGlowWidth', 16);
  fx.setFxParam('bloom.trailEmission', 30);

  // User-configurable state comes from the same builder as the panel.
  fx.updateConfig(buildFxConfig(settings));
  fx.setFxParams(buildFxParams(settings));
}
