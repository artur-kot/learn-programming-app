use crate::{db, models::ExerciseProgress};
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn mark_exercise_completed(
    pool: State<'_, SqlitePool>,
    course_slug: String,
    exercise_id: String,
    exercise_path: String,
) -> Result<(), String> {
    let progress = ExerciseProgress {
        id: None,
        course_slug,
        exercise_id,
        exercise_path,
        completed: true,
        completed_at: Some(chrono::Utc::now().to_rfc3339()),
        created_at: None,
        updated_at: None,
    };

    db::save_exercise_progress(&pool, &progress)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn mark_exercise_incomplete(
    pool: State<'_, SqlitePool>,
    course_slug: String,
    exercise_id: String,
    exercise_path: String,
) -> Result<(), String> {
    let progress = ExerciseProgress {
        id: None,
        course_slug,
        exercise_id,
        exercise_path,
        completed: false,
        completed_at: None,
        created_at: None,
        updated_at: None,
    };

    db::save_exercise_progress(&pool, &progress)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_exercise_progress(
    pool: State<'_, SqlitePool>,
    course_slug: String,
    exercise_id: String,
) -> Result<Option<ExerciseProgress>, String> {
    db::get_exercise_progress(&pool, &course_slug, &exercise_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_exercise_progress(
    pool: State<'_, SqlitePool>,
    course_slug: String,
) -> Result<Vec<ExerciseProgress>, String> {
    db::get_all_exercise_progress(&pool, &course_slug)
        .await
        .map_err(|e| e.to_string())
}
