import { BAClickFX } from 'ba-click-fx';
import { applyFxPatches, FX_BASE_OPTIONS } from './fx-config.js';

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
        ...FX_BASE_OPTIONS,
        target: payload.canvas,
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
      applyFxPatches(fx);

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

    case 'updateConfig':
      fx?.updateConfig(payload);
      break;

    case 'setFxParams':
      fx?.setFxParams(payload);
      break;

    case 'reset':
      fx?.updateConfig({
        clickEnabled: true,
        trailEnabled: true,
        trailAlways: true,
        scale: 1,
        opacity: 1,
        clickTimeScale: 1,
        inputSamplingRate: 60,
        maxDpr: 1,
      });
      fx?.resetFxConfig();
      applyFxPatches(fx);
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
