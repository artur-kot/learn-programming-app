import path from 'node:path';
import { app } from 'electron';
import Database from 'better-sqlite3';

let db: Database.Database | null = null;

function openDb(): Database.Database {
  if (db) return db;

  const file = path.join(app.getPath('userData'), 'progress.db');
  db = new Database(file);

  // Initialize schema
  db.pragma('journal_mode = WAL');
  db.exec(
    `CREATE TABLE IF NOT EXISTS exercise_progress (
      course_slug   TEXT NOT NULL,
      exercise_path TEXT NOT NULL,
      completed     INTEGER NOT NULL DEFAULT 0,
      completed_at  TEXT,
      PRIMARY KEY (course_slug, exercise_path)
    )`
  );

  return db;
}

export function markExerciseCompleted(courseSlug: string, exercisePath: string): void {
  const db = openDb();
  const stmt = db.prepare(
    `INSERT INTO exercise_progress (course_slug, exercise_path, completed, completed_at)
     VALUES (?, ?, 1, datetime('now'))
     ON CONFLICT(course_slug, exercise_path)
     DO UPDATE SET completed = 1, completed_at = datetime('now')`
  );
  stmt.run(courseSlug, exercisePath);
}

export function isExerciseCompleted(courseSlug: string, exercisePath: string): boolean {
  const db = openDb();
  const stmt = db.prepare(
    `SELECT completed FROM exercise_progress WHERE course_slug = ? AND exercise_path = ?`
  );
  const row = stmt.get(courseSlug, exercisePath) as { completed: number } | undefined;
  return !!(row && row.completed);
}

export function clearExerciseCompletion(courseSlug: string, exercisePath: string): void {
  const db = openDb();
  const stmt = db.prepare(
    `UPDATE exercise_progress SET completed = 0, completed_at = NULL WHERE course_slug = ? AND exercise_path = ?`
  );
  stmt.run(courseSlug, exercisePath);
}
