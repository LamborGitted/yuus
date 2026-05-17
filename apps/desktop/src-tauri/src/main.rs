use base64::Engine;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;
use walkdir::WalkDir;

const IMAGE_EXTENSIONS: [&str; 8] = ["png", "jpg", "jpeg", "svg", "gif", "bmp", "webp", "ico"];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImageReplaceItem {
    image_hash: String,
    original_path: String,
    original_name: String,
    replacement_path: String,
    replaced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HistoryEntry {
    action: String,
    original_path: String,
    original_name: String,
    replacement_path: String,
    backup_path: String,
    timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImagesReplaceTable {
    table_hash: String,
    images_dir: String,
    items: Vec<ImageReplaceItem>,
    #[serde(default)]
    history: Vec<HistoryEntry>,
    #[serde(default)]
    redo_stack: Vec<HistoryEntry>,
    #[serde(default)]
    audit_log: Vec<HistoryEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplaceResult {
    table_hash: String,
    original_path: String,
    replacement_path: String,
    replaced: bool,
    reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UndoRedoState {
    can_undo: bool,
    can_redo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SystemLocaleInfo {
    locale: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImagePreviewPayload {
    path: String,
    data_url: String,
}

fn images_workspace_dir() -> Result<PathBuf, String> {
    let temp_dir = std::env::temp_dir().join("images");
    fs::create_dir_all(&temp_dir).map_err(|error| error.to_string())?;
    Ok(temp_dir)
}

fn backups_dir(table_hash: &str) -> Result<PathBuf, String> {
    let dir = images_workspace_dir()?.join("backups").join(table_hash);
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn has_image_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| IMAGE_EXTENSIONS.contains(&extension.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn walk_images(dir: &str, extensions: &[String], recursive: bool) -> Vec<PathBuf> {
    let walker = if recursive {
        WalkDir::new(dir).into_iter()
    } else {
        WalkDir::new(dir).max_depth(1).into_iter()
    };
    walker
        .filter_map(Result::ok)
        .map(|entry| entry.into_path())
        .filter(|path| {
            path.is_file()
                && path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| extensions.iter().any(|ext| ext.eq_ignore_ascii_case(e)))
                    .unwrap_or(false)
        })
        .collect()
}

fn hash_bytes(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

fn file_hash(path: &Path) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|error| error.to_string())?;
    Ok(hash_bytes(&bytes))
}

fn table_hash(images_dir: &str, image_paths: &[String]) -> Result<String, String> {
    let payload = serde_json::json!({
        "imagesDir": images_dir,
        "imageFiles": image_paths,
    });
    let serialized = serde_json::to_vec(&payload).map_err(|error| error.to_string())?;
    Ok(hash_bytes(&serialized))
}

fn table_path(table_hash: &str) -> Result<PathBuf, String> {
    Ok(images_workspace_dir()?.join(format!("{table_hash}.json")))
}

fn write_table(table: &ImagesReplaceTable) -> Result<(), String> {
    let path = table_path(&table.table_hash)?;
    let content = serde_json::to_vec_pretty(table).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

fn read_table(table_hash: &str) -> Result<Option<ImagesReplaceTable>, String> {
    let path = table_path(table_hash)?;
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read(path).map_err(|error| error.to_string())?;
    let table = serde_json::from_slice::<ImagesReplaceTable>(&content)
        .map_err(|error| error.to_string())?;
    Ok(Some(table))
}

fn find_item_mut<'a>(
    table: &'a mut ImagesReplaceTable,
    original_path: &str,
) -> Option<&'a mut ImageReplaceItem> {
    table
        .items
        .iter_mut()
        .find(|item| item.original_path == original_path)
}

fn now_timestamp() -> String {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .to_string()
}

fn detect_system_locale() -> Option<String> {
    ["LC_ALL", "LC_MESSAGES", "LANG", "LANGUAGE"]
        .into_iter()
        .filter_map(|key| std::env::var(key).ok())
        .map(|value| {
            value
                .split('.')
                .next()
                .unwrap_or_default()
                .split('@')
                .next()
                .unwrap_or_default()
                .replace('_', "-")
        })
        .find(|value| !value.is_empty())
}

fn guess_mime_type(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("svg") => "image/svg+xml",
        Some("gif") => "image/gif",
        Some("bmp") => "image/bmp",
        Some("webp") => "image/webp",
        Some("ico") => "image/x-icon",
        _ => "application/octet-stream",
    }
}

#[tauri::command]
fn import_images_dir(
    dir: String,
    extensions: Vec<String>,
    recursive: bool,
) -> Result<ImagesReplaceTable, String> {
    let mut image_paths = walk_images(&dir, &extensions, recursive)
        .into_iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect::<Vec<_>>();

    image_paths.sort();

    let table_hash = table_hash(&dir, &image_paths)?;
    let items = image_paths
        .into_iter()
        .map(|image_path| {
            let path = PathBuf::from(&image_path);
            let original_name = path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_string();

            Ok(ImageReplaceItem {
                image_hash: file_hash(&path)?,
                original_path: image_path,
                original_name,
                replacement_path: String::new(),
                replaced: false,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;

    let table = ImagesReplaceTable {
        table_hash,
        images_dir: dir,
        items,
        history: Vec::new(),
        redo_stack: Vec::new(),
        audit_log: Vec::new(),
    };

    write_table(&table)?;
    Ok(table)
}

#[tauri::command]
fn get_replace_table(table_hash: String) -> Result<Option<ImagesReplaceTable>, String> {
    read_table(&table_hash)
}

#[tauri::command]
fn get_image_preview(path: String) -> Result<Option<ImagePreviewPayload>, String> {
    let file_path = PathBuf::from(&path);
    if !file_path.exists() || !file_path.is_file() || !has_image_extension(&file_path) {
        return Ok(None);
    }

    let bytes = fs::read(&file_path).map_err(|error| error.to_string())?;
    let mime_type = guess_mime_type(&file_path);
    let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);

    Ok(Some(ImagePreviewPayload {
        path,
        data_url: format!("data:{mime_type};base64,{encoded}"),
    }))
}

#[tauri::command]
fn set_replacement_path(
    table_hash: String,
    original_path: String,
    replacement_path: String,
) -> Result<Option<ImageReplaceItem>, String> {
    let mut table = match read_table(&table_hash)? {
        Some(table) => table,
        None => return Ok(None),
    };

    let replacement = PathBuf::from(&replacement_path);
    if !replacement.exists() {
        return Ok(None);
    }

    let item = match find_item_mut(&mut table, &original_path) {
        Some(item) => item,
        None => return Ok(None),
    };

    item.replacement_path = replacement_path;
    item.replaced = false;
    let updated = item.clone();
    write_table(&table)?;
    Ok(Some(updated))
}

fn exec_replace(table_hash: &str, table: &mut ImagesReplaceTable, original_path: &str) -> ReplaceResult {
    let item = match find_item_mut(table, original_path) {
        Some(item) => item,
        None => {
            return ReplaceResult {
                table_hash: table_hash.to_string(),
                original_path: original_path.to_string(),
                replacement_path: String::new(),
                replaced: false,
                reason: Some("image_not_found_in_table".into()),
            }
        }
    };

    if item.replacement_path.is_empty() {
        return ReplaceResult {
            table_hash: table_hash.to_string(),
            original_path: item.original_path.clone(),
            replacement_path: String::new(),
            replaced: false,
            reason: Some("replacement_path_not_set".into()),
        };
    }

    let original = PathBuf::from(&item.original_path);
    let replacement = PathBuf::from(&item.replacement_path);
    if !original.exists() {
        return ReplaceResult {
            table_hash: table_hash.to_string(),
            original_path: item.original_path.clone(),
            replacement_path: item.replacement_path.clone(),
            replaced: false,
            reason: Some("original_file_not_found".into()),
        };
    }
    if !replacement.exists() {
        return ReplaceResult {
            table_hash: table_hash.to_string(),
            original_path: item.original_path.clone(),
            replacement_path: item.replacement_path.clone(),
            replaced: false,
            reason: Some("replacement_file_not_found".into()),
        };
    }

    let original_name = item.original_name.clone();
    let item_original_path = item.original_path.clone();
    let item_replacement_path = item.replacement_path.clone();

    let backup_dir = match backups_dir(table_hash) {
        Ok(d) => d,
        Err(_) => {
            return ReplaceResult {
                table_hash: table_hash.to_string(),
                original_path: item_original_path,
                replacement_path: item_replacement_path,
                replaced: false,
                reason: Some("backup_dir_failed".into()),
            }
        }
    };
    let backup_filename = format!("{}_{}", file_hash(&original).unwrap_or_default(), &original_name);
    let backup_path = backup_dir.join(&backup_filename);
    if fs::copy(&original, &backup_path).is_err() {
        return ReplaceResult {
            table_hash: table_hash.to_string(),
            original_path: item_original_path,
            replacement_path: item_replacement_path,
            replaced: false,
            reason: Some("backup_failed".into()),
        };
    }

    let workspace = match images_workspace_dir() {
        Ok(d) => d,
        Err(_) => {
            return ReplaceResult {
                table_hash: table_hash.to_string(),
                original_path: item_original_path,
                replacement_path: item_replacement_path,
                replaced: false,
                reason: Some("workspace_dir_failed".into()),
            }
        }
    };
    let temp_path = workspace.join(
        replacement
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("replacement-image"),
    );
    let renamed_temp_path = workspace.join(&original_name);

    if fs::copy(&replacement, &temp_path).is_err() {
        return ReplaceResult {
            table_hash: table_hash.to_string(),
            original_path: item_original_path,
            replacement_path: item_replacement_path,
            replaced: false,
            reason: Some("copy_failed".into()),
        };
    }
    if temp_path != renamed_temp_path {
        if renamed_temp_path.exists() {
            let _ = fs::remove_file(&renamed_temp_path);
        }
        if fs::rename(&temp_path, &renamed_temp_path).is_err() {
            return ReplaceResult {
                table_hash: table_hash.to_string(),
                original_path: item_original_path,
                replacement_path: item_replacement_path,
                replaced: false,
                reason: Some("rename_failed".into()),
            };
        }
    }
    if fs::copy(&renamed_temp_path, &original).is_err() {
        return ReplaceResult {
            table_hash: table_hash.to_string(),
            original_path: item_original_path,
            replacement_path: item_replacement_path,
            replaced: false,
            reason: Some("overwrite_failed".into()),
        };
    }

    item.replaced = true;

    let entry = HistoryEntry {
        action: "replace".into(),
        original_path: item_original_path.clone(),
        original_name: original_name.clone(),
        replacement_path: item_replacement_path.clone(),
        backup_path: backup_path.to_string_lossy().to_string(),
        timestamp: now_timestamp(),
    };
    table.history.push(entry.clone());
    table.audit_log.push(entry);
    table.redo_stack.clear();

    ReplaceResult {
        table_hash: table_hash.to_string(),
        original_path: item_original_path,
        replacement_path: item_replacement_path,
        replaced: true,
        reason: None,
    }
}

#[tauri::command]
fn replace_image_by_path(
    table_hash: String,
    original_path: String,
) -> Result<ReplaceResult, String> {
    let mut table = match read_table(&table_hash)? {
        Some(table) => table,
        None => {
            return Ok(ReplaceResult {
                table_hash,
                original_path,
                replacement_path: String::new(),
                replaced: false,
                reason: Some("table_not_found".into()),
            })
        }
    };

    let result = exec_replace(&table_hash, &mut table, &original_path);
    if result.replaced {
        write_table(&table)?;
    }
    Ok(result)
}

#[tauri::command]
fn replace_images_from_map(table_hash: String) -> Result<Vec<ReplaceResult>, String> {
    let mut table = match read_table(&table_hash)? {
        Some(table) => table,
        None => {
            return Ok(vec![ReplaceResult {
                table_hash,
                original_path: String::new(),
                replacement_path: String::new(),
                replaced: false,
                reason: Some("table_not_found".into()),
            }])
        }
    };

    let paths: Vec<String> = table.items.iter().map(|i| i.original_path.clone()).collect();
    let results: Vec<ReplaceResult> = paths
        .iter()
        .map(|path| exec_replace(&table_hash, &mut table, path))
        .collect();

    let any_replaced = results.iter().any(|r| r.replaced);
    if any_replaced {
        write_table(&table)?;
    }
    Ok(results)
}

#[tauri::command]
fn undo_last_replace(table_hash: String) -> Result<ReplaceResult, String> {
    let mut table = match read_table(&table_hash)? {
        Some(table) => table,
        None => {
            return Ok(ReplaceResult {
                table_hash,
                original_path: String::new(),
                replacement_path: String::new(),
                replaced: false,
                reason: Some("table_not_found".into()),
            })
        }
    };

    let entry = match table.history.pop() {
        Some(entry) => entry,
        None => {
            return Ok(ReplaceResult {
                table_hash,
                original_path: String::new(),
                replacement_path: String::new(),
                replaced: false,
                reason: Some("nothing_to_undo".into()),
            })
        }
    };

    let backup_exists = PathBuf::from(&entry.backup_path).exists();
    let original_exists = PathBuf::from(&entry.original_path).exists();

    if !backup_exists {
        table.history.push(entry.clone());
        return Ok(ReplaceResult {
            table_hash,
            original_path: entry.original_path,
            replacement_path: entry.replacement_path,
            replaced: false,
            reason: Some("backup_not_found".into()),
        });
    }

    if !original_exists {
        table.history.push(entry.clone());
        return Ok(ReplaceResult {
            table_hash,
            original_path: entry.original_path,
            replacement_path: entry.replacement_path,
            replaced: false,
            reason: Some("original_file_not_found".into()),
        });
    }

    let backup = PathBuf::from(&entry.backup_path);
    let original = PathBuf::from(&entry.original_path);
    fs::copy(&backup, &original).map_err(|error| error.to_string())?;

    if let Some(item) = find_item_mut(&mut table, &entry.original_path) {
        item.replaced = false;
    }

    let redo_entry = HistoryEntry {
        action: "replace".into(),
        original_path: entry.original_path.clone(),
        original_name: entry.original_name.clone(),
        replacement_path: entry.replacement_path.clone(),
        backup_path: entry.backup_path.clone(),
        timestamp: entry.timestamp.clone(),
    };
    table.redo_stack.push(redo_entry);

    let audit_entry = HistoryEntry {
        action: "undo".into(),
        original_path: entry.original_path.clone(),
        original_name: entry.original_name.clone(),
        replacement_path: entry.replacement_path.clone(),
        backup_path: entry.backup_path.clone(),
        timestamp: now_timestamp(),
    };
    table.audit_log.push(audit_entry);

    let result = ReplaceResult {
        table_hash: table_hash.clone(),
        original_path: entry.original_path,
        replacement_path: entry.replacement_path,
        replaced: false,
        reason: None,
    };
    write_table(&table)?;
    Ok(result)
}

#[tauri::command]
fn redo_last_replace(table_hash: String) -> Result<ReplaceResult, String> {
    let mut table = match read_table(&table_hash)? {
        Some(table) => table,
        None => {
            return Ok(ReplaceResult {
                table_hash,
                original_path: String::new(),
                replacement_path: String::new(),
                replaced: false,
                reason: Some("table_not_found".into()),
            })
        }
    };

    let entry = match table.redo_stack.pop() {
        Some(entry) => entry,
        None => {
            return Ok(ReplaceResult {
                table_hash,
                original_path: String::new(),
                replacement_path: String::new(),
                replaced: false,
                reason: Some("nothing_to_redo".into()),
            })
        }
    };

    let replacement_exists = PathBuf::from(&entry.replacement_path).exists();
    let original_exists = PathBuf::from(&entry.original_path).exists();

    if !replacement_exists {
        table.redo_stack.push(entry.clone());
        return Ok(ReplaceResult {
            table_hash,
            original_path: entry.original_path,
            replacement_path: entry.replacement_path,
            replaced: false,
            reason: Some("replacement_file_not_found".into()),
        });
    }

    if !original_exists {
        table.redo_stack.push(entry.clone());
        return Ok(ReplaceResult {
            table_hash,
            original_path: entry.original_path,
            replacement_path: entry.replacement_path,
            replaced: false,
            reason: Some("original_file_not_found".into()),
        });
    }

    let replacement = PathBuf::from(&entry.replacement_path);
    let original = PathBuf::from(&entry.original_path);
    let original_name = entry.original_name.clone();
    let workspace = images_workspace_dir()?;
    let temp_path = workspace.join(
        replacement
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("replacement-image"),
    );
    let renamed_temp_path = workspace.join(&original_name);

    fs::copy(&replacement, &temp_path).map_err(|error| error.to_string())?;
    if temp_path != renamed_temp_path {
        if renamed_temp_path.exists() {
            fs::remove_file(&renamed_temp_path).map_err(|error| error.to_string())?;
        }
        fs::rename(&temp_path, &renamed_temp_path).map_err(|error| error.to_string())?;
    }
    fs::copy(&renamed_temp_path, &original).map_err(|error| error.to_string())?;

    if let Some(item) = find_item_mut(&mut table, &entry.original_path) {
        item.replaced = true;
    }

    let history_entry = HistoryEntry {
        action: "replace".into(),
        original_path: entry.original_path.clone(),
        original_name: entry.original_name.clone(),
        replacement_path: entry.replacement_path.clone(),
        backup_path: entry.backup_path.clone(),
        timestamp: entry.timestamp.clone(),
    };
    table.history.push(history_entry);

    let audit_entry = HistoryEntry {
        action: "redo".into(),
        original_path: entry.original_path.clone(),
        original_name: entry.original_name.clone(),
        replacement_path: entry.replacement_path.clone(),
        backup_path: entry.backup_path.clone(),
        timestamp: now_timestamp(),
    };
    table.audit_log.push(audit_entry);

    let result = ReplaceResult {
        table_hash: table_hash.clone(),
        original_path: entry.original_path,
        replacement_path: entry.replacement_path,
        replaced: true,
        reason: None,
    };
    write_table(&table)?;
    Ok(result)
}

#[tauri::command]
fn get_undo_redo_state(table_hash: String) -> Result<UndoRedoState, String> {
    let table = match read_table(&table_hash)? {
        Some(table) => table,
        None => {
            return Ok(UndoRedoState {
                can_undo: false,
                can_redo: false,
            })
        }
    };

    Ok(UndoRedoState {
        can_undo: !table.history.is_empty(),
        can_redo: !table.redo_stack.is_empty(),
    })
}

#[tauri::command]
fn reveal_in_finder(path: String) -> Result<(), String> {
    let path = PathBuf::from(&path);
    if !path.exists() {
        return Err("File not found".into());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path.to_string_lossy()])
            .spawn()
            .map_err(|error| error.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path.to_string_lossy()])
            .spawn()
            .map_err(|error| error.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(parent) = path.parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
fn get_system_locale() -> SystemLocaleInfo {
    SystemLocaleInfo {
        locale: detect_system_locale(),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            import_images_dir,
            get_replace_table,
            get_image_preview,
            set_replacement_path,
            replace_image_by_path,
            replace_images_from_map,
            undo_last_replace,
            redo_last_replace,
            get_undo_redo_state,
            reveal_in_finder,
            get_system_locale
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("Yuus Desktop");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
