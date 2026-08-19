import {
  currentMonitor,
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
} from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { BAClickFX } from 'ba-click-fx';
import {
  applyFxPatches,
  buildFxConfig,
  buildFxParams,
  FX_BASE_OPTIONS,
} from './fx-config.js';
import { loadSettings } from './settings.js';

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
    dpr: Math.min(window.devicePixelRatio || 1, 2),
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
  await win.setIgnoreCursorEvents(true);

  // Note: the window is an NSPanel with the NonActivatingPanel style mask, so
  // it never takes keyboard/IME focus. Do NOT call setFocusable(false) here:
  // it panics on NSPanel-backed Tauri windows (no `focusable` ivar on NSPanel).
  // Spaces behaviour is set natively in Rust (FullScreenAuxiliary +
  // CanJoinAllSpaces), so setVisibleOnAllWorkspaces is unnecessary too.
}

// Keep the coordinate mapping and the renderer viewport in sync when the
// window is resized (resolution/DPR change) or moved (different monitor).
async function onOverlayGeometryChange() {
  try {
    const monitor = await currentMonitor();
    if (monitor) {
      state.scale = monitor.scaleFactor;
      state.origin = {
        x: monitor.workArea.position.x,
        y: monitor.workArea.position.y,
      };
    }

    const viewport = getViewport();
    // Guard against degenerate/transitional sizes (e.g. during a Space/focus
    // change) that could make the renderer resize into nothing.
    if (viewport.width < 16 || viewport.height < 16) return;

    if (state.worker) {
      post('resize', viewport);
    } else {
      state.fx?.resize(viewport.width, viewport.height, viewport.dpr);
    }
  } catch (error) {
    console.error('Failed to refresh overlay viewport', error);
  }
}

// Minimal nudge that forces the WKWebView compositor to redraw (upstream macOS
// transparent-window workaround for content freezing after a focus change).
let lastRedrawAt = 0;
async function forceRedraw() {
  const now = Date.now();
  if (now - lastRedrawAt < 3000) return;
  lastRedrawAt = now;
  try {
    const size = await win.innerSize();
    await win.setSize(new PhysicalSize(size.width + 1, size.height));
    await win.setSize(size);
  } catch (error) {
    console.error('Failed to nudge overlay redraw', error);
  }
}

function logFwd(message) {
  invoke('log_message', { message }).catch(() => {});
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
    ...FX_BASE_OPTIONS,
    target: canvas,
    outputCompositing: 'browser-overlay',
    hostCompositingSurface: 'transparent-window',
    effectBackend: 'canvas2d',
    bloomBackend: 'software',
  });
  applyFxPatches(state.fx);

  logStatus('fallback', {
    requested: {
      effectBackend: 'canvas2d',
      bloomBackend: 'software',
      inputSamplingRate: 60,
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

function applySettings(settings) {
  const config = buildFxConfig(settings);
  const params = buildFxParams(settings);

  if (state.worker) {
    post('updateConfig', config);
    post('setFxParams', params);
    return;
  }

  if (state.fx) {
    state.fx.updateConfig(config);
    state.fx.setFxParams(params);
  }
}

function handlePanelCommand(command) {
  const { type, payload } = command;

  if (state.worker) {
    post(type, payload);
    return;
  }

  if (!state.fx) return;

  if (type === 'updateConfig') {
    state.fx.updateConfig(payload);
  } else if (type === 'setFxParams') {
    state.fx.setFxParams(payload);
  } else if (type === 'reset') {
    state.fx.resetFxConfig();
    applyFxPatches(state.fx);
  }
}

async function main() {
  // Surface JS errors / focus / visibility changes into the log file so a
  // release build can be diagnosed without a terminal.
  window.addEventListener('error', (event) => {
    logFwd(
      `[js error] ${event.message} @ ${event.filename}:${event.lineno}:${event.colno}`,
    );
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logFwd(`[js unhandledrejection] ${reason?.stack || String(reason)}`);
  });
  document.addEventListener('visibilitychange', () => {
    logFwd(`[focus] visibilitychange hidden=${document.hidden}`);
    if (!document.hidden) {
      forceRedraw(); // kick compositor back to life when it becomes visible
    }
  });
  window.addEventListener('focus', () => {
    logFwd('[focus] window focus');
    forceRedraw();
  });
  window.addEventListener('blur', () => {
    logFwd('[focus] window blur');
  });
  setInterval(() => {
    const rect = canvas.getBoundingClientRect();
    const vp = getViewport();
    logFwd(
      `[heartbeat] t=${Date.now()} size=${Math.round(rect.width)}x${Math.round(
        rect.height,
      )} dpr=${vp.dpr} worker=${state.worker ? 'alive' : 'none'} fx=${
        state.fx ? 'alive' : 'none'
      }`,
    );
  }, 10000);

  await setupWindow();
  createRenderer();

  // Restore persisted settings on startup (localStorage is shared across windows).
  applySettings(loadSettings());

  await win.onResized(onOverlayGeometryChange);
  await win.onMoved(onOverlayGeometryChange);

  await listen('mouse-event', (event) => {
    onMouseEvent(event.payload);
  });
  await listen('panel-command', (event) => {
    handlePanelCommand(event.payload);
  });
}

main().catch((error) => {
  console.error('Failed to start ba-click-tauri overlay', error);
});