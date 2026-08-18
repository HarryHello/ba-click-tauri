use core_foundation::runloop::CFRunLoop;
use core_graphics::event::{
    CallbackResult, CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement,
    CGEventType,
};
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{generate_handler, AppHandle, Emitter, Manager, WebviewWindow};
#[allow(deprecated)] // tauri-nspanel v2 re-exports the old cocoa wrappers
use tauri_nspanel::{cocoa::appkit::NSWindowCollectionBehavior, WebviewWindowExt};
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

#[derive(Clone, Serialize)]
struct MouseEventPayload {
    kind: String,
    x: f64,
    y: f64,
    button: Option<String>,
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
                    CGEventType::LeftMouseDown => {
                        let (x, y) = *last_position.lock().unwrap();
                        payload = Some(MouseEventPayload {
                            kind: "down".to_string(),
                            x,
                            y,
                            button: Some("Left".to_string()),
                        });
                    }
                    CGEventType::LeftMouseUp => {
                        let (x, y) = *last_position.lock().unwrap();
                        payload = Some(MouseEventPayload {
                            kind: "up".to_string(),
                            x,
                            y,
                            button: Some("Left".to_string()),
                        });
                    }
                    CGEventType::RightMouseDown => {
                        let (x, y) = *last_position.lock().unwrap();
                        payload = Some(MouseEventPayload {
                            kind: "down".to_string(),
                            x,
                            y,
                            button: Some("Right".to_string()),
                        });
                    }
                    CGEventType::RightMouseUp => {
                        let (x, y) = *last_position.lock().unwrap();
                        payload = Some(MouseEventPayload {
                            kind: "up".to_string(),
                            x,
                            y,
                            button: Some("Right".to_string()),
                        });
                    }
                    CGEventType::OtherMouseDown => {
                        let (x, y) = *last_position.lock().unwrap();
                        payload = Some(MouseEventPayload {
                            kind: "down".to_string(),
                            x,
                            y,
                            button: Some("Middle".to_string()),
                        });
                    }
                    CGEventType::OtherMouseUp => {
                        let (x, y) = *last_position.lock().unwrap();
                        payload = Some(MouseEventPayload {
                            kind: "up".to_string(),
                            x,
                            y,
                            button: Some("Middle".to_string()),
                        });
                    }
                    _ => {}
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
    let panel = window.to_panel().expect("failed to convert window to panel");

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

fn apply_panel_vibrancy(app_handle: &AppHandle) {
    let panel = app_handle
        .get_webview_window("panel")
        .expect("panel window not found");

    match apply_vibrancy(
        &panel,
        NSVisualEffectMaterial::HudWindow,
        Some(NSVisualEffectState::Active),
        Some(12.0),
    ) {
        Ok(()) => println!("[info] applied native vibrancy to management panel"),
        Err(error) => eprintln!("[info] failed to apply vibrancy to management panel: {error}"),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_nspanel::init())
        .invoke_handler(generate_handler![log_message])
        .setup(|app| {
            // Hide the Dock icon: this is a pure overlay utility.
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            init_panel(app.handle());
            apply_panel_vibrancy(app.handle());
            start_global_listener(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ba-click-tauri");
}