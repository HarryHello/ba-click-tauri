use core_foundation::runloop::CFRunLoop;
use core_graphics::event::{
    CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement, CGEventType,
    CallbackResult,
};
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{generate_handler, AppHandle, Emitter, Manager, WebviewWindow};
#[allow(deprecated)] // tauri-nspanel v2 re-exports the old cocoa wrappers
use tauri_nspanel::{cocoa::appkit::NSWindowCollectionBehavior, WebviewWindowExt};
use window_vibrancy::{
    apply_vibrancy, clear_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
};

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
    thread::spawn(move || {
        let last_position = Arc::new(Mutex::new((0.0_f64, 0.0_f64)));
        let last_move_at = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(1)));

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
                    let _ = app.emit("mouse-event", payload);
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
            eprintln!("ba-click-tauri: failed to start global mouse event tap");
        }
    });
}

#[tauri::command]
fn log_message(message: String) {
    println!("[webview] {message}");
}

#[allow(non_upper_case_globals)]
#[allow(deprecated)] // the cocoa re-export is deprecated but tauri-nspanel v2 still uses it
fn init_panel(app_handle: &AppHandle) {
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

    println!("[info] overlay converted to NSWindowCollectionBehaviorFullScreenAuxiliary panel");
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
        Ok(()) => println!("[info] applied native vibrancy to management panel"),
        Err(error) => eprintln!("[info] failed to apply vibrancy to management panel: {error}"),
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
    .map_err(|error| error.to_string())
}

fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "打开管理面板", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出应用", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &PredefinedMenuItem::separator(app)?, &quit])?;

    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/bar_icon_44.png"))?;

    let tray = TrayIconBuilder::with_id("main")
        .icon(icon)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => {
                if let Some(panel) = app.get_webview_window("panel") {
                    let _ = panel.show();
                    let _ = panel.unminimize();
                    let _ = panel.set_focus();
                }
            }
            "quit" => app.exit(0),
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
        .invoke_handler(generate_handler![log_message, set_panel_material])
        .on_window_event(|window, event| {
            // Closing the management panel should hide it, not destroy it —
            // otherwise the tray "打开管理面板" can no longer find/reopen it.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "panel" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
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
