mod course;
mod database;
mod test_runner;
mod ui;

use anyhow::{Context, Result};
use std::env;
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();

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
    println!("Starting Learn Programming TUI...\n");

    ui::run_app(course_path)
        .await
        .context("Failed to run application")?;

    Ok(())
}
