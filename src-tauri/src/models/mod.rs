use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Course {
    pub id: Option<i64>,
    pub slug: String,
    pub name: String,
    pub repo_url: String,
    pub repo_path: Option<String>,
    pub last_updated: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ExerciseProgress {
    pub id: Option<i64>,
    pub course_slug: String,
    pub exercise_id: String,
    pub exercise_path: String,
    pub completed: bool,
    pub completed_at: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseMeta {
    pub id: String,
    #[serde(rename = "initCmd")]
    pub init_cmd: Option<String>,
    #[serde(rename = "testCmd")]
    pub test_cmd: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Exercise {
    pub id: String,
    pub path: String,
    pub name: String,
    pub description: String,
    pub meta: ExerciseMeta,
    pub files: Vec<String>,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseConfig {
    #[serde(rename = "ignoreExerciseFiles")]
    pub ignore_exercise_files: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseStructure {
    pub overview: String,
    pub exercises: Vec<Exercise>,
    pub config: Option<CourseConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseWithProgress {
    pub course: Course,
    pub total_exercises: i32,
    pub completed_exercises: i32,
    pub progress_percentage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}
