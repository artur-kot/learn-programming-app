use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use directories::ProjectDirs;
use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

#[derive(Debug, Clone)]
pub struct ExerciseProgress {
    pub exercise_id: String,
    pub completed: bool,
    #[allow(dead_code)]
    pub last_attempt: Option<DateTime<Utc>>,
    #[allow(dead_code)]
    pub completed_at: Option<DateTime<Utc>>,
}

impl Database {
    pub fn new(course_name: &str) -> Result<Self> {
        let db_path = Self::get_db_path(course_name)?;

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(&db_path)
            .context(format!("Failed to open database at {:?}", db_path))?;

        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_schema()?;
        Ok(db)
    }

    fn get_db_path(course_name: &str) -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("com", "learnp", "Learn Programming")
            .context("Failed to determine project directories")?;

        let data_dir = proj_dirs.data_dir();
        let sanitized_name = course_name
            .chars()
            .map(|c| {
                if c.is_alphanumeric() || c == '-' || c == '_' {
                    c
                } else {
                    '_'
                }
            })
            .collect::<String>();

        Ok(data_dir.join(format!("{}.db", sanitized_name)))
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS exercise_progress (
                exercise_id TEXT PRIMARY KEY,
                completed INTEGER NOT NULL DEFAULT 0,
                last_attempt TEXT,
                completed_at TEXT
            )",
            [],
        )?;

        // Create migration table to track ID changes
        conn.execute(
            "CREATE TABLE IF NOT EXISTS id_migrations (
                old_id TEXT PRIMARY KEY,
                new_id TEXT NOT NULL,
                migrated_at TEXT NOT NULL
            )",
            [],
        )?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn get_progress(&self, exercise_id: &str) -> Result<ExerciseProgress> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT exercise_id, completed, last_attempt, completed_at
             FROM exercise_progress
             WHERE exercise_id = ?1",
        )?;

        let progress = stmt
            .query_row(params![exercise_id], |row| {
                Ok(ExerciseProgress {
                    exercise_id: row.get(0)?,
                    completed: row.get::<_, i32>(1)? != 0,
                    last_attempt: row
                        .get::<_, Option<String>>(2)?
                        .and_then(|s| s.parse::<DateTime<Utc>>().ok()),
                    completed_at: row
                        .get::<_, Option<String>>(3)?
                        .and_then(|s| s.parse::<DateTime<Utc>>().ok()),
                })
            })
            .unwrap_or_else(|_| ExerciseProgress {
                exercise_id: exercise_id.to_string(),
                completed: false,
                last_attempt: None,
                completed_at: None,
            });

        Ok(progress)
    }

    pub fn mark_completed(&self, exercise_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO exercise_progress (exercise_id, completed, last_attempt, completed_at)
             VALUES (?1, 1, ?2, ?2)",
            params![exercise_id, now],
        )?;
        Ok(())
    }

    pub fn mark_attempted(&self, exercise_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO exercise_progress (exercise_id, completed, last_attempt, completed_at)
             VALUES (?1, 0, ?2, NULL)",
            params![exercise_id, now],
        )?;
        Ok(())
    }

    pub fn get_all_progress(&self) -> Result<Vec<ExerciseProgress>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT exercise_id, completed, last_attempt, completed_at FROM exercise_progress",
        )?;

        let progress_iter = stmt.query_map([], |row| {
            Ok(ExerciseProgress {
                exercise_id: row.get(0)?,
                completed: row.get::<_, i32>(1)? != 0,
                last_attempt: row
                    .get::<_, Option<String>>(2)?
                    .and_then(|s| s.parse::<DateTime<Utc>>().ok()),
                completed_at: row
                    .get::<_, Option<String>>(3)?
                    .and_then(|s| s.parse::<DateTime<Utc>>().ok()),
            })
        })?;

        let mut results = Vec::new();
        for progress in progress_iter {
            results.push(progress?);
        }
        Ok(results)
    }

    /// Migrate an exercise ID from old to new
    /// This updates the exercise_progress table and records the migration
    #[allow(dead_code)]
    pub fn migrate_exercise_id(&self, old_id: &str, new_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        let conn = self.conn.lock().unwrap();

        // Check if migration already exists
        let migration_exists: bool = conn
            .query_row(
                "SELECT 1 FROM id_migrations WHERE old_id = ?1",
                params![old_id],
                |_| Ok(true),
            )
            .unwrap_or(false);

        if migration_exists {
            return Ok(());
        }

        // Check if there's progress for the old ID
        let has_progress: bool = conn
            .query_row(
                "SELECT 1 FROM exercise_progress WHERE exercise_id = ?1",
                params![old_id],
                |_| Ok(true),
            )
            .unwrap_or(false);

        if has_progress {
            // Update the exercise_id in the progress table
            conn.execute(
                "UPDATE exercise_progress SET exercise_id = ?1 WHERE exercise_id = ?2",
                params![new_id, old_id],
            )?;

            // Record the migration
            conn.execute(
                "INSERT INTO id_migrations (old_id, new_id, migrated_at) VALUES (?1, ?2, ?3)",
                params![old_id, new_id, now],
            )?;
        }

        Ok(())
    }

    /// Batch migrate multiple exercise IDs
    #[allow(dead_code)]
    pub fn migrate_exercise_ids(&self, migrations: &[(String, String)]) -> Result<()> {
        for (old_id, new_id) in migrations {
            self.migrate_exercise_id(old_id, new_id)?;
        }
        Ok(())
    }

    /// Get all recorded migrations
    #[allow(dead_code)]
    pub fn get_migrations(&self) -> Result<Vec<(String, String, String)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT old_id, new_id, migrated_at FROM id_migrations")?;

        let migrations_iter = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })?;

        let mut results = Vec::new();
        for migration in migrations_iter {
            results.push(migration?);
        }
        Ok(results)
    }
}
