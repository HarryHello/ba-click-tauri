import { BAClickFX } from 'ba-click-fx';

let fx = null;

function sendStatus(label, extra = {}) {
  const cfg = fx?.getConfig();

  self.postMessage({
    type: 'status',
    payload: {
      label,
      extra,
      resolved: cfg
        ? {
            effect: cfg.resolvedEffectBackend,
            bloom: cfg.resolvedBloomBackend,
            mode: cfg.renderingMode,
          }
        : null,
    },
  });
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init': {
      let webgl2Probe = false;
      try {
        const probe = new OffscreenCanvas(1, 1);
        webgl2Probe = Boolean(probe.getContext('webgl2'));
      } catch {
        webgl2Probe = false;
      }

      const options = {
        target: payload.canvas,
        inputSource: 'manual',
        renderingMode: 'enhanced',
        clickEnabled: true,
        trailEnabled: true,
        trailAlways: true,
        inputSamplingRate: 60,
        maxDpr: 1,
        overlayAlphaLimit: 0.85,
      };

      if (webgl2Probe) {
        // Full WebGL2 owns the OffscreenCanvas directly: GPU-driven, should be
        // both smoother and keep the complete glow.
        options.effectBackend = 'webgl2';
        options.bloomBackend = 'webgl2';
      } else {
        // OffscreenCanvas WebGL2 unavailable -> canvas2d + software bloom.
        options.effectBackend = 'canvas2d';
        options.bloomBackend = 'software';
        options.outputCompositing = 'browser-overlay';
        options.hostCompositingSurface = 'transparent-window';
      }

      fx = new BAClickFX(options);

      // Keep the same tuning as the main-thread version: reduced click
      // brightness, a softer semi-transparent light-blue centre disk, and a
      // water-drop trail shape.
      fx.setFxParam('bloom.resolutionScale', 0.3);
      fx.setFxParam('bloom.diffusion', 5);
      fx.setFxParam('bloom.clickEmissionScale', 0.4);
      fx.setFxParam('bloom.diskEmission', 0.7);
      fx.setFxParam('bloom.diskEmissionAlpha', 0.5);
      fx.setFxParam('trail.width', 4.0);
      fx.setFxParam('trail.geometryWidth', 4.0);
      fx.setFxParam('trail.outerGlowWidth', 16);
      fx.setFxParam('bloom.trailEmission', 30);

      fx.resize(payload.width, payload.height, payload.dpr);
      sendStatus('worker-init', {
        requested: {
          effectBackend: options.effectBackend,
          bloomBackend: options.bloomBackend,
          webgl2Probe,
          inputSamplingRate: 60,
        },
      });
      break;
    }

    case 'resize':
      fx?.resize(payload.width, payload.height, payload.dpr);
      break;

    case 'pointerDown':
      fx?.pointerDown(payload);
      break;

    case 'pointerMove':
      fx?.pointerMove(payload);
      break;

    case 'pointerUp':
      fx?.pointerUp(payload.pointerId);
      break;

    case 'pointerCancel':
      fx?.pointerCancel(payload.pointerId);
      break;

    case 'boom':
      fx?.boom(payload.x, payload.y);
      break;

    case 'destroy':
      fx?.destroy();
      fx = null;
      self.postMessage({ type: 'destroyed' });
      break;
  }
});
