use anyhow::Result;
use std::path::Path;
use std::process::Command;

pub struct GitRepo {
    path: std::path::PathBuf,
}

impl GitRepo {
    pub fn new<P: AsRef<Path>>(path: P) -> Self {
        Self {
            path: path.as_ref().to_path_buf(),
        }
    }

    /// Check if the directory is a git repository
    pub fn is_git_repo(&self) -> bool {
        self.path.join(".git").exists()
    }

    /// Get the current branch name
    pub fn get_current_branch(&self) -> Result<String> {
        let output = self.run_git_command(&["branch", "--show-current"])?;
        Ok(output.trim().to_string())
    }

    /// Check if there's a remote configured
    pub fn has_remote(&self) -> bool {
        self.run_git_command(&["remote"]).map(|o| !o.trim().is_empty()).unwrap_or(false)
    }

    /// Fetch from remote without merging
    pub fn fetch(&self) -> Result<()> {
        self.run_git_command(&["fetch"])?;
        Ok(())
    }

    /// Check if local branch is behind remote
    pub fn is_behind_remote(&self) -> Result<bool> {
        let current_branch = self.get_current_branch()?;

        // Get remote tracking branch
        let remote_branch = format!("origin/{}", current_branch);

        // Check if remote branch exists
        let branch_exists = self.run_git_command(&["rev-parse", "--verify", &remote_branch]).is_ok();

        if !branch_exists {
            // No remote branch to compare
            return Ok(false);
        }

        // Compare local and remote
        let output = self.run_git_command(&["rev-list", "--count", &format!("HEAD..{}", remote_branch)])?;
        let behind_count: usize = output.trim().parse().unwrap_or(0);

        Ok(behind_count > 0)
    }

    /// Get number of commits behind remote
    pub fn commits_behind(&self) -> Result<usize> {
        let current_branch = self.get_current_branch()?;
        let remote_branch = format!("origin/{}", current_branch);

        let output = self.run_git_command(&["rev-list", "--count", &format!("HEAD..{}", remote_branch)])?;
        let count: usize = output.trim().parse().unwrap_or(0);

        Ok(count)
    }

    /// Pull changes from remote
    pub fn pull(&self) -> Result<String> {
        let output = self.run_git_command(&["pull"])?;
        Ok(output)
    }

    /// Check if there are uncommitted changes
    pub fn has_uncommitted_changes(&self) -> bool {
        self.run_git_command(&["status", "--porcelain"])
            .map(|o| !o.trim().is_empty())
            .unwrap_or(false)
    }

    fn run_git_command(&self, args: &[&str]) -> Result<String> {
        let output = if cfg!(target_os = "windows") {
            Command::new("cmd")
                .arg("/C")
                .arg("git")
                .args(args)
                .current_dir(&self.path)
                .output()?
        } else {
            Command::new("git")
                .args(args)
                .current_dir(&self.path)
                .output()?
        };

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("Git command failed: {}", stderr)
        }
    }
}

/// Check for course updates and prompt user
pub fn check_and_prompt_for_updates<P: AsRef<Path>>(course_path: P) -> Result<()> {
    let repo = GitRepo::new(&course_path);

    // Only check if it's a git repo
    if !repo.is_git_repo() {
        return Ok(());
    }

    // Only check if there's a remote
    if !repo.has_remote() {
        return Ok(());
    }

    println!("Checking for course updates...");

    // Fetch latest changes
    if let Err(e) = repo.fetch() {
        eprintln!("Warning: Could not fetch updates: {}", e);
        return Ok(());
    }

    // Check if behind
    let is_behind = repo.is_behind_remote()?;
    if !is_behind {
        println!("Course is up to date!");
        std::thread::sleep(std::time::Duration::from_millis(500));
        return Ok(());
    }

    let commits_behind = repo.commits_behind()?;
    let current_branch = repo.get_current_branch()?;

    println!("\n╔═══════════════════════════════════════════════════════════╗");
    println!("║           COURSE UPDATES AVAILABLE                        ║");
    println!("╚═══════════════════════════════════════════════════════════╝");
    println!();
    println!("Your course is {} commit(s) behind origin/{}", commits_behind, current_branch);

    if repo.has_uncommitted_changes() {
        println!();
        println!("⚠️  Warning: You have uncommitted changes.");
        println!("   Pulling updates may cause conflicts.");
    }

    println!();
    print!("Do you want to pull the latest changes? [Y/n]: ");
    std::io::Write::flush(&mut std::io::stdout())?;

    let mut input = String::new();
    std::io::stdin().read_line(&mut input)?;
    let input = input.trim().to_lowercase();

    if input.is_empty() || input == "y" || input == "yes" {
        println!("\nPulling updates...");
        match repo.pull() {
            Ok(output) => {
                println!("{}", output);
                println!("✓ Course updated successfully!");
                std::thread::sleep(std::time::Duration::from_secs(1));
            }
            Err(e) => {
                eprintln!("Error pulling updates: {}", e);
                eprintln!("\nYou can manually update by running:");
                eprintln!("  cd {:?} && git pull", course_path.as_ref());
                println!("\nPress Enter to continue...");
                let mut _dummy = String::new();
                std::io::stdin().read_line(&mut _dummy)?;
            }
        }
    } else {
        println!("\nSkipping update. You can update later with 'git pull'");
        std::thread::sleep(std::time::Duration::from_millis(500));
    }

    Ok(())
}
