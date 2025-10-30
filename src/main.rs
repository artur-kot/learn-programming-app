mod config;
mod course;
mod database;
mod git;
mod playground;
mod test_runner;
mod ui;

use anyhow::{Context, Result};
use std::env;
use std::path::PathBuf;

fn print_help(program_name: &str) {
    println!("learnp - Interactive TUI application for learning programming through exercises");
    println!();
    println!("USAGE:");
    println!("    {} [OPTIONS] [course-directory]", program_name);
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
}

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();

    // Parse flags and arguments
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
