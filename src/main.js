import { BAClickFX } from 'ba-click-fx';
import {
  currentMonitor,
  cursorPosition,
  getCurrentWindow,
  PhysicalPosition,
  PhysicalSize,
} from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';

const win = getCurrentWindow();
const canvas = document.getElementById('fx');

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
  // Tauri cursorPosition()/monitor coordinates are Physical (device pixels).
  // The canvas viewport is in CSS pixels, so divide by the display scale factor.
  return {
    x: (point.x - state.origin.x) / state.scale,
    y: (point.y - state.origin.y) / state.scale,
  };
}

async function setupWindow() {
  const monitor = await currentMonitor();
  state.monitor = monitor;

  if (monitor) {
    state.origin = {
      x: monitor.position.x,
      y: monitor.position.y,
    };
    state.scale = monitor.scaleFactor;

    await win.setPosition(new PhysicalPosition(state.origin.x, state.origin.y));
    await win.setSize(new PhysicalSize(monitor.size.width, monitor.size.height));
  }

  await win.setAlwaysOnTop(true);
  await win.setVisibleOnAllWorkspaces(true);
  await win.setIgnoreCursorEvents(true);
}

function createFx() {
  // Use the exact web effect library, with manual input so the desktop host
  // can feed global mouse events into it.
  state.fx = new BAClickFX({
    target: canvas,
    inputSource: 'manual',
    outputCompositing: 'browser-overlay',
    hostCompositingSurface: 'transparent-window',
    effectBackend: 'auto',
    clickEnabled: true,
    trailEnabled: true,
    trailAlways: true,
    inputSamplingRate: 240,
  });
}

async function onMouseButton(event) {
  if (!state.fx) return;

  const point = toCanvasPoint(await cursorPosition());
  const input = {
    x: point.x,
    y: point.y,
    pointerId: 1,
    pointerType: 'mouse',
  };

  if (event.kind === 'down') {
    state.fx.pointerDown(input);
  } else if (event.kind === 'up') {
    state.fx.pointerUp(1);
  }
}

function startMouseMovePolling() {
  // Moves are polled through Tauri's native cursor-position API instead of
  // flooding the IPC bridge with a Rust-side global event stream.
  setInterval(async () => {
    if (!state.fx) return;

    const point = toCanvasPoint(await cursorPosition());
    state.fx.pointerMove({
      x: point.x,
      y: point.y,
      pointerId: 1,
      pointerType: 'mouse',
    });
  }, 16);
}

async function main() {
  await setupWindow();
  createFx();
  startMouseMovePolling();

  await listen('mouse-event', (event) => {
    onMouseButton(event.payload);
  });
}

main().catch((error) => {
  console.error('Failed to start ba-click-tauri overlay', error);
});