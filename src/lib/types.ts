export interface Course {
  id?: number;
  slug: string;
  name: string;
  repo_url: string;
  repo_path?: string;
  last_updated?: string;
  created_at?: string;
}

export interface ExerciseProgress {
  id?: number;
  course_slug: string;
  exercise_id: string;
  exercise_path: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseMeta {
  id: string;
  initCmd?: string;
  testCmd?: string;
}

export interface Exercise {
  id: string;
  path: string;
  name: string;
  description: string;
  meta: ExerciseMeta;
  files: string[];
  completed: boolean;
}

export interface CourseConfig {
  ignoreExerciseFiles?: string[];
}

export interface CourseStructure {
  overview: string;
  exercises: Exercise[];
  config?: CourseConfig;
}

export interface CourseWithProgress {
  course: Course;
  total_exercises: number;
  completed_exercises: number;
  progress_percentage: number;
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
}

// Hardcoded course list for dashboard
export const AVAILABLE_COURSES = [
  {
    slug: 'javascript',
    name: 'Learn JavaScript',
    repo_url: 'https://github.com/artur-kot/learn-programming-javascript.git',
    description: 'Learn JavaScript fundamentals through interactive exercises',
  },
] as const;
