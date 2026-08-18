// Shared BAClickFX configuration and tuning.
//
// Both the OffscreenCanvas worker (src/fx-worker.js) and the main-thread
// fallback (src/main.js) import from here so the effect tuning only lives in
// one place. Adjust brightness / trail / bloom in this single file.

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

// Apply the effect tuning shared by both render paths.
export function applyFxPatches(fx) {
  // Software-bloom cost reduction without dropping the glow.
  fx.setFxParam('bloom.resolutionScale', 0.3);
  fx.setFxParam('bloom.diffusion', 5);

  // Click: soft, semi-transparent light-blue centre disk instead of a white blob.
  fx.setFxParam('bloom.clickEmissionScale', 0.4);
  fx.setFxParam('bloom.diskEmission', 0.7);
  fx.setFxParam('bloom.diskEmissionAlpha', 0.5);

  // Trail: water-drop shape — thicker, brighter head that tapers behind.
  fx.setFxParam('trail.width', 4.0);
  fx.setFxParam('trail.geometryWidth', 4.0);
  fx.setFxParam('trail.outerGlowWidth', 16);
  fx.setFxParam('bloom.trailEmission', 30);
}