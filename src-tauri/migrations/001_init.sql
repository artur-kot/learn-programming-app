-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    repo_url TEXT NOT NULL,
    repo_path TEXT,
    last_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create exercise_progress table
CREATE TABLE IF NOT EXISTS exercise_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_slug TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    exercise_path TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_slug, exercise_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercise_progress_course
ON exercise_progress(course_slug);

CREATE INDEX IF NOT EXISTS idx_exercise_progress_completed
ON exercise_progress(completed);
