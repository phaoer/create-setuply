use futures_util::StreamExt;
use reqwest;
use serde::{Deserialize, Serialize};
use std::{
    io::{Read, Seek, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
};
use tauri::{AppHandle, Emitter};
use windows::{
    core::{Interface, HRESULT, HSTRING},
    Win32::{
        System::Com::{
            CoCreateInstance, CoInitializeEx, CoUninitialize, IPersistFile, CLSCTX_INPROC_SERVER,
            COINIT_APARTMENTTHREADED,
        },
        UI::Shell::{IShellLinkW, ShellLink},
    },
};
use winreg::{enums::HKEY_LOCAL_MACHINE, RegKey};
use zip::read::ZipArchive;

#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct InstallError<'a> {
    msg: &'a str,
}

#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct InstallProgress {
    progress: u32,
}

#[derive(Clone, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Reg {
    display_name: String,
    display_version: String,
    publisher: String,
    install_location: String,
    uninstall_string: String,
}

#[derive(Clone, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ShortCut {
    target_path: String,
    shortcut_name: String,
    working_dir: String,
    description: String,
}

#[derive(Clone, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Setting {
    reg: Option<Reg>,
    short_cut: Option<ShortCut>,
}

fn create_shortcut(short_cut: ShortCut) -> Result<(), Box<dyn std::error::Error>> {
    let ShortCut {
        target_path,
        shortcut_name,
        working_dir,
        description,
    } = short_cut;

    unsafe {
        let hr: HRESULT = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
        if hr.is_err() {
            return Err(format!("CoInitializeEx failed: {:?}", hr).into());
        }

        let shell_link: IShellLinkW = CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)?;

        shell_link.SetPath(&HSTRING::from(target_path))?;

        shell_link.SetWorkingDirectory(&HSTRING::from(working_dir))?;

        shell_link.SetDescription(&HSTRING::from(description))?;

        let persist_file: IPersistFile = shell_link.cast()?;

        let desktop = dirs::desktop_dir().ok_or("Failed to get desktop directory")?;

        let shortcut = desktop.join(format!("{}.lnk", shortcut_name));

        persist_file.Save(&HSTRING::from(shortcut.as_path()), true)?;

        CoUninitialize();
    }

    Ok(())
}

fn write_registry(reg: Reg) -> Result<(), Box<dyn std::error::Error>> {
    let Reg {
        display_name,
        display_version,
        publisher,
        install_location,
        uninstall_string,
    } = reg;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

    let hklm_key_path = format!(
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{}",
        display_name
    );
    let (uninstall_key, _) = hklm.create_subkey(&hklm_key_path)?;

    uninstall_key.set_value("DisplayIcon", &install_location)?;
    uninstall_key.set_value("DisplayName", &display_name)?;
    uninstall_key.set_value("DisplayVersion", &display_version)?;
    uninstall_key.set_value("Publisher", &publisher)?;
    uninstall_key.set_value("InstallLocation", &install_location)?;
    uninstall_key.set_value("UninstallString", &uninstall_string)?;

    let (firewall_rules_key, _) = hklm.create_subkey(
        "SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\FirewallRules",
    )?;

    let inbound_rule_name = format!("{}-In-TCP", display_name);
    let outbound_rule_name = format!("{}-Out-TCP", display_name);

    let inbound_rule_value = format!(
        "v2.0|Action=Allow|Active=TRUE|Dir=in|Protocol=TCP|App={}|Name={} Inbound",
        install_location, display_name
    );
    let outbound_rule_value = format!(
        "v2.0|Action=Allow|Active=TRUE|Dir=out|Protocol=TCP|App={}|Name={} Outbound",
        install_location, display_name
    );

    firewall_rules_key.set_value(&inbound_rule_name, &inbound_rule_value)?;

    firewall_rules_key.set_value(&outbound_rule_name, &outbound_rule_value)?;

    Ok(())
}

#[tauri::command]
fn quit(app: AppHandle) {
    app.exit(0);
}

fn unzip_file<T: Read + Seek>(
    reader: T,
    target_dir: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut archive = ZipArchive::new(reader)?;

    std::fs::create_dir_all(target_dir)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let outpath: PathBuf = match file.enclosed_name() {
            Some(p) => target_dir.join(p),
            None => {
                return Err(format!(
                    "Illegal file path in archive (possible traversal): {}",
                    file.name()
                )
                .into());
            }
        };

        let canonical_target = std::fs::canonicalize(target_dir)?;

        if let Some(parent) = outpath.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let canonical_out = std::fs::canonicalize(outpath.parent().unwrap_or(&canonical_target))?;
        if !canonical_out.starts_with(&canonical_target) {
            return Err(format!("Entry tries to escape target dir: {}", file.name()).into());
        }

        if file.name().ends_with('/') || file.is_dir() {
            std::fs::create_dir_all(&outpath)?;
            continue;
        }

        {
            let mut outfile = std::fs::File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }
    }

    Ok(())
}

async fn download_file(
    app: AppHandle,
    package_download_url: String,
    package_save_path: PathBuf,
    package_extract_path: PathBuf,
    setting: Option<Setting>,
) {
    let error = |msg: &str| {
        let _ = app.emit("install-error", InstallError { msg });

        let _ = std::fs::remove_file(&package_save_path);
    };

    let response = match reqwest::get(&package_download_url).await {
        Ok(res) => res,
        Err(_) => {
            error("API request failed");
            return;
        }
    };

    let total_size = response.content_length().unwrap_or(0);

    let mut stream = response.bytes_stream();

    let mut downloaded: u64 = 0;

    let mut file = match std::fs::File::create(&package_save_path) {
        Ok(f) => f,
        Err(e) => {
            error(&format!("Failed to create file: {}", e));
            return;
        }
    };

    let mut last_progress = 0;

    while let Some(chunk_result) = stream.next().await {
        let chunk = match chunk_result {
            Ok(c) => c,
            Err(e) => {
                error(&format!("Download interrupted: {}", e));
                return;
            }
        };

        if let Err(e) = file.write_all(&chunk) {
            error(&format!("Failed to write file: {}", e));
            return;
        }

        downloaded += chunk.len() as u64;

        let progress = ((downloaded as f64 / total_size as f64) * 100.0) as u32;

        let clamped_progress = if progress > 98 { 98 } else { progress };

        if clamped_progress != last_progress {
            let _ = app.emit(
                "install-progress",
                InstallProgress {
                    progress: clamped_progress,
                },
            );

            last_progress = clamped_progress;
        }
    }

    let _ = app.emit("install-progress", InstallProgress { progress: 99 });

    let path = Path::new(&package_save_path);
    let extract_path = Path::new(&package_extract_path);

    let ext = path
        .extension()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or("")
        .to_lowercase();

    if ext != "zip" {
        error(&format!("Unsupported file ext: {}", ext));
        return;
    }

    let zip_file = match std::fs::File::open(&path) {
        Ok(f) => f,
        Err(e) => {
            error(&format!("Failed to open zip: {}", e));
            return;
        }
    };

    if let Err(e) = unzip_file(zip_file, extract_path) {
        error(&format!("Failed to extract zip: {}", e));
        return;
    }

    if let Some(setting_data) = setting {
        if let Some(reg_data) = setting_data.reg {
            if let Err(e) = write_registry(reg_data) {
                error(&format!("Failed to write reg: {}", e));
                return;
            }
        }

        if let Some(short_cut_data) = setting_data.short_cut {
            if let Err(e) = create_shortcut(short_cut_data) {
                error(&format!("Failed to create shortcut: {}", e));
                return;
            }
        }
    }

    let _ = app.emit("install-progress", InstallProgress { progress: 100 });
    let _ = std::fs::remove_file(&package_save_path);
}

#[tauri::command(rename_all = "camelCase")]
fn installation(
    app: AppHandle,
    package_download_url: String,
    package_filename: String,
    install_path: String,
    setting: Option<Setting>,
) -> Result<String, String> {
    let temp_path = std::env::temp_dir();

    let package_save_path = temp_path.join(&package_filename);

    let package_extract_path = PathBuf::from(&install_path);

    if package_extract_path.exists() {
        if let Err(e) = std::fs::remove_dir_all(&package_extract_path) {
            return Err(format!("Failed to clear installation directory: {}", e));
        }
    }

    if let Err(e) = std::fs::create_dir_all(&package_extract_path) {
        return Err(format!("Failed to create installation directory: {}", e));
    }

    let exe_path = package_extract_path.clone();

    tauri::async_runtime::spawn({
        async move {
            download_file(
                app,
                package_download_url,
                package_save_path,
                package_extract_path,
                setting,
            )
            .await;
        }
    });

    Ok(exe_path.to_string_lossy().to_string())
}

#[tauri::command(rename_all = "camelCase")]
fn launch(exe_path: String) -> Result<(), String> {
    let path = Path::new(&exe_path);

    let work_dir = path.parent().ok_or_else(|| {
        String::from("Failed to launch the application: missing parent directory")
    })?;

    if let Err(_) = Command::new(path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .current_dir(work_dir)
        .spawn()
    {
        std::process::exit(1);
    } else {
        std::process::exit(0);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![quit, installation, launch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
