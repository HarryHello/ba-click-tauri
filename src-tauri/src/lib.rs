use serde::Serialize;
use std::thread;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
struct MouseEventPayload {
    kind: String,
    button: String,
}

fn button_name(event_type: rdev::EventType) -> String {
    match event_type {
        rdev::EventType::ButtonPress(button) | rdev::EventType::ButtonRelease(button) => {
            format!("{button:?}")
        }
        _ => String::new(),
    }
}

fn start_global_listener(app: AppHandle) {
    thread::spawn(move || {
        let result = rdev::listen(move |event: rdev::Event| {
            let kind = match event.event_type {
                rdev::EventType::ButtonPress(_) => Some("down"),
                rdev::EventType::ButtonRelease(_) => Some("up"),
                _ => None,
            };

            if let Some(kind) = kind {
                let payload = MouseEventPayload {
                    kind: kind.to_string(),
                    button: button_name(event.event_type),
                };
                let _ = app.emit("mouse-event", payload);
            }
        });

        if let Err(error) = result {
            eprintln!("ba-click-tauri: failed to start global mouse listener: {error:?}");
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            start_global_listener(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ba-click-tauri");
}