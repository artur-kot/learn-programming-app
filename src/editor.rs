use anyhow::{Context, Result};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone)]
pub struct Editor {
    pub name: String,
    pub executable: String,
    pub args: Vec<String>,
}

impl Editor {
    pub fn new(name: impl Into<String>, executable: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            executable: executable.into(),
            args: Vec::new(),
        }
    }

    pub fn with_args(mut self, args: Vec<String>) -> Self {
        self.args = args;
        self
    }
}

/// Detect popular code editors/IDEs installed on the system
pub fn detect_editors() -> Vec<Editor> {
    let editor_candidates: Vec<(&str, &str, Vec<&str>)> = vec![
        ("Visual Studio Code", "code", vec![]),
        ("Visual Studio Code Insiders", "code-insiders", vec![]),
        ("Cursor", "cursor", vec![]),
        ("IntelliJ IDEA", "idea", vec![]),
        ("WebStorm", "webstorm", vec![]),
        ("PyCharm", "pycharm", vec![]),
        ("CLion", "clion", vec![]),
        ("GoLand", "goland", vec![]),
        ("Neovim", "nvim", vec![]),
        ("Vim", "vim", vec![]),
        ("Emacs", "emacs", vec![]),
        ("Sublime Text", "subl", vec![]),
        ("Atom", "atom", vec![]),
        #[cfg(target_os = "windows")]
        ("Notepad++", "notepad++", vec![]),
        #[cfg(target_os = "linux")]
        ("gedit", "gedit", vec![]),
        #[cfg(target_os = "linux")]
        ("Kate", "kate", vec![]),
    ];

    let mut found_editors = Vec::new();

    for (name, executable, default_args) in editor_candidates {
        if let Some(full_path) = find_executable_in_path(executable) {
            // Store the full path to the executable for reliable launching
            let path_str = full_path.to_string_lossy().to_string();
            found_editors.push(
                Editor::new(name, path_str)
                    .with_args(default_args.iter().map(|s| s.to_string()).collect()),
            );
        }
    }

    found_editors
}

/// Find the full path of an executable in PATH
fn find_executable_in_path(name: &str) -> Option<PathBuf> {
    if let Ok(path_var) = std::env::var("PATH") {
        let paths = std::env::split_paths(&path_var);

        // On Windows, we need to try multiple extensions
        #[cfg(target_os = "windows")]
        let extensions = vec!["", ".exe", ".cmd", ".bat", ".ps1"];

        #[cfg(not(target_os = "windows"))]
        let extensions = vec![""];

        for path in paths {
            for ext in &extensions {
                let candidate = if ext.is_empty() {
                    path.join(name)
                } else {
                    path.join(format!("{}{}", name, ext))
                };

                if candidate.exists() && candidate.is_file() {
                    return Some(candidate);
                }
            }
        }
    }

    None
}

/// Open a directory in the specified editor
pub fn open_directory_in_editor(
    editor_path: &str,
    editor_args: &[String],
    directory: &Path,
) -> Result<()> {
    let mut command = Command::new(editor_path);

    // Add any custom arguments
    for arg in editor_args {
        command.arg(arg);
    }

    // Add the directory path
    command.arg(directory);

    // Configure process to run detached
    command
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());

    // Spawn the process
    command.spawn().context(format!(
        "Failed to spawn editor '{}'. Make sure it's installed and in your PATH.",
        editor_path
    ))?;

    Ok(())
}

/// Open a file in the specified editor (used for config file)
pub fn open_file_in_editor(editor_path: &str, editor_args: &[String], file: &Path) -> Result<()> {
    // On Windows, use 'start' command to properly detach the editor
    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = Command::new("cmd");
        cmd.arg("/c");
        cmd.arg("start");
        cmd.arg(""); // Empty title for start command
        cmd.arg(editor_path);

        // Add any custom arguments
        for arg in editor_args {
            cmd.arg(arg);
        }

        // Add the file path
        cmd.arg(file);

        cmd
    };

    #[cfg(not(target_os = "windows"))]
    let mut command = {
        let mut cmd = Command::new(editor_path);

        // Add any custom arguments
        for arg in editor_args {
            cmd.arg(arg);
        }

        // Add the file path
        cmd.arg(file);

        cmd
    };

    // Configure process to run detached
    command
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());

    // Spawn the process
    command.spawn().context(format!(
        "Failed to spawn editor '{}'. Make sure it's installed and in your PATH.",
        editor_path
    ))?;

    Ok(())
}

/// Get editor from environment variable ($EDITOR or $VISUAL)
pub fn get_env_editor() -> Option<PathBuf> {
    std::env::var("EDITOR")
        .ok()
        .or_else(|| std::env::var("VISUAL").ok())
        .map(PathBuf::from)
}
