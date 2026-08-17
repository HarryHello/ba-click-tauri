import { BAClickFX } from 'ba-click-fx';
import {
  currentMonitor,
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

  // rdev/CGEvent coordinates are physical pixels relative to the desktop's
  // top-left corner. The window covers the monitor work area (below the macOS
  // menu bar), so subtract that work-area origin and convert to CSS pixels.
  return {
    x: (point.x - state.origin.x) / state.scale,
    y: (point.y - state.origin.y) / state.scale,
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

function createFx() {
  // Use the exact web effect library with manual input from the global mouse
  // listener. Force enhanced rendering + WebGL2 bloom; if WKWebView cannot
  // create a WebGL2 context, the library falls back to software bloom so the
  // glow is still preserved instead of a weak native shadow path.
  state.fx = new BAClickFX({
    target: canvas,
    inputSource: 'manual',
    outputCompositing: 'browser-overlay',
    hostCompositingSurface: 'transparent-window',
    effectBackend: 'webgl2',
    renderingMode: 'enhanced',
    bloomBackend: 'software',
    clickEnabled: true,
    trailEnabled: true,
    trailAlways: true,
    inputSamplingRate: 240,
    maxDpr: Math.min(window.devicePixelRatio || 1, 2),
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