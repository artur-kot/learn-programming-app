mod commands;
mod db;
mod models;

use commands::{courses, exercises, progress};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let pool = tauri::async_runtime::block_on(async {
                db::init_db(&app.handle())
                    .await
                    .expect("Failed to initialize database")
            });

            app.manage(pool);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Course commands
            courses::get_all_courses,
            courses::get_course,
            courses::clone_course,
            courses::update_course,
            courses::get_course_structure,
            // Exercise commands
            exercises::read_exercise_file,
            exercises::write_exercise_file,
            exercises::init_exercise,
            exercises::test_exercise,
            // Progress commands
            progress::mark_exercise_completed,
            progress::mark_exercise_incomplete,
            progress::get_exercise_progress,
            progress::get_all_exercise_progress,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
