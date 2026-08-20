use core_foundation::runloop::CFRunLoop;
use core_graphics::event::{
    CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement, CGEventType,
    CallbackResult,
};
use serde::Serialize;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{generate_handler, AppHandle, Emitter, Manager, WebviewWindow};
#[allow(deprecated)] // tauri-nspanel v2 re-exports the old cocoa wrappers
use tauri_nspanel::{cocoa::appkit::NSWindowCollectionBehavior, WebviewWindowExt};
use tauri_plugin_opener::OpenerExt;
use window_vibrancy::{
    apply_vibrancy, clear_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
};

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    // macOS 10.15+ Input Monitoring (listen event) permission checks.
    fn CGPreflightListenEventAccess() -> bool;
    fn CGRequestListenEventAccess() -> bool;
}

fn timestamp() -> String {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}.{:03}", duration.as_secs(), duration.subsec_millis())
}

fn log_dir(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_log_dir().ok()
}

// Append one line to the app log file (~/Library/Logs/<bundle>/ba-click-tauri.log).
fn append_log(app: &AppHandle, line: &str) {
    let Some(dir) = log_dir(app) else { return };
    let _ = fs::create_dir_all(&dir);
    let path = dir.join("ba-click-tauri.log");
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(file, "[{}] {line}", timestamp());
    }
}

fn write_log(app: &AppHandle, msg: &str) {
    append_log(app, msg);
    println!("{msg}");
}

#[derive(Clone, Serialize)]
struct MouseEventPayload {
    kind: String,
    x: f64,
    y: f64,
    button: Option<String>,
}

fn button_for(event_type: CGEventType) -> Option<&'static str> {
    match event_type {
        CGEventType::LeftMouseDown | CGEventType::LeftMouseUp => Some("Left"),
        CGEventType::RightMouseDown | CGEventType::RightMouseUp => Some("Right"),
        CGEventType::OtherMouseDown | CGEventType::OtherMouseUp => Some("Middle"),
        _ => None,
    }
}

fn event_kind_for(event_type: CGEventType) -> Option<&'static str> {
    match event_type {
        CGEventType::LeftMouseDown | CGEventType::RightMouseDown | CGEventType::OtherMouseDown => {
            Some("down")
        }
        CGEventType::LeftMouseUp | CGEventType::RightMouseUp | CGEventType::OtherMouseUp => {
            Some("up")
        }
        _ => None,
    }
}

fn start_global_listener(app: AppHandle) {
    write_log(&app, "[listener] starting global mouse event tap");
    thread::spawn(move || {
        // Ad-hoc signed builds get a new code signature on every rebuild, which
        // makes macOS treat them as a new app for Input Monitoring (TCC).
        // Request explicitly so the user gets the system prompt instead of a
        // silent failure.
        let granted = unsafe { CGPreflightListenEventAccess() };
        if !granted {
            write_log(
                &app,
                "[listener] Input Monitoring not granted, requesting access...",
            );
            let _ = unsafe { CGRequestListenEventAccess() };
        }
        write_log(
            &app,
            &format!("[listener] input monitoring preflight={granted}"),
        );

        let last_position = Arc::new(Mutex::new((0.0_f64, 0.0_f64)));
        let last_move_at = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(1)));

        // Clone for the event-tap callback so `app` can be used afterwards.
        let tap_app = app.clone();

        let event_tap_result = CGEventTap::with_enabled(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            vec![
                CGEventType::MouseMoved,
                CGEventType::LeftMouseDragged,
                CGEventType::RightMouseDragged,
                CGEventType::OtherMouseDragged,
                CGEventType::LeftMouseDown,
                CGEventType::LeftMouseUp,
                CGEventType::RightMouseDown,
                CGEventType::RightMouseUp,
                CGEventType::OtherMouseDown,
                CGEventType::OtherMouseUp,
            ],
            move |_proxy, event_type, event| {
                let point = event.location();
                let mut payload = None;

                match event_type {
                    CGEventType::MouseMoved
                    | CGEventType::LeftMouseDragged
                    | CGEventType::RightMouseDragged
                    | CGEventType::OtherMouseDragged => {
                        *last_position.lock().unwrap() = (point.x, point.y);

                        let mut last_move_at = last_move_at.lock().unwrap();
                        if last_move_at.elapsed() >= Duration::from_millis(8) {
                            *last_move_at = Instant::now();
                            payload = Some(MouseEventPayload {
                                kind: "move".to_string(),
                                x: point.x,
                                y: point.y,
                                button: None,
                            });
                        }
                    }
                    _ => {
                        if let Some(kind) = event_kind_for(event_type) {
                            let (x, y) = *last_position.lock().unwrap();
                            payload = Some(MouseEventPayload {
                                kind: kind.to_string(),
                                x,
                                y,
                                button: button_for(event_type).map(str::to_string),
                            });
                        }
                    }
                }

                if let Some(payload) = payload {
                    let _ = tap_app.emit("mouse-event", payload);
                }

                CallbackResult::Keep
            },
            || {
                // Run the current thread's runloop forever; the event tap source
                // is already installed by `with_enabled`.
                CFRunLoop::run_current();
            },
        );

        if event_tap_result.is_err() {
            write_log(&app, "[listener] FAILED to start global mouse event tap (check Accessibility permission)");
        } else {
            write_log(&app, "[listener] global mouse event tap running");
        }
    });
}

#[tauri::command]
fn log_message(app: AppHandle, message: String) {
    let line = format!("[webview] {message}");
    append_log(&app, &line);
    eprintln!("{line}");
}

#[tauri::command]
fn input_monitoring_enabled() -> bool {
    unsafe { CGPreflightListenEventAccess() }
}

#[tauri::command]
fn open_input_monitoring_settings() -> Result<(), String> {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent")
        .status()
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[allow(non_upper_case_globals)]
#[allow(deprecated)] // the cocoa re-export is deprecated but tauri-nspanel v2 still uses it
fn init_panel(app_handle: &AppHandle) {
    write_log(app_handle, "[overlay] converting window to NSPanel");
    let window: WebviewWindow = app_handle
        .get_webview_window("main")
        .expect("main window not found");
    let panel = window
        .to_panel()
        .expect("failed to convert window to panel");

    // Float above other windows, but never become the key/active window.
    const NSFloatWindowLevel: i32 = 4;
    panel.set_level(NSFloatWindowLevel);

    const NSWindowStyleMaskNonActivatingPanel: i32 = 1 << 7;
    panel.set_style_mask(NSWindowStyleMaskNonActivatingPanel);

    // Show in the same Space as fullscreen apps and follow the user across
    // every desktop space.
    panel.set_collection_behaviour(
        NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces,
    );

    write_log(
        app_handle,
        "[overlay] converted to NSWindowCollectionBehaviorFullScreenAuxiliary panel",
    );
}

fn parse_vibrancy_material(value: &str) -> NSVisualEffectMaterial {
    match value {
        "sidebar" => NSVisualEffectMaterial::Sidebar,
        "window" => NSVisualEffectMaterial::WindowBackground,
        "content" => NSVisualEffectMaterial::ContentBackground,
        _ => NSVisualEffectMaterial::HudWindow,
    }
}

fn apply_panel_vibrancy(app_handle: &AppHandle) {
    let panel = app_handle
        .get_webview_window("panel")
        .expect("panel window not found");

    match apply_vibrancy(
        &panel,
        NSVisualEffectMaterial::HudWindow,
        Some(NSVisualEffectState::Active),
        None,
    ) {
        Ok(()) => write_log(app_handle, "[panel] applied native vibrancy"),
        Err(error) => write_log(
            app_handle,
            &format!("[panel] failed to apply vibrancy: {error}"),
        ),
    }
}

#[tauri::command]
fn set_panel_material(app: AppHandle, material: String) -> Result<(), String> {
    let panel = app
        .get_webview_window("panel")
        .ok_or_else(|| "panel window not found".to_string())?;

    clear_vibrancy(&panel).map_err(|error| error.to_string())?;
    apply_vibrancy(
        &panel,
        parse_vibrancy_material(&material),
        Some(NSVisualEffectState::Active),
        None,
    )
    .map_err(|error| error.to_string())?;

    write_log(
        &app,
        &format!("[panel] set vibrancy material to '{material}'"),
    );
    Ok(())
}

fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "打开管理面板", true, None::<&str>)?;
    let logs = MenuItem::with_id(app, "logs", "查看日志", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出应用", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[&open, &logs, &PredefinedMenuItem::separator(app)?, &quit],
    )?;

    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/bar_icon_44.png"))?;

    let tray = TrayIconBuilder::with_id("main")
        .icon(icon)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => {
                if let Some(panel) = app.get_webview_window("panel") {
                    write_log(app, "[panel] open via tray");
                    let _ = panel.show();
                    let _ = panel.unminimize();
                    let _ = panel.set_focus();
                }
            }
            "logs" => {
                if let Some(dir) = log_dir(app) {
                    let file = dir.join("ba-click-tauri.log");
                    write_log(app, "[logs] revealing log file");
                    let _ = app.opener().reveal_item_in_dir(&file);
                }
            }
            "quit" => {
                write_log(app, "[app] quit from tray");
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    app.manage(Mutex::new(tray));
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_nspanel::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(generate_handler![
            log_message,
            set_panel_material,
            input_monitoring_enabled,
            open_input_monitoring_settings
        ])
        .on_window_event(|window, event| {
            // Closing the management panel should hide it, not destroy it —
            // otherwise the tray "打开管理面板" can no longer find/reopen it.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "panel" {
                    write_log(
                        window.app_handle(),
                        "[panel] close requested -> hidden instead of destroyed",
                    );
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            write_log(app.handle(), "[app] startup");
            // Hide the Dock icon: this is a pure overlay utility.
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            init_panel(app.handle());
            apply_panel_vibrancy(app.handle());
            setup_tray(app)?;
            start_global_listener(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ba-click-tauri");
}
