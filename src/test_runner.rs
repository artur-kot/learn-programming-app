use anyhow::{Context, Result};
use crate::course::Exercise;
use std::path::{Path, PathBuf};
use std::process::Stdio;
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
    #[allow(dead_code)]
    course_path: PathBuf,
}

impl TestRunner {
    pub fn new<P: AsRef<Path>>(course_path: P) -> Self {
        Self {
            course_path: course_path.as_ref().to_path_buf(),
        }
    }

    /// Run setup command for an exercise if one exists
    /// Returns true if setup was run, false if skipped
    async fn run_setup(&self, exercise: &Exercise, tx: &mpsc::Sender<String>) -> Result<bool> {
        if let Some(setup_cmd) = exercise.get_setup_command() {
            let _ = tx.send(format!("Running setup: {}\n", setup_cmd)).await;

            let mut cmd = self.create_command(&setup_cmd, &exercise.path);
            cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

            let mut child = cmd.spawn()
                .context(format!("Failed to spawn setup command: {}", setup_cmd))?;

            // Stream setup output
            if let Some(stdout) = child.stdout.take() {
                let tx_clone = tx.clone();
                tokio::spawn(async move {
                    let reader = BufReader::new(stdout);
                    let mut lines = reader.lines();
                    while let Ok(Some(line)) = lines.next_line().await {
                        let _ = tx_clone.send(line + "\n").await;
                    }
                });
            }

            if let Some(stderr) = child.stderr.take() {
                let tx_clone = tx.clone();
                tokio::spawn(async move {
                    let reader = BufReader::new(stderr);
                    let mut lines = reader.lines();
                    while let Ok(Some(line)) = lines.next_line().await {
                        let _ = tx_clone.send(line + "\n").await;
                    }
                });
            }

            let status = child.wait().await
                .context("Failed to wait for setup command")?;

            if !status.success() {
                anyhow::bail!("Setup failed with exit code: {:?}", status.code());
            }

            let _ = tx.send("\nSetup complete!\n\n".to_string()).await;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Create a command from a command string
    fn create_command(&self, command_str: &str, working_dir: &Path) -> TokioCommand {
        let mut cmd = if cfg!(target_os = "windows") {
            let mut c = TokioCommand::new("cmd");
            c.arg("/C");
            c.arg(command_str);
            c
        } else {
            let mut c = TokioCommand::new("sh");
            c.arg("-c");
            c.arg(command_str);
            c
        };

        cmd.current_dir(working_dir);
        cmd
    }

    /// Run tests for an exercise
    pub async fn run_test(&self, exercise: &Exercise) -> Result<TestResult> {
        let test_cmd = exercise.get_test_command();
        let mut cmd = self.create_command(&test_cmd, &exercise.path);

        let output = cmd.output().await
            .context(format!("Failed to execute test command: {}", test_cmd))?;

        if output.status.success() {
            Ok(TestResult::Passed)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);

            // If tests failed (not an error), return Failed
            if stderr.contains("FAIL") || stdout.contains("FAIL") || stderr.contains("failed") || stdout.contains("failed") {
                Ok(TestResult::Failed)
            } else if stderr.is_empty() && stdout.is_empty() {
                // Sometimes tests fail silently
                Ok(TestResult::Failed)
            } else {
                Ok(TestResult::Error(format!("{}{}", stdout, stderr)))
            }
        }
    }

    /// Run tests with full output
    pub async fn run_test_with_output(&self, exercise: &Exercise) -> Result<(TestResult, String)> {
        let test_cmd = exercise.get_test_command();
        let mut cmd = self.create_command(&test_cmd, &exercise.path);

        let output = cmd.output().await
            .context(format!("Failed to execute test command: {}", test_cmd))?;

        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let combined_output = format!("{}{}", stdout, stderr);

        let result = if output.status.success() {
            TestResult::Passed
        } else {
            // If tests failed (not an error), return Failed
            if stderr.contains("FAIL") || stdout.contains("FAIL") || stderr.contains("failed") || stdout.contains("failed") {
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

    /// Run tests with streaming output
    pub async fn run_test_streaming(
        &self,
        exercise: &Exercise,
        tx: mpsc::Sender<String>,
    ) -> Result<TestResult> {
        // Run setup first if needed
        if let Err(e) = self.run_setup(exercise, &tx).await {
            let error_msg = format!("Setup failed: {}", e);
            let _ = tx.send(error_msg.clone()).await;
            return Ok(TestResult::Error(error_msg));
        }

        let _ = tx.send(format!("Running tests: {}\n\n", exercise.get_test_command())).await;

        let test_cmd = exercise.get_test_command();

        let mut child = if cfg!(target_os = "windows") {
            TokioCommand::new("cmd")
                .arg("/C")
                .arg(&test_cmd)
                .current_dir(&exercise.path)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .context(format!("Failed to spawn test command: {}", test_cmd))?
        } else {
            TokioCommand::new("sh")
                .arg("-c")
                .arg(&test_cmd)
                .current_dir(&exercise.path)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .context(format!("Failed to spawn test command: {}", test_cmd))?
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

}
