# ba-click-tauri

> **English:** A macOS desktop overlay for the [ba-click-fx](https://github.com/CialloKing/ba-click-fx) web effect, built with **Tauri v2**.
> **中文：** 基于 **Tauri v2** 的 macOS 桌面悬浮特效层，复刻 [ba-click-fx](https://github.com/CialloKing/ba-click-fx) 网页版蔚蓝档案点击特效与光标拖尾。

It creates a transparent, borderless, always-on-top, **click-through** window over the primary display and renders the effect on a **WebGL2 OffscreenCanvas running inside a Web Worker** — keeping rendering off the main thread for smooth input, without bundling Electron/Chromium.

它在主显示器上创建一个透明、无边框、置顶、**点击穿透**的悬浮窗口，特效渲染在 **Web Worker 内的 WebGL2 OffscreenCanvas** 上，渲染不占用主线程，且不打包 Electron/Chromium。

---

## Features / 功能特性

**English**

- Transparent click-through overlay (clicks pass to apps underneath)
- Mouse-only macOS `CGEventTap` for global move/down/up events — keyboard/IME is never touched
- Effect renders in a **Dedicated Worker + OffscreenCanvas** with **Full WebGL2**
- Falls back to `canvas2d + software bloom` when WebGL2 is unavailable
- NSPanel is `NonActivatingPanel`, so it never takes keyboard/IME focus
- Converted to an **NSPanel** with `FullScreenAuxiliary` + `CanJoinAllSpaces`, so it can float above **fullscreen apps**
- App runs as an `Accessory` (no Dock icon) with a menu bar icon: open management panel / quit
- Uses the original `ba-click-fx` npm package — no effect rewrite
- Built-in management panel with native macOS vibrancy (frosted glass): unified effect size, opacity (disk + shards only), trail width, bloom, refresh rate and quality presets
- "Launch at login" (autostart) toggle in the management panel
- Lightweight: system WKWebView + small Rust process

**中文**

- 透明点击穿透悬浮层（点击会透传给下层应用）
- 仅监听鼠标的 macOS `CGEventTap`，不触碰键盘 / 输入法事件
- 特效在 **Dedicated Worker + OffscreenCanvas** 中渲染，优先使用 **完整 WebGL2**
- WebGL2 不可用时回退到 `canvas2d + software bloom`
- NSPanel 为 `NonActivatingPanel`，不会抢占键盘 / 输入法焦点
- 使用 **NSPanel**（`FullScreenAuxiliary` + `CanJoinAllSpaces`），可覆盖在**全屏应用**之上
- 以 `Accessory` 模式运行（无 Dock 图标），带菜单栏图标：打开管理面板 / 退出
- 直接使用原版 `ba-click-fx` npm 包，不重写特效
- 内置管理面板（原生 macOS 毛玻璃 vibrancy）：统一特效大小、不透明度（仅圆盘 + 碎片）、拖尾粗细、辉光、刷新率与画质预设
- 管理面板内可开启「开机自启」
- 轻量：系统 WKWebView + 小体积 Rust 进程

---

## Requirements / 环境要求

**English / 中文**

- macOS
- Node.js (with npm) /（含 npm）
- Rust toolchain (`cargo`, `rustc`) — install via [rustup](https://rustup.rs) / 通过 [rustup](https://rustup.rs) 安装
- Xcode Command Line Tools / Xcode 命令行工具

---

## Development / 开发

**English / 中文**

```bash
npm install
npm run tauri dev
```

On macOS, when the app asks for **Accessibility** permission, enable it in:

macOS 若提示需要**辅助功能（Accessibility）**权限，请在系统设置中开启：

```
System Settings → Privacy & Security → Accessibility
系统设置 → 隐私与安全性 → 辅助功能
```

This is required for the global mouse event tap.

这是全局鼠标事件监听所必需的。

---

## Build / 构建

**English / 中文**

```bash
npm run tauri build
```

**English:** The management panel starts **hidden** — open it from the menu bar icon (打开管理面板). The vendored `ba-click-fx` build lives in `vendor/ba-click-fx`; after tuning the fork, re-sync it with `npm run sync:vendor`.

**中文：** 管理面板默认**不自动弹出**——从菜单栏图标「打开管理面板」呼出。`ba-click-fx` 的构建产物已 vendor 进 `vendor/ba-click-fx`；调整 fork 后执行 `npm run sync:vendor` 重新同步。

---

## Publish a DMG to GitHub / 发布 DMG 到 GitHub

**English / 中文**

Pushing a `v*` tag triggers `.github/workflows/release.yml`, which builds the DMG and uploads it to a GitHub Release. Without further setup the app is **ad-hoc signed** and macOS Gatekeeper will block it on other Macs — for real distribution you must sign + notarize.

打 `v*` 标签会触发 `.github/workflows/release.yml` 构建 DMG 并上传到 GitHub Release。不额外配置的话应用是 **ad-hoc 签名**，会被其他 Mac 的 Gatekeeper 拦截——要正式分发必须签名 + 公证。

### 1. 证书（证书，付费开发者账号）
Enroll in the Apple Developer Program and create a **Developer ID Application** certificate, then install it into Keychain.
注册 Apple Developer Program，创建 **Developer ID Application** 证书并装进钥匙串。

### 2. 签名 / 构建（local: set `bundle.macOS.signingIdentity` in `tauri.conf.json`; CI: it reads `APPLE_SIGNING_IDENTITY`)
```jsonc
"bundle": {
  "macOS": {
    "signingIdentity": "Developer ID Application: 你的名字 (TEAMID)"
  }
}
```

### 3. 公证（Notarization，Tauri CLI 自动完成）
Set these env vars when building (CI uses them from repository secrets):
构建时设置以下环境变量（CI 从仓库 secrets 读取）：

```bash
# API-key approach (CI-friendly) / API Key 方式（适合 CI）
export APPLE_API_KEY="xxxx"                 # base64 of AuthKey_XXXX.p8
export APPLE_API_ISSUER="xxxx-…"
export APPLE_API_KEY_PATH="/path/AuthKey_XXXX.p8"
export APPLE_SIGNING_IDENTITY="Developer ID Application: … (TEAMID)"

# or Apple ID / 或 Apple ID 方式
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # app-specific password / 专用密码
export APPLE_TEAM_ID="TEAMID"
```

### 4. 验证（verify）
```bash
xcrun stapler validate src-tauri/target/release/bundle/macos/ba-click-tauri.app
spctl --assess --type execute -vv src-tauri/target/release/bundle/macos/ba-click-tauri.app
# expect "accepted" / 应显示 accepted
```

### 5. 打标签发布（release via tag）
```bash
git tag v0.1.0 && git push origin v0.1.0   # triggers workflow / 触发工作流
# or manually / 或手动：
gh release create v0.1.0 src-tauri/target/release/bundle/dmg/ba-click-tauri_0.1.0_aarch64.dmg --generate-notes
```

> **Note / 注意:** the mandatory secrets for the workflow are listed at the top of `release.yml`. 工作流必需的 secrets 已列在 `release.yml` 顶部注释。

---

## How it works / 工作原理

**English / 中文**

1. Tauri opens a transparent borderless window covering the monitor **work area** (below the macOS menu bar).
   Tauri 打开一个覆盖显示器**工作区**（菜单栏下方）的透明无边框窗口。
2. The window calls `setIgnoreCursorEvents(true)` so clicks pass through.
   窗口调用 `setIgnoreCursorEvents(true)` 让点击透传。
3. The window is converted into a non-activating `NSPanel` (`FullScreenAuxiliary` + `CanJoinAllSpaces`), so it floats above fullscreen apps, follows every space, and never takes keyboard/IME focus.
   窗口被转换为非激活的 `NSPanel`（`FullScreenAuxiliary` + `CanJoinAllSpaces`），可覆盖全屏应用、跟随所有桌面空间，且不抢占键盘/输入法焦点。
4. A Rust `CGEventTap` streams mouse move/down/up events to the webview.
   Rust `CGEventTap` 将全局鼠标移动/按下/抬起事件推送给 webview。
5. The main thread transfers the canvas to an `OffscreenCanvas` and forwards pointer events to a Worker.
   主线程把画布转交给 `OffscreenCanvas`，并将指针事件转发给 Worker。
6. The Worker runs `BAClickFX` (`inputSource: 'manual'`) and renders with Full WebGL2 when available, otherwise falls back to Canvas 2D + software bloom.
   Worker 运行 `BAClickFX`（`inputSource: 'manual'`），可用时使用完整 WebGL2，否则回退 Canvas 2D + 软件 Bloom。

---

## Current tuning / 当前调参

**English:** Applied via `applyFxPatches()` in **`src/fx-config.js`** — the single source of truth used by both the Worker renderer and the main-thread fallback. To tune the effect, edit only this file.

**中文：** 通过 **`src/fx-config.js`** 中的 `applyFxPatches()` 统一应用——它是 Worker 渲染与主线程 fallback 共同使用的唯一调参入口，调整效果只需修改这一个文件。

**English:** The unified opacity (panel setting, default **35%**) applies **only to the click disk + shards**; the trail and the rings stay opaque. The factors below (`1.0 / 0.6 / 5.99`) are defined once in `fx-config.js` and scaled by opacity through `buildFxParams()`.

**中文：** 统一不透明度（面板设置，默认 **35%**）**只作用于点击圆盘 + 三角碎片**，拖尾与圆环保持不透明。下面的系数（`1.0 / 0.6 / 5.99`）在 `fx-config.js` 中定义一次，经 `buildFxParams()` 按不透明度缩放。

| Parameter / 参数 | Factor / 系数 | Default / 默认 | Purpose / 作用 |
|---|---|---|---|
| `maxDpr` | — | 2 | Render at Retina resolution / 以 Retina 分辨率渲染 |
| `bloom.resolutionScale` | — | 0.3 | Cheaper bloom buffers (performance) / 降低 Bloom 缓冲开销（性能） |
| `bloom.diffusion` | — | 5 | Less blur work (performance) / 减少模糊计算（性能） |
| `bloom.clickEmissionScale` | — | 0.4 | Click glow not too bright / 点击辉光不过亮 |
| `bloom.diskEmission` | `1.00 × opacity` | 0.35 | Soft, semi-transparent pale-blue centre disk / 柔和半透明淡蓝中心圆盘 |
| `bloom.diskEmissionAlpha` | `0.60 × opacity` | 0.21 | Disk stays translucent, not a white blob / 圆盘保持半透明，不是白块 |
| `shards.hdrIntensity` | `5.99 × opacity` | 2.096 | Shards follow the same opacity / 碎片辉光跟随同一不透明度 |
| `trail.width` / `trail.geometryWidth` | — | 4.0 | Thicker trail core / 拖尾核心更粗 |
| `trail.outerGlowWidth` | — | 16 | Water-drop head glow / 水滴状头部辉光 |
| `bloom.trailEmission` | — | 30 | Brighter head → clear thick-to-thin taper / 头部更亮，粗细渐变更明显 |
| `overlayAlphaLimit` | — | 0.85 | Overall overlay stays semi-transparent / 整体悬浮层保持半透明 |

---

## Verifying the rendering path / 验证渲染路径

During dev, the terminal prints a status message from the Worker:

开发模式下，终端会打印来自 Worker 的状态消息：

```text
[webview] {"label":"worker-init","extra":{"requested":{"effectBackend":"webgl2","bloomBackend":"webgl2","webgl2Probe":true}},"resolved":{...}}
```

- `webgl2Probe: true` and `resolved` ending as `webgl2/webgl2` → GPU render path active.
- `webgl2Probe: true` 且 `resolved` 最终为 `webgl2/webgl2` → GPU 渲染路径生效。
- `webgl2Probe: false` or `resolved` ending as `canvas2d/native` → WebGL2 unavailable; falls back to Canvas 2D + software bloom.
- `webgl2Probe: false` 或 `resolved` 最终为 `canvas2d/native` → WebGL2 不可用，回退 Canvas 2D + 软件 Bloom。

> **Note / 注意:** right after `worker-init`, `resolved` may briefly show `pending/native` before the first frame renders. That is expected.
> `worker-init` 刚出现时，`resolved` 可能短暂显示 `pending/native`，这是首帧渲染前的正常状态。

---

## Exit / 退出

The Dock icon is hidden (the app runs as an `Accessory`), so to quit:

Dock 图标已隐藏（应用以 `Accessory` 运行），退出方式：

- **Dev mode:** press `Ctrl+C` in the terminal running `npm run tauri dev`.
  **开发模式：** 在运行 `npm run tauri dev` 的终端按 `Ctrl+C`。
- **Running the app directly:**
  **直接运行时：**

```bash
pkill -f ba-click-tauri
```

---

## Troubleshooting / 故障排查

### Effect not triggering or no glow / 特效不触发或没有辉光

- Make sure the app has **Accessibility** permission (System Settings → Privacy & Security → Accessibility). The global mouse listener depends on it.
  请确认已授予**辅助功能（Accessibility）**权限，全局鼠标监听依赖它。
- Check the terminal `[webview] worker-init` line to confirm the render path.
  查看终端 `[webview] worker-init` 日志确认渲染路径。
- Effect look/glow/brightness is tuned in `src/fx-config.js`. Frontend changes hot-reload with `npm run tauri dev`.
  特效外观/辉光/亮度在 `src/fx-config.js` 中调整，前端改动会由 `npm run tauri dev` 热加载。

### Overlay not showing over a fullscreen app / 悬浮层不显示在全屏应用之上

- The window must be converted to the NSPanel: startup should print `[info] overlay converted to NSWindowCollectionBehaviorFullScreenAuxiliary panel`.
  窗口必须转换为 NSPanel：启动时应打印 `[info] overlay converted to NSWindowCollectionBehaviorFullScreenAuxiliary panel`。
- A few capture/exclusive apps isolate their own content; those edge cases are not coverable.
  少数抓屏/独占类应用会隔离自身内容，这类边界情况无法覆盖。

### IME / typing crash or focus stealing / 输入法崩溃或抢焦点

- This was fixed by using a `NonActivatingPanel` and by no longer calling `setFocusable(false)` on the NSPanel-backed window.
  已通过使用 `NonActivatingPanel`，且不再对 NSPanel 窗口调用 `setFocusable(false)` 修复。
- If it ever recurs: `pkill -f ba-click-tauri`, restart `npm run tauri dev`, and paste the terminal error.
  若再次出现：`pkill -f ba-click-tauri` 后重新 `npm run tauri dev`，并粘贴终端报错。

### Large build cache / disk usage / 构建缓存过大

- The Rust build cache in `src-tauri/target` can grow large (several GB). It is safe to wipe:
  `src-tauri/target` 下的 Rust 构建缓存可能达到数 GB，可安全清空：

```bash
cd src-tauri && cargo clean
```

Then rebuild with `npm run tauri dev` / `npm run tauri build`.

然后重新用 `npm run tauri dev` / `npm run tauri build` 构建。

---

## Project layout / 项目结构

```text
ba-click-tauri/
├── index.html           # transparent overlay page / 透明悬浮页面
├── panel.html           # management panel page / 管理面板页面
├── src/
│   ├── main.js          # window setup, global mouse wiring, worker + panel command forwarding
│   │                    # 窗口设置、全局鼠标接线、Worker + 面板指令转发
│   ├── fx-config.js     # shared BAClickFX options + tuning + settings→config/params mappers
│   │                    # 共享 BAClickFX 配置 + 调参 + settings→config/params 映射（唯一入口）
│   ├── fx-worker.js     # BAClickFX inside a Worker (WebGL2 OffscreenCanvas)
│   │                    # Worker 内运行的 BAClickFX（WebGL2 OffscreenCanvas）
│   ├── panel.js         # management panel logic -> emits panel-command events
│   │                    # 管理面板逻辑 -> 发送 panel-command 事件
│   ├── settings.js      # persisted panel settings (localStorage) / 面板设置持久化
│   └── panel.css        # management panel styles / 管理面板样式
├── tests/               # node unit tests for fx-config + settings / 纯函数单测
├── scripts/
│   └── vendor-fx.mjs    # re-copy vendored ba-click-fx (npm run sync:vendor)
├── vendor/
│   └── ba-click-fx/     # vendored ba-click-fx build (self-contained repo / 自包含)
├── .github/workflows/   # CI + release (sign/notarize/upload DMG)
├── src-tauri/
│   ├── src/
│   │   └── lib.rs       # Rust backend + mouse-only CGEventTap + NSPanel + log bridge
│   │                    # Rust 后端 + 仅鼠标 CGEventTap + NSPanel + 日志桥
│   ├── capabilities/
│   └── tauri.conf.json  # overlay + management window config / 悬浮层 + 管理窗口配置
```

---

## License / 许可

MIT — same as the upstream `ba-click-fx` project.

MIT — 与上游 `ba-click-fx` 项目一致。
