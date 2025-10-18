use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use directories::ProjectDirs;
use rusqlite::{params, Connection};
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

#[derive(Debug, Clone)]
pub struct ExerciseProgress {
    pub exercise_id: String,
    pub completed: bool,
    pub last_attempt: Option<DateTime<Utc>>,
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

        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn get_db_path(course_name: &str) -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("com", "js-learner", "js-learner")
            .context("Failed to determine project directories")?;

        let data_dir = proj_dirs.data_dir();
        let sanitized_name = course_name
            .chars()
            .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
            .collect::<String>();

        Ok(data_dir.join(format!("{}.db", sanitized_name)))
    }

    fn init_schema(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS exercise_progress (
                exercise_id TEXT PRIMARY KEY,
                completed INTEGER NOT NULL DEFAULT 0,
                last_attempt TEXT,
                completed_at TEXT
            )",
            [],
        )?;
        Ok(())
    }

    pub fn get_progress(&self, exercise_id: &str) -> Result<ExerciseProgress> {
        let mut stmt = self.conn.prepare(
            "SELECT exercise_id, completed, last_attempt, completed_at
             FROM exercise_progress
             WHERE exercise_id = ?1"
        )?;

        let progress = stmt.query_row(params![exercise_id], |row| {
            Ok(ExerciseProgress {
                exercise_id: row.get(0)?,
                completed: row.get::<_, i32>(1)? != 0,
                last_attempt: row.get::<_, Option<String>>(2)?
                    .and_then(|s| s.parse::<DateTime<Utc>>().ok()),
                completed_at: row.get::<_, Option<String>>(3)?
                    .and_then(|s| s.parse::<DateTime<Utc>>().ok()),
            })
        }).unwrap_or_else(|_| ExerciseProgress {
            exercise_id: exercise_id.to_string(),
            completed: false,
            last_attempt: None,
            completed_at: None,
        });

        Ok(progress)
    }

    pub fn mark_completed(&self, exercise_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT OR REPLACE INTO exercise_progress (exercise_id, completed, last_attempt, completed_at)
             VALUES (?1, 1, ?2, ?2)",
            params![exercise_id, now],
        )?;
        Ok(())
    }

    pub fn mark_attempted(&self, exercise_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT OR REPLACE INTO exercise_progress (exercise_id, completed, last_attempt, completed_at)
             VALUES (
                 ?1,
                 COALESCE((SELECT completed FROM exercise_progress WHERE exercise_id = ?1), 0),
                 ?2,
                 (SELECT completed_at FROM exercise_progress WHERE exercise_id = ?1)
             )",
            params![exercise_id, now],
        )?;
        Ok(())
    }

    pub fn get_all_progress(&self) -> Result<Vec<ExerciseProgress>> {
        let mut stmt = self.conn.prepare(
            "SELECT exercise_id, completed, last_attempt, completed_at FROM exercise_progress"
        )?;

        let progress_iter = stmt.query_map([], |row| {
            Ok(ExerciseProgress {
                exercise_id: row.get(0)?,
                completed: row.get::<_, i32>(1)? != 0,
                last_attempt: row.get::<_, Option<String>>(2)?
                    .and_then(|s| s.parse::<DateTime<Utc>>().ok()),
                completed_at: row.get::<_, Option<String>>(3)?
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
