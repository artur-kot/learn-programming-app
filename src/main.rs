mod config;
mod course;
mod database;
mod git;
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
    println!("    -h, --help       Print help information");
    println!("    -v, --version    Print version information");
    println!();
    println!("ARGS:");
    println!("    <course-directory>    Path to the course directory (optional, defaults to current directory)");
    println!();
    println!("DESCRIPTION:");
    println!("    A course directory must contain:");
    println!("      - course.json (course metadata)");
    println!("      - exercises/ (directory with exercise folders)");
    println!();
    println!("EXAMPLES:");
    println!("    {} ./my-course", program_name);
    println!("    {}              # Uses current directory", program_name);
}

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();

    // Handle --version flag
    if args.len() > 1 && (args[1] == "--version" || args[1] == "-v") {
        println!("learnp version {}", env!("CARGO_PKG_VERSION"));
        std::process::exit(0);
    }

    // Handle --help flag
    if args.len() > 1 && (args[1] == "--help" || args[1] == "-h") {
        print_help(&args[0]);
        std::process::exit(0);
    }

    let course_path = if args.len() > 1 {
        // Course path provided as argument
        PathBuf::from(&args[1])
    } else {
        // Use current directory as course root
        env::current_dir()?
    };

    if !course_path.exists() {
        eprintln!("Error: Course directory not found at {:?}", course_path);
        eprintln!("\nUsage: {} [course-directory]", args[0]);
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
        eprintln!("\nUsage: {} [course-directory]", args[0]);
        std::process::exit(1);
    }

    println!("Loading course from: {:?}", course_path);

    // Check for course updates before starting TUI
    if let Err(e) = git::check_and_prompt_for_updates(&course_path) {
        eprintln!("Warning: Could not check for updates: {}", e);
    }

    println!("\nStarting Learn Programming TUI...\n");

    ui::run_app(course_path)
        .await
        .context("Failed to run application")?;

    Ok(())
}
