use crate::models::CommandResult;
use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::State;

#[tauri::command]
pub async fn read_exercise_file(
    exercise_path: String,
    file_name: String,
) -> Result<String, String> {
    let file_path = Path::new(&exercise_path).join(&file_name);
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_exercise_file(
    exercise_path: String,
    file_name: String,
    content: String,
) -> Result<(), String> {
    let file_path = Path::new(&exercise_path).join(&file_name);
    fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn init_exercise(
    exercise_path: String,
    init_cmd: Option<String>,
) -> Result<CommandResult, String> {
    if let Some(cmd) = init_cmd {
        execute_command(&exercise_path, &cmd).await
    } else {
        Ok(CommandResult {
            success: true,
            stdout: "No init command specified".to_string(),
            stderr: String::new(),
            exit_code: 0,
        })
    }
}

#[tauri::command]
pub async fn test_exercise(
    exercise_path: String,
    test_cmd: Option<String>,
) -> Result<CommandResult, String> {
    if let Some(cmd) = test_cmd {
        execute_command(&exercise_path, &cmd).await
    } else {
        Err("No test command specified".to_string())
    }
}

async fn execute_command(cwd: &str, command: &str) -> Result<CommandResult, String> {
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let (cmd, args) = parts.split_first().unwrap();

    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", command])
            .current_dir(cwd)
            .output()
    } else {
        Command::new("sh")
            .args(&["-c", command])
            .current_dir(cwd)
            .output()
    }
    .map_err(|e| format!("Failed to execute command: {}", e))?;

    Ok(CommandResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}
