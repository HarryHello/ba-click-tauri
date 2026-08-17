use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

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

        let result = rdev::listen(move |event: rdev::Event| {
            let mut payload = None;

            match &event.event_type {
                rdev::EventType::MouseMove { x, y } => {
                    *last_position.lock().unwrap() = (*x, *y);

                    let mut last_move_at = last_move_at.lock().unwrap();
                    if last_move_at.elapsed() >= Duration::from_millis(8) {
                        *last_move_at = Instant::now();
                        payload = Some(MouseEventPayload {
                            kind: "move".to_string(),
                            x: *x,
                            y: *y,
                            button: None,
                        });
                    }
                }
                rdev::EventType::ButtonPress(button) => {
                    let (x, y) = *last_position.lock().unwrap();
                    payload = Some(MouseEventPayload {
                        kind: "down".to_string(),
                        x,
                        y,
                        button: Some(format!("{button:?}")),
                    });
                }
                rdev::EventType::ButtonRelease(button) => {
                    let (x, y) = *last_position.lock().unwrap();
                    payload = Some(MouseEventPayload {
                        kind: "up".to_string(),
                        x,
                        y,
                        button: Some(format!("{button:?}")),
                    });
                }
                _ => {}
            }

            if let Some(payload) = payload {
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