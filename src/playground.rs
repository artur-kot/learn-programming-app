use crate::course::Exercise;
use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};

/// Extracts an exercise to a playground folder for experimentation
pub fn extract_to_playground(exercise: &Exercise) -> Result<PathBuf> {
    let playground_path = exercise.path.join("playground");

    // Copy the entire exercise directory to playground
    copy_dir_recursive(&exercise.path, &playground_path, &exercise.path)?;

    // Create/update .gitignore in the exercise folder
    create_gitignore(&exercise.path)?;

    Ok(playground_path)
}

/// Checks if a playground already exists for the given exercise
pub fn playground_exists(exercise: &Exercise) -> bool {
    exercise.path.join("playground").exists()
}

/// Removes an existing playground directory
pub fn remove_playground(exercise: &Exercise) -> Result<()> {
    let playground_path = exercise.path.join("playground");

    if playground_path.exists() {
        fs::remove_dir_all(&playground_path)
            .with_context(|| format!("Failed to remove playground at {:?}", playground_path))?;
    }

    Ok(())
}

/// Recursively copies a directory, excluding the playground folder itself
fn copy_dir_recursive(src: &Path, dst: &Path, root: &Path) -> Result<()> {
    // Create destination directory
    fs::create_dir_all(dst).with_context(|| format!("Failed to create directory {:?}", dst))?;

    // Iterate over directory entries
    for entry in fs::read_dir(src).with_context(|| format!("Failed to read directory {:?}", src))? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path = entry.path();
        let file_name = entry.file_name();

        // Skip the playground directory itself to avoid recursion
        if file_name == "playground" {
            continue;
        }

        // Skip hidden files and directories (like .git)
        if let Some(name) = file_name.to_str() {
            if name.starts_with('.') {
                continue;
            }
            // Skip README files
            if name.to_lowercase() == "readme.md" || name.to_lowercase() == "readme" {
                continue;
            }
        }

        // Calculate destination path
        let relative_path = src_path.strip_prefix(root)?;
        let dst_path = dst.join(relative_path.file_name().unwrap());

        if file_type.is_dir() {
            // Recursively copy subdirectory
            copy_dir_recursive(&src_path, &dst_path, root)?;
        } else if file_type.is_file() {
            // Copy file
            fs::copy(&src_path, &dst_path)
                .with_context(|| format!("Failed to copy {:?} to {:?}", src_path, dst_path))?;
        }
        // Skip symlinks and other special files
    }

    Ok(())
}

/// Creates or updates .gitignore to exclude playground folder
fn create_gitignore(exercise_path: &Path) -> Result<()> {
    let gitignore_path = exercise_path.join(".gitignore");
    let playground_entry = "playground/\n";

    if gitignore_path.exists() {
        // Read existing .gitignore
        let content = fs::read_to_string(&gitignore_path)
            .with_context(|| format!("Failed to read .gitignore at {:?}", gitignore_path))?;

        // Check if playground/ is already in .gitignore
        if !content.lines().any(|line| {
            let trimmed = line.trim();
            trimmed == "playground/" || trimmed == "playground"
        }) {
            // Append playground/ to .gitignore
            let mut new_content = content;
            if !new_content.ends_with('\n') {
                new_content.push('\n');
            }
            new_content.push_str(playground_entry);

            fs::write(&gitignore_path, new_content)
                .with_context(|| format!("Failed to update .gitignore at {:?}", gitignore_path))?;
        }
    } else {
        // Create new .gitignore with playground/
        fs::write(&gitignore_path, playground_entry)
            .with_context(|| format!("Failed to create .gitignore at {:?}", gitignore_path))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_playground_extraction() {
        let temp = TempDir::new().unwrap();
        let exercise_path = temp.path().join("001-test");
        fs::create_dir(&exercise_path).unwrap();

        // Create some test files
        fs::write(exercise_path.join("test.js"), "console.log('test');").unwrap();
        fs::write(exercise_path.join("README.md"), "# Test").unwrap();

        let exercise = Exercise {
            id: "001-test".to_string(),
            title: "Test".to_string(),
            description: "Test exercise".to_string(),
            order: 1,
            path: exercise_path.clone(),
            language: crate::course::Language::JavaScript,
            metadata: Default::default(),
            readme_file: exercise_path.join("README.md"),
        };

        // Extract to playground
        let result = extract_to_playground(&exercise);
        assert!(result.is_ok());

        // Verify playground exists
        let playground_path = exercise_path.join("playground");
        assert!(playground_path.exists());
        assert!(playground_path.join("test.js").exists());
        // README should NOT be copied to playground
        assert!(!playground_path.join("README.md").exists());

        // Verify .gitignore was created
        let gitignore_path = exercise_path.join(".gitignore");
        assert!(gitignore_path.exists());
        let gitignore_content = fs::read_to_string(gitignore_path).unwrap();
        assert!(gitignore_content.contains("playground/"));
    }

    #[test]
    fn test_playground_exists() {
        let temp = TempDir::new().unwrap();
        let exercise_path = temp.path().join("001-test");
        fs::create_dir(&exercise_path).unwrap();

        let exercise = Exercise {
            id: "001-test".to_string(),
            title: "Test".to_string(),
            description: "Test exercise".to_string(),
            order: 1,
            path: exercise_path.clone(),
            language: crate::course::Language::JavaScript,
            metadata: Default::default(),
            readme_file: exercise_path.join("README.md"),
        };

        // Should not exist initially
        assert!(!playground_exists(&exercise));

        // Create playground
        fs::create_dir(exercise_path.join("playground")).unwrap();

        // Should exist now
        assert!(playground_exists(&exercise));
    }

    #[test]
    fn test_remove_playground() {
        let temp = TempDir::new().unwrap();
        let exercise_path = temp.path().join("001-test");
        fs::create_dir(&exercise_path).unwrap();
        fs::create_dir(exercise_path.join("playground")).unwrap();

        let exercise = Exercise {
            id: "001-test".to_string(),
            title: "Test".to_string(),
            description: "Test exercise".to_string(),
            order: 1,
            path: exercise_path.clone(),
            language: crate::course::Language::JavaScript,
            metadata: Default::default(),
            readme_file: exercise_path.join("README.md"),
        };

        assert!(playground_exists(&exercise));

        // Remove playground
        let result = remove_playground(&exercise);
        assert!(result.is_ok());
        assert!(!playground_exists(&exercise));
    }
}
