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
}
