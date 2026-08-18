# ba-click-tauri

A macOS desktop overlay for the [ba-click-fx](https://github.com/CialloKing/ba-click-fx) web effect, built with **Tauri v2**.

It creates a transparent, borderless, always-on-top, **click-through** window over the primary display and renders the original Blue Archive click effect + cursor trail on a **WebGL2 OffscreenCanvas running inside a Web Worker**. This keeps rendering off the main thread for smooth input, without bundling Electron/Chromium.

## Features

- Transparent click-through overlay (clicks pass to apps underneath)
- Mouse-only macOS `CGEventTap` for global move/down/up events — keyboard/IME is never touched
- Effect renders in a **Dedicated Worker + OffscreenCanvas** with **Full WebGL2**
- Falls back to `canvas2d + software bloom` when WebGL2 is unavailable
- Window is non-focusable (`focusable: false`), so typing in other apps never steals focus
- Converted to an **NSPanel** with `FullScreenAuxiliary` + `CanJoinAllSpaces`, so it can float above **fullscreen apps**
- App runs as an `Accessory` (no Dock icon) since it is a pure overlay utility
- Uses the original `ba-click-fx` npm package — no effect rewrite
- Lightweight: system WKWebView + small Rust process

## Requirements

- macOS
- Node.js (with npm)
- Rust toolchain (`cargo`, `rustc`) — install via [rustup](https://rustup.rs)
- Xcode Command Line Tools

## Development

```bash
npm install
npm run tauri dev
```

On macOS, when the app asks for **Accessibility** permission, enable it in:

```
System Settings → Privacy & Security → Accessibility
```

This is required for the global mouse event tap.

## Build (debug/release)

```bash
npm run tauri build
```

## How it works

1. Tauri opens a transparent borderless window covering the monitor **work area** (below the macOS menu bar).
2. The window calls `setIgnoreCursorEvents(true)` and `setFocusable(false)`, so it never intercepts clicks or keyboard/IME input.
3. The window is converted into an `NSPanel` (`FullScreenAuxiliary` + `CanJoinAllSpaces`), letting it float above fullscreen apps and follow every desktop space.
4. A Rust `CGEventTap` streams mouse move/down/up events to the webview.
5. The main thread transfers the canvas to an `OffscreenCanvas` and forwards pointer events to a Worker.
6. The Worker runs `BAClickFX` (`inputSource: 'manual'`) and renders with Full WebGL2 (WebGL2 bloom) when available, otherwise falls back to Canvas 2D + software bloom.
4. The main thread transfers the canvas to an `OffscreenCanvas` and forwards pointer events to a Worker.
5. The Worker runs `BAClickFX` (`inputSource: 'manual'`) and renders with Full WebGL2 (WebGL2 bloom) when available, otherwise falls back to Canvas 2D + software bloom.

## Current tuning

Applied via `setFxParam()` in `src/fx-worker.js` (kept in sync with the fallback path in `src/main.js`):

| Parameter | Value | Purpose |
|---|---|---|
| `bloom.resolutionScale` | 0.3 | Cheaper bloom buffers (performance) |
| `bloom.diffusion` | 5 | Less blur work (performance) |
| `bloom.clickEmissionScale` | 0.4 | Click glow not too bright |
| `bloom.diskEmission` | 0.7 | Soft, semi-transparent light-blue centre disk |
| `bloom.diskEmissionAlpha` | 0.5 | Disk stays translucent, not a white blob |
| `trail.width` / `trail.geometryWidth` | 4.0 | Thicker trail core |
| `trail.outerGlowWidth` | 16 | Water-drop head glow |
| `bloom.trailEmission` | 30 | Brighter head → clear thick-to-thin taper |
| `overlayAlphaLimit` | 0.85 | Overall overlay stays semi-transparent |

## Verifying the rendering path

During dev, the terminal prints a status message from the Worker:

```text
[webview] {"label":"worker-init","extra":{"requested":{"effectBackend":"webgl2","bloomBackend":"webgl2","webgl2Probe":true}},"resolved":{...}}
```

- `webgl2Probe: true` and `resolved` ending as `webgl2/webgl2` → GPU render path active.
- `webgl2Probe: false` or `resolved` ending as `canvas2d/native` → WebGL2 unavailable on this WebView; the app falls back to Canvas 2D + software bloom.

> Note: right after `worker-init`, `resolved` may briefly show `pending/native` before the first frame renders. That is expected.

## Project layout

```text
ba-click-tauri/
├── index.html           # transparent overlay page
├── src/
│   ├── main.js          # window setup, global mouse wiring, worker forwarding
│   └── fx-worker.js     # BAClickFX inside a Worker (WebGL2 OffscreenCanvas)
├── src-tauri/
│   ├── src/
│   │   └── lib.rs       # Rust backend + mouse-only CGEventTap + log bridge
│   ├── capabilities/
│   └── tauri.conf.json  # transparent overlay window config
```

## License

MIT — same as the upstream `ba-click-fx` project.
