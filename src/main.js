import {
  currentMonitor,
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
} from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { BAClickFX } from 'ba-click-fx';

const win = getCurrentWindow();
const canvas = document.getElementById('fx');

const webgpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator;

const state = {
  monitor: null,
  origin: { x: 0, y: 0 },
  scale: 1,
  worker: null,
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

function getViewport() {
  const rect = canvas.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
    dpr: Math.min(window.devicePixelRatio || 1, 1),
  };
}

function post(type, payload = {}) {
  state.worker?.postMessage({ type, payload });
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
  const cfg = state.fx?.getConfig();

  try {
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

function createWorkerRenderer() {
  if (typeof canvas.transferControlToOffscreen !== 'function') {
    return false;
  }

  try {
    const offscreen = canvas.transferControlToOffscreen();

    state.worker = new Worker(new URL('./fx-worker.js', import.meta.url), {
      type: 'module',
    });

    state.worker.addEventListener('message', (event) => {
      if (event.data.type === 'status') {
        invoke('log_message', {
          message: JSON.stringify(event.data.payload),
        }).catch(() => {});
      } else if (event.data.type === 'destroyed') {
        state.worker = null;
      }
    });

    const viewport = getViewport();
    state.worker.postMessage(
      {
        type: 'init',
        payload: {
          canvas: offscreen,
          ...viewport,
        },
      },
      [offscreen],
    );

    return true;
  } catch (error) {
    console.error('Failed to start OffscreenCanvas worker; falling back', error);
    state.worker = null;
    return false;
  }
}

function createFallbackFx() {
  state.fx = new BAClickFX({
    target: canvas,
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

  state.fx.setFxParam('bloom.resolutionScale', 0.3);
  state.fx.setFxParam('bloom.diffusion', 5);
  state.fx.setFxParam('bloom.clickEmissionScale', 0.5);

  logStatus('fallback', {
    requested: {
      effectBackend: 'canvas2d',
      bloomBackend: 'software',
      inputSamplingRate: 30,
    },
  }).catch(() => {});
}

function createRenderer() {
  if (createWorkerRenderer()) {
    return;
  }

  createFallbackFx();
}

function onMouseEvent(event) {
  const point = toCanvasPoint({ x: event.x, y: event.y });
  const input = {
    x: point.x,
    y: point.y,
    pointerId: 1,
    pointerType: 'mouse',
  };

  if (state.worker) {
    if (event.kind === 'move') {
      post('pointerMove', input);
    } else if (event.kind === 'down') {
      post('pointerDown', input);
    } else if (event.kind === 'up') {
      post('pointerUp', { pointerId: 1 });
    }
    return;
  }

  if (!state.fx) return;

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
  createRenderer();

  await listen('mouse-event', (event) => {
    onMouseEvent(event.payload);
  });
}

main().catch((error) => {
  console.error('Failed to start ba-click-tauri overlay', error);
});