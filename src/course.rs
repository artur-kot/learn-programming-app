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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context_files: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context_patterns: Option<Vec<String>>,
}

#[derive(Debug, Clone)]
pub struct Exercise {
    pub metadata: ExerciseMetadata,
    pub path: PathBuf,
    pub exercise_file: PathBuf,
    #[allow(dead_code)]
    pub test_file: PathBuf,
    pub readme_file: PathBuf,
}

impl Exercise {
    /// Collect context files for hint generation
    /// Uses metadata-defined files if available, otherwise auto-discovers
    pub fn collect_context_files(&self) -> Result<Vec<(PathBuf, String)>> {
        const MAX_FILES: usize = 10;
        const MAX_FILE_SIZE: u64 = 50 * 1024; // 50KB
        const MAX_TOTAL_SIZE: u64 = 200 * 1024; // 200KB

        let mut context_files = Vec::new();
        let mut total_size = 0u64;

        // Check if metadata specifies context files
        if let Some(ref files) = self.metadata.context_files {
            // Use explicitly defined files
            for file_path in files {
                if context_files.len() >= MAX_FILES {
                    break;
                }
                let full_path = self.path.join(file_path);
                if let Ok((path, content)) = Self::read_file_with_limit(&full_path, MAX_FILE_SIZE) {
                    let content_size = content.len() as u64;
                    if total_size + content_size <= MAX_TOTAL_SIZE {
                        total_size += content_size;
                        context_files.push((path, content));
                    }
                }
            }
        } else if let Some(ref patterns) = self.metadata.context_patterns {
            // Use glob patterns
            for pattern in patterns {
                if context_files.len() >= MAX_FILES {
                    break;
                }
                let pattern_path = self.path.join(pattern);
                if let Some(pattern_str) = pattern_path.to_str() {
                    if let Ok(entries) = glob::glob(pattern_str) {
                        for entry in entries.flatten() {
                            if context_files.len() >= MAX_FILES {
                                break;
                            }
                            if let Ok((path, content)) =
                                Self::read_file_with_limit(&entry, MAX_FILE_SIZE)
                            {
                                let content_size = content.len() as u64;
                                if total_size + content_size <= MAX_TOTAL_SIZE {
                                    total_size += content_size;
                                    context_files.push((path, content));
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Auto-discover relevant files
            context_files =
                self.auto_discover_context_files(MAX_FILES, MAX_FILE_SIZE, MAX_TOTAL_SIZE)?;
        }

        Ok(context_files)
    }

    fn auto_discover_context_files(
        &self,
        max_files: usize,
        max_file_size: u64,
        max_total_size: u64,
    ) -> Result<Vec<(PathBuf, String)>> {
        let mut context_files = Vec::new();
        let mut total_size = 0u64;

        // Include the main exercise file first
        if let Ok((path, content)) = Self::read_file_with_limit(&self.exercise_file, max_file_size)
        {
            total_size += content.len() as u64;
            context_files.push((path, content));
        }

        // Walk the exercise directory
        if let Ok(entries) = std::fs::read_dir(&self.path) {
            for entry in entries.flatten() {
                if context_files.len() >= max_files {
                    break;
                }

                let path = entry.path();
                let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

                // Skip excluded files/directories
                if Self::should_exclude(&path, file_name) {
                    continue;
                }

                // If it's a directory, scan it recursively (but only one level deep)
                if path.is_dir() {
                    if let Ok(sub_entries) = std::fs::read_dir(&path) {
                        for sub_entry in sub_entries.flatten() {
                            if context_files.len() >= max_files {
                                break;
                            }
                            let sub_path = sub_entry.path();
                            if sub_path.is_file() && Self::is_relevant_file(&sub_path) {
                                if let Ok((p, content)) =
                                    Self::read_file_with_limit(&sub_path, max_file_size)
                                {
                                    let content_size = content.len() as u64;
                                    if total_size + content_size <= max_total_size {
                                        // Skip if it's the main exercise file (already added)
                                        if p != self.exercise_file {
                                            total_size += content_size;
                                            context_files.push((p, content));
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else if path.is_file() && Self::is_relevant_file(&path) {
                    if let Ok((p, content)) = Self::read_file_with_limit(&path, max_file_size) {
                        let content_size = content.len() as u64;
                        if total_size + content_size <= max_total_size {
                            // Skip if it's the main exercise file (already added)
                            if p != self.exercise_file {
                                total_size += content_size;
                                context_files.push((p, content));
                            }
                        }
                    }
                }
            }
        }

        Ok(context_files)
    }

    fn should_exclude(path: &Path, file_name: &str) -> bool {
        // Exclude directories
        if path.is_dir() {
            return matches!(
                file_name,
                "node_modules" | "dist" | "build" | ".cache" | ".git" | "coverage"
            );
        }

        // Exclude config and non-source files
        matches!(
            file_name,
            "package.json"
                | "package-lock.json"
                | "tsconfig.json"
                | "jest.config.js"
                | "webpack.config.js"
                | "vite.config.js"
                | ".eslintrc.js"
                | ".eslintrc.json"
                | ".prettierrc"
                | ".gitignore"
                | "README.md"
                | "exercise.test.js"
        )
    }

    fn is_relevant_file(path: &Path) -> bool {
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            matches!(
                ext,
                "js" | "ts" | "jsx" | "tsx" | "css" | "scss" | "html" | "vue" | "json"
            )
        } else {
            false
        }
    }

    fn read_file_with_limit(path: &Path, max_size: u64) -> Result<(PathBuf, String)> {
        let metadata = std::fs::metadata(path)?;
        if metadata.len() > max_size {
            anyhow::bail!("File too large");
        }
        let content = std::fs::read_to_string(path)?;
        Ok((path.to_path_buf(), content))
    }
}

impl Course {
    pub fn load_from_path<P: AsRef<Path>>(course_path: P) -> Result<(Self, Vec<Exercise>)> {
        let course_path = course_path.as_ref();
        let course_json_path = course_path.join("course.json");

        let course_json = std::fs::read_to_string(&course_json_path).context(format!(
            "Failed to read course.json at {:?}",
            course_json_path
        ))?;

        let course: Course =
            serde_json::from_str(&course_json).context("Failed to parse course.json")?;

        let exercises_dir = course_path.join("exercises");
        let mut exercises = Vec::new();

        for exercise_meta in &course.exercises {
            let exercise_path = exercises_dir.join(&exercise_meta.id);
            let exercise_file = exercise_path.join("exercise.js");

            // Support both naming conventions for test files:
            // 1. exercise.test.js (old convention)
            // 2. {exercise-id}.test.js (new convention)
            let test_file = if exercise_path.join("exercise.test.js").exists() {
                exercise_path.join("exercise.test.js")
            } else {
                exercise_path.join(format!("{}.test.js", exercise_meta.id))
            };

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
