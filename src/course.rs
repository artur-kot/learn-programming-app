use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Course {
    pub name: String,
    pub description: String,
    pub author: String,
    pub version: String,
}

/// Optional metadata file for each exercise (exercise.json)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ExerciseMetadata {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub test_command: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub setup_command: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context_files: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub context_patterns: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Language {
    JavaScript,
    Python,
    Rust,
    Go,
    Unknown,
}

impl Language {
    #[allow(dead_code)]
    pub fn as_str(&self) -> &str {
        match self {
            Language::JavaScript => "javascript",
            Language::Python => "python",
            Language::Rust => "rust",
            Language::Go => "go",
            Language::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone)]
pub struct Exercise {
    pub id: String,
    pub title: String,
    pub description: String,
    pub order: usize,
    pub path: PathBuf,
    pub language: Language,
    pub metadata: ExerciseMetadata,
    pub readme_file: PathBuf,
}

impl Exercise {
    /// Detect the language/runtime of the exercise based on files present
    fn detect_language(path: &Path) -> Language {
        if path.join("package.json").exists() {
            Language::JavaScript
        } else if path.join("requirements.txt").exists() || path.join("pyproject.toml").exists() {
            Language::Python
        } else if path.join("Cargo.toml").exists() {
            Language::Rust
        } else if path.join("go.mod").exists() {
            Language::Go
        } else {
            Language::Unknown
        }
    }

    /// Get the test command for this exercise
    pub fn get_test_command(&self) -> String {
        // Use custom test command if specified in metadata
        if let Some(ref cmd) = self.metadata.test_command {
            return cmd.clone();
        }

        // Otherwise, use language-specific defaults
        match self.language {
            Language::JavaScript => "pnpm test".to_string(),
            Language::Python => "python -m pytest".to_string(),
            Language::Rust => "cargo test".to_string(),
            Language::Go => "go test".to_string(),
            Language::Unknown => "echo 'No test command configured'".to_string(),
        }
    }

    /// Get the setup command for this exercise (if any)
    pub fn get_setup_command(&self) -> Option<String> {
        // Use custom setup command if specified
        if let Some(ref cmd) = self.metadata.setup_command {
            return Some(cmd.clone());
        }

        // Otherwise, use language-specific defaults
        match self.language {
            Language::JavaScript => Some("pnpm install".to_string()),
            Language::Python => {
                if self.path.join("requirements.txt").exists() {
                    Some("pip install -r requirements.txt".to_string())
                } else {
                    None
                }
            }
            Language::Rust => Some("cargo build".to_string()),
            Language::Go => Some("go mod download".to_string()),
            Language::Unknown => None,
        }
    }

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

        // Include key files based on language
        let key_files = match self.language {
            Language::JavaScript => vec!["exercise.js", "index.js", "app.js"],
            Language::Python => vec!["exercise.py", "main.py", "__init__.py"],
            Language::Rust => vec!["src/main.rs", "src/lib.rs"],
            Language::Go => vec!["main.go"],
            Language::Unknown => vec![],
        };

        for file_name in key_files {
            let file_path = self.path.join(file_name);
            if file_path.exists() {
                if let Ok((path, content)) = Self::read_file_with_limit(&file_path, max_file_size) {
                    let content_size = content.len() as u64;
                    if total_size + content_size <= max_total_size {
                        total_size += content_size;
                        context_files.push((path, content));
                    }
                }
            }
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
                                        total_size += content_size;
                                        context_files.push((p, content));
                                    }
                                }
                            }
                        }
                    }
                } else if path.is_file() && Self::is_relevant_file(&path) {
                    if let Ok((p, content)) = Self::read_file_with_limit(&path, max_file_size) {
                        let content_size = content.len() as u64;
                        if total_size + content_size <= max_total_size {
                            total_size += content_size;
                            context_files.push((p, content));
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
        if !exercises_dir.exists() {
            anyhow::bail!("Exercises directory not found at {:?}", exercises_dir);
        }

        // Auto-discover exercises from the exercises folder
        let mut exercises = Vec::new();
        let mut entries: Vec<_> = std::fs::read_dir(&exercises_dir)
            .context("Failed to read exercises directory")?
            .filter_map(|entry| entry.ok())
            .filter(|entry| entry.path().is_dir())
            .collect();

        // Sort entries alphabetically by folder name
        entries.sort_by(|a, b| {
            a.file_name().cmp(&b.file_name())
        });

        for (index, entry) in entries.iter().enumerate() {
            let exercise_path = entry.path();
            let folder_name = entry.file_name();
            let folder_name_str = folder_name.to_string_lossy();

            // Generate ID from folder name (strip leading zeros and numbers if present)
            let id = Self::generate_exercise_id(&folder_name_str);

            // Detect language
            let language = Exercise::detect_language(&exercise_path);

            // Try to load exercise.json metadata
            let metadata_path = exercise_path.join("exercise.json");
            let metadata: ExerciseMetadata = if metadata_path.exists() {
                let metadata_json = std::fs::read_to_string(&metadata_path)
                    .context(format!("Failed to read {:?}", metadata_path))?;
                serde_json::from_str(&metadata_json)
                    .context(format!("Failed to parse {:?}", metadata_path))?
            } else {
                ExerciseMetadata::default()
            };

            // Generate title and description from metadata or folder name
            let title = metadata
                .title
                .clone()
                .unwrap_or_else(|| Self::humanize_name(&id));
            let description = metadata
                .description
                .clone()
                .unwrap_or_else(|| format!("Exercise: {}", title));

            let readme_file = exercise_path.join("README.md");

            exercises.push(Exercise {
                id,
                title,
                description,
                order: index + 1,
                path: exercise_path,
                language,
                metadata,
                readme_file,
            });
        }

        Ok((course, exercises))
    }

    /// Generate exercise ID from folder name
    /// Examples: "01-hello-world" -> "hello-world", "hello-world" -> "hello-world"
    fn generate_exercise_id(folder_name: &str) -> String {
        // Remove leading digits and hyphens (e.g., "01-" or "001-")
        let without_prefix = folder_name
            .trim_start_matches(|c: char| c.is_ascii_digit() || c == '-');

        // If we removed everything, use the original name
        if without_prefix.is_empty() {
            folder_name.to_string()
        } else {
            without_prefix.to_string()
        }
    }

    /// Convert a kebab-case or snake_case name to a human-readable title
    /// Examples: "hello-world" -> "Hello World", "array_basics" -> "Array Basics"
    fn humanize_name(name: &str) -> String {
        name.replace('-', " ")
            .replace('_', " ")
            .split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => {
                        first.to_uppercase().collect::<String>() + chars.as_str()
                    }
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    }
}
