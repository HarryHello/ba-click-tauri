use core_foundation::runloop::CFRunLoop;
use core_graphics::event::{
    CallbackResult, CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement,
    CGEventType,
};
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{generate_handler, AppHandle, Emitter};

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
                        if last_move_at.elapsed() >= Duration::from_millis(16) {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(generate_handler![log_message])
        .setup(|app| {
            start_global_listener(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ba-click-tauri");
}