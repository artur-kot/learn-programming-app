import path from 'node:path';
import { app } from 'electron';
import sqlite3 from 'sqlite3';

const sqlite = sqlite3.verbose();

let dbPromise: Promise<sqlite3.Database> | null = null;

function openDb(): Promise<sqlite3.Database> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const file = path.join(app.getPath('userData'), 'progress.db');
    const db = new sqlite.Database(file, (err) => {
      if (err) return reject(err);
      // Initialize schema
      db.serialize(() => {
        db.run("PRAGMA journal_mode = WAL");
        db.run(
          `CREATE TABLE IF NOT EXISTS exercise_progress (
            course_slug   TEXT NOT NULL,
            exercise_path TEXT NOT NULL,
            completed     INTEGER NOT NULL DEFAULT 0,
            completed_at  TEXT,
            PRIMARY KEY (course_slug, exercise_path)
          )`,
          (e) => {
            if (e) reject(e);
            else resolve(db);
          }
        );
      });
    });
  });
  return dbPromise;
}

export async function markExerciseCompleted(courseSlug: string, exercisePath: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    db.run(
      `INSERT INTO exercise_progress (course_slug, exercise_path, completed, completed_at)
       VALUES (?, ?, 1, datetime('now'))
       ON CONFLICT(course_slug, exercise_path)
       DO UPDATE SET completed = 1, completed_at = datetime('now')`,
      [courseSlug, exercisePath],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export async function isExerciseCompleted(courseSlug: string, exercisePath: string): Promise<boolean> {
  const db = await openDb();
  return await new Promise<boolean>((resolve, reject) => {
    db.get(
      `SELECT completed FROM exercise_progress WHERE course_slug = ? AND exercise_path = ?`,
      [courseSlug, exercisePath],
      (err, row: any) => {
        if (err) reject(err);
        else resolve(!!(row && row.completed));
      }
    );
  });
}

export async function clearExerciseCompletion(courseSlug: string, exercisePath: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    db.run(
      `UPDATE exercise_progress SET completed = 0, completed_at = NULL WHERE course_slug = ? AND exercise_path = ?`,
      [courseSlug, exercisePath],
      (err) => (err ? reject(err) : resolve())
    );
  });
}
