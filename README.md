# ba-click-tauri

A macOS desktop overlay for the [ba-click-fx](https://github.com/CialloKing/ba-click-fx) web effect, built with **Tauri v2**.

It creates a transparent, borderless, always-on-top, **click-through** window covering the primary display and feeds global mouse events into the original `BA-click-fx` WebGL/Canvas effect. This gives the same Blue Archive click effect and cursor trail without bundling Electron/Chromium.

## Features

- Transparent click-through overlay (clicks pass to apps underneath)
- Global left/right/middle mouse button events through a macOS event tap
- Mouse-position polling through Tauri's native `cursorPosition()` API
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

1. Tauri opens a transparent window over the primary monitor.
2. The window calls `setIgnoreCursorEvents(true)`, so it never intercepts clicks.
3. A Rust `rdev` global listener reports mouse-down/up events to the webview.
4. The frontend polls `cursorPosition()` for mouse movement and feeds it to `BAClickFX` via `inputSource: 'manual'`.

## Project layout

```text
ba-click-tauri/
├── index.html          # transparent overlay page
├── src/
│   └── main.js         # BAClickFX wiring + cursor/button handling
├── src-tauri/
│   ├── src/
│   │   └── lib.rs      # Rust backend + global mouse listener
│   ├── capabilities/
│   └── tauri.conf.json # transparent overlay window config
```

## License

MIT — same as the upstream `ba-click-fx` project.