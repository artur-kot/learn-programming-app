mod config;
mod course;
mod database;
mod editor;
mod git;
mod playground;
mod test_runner;
mod ui;

use anyhow::{Context, Result};
use std::env;
use std::path::PathBuf;

fn handle_config_command(args: &[String]) -> Result<()> {
    use crate::config::Config;
    use crate::editor;

    // Check for --path flag
    if args.len() >= 3 && args[2] == "--path" {
        // Just print the config path
        match Config::get_config_path() {
            Ok(path) => {
                println!("{}", path.display());
                std::process::exit(0);
            }
            Err(e) => {
                eprintln!("Error: Failed to get config path: {}", e);
                std::process::exit(1);
            }
        }
    }

    // Open config in editor
    let config = Config::load().unwrap_or_default();
    let config_path = Config::get_config_path()?;

    // Ensure config file exists
    if !config_path.exists() {
        config.save()?;
        println!("Created new config file at: {}", config_path.display());
    }

    // Try to get editor from environment variable first, then from config
    let editor_to_use = if let Some(env_editor) = editor::get_env_editor() {
        Some((env_editor.to_string_lossy().to_string(), Vec::new()))
    } else {
        config
            .get_editor()
            .map(|(path, args)| (path.to_string(), args.to_vec()))
    };

    if let Some((editor_path, editor_args)) = editor_to_use {
        editor::open_file_in_editor(&editor_path, &editor_args, &config_path)?;
        println!("Opening config file in editor...");
        std::process::exit(0);
    } else {
        eprintln!("Error: No editor configured.");
        eprintln!(
            "Set the $EDITOR environment variable or configure an editor in the TUI with 'o' key."
        );
        eprintln!("Config file location: {}", config_path.display());
        std::process::exit(1);
    }
}

fn print_help(program_name: &str) {
    println!("learnp - Interactive TUI application for learning programming through exercises");
    println!();
    println!("USAGE:");
    println!("    {} [OPTIONS] [course-directory]", program_name);
    println!("    {} config [--path]", program_name);
    println!();
    println!("COMMANDS:");
    println!("    config               Open configuration file in your editor");
    println!("    config --path        Print the path to the configuration file");
    println!();
    println!("OPTIONS:");
    println!("    -h, --help           Print help information");
    println!("    -v, --version        Print version information");
    println!("    --unblock-all        Unlock all exercises (bypass progression requirements)");
    println!();
    println!("ARGS:");
    println!("    <course-directory>    Path to the course directory (optional, defaults to current directory)");
    println!();
    println!("DESCRIPTION:");
    println!("    A course directory must contain:");
    println!("      - course.json (course metadata)");
    println!("      - exercises/ (directory with exercise folders)");
    println!();
    println!("    You can also use the LEARNP_UNBLOCK_ALL=1 environment variable to unlock all exercises.");
    println!();
    println!("EXAMPLES:");
    println!("    {} ./my-course", program_name);
    println!("    {}              # Uses current directory", program_name);
    println!("    {} --unblock-all ./my-course", program_name);
    println!(
        "    {} config       # Open config in your editor",
        program_name
    );
    println!(
        "    {} config --path # Print config file path",
        program_name
    );
}

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();

    // Handle config subcommand first
    if args.len() >= 2 && args[1] == "config" {
        return handle_config_command(&args);
    }

    // Parse flags and arguments for normal TUI mode
    let mut unblock_all = false;
    let mut course_path_arg: Option<String> = None;

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--version" | "-v" => {
                println!("learnp version {}", env!("CARGO_PKG_VERSION"));
                std::process::exit(0);
            }
            "--help" | "-h" => {
                print_help(&args[0]);
                std::process::exit(0);
            }
            "--unblock-all" => {
                unblock_all = true;
            }
            arg => {
                // This is the course directory path
                if course_path_arg.is_none() {
                    course_path_arg = Some(arg.to_string());
                } else {
                    eprintln!("Error: Unexpected argument '{}'", arg);
                    eprintln!("\nUsage: {} [OPTIONS] [course-directory]", args[0]);
                    std::process::exit(1);
                }
            }
        }
        i += 1;
    }

    let course_path = if let Some(path) = course_path_arg {
        PathBuf::from(path)
    } else {
        // Use current directory as course root
        env::current_dir()?
    };

    if !course_path.exists() {
        eprintln!("Error: Course directory not found at {:?}", course_path);
        eprintln!("\nUsage: {} [OPTIONS] [course-directory]", args[0]);
        eprintln!("\nOr run from within a course directory that contains course.json");
        std::process::exit(1);
    }

    let course_json = course_path.join("course.json");
    if !course_json.exists() {
        eprintln!("Error: course.json not found in {:?}", course_path);
        eprintln!("\nMake sure you are in a course directory or provide a path to one.");
        eprintln!("A course directory must contain:");
        eprintln!("  - course.json (course metadata)");
        eprintln!("  - exercises/ (directory with exercise folders)");
        eprintln!("\nUsage: {} [OPTIONS] [course-directory]", args[0]);
        std::process::exit(1);
    }

    println!("Loading course from: {:?}", course_path);

    // Check for course updates before starting TUI
    if let Err(e) = git::check_and_prompt_for_updates(&course_path) {
        eprintln!("Warning: Could not check for updates: {}", e);
    }

    println!("\nStarting Learn Programming TUI...\n");

    ui::run_app(course_path, unblock_all)
        .await
        .context("Failed to run application")?;

    Ok(())
}
