use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Course {
    pub name: String,
    pub description: String,
    pub author: String,
    pub version: String,
    pub exercises: Vec<ExerciseMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExerciseMetadata {
    pub id: String,
    pub title: String,
    pub description: String,
    pub order: usize,
}

#[derive(Debug, Clone)]
pub struct Exercise {
    pub metadata: ExerciseMetadata,
    pub path: PathBuf,
    pub exercise_file: PathBuf,
    pub test_file: PathBuf,
    pub readme_file: PathBuf,
}

impl Course {
    pub fn load_from_path<P: AsRef<Path>>(course_path: P) -> Result<(Self, Vec<Exercise>)> {
        let course_path = course_path.as_ref();
        let course_json_path = course_path.join("course.json");

        let course_json = std::fs::read_to_string(&course_json_path)
            .context(format!("Failed to read course.json at {:?}", course_json_path))?;

        let course: Course = serde_json::from_str(&course_json)
            .context("Failed to parse course.json")?;

        let exercises_dir = course_path.join("exercises");
        let mut exercises = Vec::new();

        for exercise_meta in &course.exercises {
            let exercise_path = exercises_dir.join(&exercise_meta.id);
            let exercise_file = exercise_path.join("exercise.js");
            let test_file = exercise_path.join("exercise.test.js");
            let readme_file = exercise_path.join("README.md");

            if exercise_file.exists() && test_file.exists() {
                exercises.push(Exercise {
                    metadata: exercise_meta.clone(),
                    path: exercise_path,
                    exercise_file,
                    test_file,
                    readme_file,
                });
            }
        }

        Ok((course, exercises))
    }
}
