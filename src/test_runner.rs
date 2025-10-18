use anyhow::{Context, Result};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, PartialEq)]
pub enum TestResult {
    Passed,
    Failed,
    Error(String),
}

pub struct TestRunner {
    course_path: std::path::PathBuf,
}

impl TestRunner {
    pub fn new<P: AsRef<Path>>(course_path: P) -> Self {
        Self {
            course_path: course_path.as_ref().to_path_buf(),
        }
    }

    pub async fn run_test(&self, exercise_id: &str) -> Result<TestResult> {
        let test_pattern = format!("exercises/{}.*\\.test\\.js$", exercise_id);

        // Check if node_modules exists, if not suggest running npm install
        let node_modules = self.course_path.join("node_modules");
        if !node_modules.exists() {
            return Ok(TestResult::Error(
                "node_modules not found. Please run 'npm install' in the course directory.".to_string()
            ));
        }

        let output = Command::new("npm")
            .arg("test")
            .arg("--")
            .arg("--testPathPattern")
            .arg(&test_pattern)
            .arg("--silent")
            .current_dir(&self.course_path)
            .output()
            .context("Failed to execute npm test")?;

        if output.status.success() {
            Ok(TestResult::Passed)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);

            // If tests failed (not an error), return Failed
            if stderr.contains("FAIL") || stdout.contains("FAIL") {
                Ok(TestResult::Failed)
            } else if stderr.is_empty() && stdout.is_empty() {
                // Sometimes tests fail silently
                Ok(TestResult::Failed)
            } else {
                Ok(TestResult::Error(format!("{}{}", stdout, stderr)))
            }
        }
    }

    pub async fn run_all_tests(&self) -> Result<bool> {
        let output = Command::new("npm")
            .arg("test")
            .arg("--")
            .arg("--silent")
            .current_dir(&self.course_path)
            .output()
            .context("Failed to execute npm test")?;

        Ok(output.status.success())
    }
}
