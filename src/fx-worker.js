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
    case 'init':
      fx = new BAClickFX({
        target: payload.canvas,
        inputSource: 'manual',
        outputCompositing: 'browser-overlay',
        hostCompositingSurface: 'transparent-window',
        effectBackend: 'canvas2d',
        renderingMode: 'enhanced',
        bloomBackend: 'software',
        clickEnabled: true,
        trailEnabled: true,
        trailAlways: true,
        inputSamplingRate: 30,
        maxDpr: 1,
      });

      // Keep the same tuning as the main-thread version: cheaper software bloom
      // and click brightness balanced against the trail.
      fx.setFxParam('bloom.resolutionScale', 0.3);
      fx.setFxParam('bloom.diffusion', 5);
      fx.setFxParam('bloom.clickEmissionScale', 0.5);

      fx.resize(payload.width, payload.height, payload.dpr);
      sendStatus('worker-init', {
        requested: {
          effectBackend: 'canvas2d',
          bloomBackend: 'software',
          inputSamplingRate: 30,
        },
      });
      break;

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
