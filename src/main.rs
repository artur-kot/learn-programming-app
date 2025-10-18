mod course;
mod database;
mod test_runner;
mod ui;
mod watcher;

use anyhow::{Context, Result};
use std::env;
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();

    let course_path = if args.len() > 1 {
        PathBuf::from(&args[1])
    } else {
        // Default to example-js-course in current directory
        let current_dir = env::current_dir()?;
        current_dir.join("example-js-course")
    };

    if !course_path.exists() {
        eprintln!("Error: Course directory not found at {:?}", course_path);
        eprintln!("\nUsage: {} [course-directory]", args[0]);
        eprintln!("\nExample: {} ./example-js-course", args[0]);
        std::process::exit(1);
    }

    let course_json = course_path.join("course.json");
    if !course_json.exists() {
        eprintln!("Error: course.json not found in {:?}", course_path);
        eprintln!("Make sure the directory contains a valid course structure.");
        std::process::exit(1);
    }

    println!("Loading course from: {:?}", course_path);
    println!("Starting JavaScript Learner TUI...\n");

    ui::run_app(course_path)
        .await
        .context("Failed to run application")?;

    Ok(())
}
