use anyhow::{Context, Result};
use std::path::Path;
use std::process::{Command, Stdio};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;
use tokio::sync::mpsc;

#[derive(Debug, Clone, PartialEq)]
pub enum TestResult {
    Passed,
    Failed,
    Error(String),
}

#[derive(Clone)]
pub struct TestRunner {
    course_path: std::path::PathBuf,
}

impl TestRunner {
    pub fn new<P: AsRef<Path>>(course_path: P) -> Self {
        Self {
            course_path: course_path.as_ref().to_path_buf(),
        }
    }

    fn create_npm_command(&self, args: &[&str]) -> Command {
        let mut cmd = if cfg!(target_os = "windows") {
            let mut c = Command::new("cmd");
            c.arg("/C");
            c.arg("npm");
            c
        } else {
            Command::new("npm")
        };

        for arg in args {
            cmd.arg(arg);
        }

        cmd.current_dir(&self.course_path);
        cmd
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

        let output = self.create_npm_command(&["test", "--", "--testPathPattern", &test_pattern, "--silent"])
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

    pub async fn run_test_with_output(&self, exercise_id: &str) -> Result<(TestResult, String)> {
        let test_pattern = format!("exercises/{}.*\\.test\\.js$", exercise_id);

        // Check if node_modules exists, if not suggest running npm install
        let node_modules = self.course_path.join("node_modules");
        if !node_modules.exists() {
            let error_msg = "node_modules not found. Please run 'npm install' in the course directory.".to_string();
            return Ok((TestResult::Error(error_msg.clone()), error_msg));
        }

        let output = self.create_npm_command(&["test", "--", "--testPathPattern", &test_pattern])
            .output()
            .context("Failed to execute npm test")?;

        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let combined_output = format!("{}{}", stdout, stderr);

        let result = if output.status.success() {
            TestResult::Passed
        } else {
            // If tests failed (not an error), return Failed
            if stderr.contains("FAIL") || stdout.contains("FAIL") {
                TestResult::Failed
            } else if stderr.is_empty() && stdout.is_empty() {
                // Sometimes tests fail silently
                TestResult::Failed
            } else {
                TestResult::Error(combined_output.clone())
            }
        };

        Ok((result, combined_output))
    }

    pub async fn run_test_streaming(&self, exercise_id: &str, tx: mpsc::Sender<String>) -> Result<TestResult> {
        let test_pattern = format!("exercises/{}.*\\.test\\.js$", exercise_id);

        // Check if node_modules exists
        let node_modules = self.course_path.join("node_modules");
        if !node_modules.exists() {
            let error_msg = "node_modules not found. Please run 'npm install' in the course directory.".to_string();
            let _ = tx.send(error_msg.clone()).await;
            return Ok(TestResult::Error(error_msg));
        }

        let mut child = if cfg!(target_os = "windows") {
            TokioCommand::new("cmd")
                .arg("/C")
                .arg("npm")
                .arg("test")
                .arg("--")
                .arg("--testPathPattern")
                .arg(&test_pattern)
                .arg("--no-color")
                .current_dir(&self.course_path)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .context("Failed to spawn npm test")?
        } else {
            TokioCommand::new("npm")
                .arg("test")
                .arg("--")
                .arg("--testPathPattern")
                .arg(&test_pattern)
                .arg("--no-color")
                .current_dir(&self.course_path)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .context("Failed to spawn npm test")?
        };

        let stdout = child.stdout.take().context("Failed to capture stdout")?;
        let stderr = child.stderr.take().context("Failed to capture stderr")?;

        let tx_clone = tx.clone();
        let stdout_handle = tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                if tx_clone.send(line + "\n").await.is_err() {
                    break;
                }
            }
        });

        let tx_clone = tx.clone();
        let stderr_handle = tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                if tx_clone.send(line + "\n").await.is_err() {
                    break;
                }
            }
        });

        // Wait for both streams to finish
        let _ = tokio::join!(stdout_handle, stderr_handle);

        // Wait for the process to complete
        let status = child.wait().await.context("Failed to wait for npm test")?;

        if status.success() {
            Ok(TestResult::Passed)
        } else {
            // Check if tests failed vs error - we'll determine this from output
            Ok(TestResult::Failed)
        }
    }

    pub async fn run_all_tests(&self) -> Result<bool> {
        let output = self.create_npm_command(&["test", "--", "--silent"])
            .output()
            .context("Failed to execute npm test")?;

        Ok(output.status.success())
    }
}
