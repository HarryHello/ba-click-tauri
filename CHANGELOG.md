# Changelog

All notable changes to **BA Click Tauri** will be documented in this file.

## [0.1.3] - 2026-08-20

### Added

- **输入监控权限检测与引导（Input Monitoring permission detection & guidance）**
  - 启动时自动检测 Input Monitoring 权限；未授权时主动调用系统 API 尝试弹出授权请求。
  - 管理面板顶部新增黄色提示条：权限缺失时显示「去开启」按钮，一键跳转
    `系统设置 → 隐私与安全性 → 输入监控`；授权后提示条自动隐藏。
  - 日志中记录 `[listener] input monitoring preflight=...`，方便确认权限状态。

- **自签名代码签名身份（self-signed signing identity）**
  - 默认使用本机自签名证书 `BA Click Tauri Signing` 签名（不再是 ad-hoc）。
  - 同一张证书签名的更新会保持 Input Monitoring 权限，更新后**通常无需重新授权**。
  - 本机构建需要该证书存在于钥匙串；GitHub Actions 自动构建如需复用，需导出 `.p12` 并配置 secrets。

- **管理面板统一命名**
  - 面板标题/窗口标题从「BA Click FX」改为「BA Click Tauri」。

### Changed

- 面板「检查更新」「GitHub 仓库」按钮改为**强调色蓝色圆角白字按钮**，不再像 disabled。
- 修复权限提示条在已授权时仍显示的问题（`display:flex` 覆盖 `hidden`）。

### Fixed

- 修复 ad-hoc 构建更新后输入监控权限失效导致“切焦点后特效消失”的体验问题：
  现在会明确提示并引导重新授权，而不是静默失败。

> **升级提醒（Important）**：如果升级后特效不触发，请打开
> `系统设置 → 隐私与安全性 → 输入监控`，**删除旧的 BA Click Tauri 条目**，
> 然后重新添加/勾选新的应用条目；之后启动应用即可恢复。

---

## [0.1.2] - 2026-08-19

### Added

- 菜单栏「查看日志」，在 Finder 中定位应用日志文件。
- 日志文件：`~/Library/Logs/com.harryhell.ba-click-tauri/ba-click-tauri.log`。
- 记录启动、鼠标监听、面板开关、WebView JS 错误、聚焦/可见性变化、心跳。

### Changed

- GitHub Actions 自动构建支持 **aarch64（Apple Silicon）与 x86_64（Intel）** 两个 DMG。
- 面板新增「开机自启」开关；开关控件改为 macOS 风格 switcher。
- 管理面板默认隐藏，从菜单栏呼出。

### Fixed

- 修复关闭管理面板后无法再次打开的问题（关闭时隐藏而非销毁）。
- 修复无签名构建的 ad-hoc 签名资源缺失导致被系统判定为“已损坏”。

---

## [0.1.1] - 2026-08-19

### Added

- 面板新增「检查更新」「GitHub 仓库」入口（跳转 GitHub Release / 仓库）。

### Changed

- 应用正式名改为 **BA Click Tauri**。

### Fixed

- 修复管理面板关闭后无法再次打开的问题。

---

## [0.1.0] - 2026-08-19

### Added

- 首个公开构建：透明点击穿透悬浮层、BA 风格点击特效与光标拖尾。
- 管理面板：统一特效大小、不透明度（仅圆盘+碎片）、拖尾粗细、辉光、刷新率、画质预设、毛玻璃样式。
- 菜单栏图标：打开管理面板 / 退出。
