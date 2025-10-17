use crate::{
    db,
    models::{Course, CourseConfig, CourseStructure, CourseWithProgress, Exercise, ExerciseMeta},
};
use git2::Repository;
use glob::Pattern;
use sqlx::SqlitePool;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager, State};

#[tauri::command]
pub async fn get_all_courses(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<CourseWithProgress>, String> {
    db::get_courses_with_progress(&pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_course(
    pool: State<'_, SqlitePool>,
    slug: String,
) -> Result<Option<Course>, String> {
    db::get_course(&pool, &slug)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clone_course(
    app_handle: AppHandle,
    pool: State<'_, SqlitePool>,
    slug: String,
    name: String,
    repo_url: String,
) -> Result<Course, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let courses_dir = app_dir.join("courses");
    fs::create_dir_all(&courses_dir).map_err(|e| e.to_string())?;

    let repo_path = courses_dir.join(&slug);

    // Clone repository
    Repository::clone(&repo_url, &repo_path)
        .map_err(|e| format!("Failed to clone repository: {}", e))?;

    let course = Course {
        id: None,
        slug: slug.clone(),
        name,
        repo_url,
        repo_path: Some(repo_path.to_string_lossy().to_string()),
        last_updated: Some(chrono::Utc::now().to_rfc3339()),
        created_at: None,
    };

    db::save_course(&pool, &course)
        .await
        .map_err(|e| e.to_string())?;

    db::get_course(&pool, &slug)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Failed to retrieve saved course".to_string())
}

#[tauri::command]
pub async fn check_course_update_available(
    pool: State<'_, SqlitePool>,
    slug: String,
) -> Result<bool, String> {
    let course = db::get_course(&pool, &slug)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Course not found".to_string())?;

    let repo_path = course
        .repo_path
        .as_ref()
        .ok_or_else(|| "Course repo path not found".to_string())?
        .clone();

    // Perform git operations in blocking task
    tokio::task::spawn_blocking(move || {
        let repo = Repository::open(&repo_path)
            .map_err(|e| format!("Failed to open repository: {}", e))?;

        // Fetch from remote
        let mut remote = repo
            .find_remote("origin")
            .map_err(|e| format!("Failed to find remote: {}", e))?;

        remote
            .fetch(&["main"], None, None)
            .map_err(|e| format!("Failed to fetch: {}", e))?;

        // Check if update is available
        let fetch_head = repo
            .find_reference("FETCH_HEAD")
            .map_err(|e| format!("Failed to find FETCH_HEAD: {}", e))?;

        let fetch_commit = repo
            .reference_to_annotated_commit(&fetch_head)
            .map_err(|e| format!("Failed to get commit: {}", e))?;

        let (analysis, _) = repo
            .merge_analysis(&[&fetch_commit])
            .map_err(|e| format!("Failed to analyze merge: {}", e))?;

        // Return true if update is available (not up to date)
        Ok::<bool, String>(!analysis.is_up_to_date())
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn update_course(pool: State<'_, SqlitePool>, slug: String) -> Result<Course, String> {
    let course = db::get_course(&pool, &slug)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Course not found".to_string())?;

    let repo_path = course
        .repo_path
        .as_ref()
        .ok_or_else(|| "Course repo path not found".to_string())?
        .clone();

    // Perform git operations in blocking task
    let repo_path_clone = repo_path.clone();
    tokio::task::spawn_blocking(move || {
        let repo = Repository::open(&repo_path_clone)
            .map_err(|e| format!("Failed to open repository: {}", e))?;

        // Fetch and pull
        let mut remote = repo
            .find_remote("origin")
            .map_err(|e| format!("Failed to find remote: {}", e))?;

        remote
            .fetch(&["main"], None, None)
            .map_err(|e| format!("Failed to fetch: {}", e))?;

        // Reset to origin/main
        let fetch_head = repo
            .find_reference("FETCH_HEAD")
            .map_err(|e| format!("Failed to find FETCH_HEAD: {}", e))?;

        let fetch_commit = repo
            .reference_to_annotated_commit(&fetch_head)
            .map_err(|e| format!("Failed to get commit: {}", e))?;

        let (analysis, _) = repo
            .merge_analysis(&[&fetch_commit])
            .map_err(|e| format!("Failed to analyze merge: {}", e))?;

        if analysis.is_up_to_date() {
            return Ok(false);
        } else if analysis.is_fast_forward() {
            let refname = "refs/heads/main";
            let mut reference = repo
                .find_reference(refname)
                .map_err(|e| format!("Failed to find reference: {}", e))?;

            reference
                .set_target(fetch_commit.id(), "Fast-forward")
                .map_err(|e| format!("Failed to set target: {}", e))?;

            repo.set_head(refname)
                .map_err(|e| format!("Failed to set HEAD: {}", e))?;

            repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
                .map_err(|e| format!("Failed to checkout: {}", e))?;
        }

        Ok::<bool, String>(true)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))??;

    let updated_course = Course {
        last_updated: Some(chrono::Utc::now().to_rfc3339()),
        ..course
    };

    db::save_course(&pool, &updated_course)
        .await
        .map_err(|e| e.to_string())?;

    Ok(updated_course)
}

#[tauri::command]
pub async fn get_course_structure(
    pool: State<'_, SqlitePool>,
    slug: String,
) -> Result<CourseStructure, String> {
    let course = db::get_course(&pool, &slug)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Course not found".to_string())?;

    let repo_path = course
        .repo_path
        .as_ref()
        .ok_or_else(|| "Course repo path not found".to_string())?;

    let overview_path = Path::new(repo_path).join("overview.md");
    let overview =
        fs::read_to_string(&overview_path).unwrap_or_else(|_| "No overview available".to_string());

    // Read root meta.json if it exists
    let meta_path = Path::new(repo_path).join("course.json");
    let config = if meta_path.exists() {
        fs::read_to_string(&meta_path)
            .ok()
            .and_then(|content| serde_json::from_str::<CourseConfig>(&content).ok())
    } else {
        None
    };

    let ignore_patterns = config
        .as_ref()
        .and_then(|c| c.ignore_exercise_files.as_ref())
        .map(|patterns| patterns.as_slice())
        .unwrap_or(&[]);

    let exercises = scan_exercises(repo_path, &slug, &pool, ignore_patterns).await?;

    Ok(CourseStructure {
        overview,
        exercises,
        config,
    })
}

async fn scan_exercises(
    repo_path: &str,
    course_slug: &str,
    pool: &SqlitePool,
    ignore_patterns: &[String],
) -> Result<Vec<Exercise>, String> {
    let path = Path::new(repo_path);
    let mut exercises = Vec::new();

    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries.filter_map(Result::ok) {
        let entry_path = entry.path();
        if entry_path.is_dir()
            && !entry_path
                .file_name()
                .unwrap()
                .to_str()
                .unwrap()
                .starts_with('.')
        {
            // Check if it contains subdirectories (chapters)
            scan_chapter(
                &entry_path,
                course_slug,
                pool,
                &mut exercises,
                ignore_patterns,
            )
            .await?;
        }
    }

    // Sort exercises by path
    exercises.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(exercises)
}

async fn scan_chapter(
    chapter_path: &Path,
    course_slug: &str,
    pool: &SqlitePool,
    exercises: &mut Vec<Exercise>,
    ignore_patterns: &[String],
) -> Result<(), String> {
    let entries = fs::read_dir(chapter_path).map_err(|e| e.to_string())?;

    for entry in entries.filter_map(Result::ok) {
        let entry_path = entry.path();
        if entry_path.is_dir()
            && !entry_path
                .file_name()
                .unwrap()
                .to_str()
                .unwrap()
                .starts_with('.')
        {
            let meta_dir = entry_path.join("_meta");
            if meta_dir.exists() {
                let exercise =
                    parse_exercise(&entry_path, course_slug, pool, ignore_patterns).await?;
                exercises.push(exercise);
            }
        }
    }

    Ok(())
}

async fn parse_exercise(
    exercise_path: &Path,
    course_slug: &str,
    pool: &SqlitePool,
    ignore_patterns: &[String],
) -> Result<Exercise, String> {
    let meta_dir = exercise_path.join("_meta");
    let meta_json_path = meta_dir.join("meta.json");
    let description_path = meta_dir.join("description.md");

    let meta_json_str = fs::read_to_string(&meta_json_path)
        .map_err(|e| format!("Failed to read meta.json: {}", e))?;

    let mut meta: ExerciseMeta = serde_json::from_str(&meta_json_str)
        .map_err(|e| format!("Failed to parse meta.json: {}", e))?;

    let description = fs::read_to_string(&description_path)
        .unwrap_or_else(|_| "No description available".to_string());

    let name = exercise_path
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    // Generate exercise path relative to repo
    let path_str = exercise_path.to_string_lossy().to_string();

    // Ensure meta.id is set
    if meta.id.is_empty() {
        meta.id = format!("{}_{}", course_slug, name);
    }

    // Compile glob patterns
    let patterns: Vec<Pattern> = ignore_patterns
        .iter()
        .filter_map(|p| Pattern::new(p).ok())
        .collect();

    // Get files in exercise (excluding _meta and ignored files)
    let mut files = Vec::new();
    let entries = fs::read_dir(exercise_path).map_err(|e| e.to_string())?;
    for entry in entries.filter_map(Result::ok) {
        let file_name = entry.file_name().to_string_lossy().to_string();
        if file_name != "_meta" {
            // Check if file matches any ignore pattern
            let should_ignore = patterns.iter().any(|pattern| pattern.matches(&file_name));
            if !should_ignore {
                files.push(file_name);
            }
        }
    }

    // Check if completed
    let progress = db::get_exercise_progress(pool, course_slug, &meta.id)
        .await
        .map_err(|e| e.to_string())?;

    let completed = progress.map(|p| p.completed).unwrap_or(false);

    Ok(Exercise {
        id: meta.id.clone(),
        path: path_str,
        name,
        description,
        meta,
        files,
        completed,
    })
}
