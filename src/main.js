import { BAClickFX } from 'ba-click-fx';
import {
  currentMonitor,
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
} from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

const win = getCurrentWindow();
const canvas = document.getElementById('fx');

const webgpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator;

const state = {
  monitor: null,
  origin: { x: 0, y: 0 },
  scale: 1,
  fx: null,
};

function toCanvasPoint(point) {
  if (!state.monitor) {
    return { x: point.x, y: point.y };
  }

  // CGEvent coordinates are logical points relative to the desktop's top-left.
  // The window covers the monitor work area (below the macOS menu bar), so
  // subtract the work-area's logical origin. This matches the canvas CSS
  // coordinate space directly.
  return {
    x: point.x - state.origin.x / state.scale,
    y: point.y - state.origin.y / state.scale,
  };
}

async function setupWindow() {
  const monitor = await currentMonitor();
  state.monitor = monitor;

  if (monitor) {
    state.scale = monitor.scaleFactor;
    state.origin = {
      x: monitor.workArea.position.x,
      y: monitor.workArea.position.y,
    };

    await win.setPosition(new PhysicalPosition(state.origin.x, state.origin.y));
    await win.setSize(new PhysicalSize(monitor.workArea.size.width, monitor.workArea.size.height));
  }

  await win.setAlwaysOnTop(true);
  await win.setVisibleOnAllWorkspaces(true);
  await win.setIgnoreCursorEvents(true);

  // The overlay must never take keyboard/IME focus. If it does, typing in
  // another app (even English) can crash or misbehave.
  await win.setFocusable(false);
}

async function logStatus(label, extra = {}) {
  try {
    const cfg = state.fx?.getConfig();
    await invoke('log_message', {
      message: JSON.stringify({
        label,
        webgpuAvailable,
        extra,
        resolved: cfg
          ? {
              effect: cfg.resolvedEffectBackend,
              bloom: cfg.resolvedBloomBackend,
              mode: cfg.renderingMode,
            }
          : null,
      }),
    });
  } catch (error) {
    console.error('Failed to log status', error);
  }
}

function createFx() {
  // The log shows WebGPU is exposed by WKWebView but the library cannot
  // actually create a usable WebGPU/WebGL2 device on the transparent canvas,
  // so it resolves to canvas2d + native. Native shadow glow is too subtle,
  // so we explicitly use software bloom: it costs more, but at 1x/30Hz it
  // should keep the improved frame rate and restore the real glow.
  const effectBackend = 'canvas2d';
  const bloomBackend = 'software';
  const inputSamplingRate = 30;

  state.fx = new BAClickFX({
    target: canvas,
    inputSource: 'manual',
    outputCompositing: 'browser-overlay',
    hostCompositingSurface: 'transparent-window',
    effectBackend,
    webgpuPreferHdr: false,
    renderingMode: 'enhanced',
    bloomBackend,
    clickEnabled: true,
    trailEnabled: true,
    trailAlways: true,
    inputSamplingRate,
    maxDpr: 1,
  });

  // Software bloom is the main cost. Lowering resolutionScale and diffusion
  // keeps the glow visible while cutting the full-screen blur work a lot.
  state.fx.setFxParam('bloom.resolutionScale', 0.3);
  state.fx.setFxParam('bloom.diffusion', 5);
  // Clicks are too bright compared to the trail; scale down only the click
  // bloom source without changing the trail's glow.
  state.fx.setFxParam('bloom.clickEmissionScale', 0.5);

  logStatus('startup', {
    requested: { effectBackend, bloomBackend, inputSamplingRate },
  }).catch(() => {});

  canvas.addEventListener('baclickfxeffectbackendchange', (event) => {
    logStatus('effect-backend', event.detail).catch(() => {});
  });
  canvas.addEventListener('baclickfxbackendchange', (event) => {
    logStatus('bloom-backend', event.detail).catch(() => {});
  });
}

function onMouseEvent(event) {
  if (!state.fx) return;

  const point = toCanvasPoint({ x: event.x, y: event.y });
  const input = {
    x: point.x,
    y: point.y,
    pointerId: 1,
    pointerType: 'mouse',
  };

  if (event.kind === 'move') {
    state.fx.pointerMove(input);
  } else if (event.kind === 'down') {
    state.fx.pointerDown(input);
  } else if (event.kind === 'up') {
    state.fx.pointerUp(1);
  }
}

async function main() {
  await setupWindow();
  createFx();

  await listen('mouse-event', (event) => {
    onMouseEvent(event.payload);
  });
}

main().catch((error) => {
  console.error('Failed to start ba-click-tauri overlay', error);
});