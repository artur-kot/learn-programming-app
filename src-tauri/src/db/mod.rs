use sqlx::{sqlite::SqlitePool, Row};
use tauri::{AppHandle, Manager};

use crate::models::{Course, CourseWithProgress, ExerciseProgress};

pub async fn init_db(app_handle: &AppHandle) -> Result<SqlitePool, sqlx::Error> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");

    std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");

    let db_path = app_dir.join("learn_programming.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

    let pool = SqlitePool::connect(&db_url).await?;

    // Run migrations
    sqlx::query(include_str!("../../migrations/001_init.sql"))
        .execute(&pool)
        .await?;

    Ok(pool)
}

pub async fn save_course(pool: &SqlitePool, course: &Course) -> Result<i64, sqlx::Error> {
    let result = sqlx::query(
        "INSERT INTO courses (slug, name, repo_url, repo_path, last_updated)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
         name = excluded.name,
         repo_url = excluded.repo_url,
         repo_path = excluded.repo_path,
         last_updated = excluded.last_updated",
    )
    .bind(&course.slug)
    .bind(&course.name)
    .bind(&course.repo_url)
    .bind(&course.repo_path)
    .bind(&course.last_updated)
    .execute(pool)
    .await?;

    Ok(result.last_insert_rowid())
}

pub async fn get_course(pool: &SqlitePool, slug: &str) -> Result<Option<Course>, sqlx::Error> {
    sqlx::query_as::<_, Course>(
        "SELECT id, slug, name, repo_url, repo_path, last_updated, created_at FROM courses WHERE slug = ?"
    )
    .bind(slug)
    .fetch_optional(pool)
    .await
}

pub async fn get_all_courses(pool: &SqlitePool) -> Result<Vec<Course>, sqlx::Error> {
    sqlx::query_as::<_, Course>(
        "SELECT id, slug, name, repo_url, repo_path, last_updated, created_at FROM courses",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_courses_with_progress(
    pool: &SqlitePool,
) -> Result<Vec<CourseWithProgress>, sqlx::Error> {
    let courses = get_all_courses(pool).await?;
    let mut courses_with_progress = Vec::new();

    for course in courses {
        let total = sqlx::query_scalar::<_, i32>(
            "SELECT COUNT(*) FROM exercise_progress WHERE course_slug = ?",
        )
        .bind(&course.slug)
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let completed = sqlx::query_scalar::<_, i32>(
            "SELECT COUNT(*) FROM exercise_progress WHERE course_slug = ? AND completed = 1",
        )
        .bind(&course.slug)
        .fetch_one(pool)
        .await
        .unwrap_or(0);

        let percentage = if total > 0 {
            (completed as f32 / total as f32) * 100.0
        } else {
            0.0
        };

        courses_with_progress.push(CourseWithProgress {
            course,
            total_exercises: total,
            completed_exercises: completed,
            progress_percentage: percentage,
        });
    }

    Ok(courses_with_progress)
}

pub async fn save_exercise_progress(
    pool: &SqlitePool,
    progress: &ExerciseProgress,
) -> Result<i64, sqlx::Error> {
    let result = sqlx::query(
        "INSERT INTO exercise_progress (course_slug, exercise_id, exercise_path, completed, completed_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(course_slug, exercise_id) DO UPDATE SET
         completed = excluded.completed,
         completed_at = excluded.completed_at,
         updated_at = CURRENT_TIMESTAMP"
    )
    .bind(&progress.course_slug)
    .bind(&progress.exercise_id)
    .bind(&progress.exercise_path)
    .bind(progress.completed)
    .bind(&progress.completed_at)
    .execute(pool)
    .await?;

    Ok(result.last_insert_rowid())
}

pub async fn get_exercise_progress(
    pool: &SqlitePool,
    course_slug: &str,
    exercise_id: &str,
) -> Result<Option<ExerciseProgress>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, course_slug, exercise_id, exercise_path, completed, completed_at, created_at, updated_at
         FROM exercise_progress
         WHERE course_slug = ? AND exercise_id = ?"
    )
    .bind(course_slug)
    .bind(exercise_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|r| ExerciseProgress {
        id: r.get("id"),
        course_slug: r.get("course_slug"),
        exercise_id: r.get("exercise_id"),
        exercise_path: r.get("exercise_path"),
        completed: r.get::<i32, _>("completed") != 0,
        completed_at: r.get("completed_at"),
        created_at: r.get("created_at"),
        updated_at: r.get("updated_at"),
    }))
}

pub async fn get_all_exercise_progress(
    pool: &SqlitePool,
    course_slug: &str,
) -> Result<Vec<ExerciseProgress>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, course_slug, exercise_id, exercise_path, completed, completed_at, created_at, updated_at
         FROM exercise_progress
         WHERE course_slug = ?"
    )
    .bind(course_slug)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| ExerciseProgress {
            id: r.get("id"),
            course_slug: r.get("course_slug"),
            exercise_id: r.get("exercise_id"),
            exercise_path: r.get("exercise_path"),
            completed: r.get::<i32, _>("completed") != 0,
            completed_at: r.get("completed_at"),
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        })
        .collect())
}
