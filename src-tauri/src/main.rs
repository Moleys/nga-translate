#[cfg(feature = "tauri-app")]
use std::sync::Arc;

#[cfg(feature = "tauri-app")]
use anyhow::anyhow;
#[cfg(feature = "tauri-app")]
use tauri::{AppHandle, Manager, State};

#[cfg(feature = "tauri-app")]
use nga_translate_shell::{translate_payload, TranslatePayload, TranslateResponse, Translator, TranslatorState};

#[cfg(feature = "tauri-app")]
#[tauri::command]
fn translate_text(payload: TranslatePayload, state: State<TranslatorState>) -> Result<TranslateResponse, String> {
    translate_payload(&state.0, payload)
}

#[cfg(feature = "tauri-app")]
#[tauri::command]
fn health_check() -> String {
    "ok".into()
}

#[cfg(feature = "tauri-app")]
fn resolve_data_dir(app: &AppHandle) -> Option<std::path::PathBuf> {
    let resolver = app.path().resource_dir().ok();

    if let Some(resource_dir) = resolver.as_ref() {
        let candidate = resource_dir.join("data");
        if candidate.exists() {
            return Some(candidate);
        }
    }

    if let Some(resolved) = resolver.resolve_resource("data/Names2.txt") {
        if resolved.exists() {
            if let Some(parent) = resolved.parent() {
                return Some(parent.to_path_buf());
            }
        }
    }

    let candidates = [
        std::path::PathBuf::from("../translate-server/data"),
        std::path::PathBuf::from("../src-tauri/data"),
        std::path::PathBuf::from("../data"),
        std::path::PathBuf::from("src-tauri/data"),
        std::path::PathBuf::from("data"),
    ];

    for path in candidates {
        if path.exists() {
            return Some(path);
        }
    }

    None
}

#[cfg(feature = "tauri-app")]
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = resolve_data_dir(&app.handle()).ok_or_else(|| anyhow!("could not find data directory"))?;
            let translator = Translator::load(&data_dir)?;
            app.manage(TranslatorState(Arc::new(translator)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![translate_text, health_check])
        .run(tauri::generate_context!(
            "../../tauri.conf.json"
        ))
        .expect("error while running tauri application");
}

#[cfg(not(feature = "tauri-app"))]
fn main() {}
