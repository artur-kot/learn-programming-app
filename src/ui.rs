use crate::config::Config;
use crate::course::{Course, Exercise};
use crate::database::Database;
use crate::editor::{self, Editor};
use crate::playground;
use crate::test_runner::{TestResult, TestRunner};
use ansi_to_tui::IntoText;
use anyhow::Result;
use crossterm::{
    event::{
        self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind, KeyModifiers,
        MouseEventKind,
    },
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::{Backend, CrosstermBackend},
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span, Text},
    widgets::{Block, Borders, List, ListItem, ListState, Paragraph, Wrap},
    Frame, Terminal,
};
use std::io;
use std::path::PathBuf;
use tokio::sync::mpsc;

#[derive(PartialEq)]
pub enum DisplayMode {
    Readme,
    ReadmeFocused,
    TestOutput,
    Hint,
    ModelSelection,
    RunAllTests,
    PlaygroundConfirm,
    EditorSelection,
}

pub struct App {
    course: Course,
    all_exercises: Vec<Exercise>, // All exercises from course
    current_folder_path: PathBuf, // Current folder being viewed
    current_exercises: Vec<Exercise>, // Exercises in current folder
    breadcrumb: Vec<String>, // Breadcrumb trail for navigation
    database: Database,
    test_runner: TestRunner,
    selected_index: usize,
    list_state: ListState,
    display_mode: DisplayMode,
    last_test_result: Option<TestResult>,
    test_output_lines: Vec<String>,
    status_message: String,
    status_message_timestamp: Option<std::time::Instant>,
    default_status_message: String,
    is_running_test: bool,
    scroll_position: usize,
    output_receiver: Option<mpsc::Receiver<String>>,
    result_receiver: Option<mpsc::Receiver<TestResult>>,
    running_exercise_id: Option<String>,
    blink_toggle: bool,
    blink_counter: u8,
    hint_text: Option<String>,
    is_generating_hint: bool,
    hint_receiver: Option<mpsc::Receiver<String>>,
    hint_complete_receiver: Option<mpsc::Receiver<()>>,
    config: Config,
    available_models: Vec<String>,
    model_list_state: ListState,
    models_receiver: Option<mpsc::Receiver<Vec<String>>>,
    // Editor selection state
    available_editors: Vec<Editor>,
    editor_list_state: ListState,
    // Run all tests state
    is_running_all_tests: bool,
    run_all_progress: Vec<(String, Option<TestResult>)>, // (exercise_id, result)
    run_all_current_index: usize,
    run_all_output: Vec<String>,
    run_all_receiver: Option<mpsc::Receiver<(usize, TestResult)>>,
    run_all_cancel_tx: Option<mpsc::Sender<()>>,
    // Setup tracking
    setup_start_index: Option<usize>, // Track where setup output starts
    // Unblock all flag
    unblock_all: bool,
    // Playground state
    playground_path: Option<PathBuf>,
    show_playground_success: bool,
    // List viewport height for smart scrolling
    list_viewport_height: usize,
    // Course path for folder navigation
    course_path: PathBuf,
}

impl App {
    pub fn new(course_path: PathBuf, unblock_all: bool) -> Result<Self> {
        let (course, all_exercises) = Course::load_from_path(&course_path)?;
        let database = Database::new(&course_path)?;
        let test_runner = TestRunner::new(&course_path);

        // Start in the root exercises folder
        let exercises_dir = course_path.join("exercises");
        let current_exercises = Self::load_current_folder(&all_exercises, &exercises_dir);

        // Find first incomplete exercise to select on startup
        let progress_map: std::collections::HashMap<String, bool> = database
            .get_all_progress()
            .unwrap_or_default()
            .into_iter()
            .map(|p| (p.exercise_id, p.completed))
            .collect();

        let mut initial_index = 0;
        for (index, exercise) in current_exercises.iter().enumerate() {
            if exercise.is_folder {
                continue; // Skip folders when looking for first incomplete
            }
            let is_completed = progress_map.get(&exercise.id).copied().unwrap_or(false);

            if !is_completed {
                initial_index = index;
                break;
            }
        }

        let mut list_state = ListState::default();
        if !current_exercises.is_empty() {
            list_state.select(Some(initial_index));
        }

        let config = Config::load().unwrap_or_default();

        Ok(Self {
            course,
            all_exercises: all_exercises.clone(),
            current_folder_path: exercises_dir,
            current_exercises,
            breadcrumb: Vec::new(),
            database,
            test_runner,
            selected_index: initial_index,
            list_state,
            display_mode: DisplayMode::Readme,
            last_test_result: None,
            test_output_lines: Vec::new(),
            status_message: String::from(
                "Enter - run/open, Backspace - go back, Shift+A - run all tests, o - open in editor, r - readme, q - quit",
            ),
            status_message_timestamp: None,
            default_status_message: String::from(
                "Enter - run/open, Backspace - go back, Shift+A - run all tests, o - open in editor, r - readme, q - quit",
            ),
            is_running_test: false,
            scroll_position: 0,
            output_receiver: None,
            result_receiver: None,
            running_exercise_id: None,
            blink_toggle: false,
            blink_counter: 0,
            hint_text: None,
            is_generating_hint: false,
            hint_receiver: None,
            hint_complete_receiver: None,
            config,
            available_models: Vec::new(),
            model_list_state: ListState::default(),
            models_receiver: None,
            available_editors: Vec::new(),
            editor_list_state: ListState::default(),
            is_running_all_tests: false,
            run_all_progress: Vec::new(),
            run_all_current_index: 0,
            run_all_output: Vec::new(),
            run_all_receiver: None,
            run_all_cancel_tx: None,
            setup_start_index: None,
            unblock_all,
            playground_path: None,
            show_playground_success: false,
            list_viewport_height: 20, // Default, will be updated during render
            course_path,
        })
    }

    fn load_current_folder(all_exercises: &[Exercise], folder_path: &PathBuf) -> Vec<Exercise> {
        all_exercises
            .iter()
            .filter(|ex| {
                // Check if the exercise's parent directory matches the current folder path
                if let Some(parent) = ex.path.parent() {
                    parent == folder_path.as_path()
                } else {
                    false
                }
            })
            .cloned()
            .collect()
    }

    fn enter_folder(&mut self) {
        if let Some(exercise) = self.current_exercises.get(self.selected_index) {
            if exercise.is_folder {
                // Navigate into folder
                self.current_folder_path = exercise.path.clone();
                self.breadcrumb.push(exercise.title.clone());
                self.current_exercises = Self::load_current_folder(&self.all_exercises, &self.current_folder_path);
                self.selected_index = 0;
                self.list_state.select(Some(0));
                self.display_mode = DisplayMode::Readme;
                self.scroll_position = 0;
            }
        }
    }

    fn go_back_folder(&mut self) {
        if !self.breadcrumb.is_empty() {
            // Go up one level
            self.breadcrumb.pop();
            if let Some(parent) = self.current_folder_path.parent() {
                self.current_folder_path = parent.to_path_buf();
                self.current_exercises = Self::load_current_folder(&self.all_exercises, &self.current_folder_path);
                self.selected_index = 0;
                self.list_state.select(Some(0));
                self.display_mode = DisplayMode::Readme;
                self.scroll_position = 0;
            }
        }
    }

    fn get_folder_progress(&self, folder: &Exercise) -> (usize, usize) {
        if !folder.is_folder {
            return (0, 0);
        }

        let progress_map: std::collections::HashMap<String, bool> = self
            .database
            .get_all_progress()
            .unwrap_or_default()
            .into_iter()
            .map(|p| (p.exercise_id, p.completed))
            .collect();

        // Find all exercises that are descendants of this folder
        let mut total = 0;
        let mut completed = 0;

        for exercise in &self.all_exercises {
            if exercise.is_folder {
                continue; // Skip nested folders, only count exercises
            }

            // Check if this exercise is a descendant of the folder
            if exercise.path.starts_with(&folder.path) {
                total += 1;
                if progress_map.get(&exercise.id).copied().unwrap_or(false) {
                    completed += 1;
                }
            }
        }

        (completed, total)
    }

    fn get_first_incomplete_index(&self) -> Option<usize> {
        let progress_map: std::collections::HashMap<String, bool> = self
            .database
            .get_all_progress()
            .unwrap_or_default()
            .into_iter()
            .map(|p| (p.exercise_id, p.completed))
            .collect();

        for (index, exercise) in self.current_exercises.iter().enumerate() {
            if exercise.is_folder {
                continue; // Skip folders
            }
            let is_completed = progress_map.get(&exercise.id).copied().unwrap_or(false);

            if !is_completed {
                return Some(index);
            }
        }

        None
    }

    fn is_exercise_unlocked(&self, index: usize) -> bool {
        // Check if LEARNP_UNBLOCK_ALL environment variable is set or --unblock-all flag is used
        if self.unblock_all || std::env::var("LEARNP_UNBLOCK_ALL").unwrap_or_default() == "1" {
            return true;
        }

        if let Some(first_incomplete) = self.get_first_incomplete_index() {
            // Allow navigation to completed exercises and the current (first incomplete) exercise
            index <= first_incomplete
        } else {
            // All exercises completed - allow navigation to all
            true
        }
    }

    fn select_next(&mut self) {
        if self.current_exercises.is_empty() {
            return;
        }

        // When LEARNP_UNBLOCK_ALL is set or --unblock-all flag is used, allow navigation to all exercises
        let unblock_all =
            self.unblock_all || std::env::var("LEARNP_UNBLOCK_ALL").unwrap_or_default() == "1";
        let max_index = if unblock_all {
            self.current_exercises.len() - 1
        } else {
            let first_incomplete = self.get_first_incomplete_index();
            first_incomplete.unwrap_or(self.current_exercises.len() - 1)
        };

        // Find next unlocked exercise
        let mut next_index = self.selected_index + 1;
        while next_index <= max_index {
            if self.is_exercise_unlocked(next_index) {
                self.selected_index = next_index;
                self.list_state.select(Some(self.selected_index));
                self.update_list_scroll();

                // Reset to readme when changing exercises
                self.display_mode = DisplayMode::Readme;
                self.test_output_lines.clear();
                self.last_test_result = None;
                self.scroll_position = 0;
                self.is_running_test = false;
                self.output_receiver = None;
                self.result_receiver = None;
                return;
            }
            next_index += 1;
        }
        // If no unlocked exercise found forward, don't move
    }

    fn select_previous(&mut self) {
        if self.current_exercises.is_empty() {
            return;
        }

        // Find previous unlocked exercise
        if self.selected_index > 0 {
            let mut prev_index = self.selected_index - 1;
            loop {
                if self.is_exercise_unlocked(prev_index) {
                    self.selected_index = prev_index;
                    self.list_state.select(Some(self.selected_index));
                    self.update_list_scroll();

                    // Reset to readme when changing exercises
                    self.display_mode = DisplayMode::Readme;
                    self.test_output_lines.clear();
                    self.last_test_result = None;
                    self.scroll_position = 0;
                    self.is_running_test = false;
                    self.output_receiver = None;
                    self.result_receiver = None;
                    return;
                }

                if prev_index == 0 {
                    break;
                }
                prev_index -= 1;
            }
        }
        // If no unlocked exercise found backward, don't move
    }

    fn update_list_scroll(&mut self) {
        // Smart scrolling with comfort zone (25% - 75%)
        if self.current_exercises.is_empty() || self.list_viewport_height == 0 {
            return;
        }

        let total_items = self.current_exercises.len();
        let visible_height = self.list_viewport_height;

        // Only apply smart scrolling if list is longer than viewport
        if total_items <= visible_height {
            return;
        }

        if let Some(selected) = self.list_state.selected() {
            // Calculate context lines (25% of viewport, min 3, max 5)
            let context_lines = (visible_height / 4).clamp(3, 5);

            let current_offset = self.list_state.offset();
            let relative_position = selected.saturating_sub(current_offset);

            // Comfort zone boundaries: 25% and 75%
            let scroll_trigger_up = context_lines;
            let scroll_trigger_down = visible_height.saturating_sub(context_lines);

            // Scroll down if selection moved PAST 75% mark
            if relative_position > scroll_trigger_down {
                let new_offset = selected.saturating_sub(scroll_trigger_down);
                let max_offset = total_items.saturating_sub(visible_height);
                let new_offset = new_offset.min(max_offset);
                *self.list_state.offset_mut() = new_offset;
            }
            // Scroll up if selection moved BEFORE 25% mark
            else if relative_position < scroll_trigger_up && selected >= scroll_trigger_up {
                let new_offset = selected.saturating_sub(scroll_trigger_up);
                *self.list_state.offset_mut() = new_offset;
            }
            // Else: in comfort zone (25-75%), no scrolling
        }
    }

    fn get_selected_exercise(&self) -> Option<&Exercise> {
        self.current_exercises.get(self.selected_index)
    }

    async fn run_current_test(&mut self) -> Result<()> {
        if let Some(exercise) = self.get_selected_exercise() {
            let exercise_clone = exercise.clone();
            let exercise_id = exercise_clone.id.clone();

            self.is_running_test = true;
            self.running_exercise_id = Some(exercise_id.clone());
            self.status_message =
                String::from("Running tests... | ↑/↓ PgUp/PgDn Home/End - scroll, Esc - back");
            self.display_mode = DisplayMode::TestOutput;
            self.test_output_lines = vec![String::from("Running tests..."), String::new()];
            self.scroll_position = 0;
            self.setup_start_index = None; // Reset setup tracking for new test run

            // Create channels for streaming output and result
            let (output_tx, output_rx) = mpsc::channel(100);
            let (result_tx, result_rx) = mpsc::channel(1);
            self.output_receiver = Some(output_rx);
            self.result_receiver = Some(result_rx);

            // Spawn test runner in background
            let test_runner = self.test_runner.clone();
            let db = self.database.clone();

            tokio::spawn(async move {
                let result = match test_runner
                    .run_test_streaming(&exercise_clone, output_tx)
                    .await
                {
                    Ok(result) => {
                        // Update database based on result
                        match &result {
                            TestResult::Passed => {
                                let _ = db.mark_completed(&exercise_clone.id);
                            }
                            TestResult::Failed => {
                                let _ = db.mark_attempted(&exercise_clone.id);
                            }
                            _ => {}
                        }
                        result
                    }
                    Err(_) => TestResult::Error("Failed to run test".to_string()),
                };

                // Send result back to main thread
                let _ = result_tx.send(result).await;
            });
        }
        Ok(())
    }

    fn check_test_output(&mut self) {
        // Toggle blink state for running indicator every 10 cycles (500ms)
        self.blink_counter = (self.blink_counter + 1) % 10;
        if self.blink_counter == 0 {
            self.blink_toggle = !self.blink_toggle;
        }

        // Check for streaming output
        if let Some(ref mut rx) = self.output_receiver {
            // Try to receive all available messages
            while let Ok(line) = rx.try_recv() {
                // Remove trailing newline if present and add as separate line
                let line = line.trim_end_matches('\n').trim_end_matches('\r');

                // Handle setup markers
                if line == "__SETUP_START__" {
                    // Mark the current position as start of setup
                    self.setup_start_index = Some(self.test_output_lines.len());
                    continue; // Don't add the marker to output
                } else if line == "__SETUP_SUCCESS__" {
                    // Remove all setup lines (from setup_start_index to current)
                    if let Some(start_idx) = self.setup_start_index {
                        self.test_output_lines.truncate(start_idx);
                        self.setup_start_index = None;
                    }
                    continue; // Don't add the marker to output
                } else if line == "__SETUP_FAILED__" {
                    // Keep setup output visible, just clear the marker tracking
                    self.setup_start_index = None;
                    continue; // Don't add the marker to output
                }

                if !line.is_empty() || self.test_output_lines.last().is_some_and(|l| !l.is_empty())
                {
                    self.test_output_lines.push(line.to_string());
                }
            }
        }

        // Check if test completed
        if let Some(ref mut result_rx) = self.result_receiver {
            if let Ok(result) = result_rx.try_recv() {
                // Test completed
                self.last_test_result = Some(result.clone());
                self.is_running_test = false;
                self.result_receiver = None;
                self.running_exercise_id = None;

                // Update status message based on result
                if let Some(exercise) = self.get_selected_exercise() {
                    let title = &exercise.title;
                    match result {
                        TestResult::Passed => {
                            self.status_message = format!(
                                "✓ {} passed! | p - extract to playground, ↑/↓ scroll, Enter - run again, Esc - back",
                                title
                            );
                        }
                        TestResult::Failed => {
                            self.status_message = format!("✗ {} failed | ↑/↓ PgUp/PgDn Home/End - scroll, Enter - run again, h - hint, Esc - back", title);
                        }
                        TestResult::Error(err) => {
                            self.status_message =
                                format!("Error: {} | Enter - retry, Esc - back", err);
                        }
                    }
                }
            }
        }

        // Check for hint generation
        self.check_hint_generation();

        // Check for models loaded
        self.check_models_loaded();

        // Check for run-all progress
        self.check_run_all_progress();
    }

    fn show_readme(&mut self) {
        self.display_mode = DisplayMode::Readme;
        self.test_output_lines.clear();
        self.scroll_position = 0;
        self.is_running_test = false;
        self.output_receiver = None;
        self.result_receiver = None;
        self.last_test_result = None;
        self.running_exercise_id = None;
        self.status_message = self.default_status_message.clone();
        self.status_message_timestamp = None;
    }

    /// Set a temporary status message that will auto-hide after 3 seconds
    fn set_temp_status(&mut self, message: String) {
        self.status_message = message;
        self.status_message_timestamp = Some(std::time::Instant::now());
    }

    /// Set a permanent status message (won't auto-hide)
    fn set_status(&mut self, message: String) {
        self.status_message = message;
        self.status_message_timestamp = None;
    }

    /// Check if temporary status message should be cleared
    fn check_status_timeout(&mut self) {
        if let Some(timestamp) = self.status_message_timestamp {
            if timestamp.elapsed().as_secs() >= 3 {
                self.status_message = self.default_status_message.clone();
                self.status_message_timestamp = None;
            }
        }
    }

    fn check_hint_generation(&mut self) {
        // Check for new tokens
        if let Some(ref mut rx) = self.hint_receiver {
            while let Ok(token) = rx.try_recv() {
                // Append token to hint text (streaming)
                if let Some(ref mut hint) = self.hint_text {
                    hint.push_str(&token);
                } else {
                    self.hint_text = Some(token);
                }
            }
        }

        // Check if generation is complete
        if let Some(ref mut complete_rx) = self.hint_complete_receiver {
            if complete_rx.try_recv().is_ok() {
                self.is_generating_hint = false;
                self.hint_complete_receiver = None;
                self.status_message = String::from(
                    "Hint ready! | ↑/↓ PgUp/PgDn Home/End - scroll, m - change model, Esc - back",
                );
            }
        }
    }

    fn show_test_output(&mut self) {
        self.display_mode = DisplayMode::TestOutput;
        self.scroll_position = 0;
        if let Some(_exercise) = self.get_selected_exercise() {
            if self.last_test_result.is_some() {
                self.status_message =
                    String::from("↑/↓ PgUp/PgDn Home/End - scroll, h - hint, Esc - back");
            } else {
                self.status_message = String::from("Enter - run tests, Esc - back");
            }
        }
    }

    fn extract_to_playground(&mut self) -> Result<()> {
        if let Some(exercise) = self.get_selected_exercise() {
            // Remove old playground if it exists
            if playground::playground_exists(exercise) {
                playground::remove_playground(exercise)?;
            }

            // Extract to playground
            match playground::extract_to_playground(exercise) {
                Ok(playground_path) => {
                    self.playground_path = Some(playground_path.clone());
                    self.show_playground_success = true;
                    self.display_mode = DisplayMode::TestOutput;
                    self.status_message = "✓ Extracted to ./playground | p - extract again, Enter - run test, Esc - back".to_string();
                }
                Err(e) => {
                    self.display_mode = DisplayMode::TestOutput;
                    self.status_message =
                        format!("✗ Failed to extract playground: {} | Esc - back", e);
                }
            }
        }
        Ok(())
    }

    async fn fetch_available_models(&mut self) {
        self.display_mode = DisplayMode::ModelSelection;
        self.status_message = String::from("Loading available models from Ollama...");
        self.available_models = vec![String::from("Loading...")];
        self.model_list_state.select(Some(0));

        // Create channel for models
        let (models_tx, models_rx) = mpsc::channel(1);
        self.models_receiver = Some(models_rx);

        // Spawn model fetching in background
        tokio::spawn(async move {
            use ollama_rs::Ollama;

            let ollama = Ollama::default();
            match ollama.list_local_models().await {
                Ok(models) => {
                    let model_names: Vec<String> = models.iter().map(|m| m.name.clone()).collect();

                    if model_names.is_empty() {
                        let _ = models_tx.send(vec![String::from("No models found. Please install a model with 'ollama pull <model-name>'")]).await;
                    } else {
                        let _ = models_tx.send(model_names).await;
                    }
                }
                Err(_) => {
                    let _ = models_tx
                        .send(vec![String::from(
                            "Error: Cannot connect to Ollama. Make sure Ollama is running.",
                        )])
                        .await;
                }
            }
        });
    }

    fn check_models_loaded(&mut self) {
        if let Some(ref mut rx) = self.models_receiver {
            if let Ok(models) = rx.try_recv() {
                self.available_models = models;
                self.models_receiver = None;

                if self.available_models.len() == 1
                    && (self.available_models[0].contains("No models found")
                        || self.available_models[0].contains("Error:"))
                {
                    // Error or no models
                    self.status_message = String::from("Press Esc to go back");
                } else {
                    self.status_message = String::from("Select a model (↑/↓ to navigate, Enter to select, Esc to cancel, 'm' to refresh)");
                    self.model_list_state.select(Some(0));
                }
            }
        }
    }

    fn select_next_model(&mut self) {
        if self.available_models.is_empty() {
            return;
        }
        let current = self.model_list_state.selected().unwrap_or(0);
        let next = (current + 1) % self.available_models.len();
        self.model_list_state.select(Some(next));
    }

    fn select_previous_model(&mut self) {
        if self.available_models.is_empty() {
            return;
        }
        let current = self.model_list_state.selected().unwrap_or(0);
        let previous = if current == 0 {
            self.available_models.len() - 1
        } else {
            current - 1
        };
        self.model_list_state.select(Some(previous));
    }

    fn confirm_model_selection(&mut self) -> Result<()> {
        if let Some(selected_idx) = self.model_list_state.selected() {
            if let Some(model) = self.available_models.get(selected_idx) {
                // Don't select if it's an error message
                if !model.contains("No models found") && !model.contains("Error:") {
                    self.config.set_model(model.clone())?;
                    self.status_message = format!("Model '{}' selected and saved!", model);
                }
            }
        }
        Ok(())
    }

    fn detect_editors(&mut self) {
        self.available_editors = editor::detect_editors();
        if !self.available_editors.is_empty() {
            self.editor_list_state.select(Some(0));
        }
        self.display_mode = DisplayMode::EditorSelection;
        self.set_status(String::from("↑/↓ - navigate, Enter - select, Esc - cancel"));
    }

    fn select_next_editor(&mut self) {
        if self.available_editors.is_empty() {
            return;
        }
        let current = self.editor_list_state.selected().unwrap_or(0);
        let next = (current + 1) % self.available_editors.len();
        self.editor_list_state.select(Some(next));
    }

    fn select_previous_editor(&mut self) {
        if self.available_editors.is_empty() {
            return;
        }
        let current = self.editor_list_state.selected().unwrap_or(0);
        let previous = if current == 0 {
            self.available_editors.len() - 1
        } else {
            current - 1
        };
        self.editor_list_state.select(Some(previous));
    }

    fn confirm_editor_selection(&mut self) -> Result<()> {
        if let Some(selected_idx) = self.editor_list_state.selected() {
            if let Some(editor) = self.available_editors.get(selected_idx) {
                self.config
                    .set_editor(editor.executable.clone(), editor.args.clone())?;
                self.set_temp_status(format!("Editor '{}' selected and saved!", editor.name));
                self.display_mode = DisplayMode::Readme;
            }
        }
        Ok(())
    }

    fn open_exercise_in_editor(&mut self) {
        if let Some(exercise) = self.get_selected_exercise() {
            if let Some((editor_path, editor_args)) = self.config.get_editor() {
                match editor::open_directory_in_editor(editor_path, editor_args, &exercise.path) {
                    Ok(_) => {
                        self.set_temp_status(format!(
                            "Opening '{}' in editor...",
                            exercise.metadata.title.as_deref().unwrap_or(&exercise.id)
                        ));
                    }
                    Err(e) => {
                        self.set_temp_status(format!(
                            "Failed to open editor: {}. Check that '{}' is in your PATH.",
                            e, editor_path
                        ));
                    }
                }
            } else {
                // No editor configured, show editor selection dialog
                self.detect_editors();
                if self.available_editors.is_empty() {
                    self.set_temp_status(String::from(
                        "No editors found. Install VSCode, Vim, or set manually in config.json",
                    ));
                    self.display_mode = DisplayMode::Readme;
                }
            }
        }
    }

    async fn check_model_and_generate_hint(&mut self) -> Result<()> {
        // Check if model is configured
        if let Some(model) = self.config.get_model() {
            // Check if the configured model is still available
            self.display_mode = DisplayMode::ModelSelection;
            self.status_message = String::from("Checking if configured model is available...");
            self.available_models = vec![String::from("Checking...")];

            let model_clone = model.to_string();
            let (check_tx, mut check_rx) = mpsc::channel(1);

            tokio::spawn(async move {
                use ollama_rs::Ollama;
                let ollama = Ollama::default();
                match ollama.list_local_models().await {
                    Ok(models) => {
                        let model_exists = models.iter().any(|m| m.name == model_clone);
                        let _ = check_tx.send(model_exists).await;
                    }
                    Err(_) => {
                        let _ = check_tx.send(false).await;
                    }
                }
            });

            // Wait for check result
            if let Some(exists) = check_rx.recv().await {
                if exists {
                    // Model exists, generate hint
                    self.generate_hint_with_model(model.to_string()).await?;
                } else {
                    // Model doesn't exist, show model selection
                    self.fetch_available_models().await;
                }
            } else {
                self.fetch_available_models().await;
            }
        } else {
            // No model configured, show model selection
            self.fetch_available_models().await;
        }
        Ok(())
    }

    async fn generate_hint_with_model(&mut self, model: String) -> Result<()> {
        if let Some(exercise) = self.get_selected_exercise() {
            let exercise_title = exercise.title.clone();
            let exercise_description = exercise.description.clone();
            let test_output = self.test_output_lines.join("\n");

            // Collect all context files (auto-discover or from metadata)
            let context_files = exercise
                .collect_context_files()
                .unwrap_or_else(|_| Vec::new());

            // Build context section with all files
            let mut context_section = String::new();
            if context_files.is_empty() {
                // Fallback to just the exercise file if collection failed
                let exercise_code = std::fs::read_to_string(exercise.path.join("exercise.js"))
                    .unwrap_or_else(|_| String::from("Could not read exercise file"));
                context_section.push_str("Current code:\n```javascript\n");
                context_section.push_str(&exercise_code);
                context_section.push_str("\n```\n");
            } else if context_files.len() == 1 {
                // Single file - simple format
                context_section.push_str("Current code:\n```javascript\n");
                context_section.push_str(&context_files[0].1);
                context_section.push_str("\n```\n");
            } else {
                // Multiple files - show each with filename
                context_section.push_str("Current code files:\n\n");
                for (path, content) in &context_files {
                    let filename = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown");
                    context_section.push_str(&format!(
                        "File: {}\n```javascript\n{}\n```\n\n",
                        filename, content
                    ));
                }
            }

            self.is_generating_hint = true;
            self.display_mode = DisplayMode::Hint;
            self.hint_text = Some(String::new());
            self.scroll_position = 0;
            self.status_message = format!("Generating hint with {}... | ↑/↓ PgUp/PgDn Home/End - scroll, m - change model, Esc - back", model);

            let (hint_tx, hint_rx) = mpsc::channel(100);
            let (complete_tx, complete_rx) = mpsc::channel(1);
            self.hint_receiver = Some(hint_rx);
            self.hint_complete_receiver = Some(complete_rx);

            tokio::spawn(async move {
                use ollama_rs::generation::completion::request::GenerationRequest;
                use ollama_rs::Ollama;

                let prompt = format!(
                    r#"You are a helpful programming tutor. A student is working on the following exercise:

Exercise: {}
Description: {}

{}

Test output showing failures:
```
{}
```

Provide a helpful hint (not the full solution) to guide them toward fixing the issue. Be encouraging and educational.

Hint:"#,
                    exercise_title, exercise_description, context_section, test_output
                );

                let ollama = Ollama::default();
                let request = GenerationRequest::new(model.clone(), prompt);

                // Use the generate method and send response in chunks (simulating streaming)
                match ollama.generate(request).await {
                    Ok(response) => {
                        // Simulate streaming by sending character chunks to preserve formatting
                        let chars: Vec<char> = response.response.chars().collect();
                        let chunk_size = 3; // Send 3 characters at a time (simulates token streaming)

                        for chunk in chars.chunks(chunk_size) {
                            let chunk_str: String = chunk.iter().collect();
                            if (hint_tx.send(chunk_str).await).is_err() {
                                break;
                            }
                            // Small delay to simulate streaming (adjust for smoother/faster streaming)
                            tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;
                        }
                        // Signal completion
                        let _ = complete_tx.send(()).await;
                    }
                    Err(e) => {
                        let error_msg = format!("Failed to generate hint: {}. Make sure Ollama is running and the '{}' model is available.", e, model);
                        let _ = hint_tx.send(error_msg).await;
                        let _ = complete_tx.send(()).await;
                    }
                }
            });
        }
        Ok(())
    }

    fn scroll_to_top(&mut self) {
        self.scroll_position = 0;
    }

    fn scroll_to_bottom(&mut self) {
        let max_scroll = match self.display_mode {
            DisplayMode::Hint => {
                self.hint_text
                    .as_ref()
                    .map(|h| h.lines().count() + 4) // +4 for header lines
                    .unwrap_or(0)
                    .saturating_sub(1)
            }
            DisplayMode::ReadmeFocused => {
                // Calculate README line count
                if let Some(exercise) = self.get_selected_exercise() {
                    if exercise.readme_file.exists() {
                        if let Ok(readme) = std::fs::read_to_string(&exercise.readme_file) {
                            readme.lines().count().saturating_sub(1)
                        } else {
                            0
                        }
                    } else {
                        0
                    }
                } else {
                    0
                }
            }
            _ => self.test_output_lines.len().saturating_sub(1),
        };
        self.scroll_position = max_scroll;
    }

    fn apply_scroll_delta(&mut self, delta: i32) {
        let max_scroll = match self.display_mode {
            DisplayMode::Hint => {
                self.hint_text
                    .as_ref()
                    .map(|h| h.lines().count() + 4) // +4 for header lines
                    .unwrap_or(0)
                    .saturating_sub(1)
            }
            DisplayMode::RunAllTests => self.run_all_output.len().saturating_sub(1),
            DisplayMode::ReadmeFocused => {
                // Calculate README line count
                if let Some(exercise) = self.get_selected_exercise() {
                    if exercise.readme_file.exists() {
                        if let Ok(readme) = std::fs::read_to_string(&exercise.readme_file) {
                            readme.lines().count().saturating_sub(1)
                        } else {
                            0
                        }
                    } else {
                        0
                    }
                } else {
                    0
                }
            }
            _ => self.test_output_lines.len().saturating_sub(1),
        };

        if delta > 0 {
            // Scrolling down
            self.scroll_position = self
                .scroll_position
                .saturating_add(delta as usize)
                .min(max_scroll);
        } else if delta < 0 {
            // Scrolling up
            self.scroll_position = self.scroll_position.saturating_sub((-delta) as usize);
        }
    }

    async fn run_all_tests(&mut self) -> Result<()> {
        self.is_running_all_tests = true;
        self.display_mode = DisplayMode::RunAllTests;
        self.scroll_position = 0;

        // Initialize progress tracking for all exercises (excluding folders)
        let exercises_only: Vec<Exercise> = self.all_exercises.iter().filter(|ex| !ex.is_folder).cloned().collect();
        self.run_all_progress = exercises_only
            .iter()
            .map(|ex| (ex.id.clone(), None))
            .collect();
        self.run_all_current_index = 0;
        self.run_all_output = vec![String::from("Starting all tests..."), String::new()];

        self.status_message = String::from("Running all tests... | Esc - cancel");

        // Create channels for progress updates and cancellation
        let (progress_tx, progress_rx) = mpsc::channel(10);
        let (cancel_tx, mut cancel_rx) = mpsc::channel::<()>(1);

        self.run_all_receiver = Some(progress_rx);
        self.run_all_cancel_tx = Some(cancel_tx);

        // Clone data needed for the background task
        let test_runner = self.test_runner.clone();
        let db = self.database.clone();

        // Spawn background task to run all tests sequentially
        tokio::spawn(async move {
            for (index, exercise) in exercises_only.iter().enumerate() {
                // Check for cancellation
                if cancel_rx.try_recv().is_ok() {
                    break;
                }

                let exercise_id = exercise.id.clone();
                let exercise_clone = exercise.clone();

                // Create a channel for this individual test's output
                let (output_tx, mut output_rx) = mpsc::channel(100);

                // Spawn a task to drain the output channel so it doesn't block
                let drain_handle = tokio::spawn(async move {
                    while output_rx.recv().await.is_some() {
                        // Just drain the output, we don't need to display it
                    }
                });

                // Run the test
                let result = match test_runner
                    .run_test_streaming(&exercise_clone, output_tx)
                    .await
                {
                    Ok(result) => {
                        // Update database based on result
                        match &result {
                            TestResult::Passed => {
                                let _ = db.mark_completed(&exercise_id);
                            }
                            TestResult::Failed => {
                                let _ = db.mark_attempted(&exercise_id);
                            }
                            _ => {}
                        }
                        result
                    }
                    Err(_) => TestResult::Error("Failed to run test".to_string()),
                };

                // Wait for drain task to finish
                let _ = drain_handle.await;

                // Send progress update
                if progress_tx.send((index, result)).await.is_err() {
                    break;
                }
            }
        });

        Ok(())
    }

    fn check_run_all_progress(&mut self) {
        let mut should_complete = false;

        if let Some(ref mut rx) = self.run_all_receiver {
            // Check for progress updates
            while let Ok((index, result)) = rx.try_recv() {
                if index < self.run_all_progress.len() {
                    self.run_all_progress[index].1 = Some(result.clone());
                    self.run_all_current_index = index + 1;

                    // Add to output
                    let exercise_id = &self.run_all_progress[index].0;
                    let exercise = self.all_exercises.iter().find(|e| &e.id == exercise_id);
                    let title = exercise.map(|e| e.title.as_str()).unwrap_or(exercise_id);

                    let status_line = match result {
                        TestResult::Passed => format!("✓ {} - PASSED", title),
                        TestResult::Failed => format!("✗ {} - FAILED", title),
                        TestResult::Error(ref err) => format!("✗ {} - ERROR: {}", title, err),
                    };
                    self.run_all_output.push(status_line);
                }

                // Check if all tests completed
                if self.run_all_current_index >= self.run_all_progress.len() {
                    should_complete = true;
                }
            }
        }

        // Complete outside of the borrow
        if should_complete {
            self.is_running_all_tests = false;
            self.run_all_receiver = None;
            self.run_all_cancel_tx = None;

            // Calculate summary
            let total = self.run_all_progress.len();
            let passed = self
                .run_all_progress
                .iter()
                .filter(|(_, r)| matches!(r, Some(TestResult::Passed)))
                .count();
            let failed = self
                .run_all_progress
                .iter()
                .filter(|(_, r)| matches!(r, Some(TestResult::Failed)))
                .count();
            let errors = self
                .run_all_progress
                .iter()
                .filter(|(_, r)| matches!(r, Some(TestResult::Error(_))))
                .count();

            self.run_all_output.push(String::new());
            self.run_all_output.push("─".repeat(50));
            self.run_all_output.push(String::new());
            self.run_all_output.push(format!(
                "Total: {} | Passed: {} | Failed: {} | Errors: {}",
                total, passed, failed, errors
            ));

            if passed == total {
                self.status_message = String::from("✓ All tests passed! | Esc - back");
            } else {
                self.status_message = String::from("Some tests failed. | Esc - back");
            }
        }
    }

    fn cancel_run_all_tests(&mut self) {
        if let Some(cancel_tx) = self.run_all_cancel_tx.take() {
            let _ = cancel_tx.try_send(());
        }
        self.is_running_all_tests = false;
        self.run_all_receiver = None;
        self.show_readme();
    }
}

pub async fn run_app(course_path: PathBuf, unblock_all: bool) -> Result<()> {
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::new(course_path, unblock_all)?;
    let res = run_app_loop(&mut terminal, &mut app).await;

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    res
}

async fn run_app_loop<B: Backend>(terminal: &mut Terminal<B>, app: &mut App) -> Result<()> {
    loop {
        // Check for test output
        app.check_test_output();

        // Check if temporary status message should be cleared
        app.check_status_timeout();

        // Draw UI and capture list viewport height for smart scrolling
        let mut list_height = 20; // Default
        terminal.draw(|f| {
            list_height = ui(f, app);
        })?;
        app.list_viewport_height = list_height;

        // Poll for events with timeout
        if event::poll(std::time::Duration::from_millis(50))? {
            // Batch process all available events to prevent scroll artifacts
            let mut scroll_delta: i32 = 0;
            let mut should_quit = false;

            // Read all available events
            while event::poll(std::time::Duration::from_millis(0))? {
                match event::read()? {
                    Event::Mouse(mouse) => {
                        // Handle mouse scroll events
                        if matches!(
                            app.display_mode,
                            DisplayMode::TestOutput
                                | DisplayMode::Hint
                                | DisplayMode::RunAllTests
                                | DisplayMode::ReadmeFocused
                        ) {
                            match mouse.kind {
                                MouseEventKind::ScrollDown => {
                                    scroll_delta += 3; // Scroll 3 lines at a time for smoother feel
                                }
                                MouseEventKind::ScrollUp => {
                                    scroll_delta -= 3;
                                }
                                _ => {}
                            }
                        }
                    }
                    Event::Key(key) if key.kind == KeyEventKind::Press => {
                        match key.code {
                            KeyCode::Char('q') => {
                                should_quit = true;
                                break;
                            }
                            KeyCode::Down if matches!(app.display_mode, DisplayMode::Readme) => {
                                app.select_next();
                            }
                            KeyCode::Up if matches!(app.display_mode, DisplayMode::Readme) => {
                                app.select_previous();
                            }
                            KeyCode::Char('j')
                                if matches!(app.display_mode, DisplayMode::Readme) =>
                            {
                                app.select_next();
                            }
                            KeyCode::Char('k')
                                if matches!(app.display_mode, DisplayMode::Readme) =>
                            {
                                app.select_previous();
                            }
                            // Folder navigation - enter folder
                            KeyCode::Right if matches!(app.display_mode, DisplayMode::Readme) => {
                                app.enter_folder();
                            }
                            KeyCode::Char('l')
                                if matches!(app.display_mode, DisplayMode::Readme) =>
                            {
                                app.enter_folder();
                            }
                            // Folder navigation - go back
                            KeyCode::Left if matches!(app.display_mode, DisplayMode::Readme) => {
                                app.go_back_folder();
                            }
                            KeyCode::Char('h')
                                if matches!(app.display_mode, DisplayMode::Readme) =>
                            {
                                app.go_back_folder();
                            }
                            KeyCode::Backspace if matches!(app.display_mode, DisplayMode::Readme) => {
                                app.go_back_folder();
                            }
                            // Model selection navigation
                            KeyCode::Down
                                if matches!(app.display_mode, DisplayMode::ModelSelection) =>
                            {
                                app.select_next_model();
                            }
                            KeyCode::Up
                                if matches!(app.display_mode, DisplayMode::ModelSelection) =>
                            {
                                app.select_previous_model();
                            }
                            // Editor selection navigation
                            KeyCode::Down
                                if matches!(app.display_mode, DisplayMode::EditorSelection) =>
                            {
                                app.select_next_editor();
                            }
                            KeyCode::Up
                                if matches!(app.display_mode, DisplayMode::EditorSelection) =>
                            {
                                app.select_previous_editor();
                            }
                            // Batch scrolling in test output, hint, and run-all modes
                            KeyCode::Down
                                if matches!(
                                    app.display_mode,
                                    DisplayMode::TestOutput
                                        | DisplayMode::Hint
                                        | DisplayMode::RunAllTests
                                        | DisplayMode::ReadmeFocused
                                ) =>
                            {
                                scroll_delta += 1;
                            }
                            KeyCode::Up
                                if matches!(
                                    app.display_mode,
                                    DisplayMode::TestOutput
                                        | DisplayMode::Hint
                                        | DisplayMode::RunAllTests
                                        | DisplayMode::ReadmeFocused
                                ) =>
                            {
                                scroll_delta -= 1;
                            }
                            KeyCode::PageDown => {
                                scroll_delta += 10;
                            }
                            KeyCode::PageUp => {
                                scroll_delta -= 10;
                            }
                            // Vim-style scrolling (j/k for down/up in test/hint/run-all modes)
                            KeyCode::Char('j')
                                if matches!(
                                    app.display_mode,
                                    DisplayMode::TestOutput
                                        | DisplayMode::Hint
                                        | DisplayMode::RunAllTests
                                        | DisplayMode::ReadmeFocused
                                ) =>
                            {
                                scroll_delta += 1;
                            }
                            KeyCode::Char('k')
                                if matches!(
                                    app.display_mode,
                                    DisplayMode::TestOutput
                                        | DisplayMode::Hint
                                        | DisplayMode::RunAllTests
                                        | DisplayMode::ReadmeFocused
                                ) =>
                            {
                                scroll_delta -= 1;
                            }
                            // Vim-style page scrolling (Ctrl+d/u for page down/up)
                            KeyCode::Char('d') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                                scroll_delta += 10;
                            }
                            KeyCode::Char('u') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                                scroll_delta -= 10;
                            }
                            // Vim-style top/bottom (g/G for top/bottom)
                            KeyCode::Char('g')
                                if matches!(
                                    app.display_mode,
                                    DisplayMode::TestOutput
                                        | DisplayMode::Hint
                                        | DisplayMode::RunAllTests
                                        | DisplayMode::ReadmeFocused
                                ) =>
                            {
                                app.scroll_to_top();
                                scroll_delta = 0;
                            }
                            KeyCode::Char('G')
                                if matches!(
                                    app.display_mode,
                                    DisplayMode::TestOutput
                                        | DisplayMode::Hint
                                        | DisplayMode::RunAllTests
                                        | DisplayMode::ReadmeFocused
                                ) =>
                            {
                                app.scroll_to_bottom();
                                scroll_delta = 0;
                            }
                            KeyCode::Home => {
                                app.scroll_to_top();
                                scroll_delta = 0;
                            }
                            KeyCode::End => {
                                app.scroll_to_bottom();
                                scroll_delta = 0;
                            }
                            KeyCode::Esc => {
                                if matches!(app.display_mode, DisplayMode::RunAllTests) {
                                    // Cancel run-all or go back to readme if finished
                                    if app.is_running_all_tests {
                                        app.cancel_run_all_tests();
                                    } else {
                                        app.show_readme();
                                    }
                                    scroll_delta = 0;
                                } else if matches!(
                                    app.display_mode,
                                    DisplayMode::Hint
                                        | DisplayMode::ModelSelection
                                        | DisplayMode::PlaygroundConfirm
                                ) {
                                    app.show_test_output();
                                    scroll_delta = 0;
                                } else if matches!(
                                    app.display_mode,
                                    DisplayMode::EditorSelection
                                        | DisplayMode::TestOutput
                                        | DisplayMode::ReadmeFocused
                                ) {
                                    app.show_readme();
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('A') if key.modifiers.contains(KeyModifiers::SHIFT) => {
                                // Shift+A: Run all tests (only from Readme mode)
                                if matches!(app.display_mode, DisplayMode::Readme)
                                    && !app.is_running_all_tests
                                {
                                    app.run_all_tests().await?;
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Enter => {
                                if matches!(app.display_mode, DisplayMode::ModelSelection) {
                                    // Confirm model selection and generate hint
                                    app.confirm_model_selection()?;
                                    if let Some(model) = app.config.get_model() {
                                        app.generate_hint_with_model(model.to_string()).await?;
                                    }
                                    scroll_delta = 0;
                                } else if matches!(app.display_mode, DisplayMode::EditorSelection) {
                                    // Confirm editor selection and open exercise
                                    if let Err(e) = app.confirm_editor_selection() {
                                        app.set_temp_status(format!(
                                            "Failed to save editor config: {}",
                                            e
                                        ));
                                        app.display_mode = DisplayMode::Readme;
                                    } else if app.display_mode == DisplayMode::Readme {
                                        // If we just selected an editor, now open the exercise
                                        app.open_exercise_in_editor();
                                    }
                                    scroll_delta = 0;
                                } else if matches!(app.display_mode, DisplayMode::Readme) {
                                    // In Readme mode, Enter either enters a folder or runs a test
                                    if let Some(exercise) = app.get_selected_exercise() {
                                        if exercise.is_folder {
                                            app.enter_folder();
                                        } else if !app.is_running_test {
                                            app.run_current_test().await?;
                                        }
                                    }
                                    scroll_delta = 0;
                                } else if !app.is_running_test {
                                    app.run_current_test().await?;
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('r') => {
                                // Switch to focused README mode with scrolling
                                if matches!(app.display_mode, DisplayMode::Readme) {
                                    app.display_mode = DisplayMode::ReadmeFocused;
                                    app.scroll_position = 0;
                                    app.status_message = String::from("Reading README | ↑/↓ PgUp/PgDn Home/End - scroll, Esc - back");
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('h') => {
                                // Generate hint if tests have failed
                                if matches!(app.display_mode, DisplayMode::TestOutput)
                                    && matches!(app.last_test_result, Some(TestResult::Failed))
                                    && !app.is_generating_hint
                                {
                                    app.check_model_and_generate_hint().await?;
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('p') => {
                                // Extract to playground if tests passed
                                if matches!(app.display_mode, DisplayMode::TestOutput)
                                    && matches!(app.last_test_result, Some(TestResult::Passed))
                                {
                                    if let Some(exercise) = app.get_selected_exercise() {
                                        // Check if playground already exists
                                        if playground::playground_exists(exercise) {
                                            app.display_mode = DisplayMode::PlaygroundConfirm;
                                            app.status_message = String::from(
                                                "Playground exists. Overwrite? y - yes, n - cancel",
                                            );
                                        } else {
                                            // Extract directly
                                            app.extract_to_playground()?;
                                        }
                                    }
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('y') => {
                                // Confirm playground overwrite
                                if matches!(app.display_mode, DisplayMode::PlaygroundConfirm) {
                                    app.extract_to_playground()?;
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('n') => {
                                // Cancel playground overwrite
                                if matches!(app.display_mode, DisplayMode::PlaygroundConfirm) {
                                    app.show_test_output();
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('o') => {
                                // Open exercise in editor (only from Readme mode)
                                if matches!(app.display_mode, DisplayMode::Readme) {
                                    app.open_exercise_in_editor();
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('m') => {
                                // Manual model selection from hint or test output mode
                                if matches!(
                                    app.display_mode,
                                    DisplayMode::Hint | DisplayMode::TestOutput
                                ) {
                                    app.fetch_available_models().await;
                                    scroll_delta = 0;
                                } else if matches!(app.display_mode, DisplayMode::ModelSelection) {
                                    // Refresh model list
                                    app.fetch_available_models().await;
                                    scroll_delta = 0;
                                }
                            }
                            _ => {}
                        }
                    }
                    _ => {} // Ignore other events
                }
            }

            if should_quit {
                return Ok(());
            }

            // Apply batched scroll changes once
            if scroll_delta != 0
                && matches!(
                    app.display_mode,
                    DisplayMode::TestOutput
                        | DisplayMode::Hint
                        | DisplayMode::RunAllTests
                        | DisplayMode::ReadmeFocused
                )
            {
                app.apply_scroll_delta(scroll_delta);
            }
        }
    }
}

fn ui(f: &mut Frame, app: &App) -> usize {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),
            Constraint::Min(0),
            Constraint::Length(3),
            Constraint::Length(3),
        ])
        .split(f.area());

    // Title with breadcrumb
    let title_text = if app.breadcrumb.is_empty() {
        app.course.name.clone()
    } else {
        format!("{} > {}", app.course.name, app.breadcrumb.join(" > "))
    };
    let title = Paragraph::new(title_text)
        .style(
            Style::default()
                .fg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
        .alignment(Alignment::Center)
        .block(Block::default().borders(Borders::ALL));
    f.render_widget(title, chunks[0]);

    // Main content area
    let main_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(40), Constraint::Percentage(60)])
        .split(chunks[1]);

    // Exercise list (returns the viewport height for smart scrolling)
    let list_height = render_exercise_list(f, app, main_chunks[0]);

    // Exercise details
    render_exercise_details(f, app, main_chunks[1]);

    // Description bar
    let description_text = if let Some(exercise) = app.get_selected_exercise() {
        exercise.description.clone()
    } else {
        String::new()
    };
    let description = Paragraph::new(description_text)
        .style(Style::default().fg(Color::White))
        .block(Block::default().borders(Borders::ALL).title("Description"));
    f.render_widget(description, chunks[2]);

    // Status bar
    let status = Paragraph::new(app.status_message.clone())
        .style(Style::default().fg(Color::Yellow))
        .block(Block::default().borders(Borders::ALL).title("Status"));
    f.render_widget(status, chunks[3]);

    // Return the list viewport height for smart scrolling
    list_height
}

fn render_exercise_list(f: &mut Frame, app: &App, area: Rect) -> usize {
    let progress_map: std::collections::HashMap<String, bool> = app
        .database
        .get_all_progress()
        .unwrap_or_default()
        .into_iter()
        .map(|p| (p.exercise_id, p.completed))
        .collect();

    let items: Vec<ListItem> = app
        .current_exercises
        .iter()
        .enumerate()
        .map(|(index, exercise)| {
            let is_completed = progress_map.get(&exercise.id).copied().unwrap_or(false);

            let is_running = app.running_exercise_id.as_ref() == Some(&exercise.id);
            let is_locked = !app.is_exercise_unlocked(index);

            // Determine icon based on type
            let (content, style) = if exercise.is_folder {
                // Get folder progress
                let (completed_count, total_count) = app.get_folder_progress(exercise);
                let all_completed = total_count > 0 && completed_count == total_count;

                // Folder icon with progress
                let icon = if all_completed { "✓" } else { "📁" };
                let progress_text = if total_count > 0 {
                    format!(" {}/{}", completed_count, total_count)
                } else {
                    String::new()
                };

                let content = format!("{} {}{}", icon, exercise.title, progress_text);

                // Determine style based on completion
                let style = if all_completed {
                    Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)
                } else {
                    Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)
                };

                (content, style)
            } else {
                // Status icon: checkmark if completed, blinking dot if running, space otherwise
                let status_icon = if is_completed {
                    "✓"
                } else if is_running {
                    if app.blink_toggle {
                        "●"
                    } else {
                        " "
                    }
                } else {
                    " "
                };
                let content = format!("{} {} - {}", status_icon, exercise.order, exercise.title);

                // Determine style based on state
                let style = if is_locked {
                    // Locked exercises are dimmed
                    Style::default().fg(Color::Rgb(128, 128, 128))
                } else if is_completed {
                    Style::default().fg(Color::Green)
                } else if is_running {
                    Style::default().fg(Color::Yellow)
                } else {
                    Style::default().fg(Color::White)
                };

                (content, style)
            };

            ListItem::new(content).style(style)
        })
        .collect();

    let list = List::new(items)
        .block(Block::default().borders(Borders::ALL).title("Exercises"))
        .highlight_style(
            Style::default()
                .bg(Color::DarkGray)
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol(">> ");

    let mut state = app.list_state.clone();
    f.render_stateful_widget(list, area, &mut state);

    // Return viewport height for smart scrolling
    // Subtract 2 for borders, 1 for title
    area.height.saturating_sub(3) as usize
}

fn render_exercise_details(f: &mut Frame, app: &App, area: Rect) {
    let (content, title, border_color) = match app.display_mode {
        DisplayMode::Readme => {
            if let Some(exercise) = app.get_selected_exercise() {
                let mut lines = vec![];

                // Show README content if available
                if exercise.readme_file.exists() {
                    if let Ok(readme) = std::fs::read_to_string(&exercise.readme_file) {
                        for line in readme.lines() {
                            lines.push(Line::from(line.to_string()));
                        }
                    }
                }

                (Text::from(lines), "README", Color::White)
            } else {
                (Text::from("No exercise selected"), "README", Color::White)
            }
        }
        DisplayMode::ReadmeFocused => {
            if let Some(exercise) = app.get_selected_exercise() {
                let mut all_lines = vec![];

                // Show README content if available
                if exercise.readme_file.exists() {
                    if let Ok(readme) = std::fs::read_to_string(&exercise.readme_file) {
                        for line in readme.lines() {
                            all_lines.push(Line::from(line.to_string()));
                        }
                    }
                }

                // Apply scrolling
                let visible_lines: Vec<Line> =
                    all_lines.into_iter().skip(app.scroll_position).collect();

                (Text::from(visible_lines), "README", Color::Green)
            } else {
                (Text::from("No exercise selected"), "README", Color::Green)
            }
        }
        DisplayMode::TestOutput => {
            let mut all_lines = Vec::new();

            // Show test result header
            if let Some(result) = &app.last_test_result {
                match result {
                    TestResult::Passed => {
                        all_lines.push(Line::from(Span::styled(
                            "✓ ALL TESTS PASSED!",
                            Style::default()
                                .fg(Color::Green)
                                .add_modifier(Modifier::BOLD),
                        )));
                    }
                    TestResult::Failed => {
                        all_lines.push(Line::from(Span::styled(
                            "✗ TESTS FAILED",
                            Style::default().fg(Color::Red).add_modifier(Modifier::BOLD),
                        )));
                    }
                    TestResult::Error(_) => {
                        all_lines.push(Line::from(Span::styled(
                            "ERROR",
                            Style::default().fg(Color::Red).add_modifier(Modifier::BOLD),
                        )));
                    }
                }
                all_lines.push(Line::from(""));
                all_lines.push(Line::from(Span::styled(
                    "─".repeat(50),
                    Style::default().fg(Color::DarkGray),
                )));
                all_lines.push(Line::from(""));
            }

            // Show test output - parse ANSI codes to prevent rendering artifacts
            for line in &app.test_output_lines {
                // Parse ANSI escape sequences into ratatui Text, then extract lines
                match line.as_str().into_text() {
                    Ok(parsed_text) => {
                        // Add each parsed line to all_lines
                        for parsed_line in parsed_text.lines {
                            all_lines.push(parsed_line);
                        }
                    }
                    Err(_) => {
                        // Fallback to plain text if parsing fails
                        all_lines.push(Line::from(line.as_str()));
                    }
                }
            }

            // Apply manual scrolling by slicing the lines
            let visible_lines: Vec<Line> =
                all_lines.into_iter().skip(app.scroll_position).collect();

            (Text::from(visible_lines), "Test Output", Color::White)
        }
        DisplayMode::Hint => {
            // Show hint header
            let mut all_lines = vec![
                Line::from(Span::styled(
                    "💡 AI HINT",
                    Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                )),
                Line::from(""),
                Line::from(Span::styled(
                    "─".repeat(50),
                    Style::default().fg(Color::DarkGray),
                )),
                Line::from(""),
            ];

            // Show hint text or loading indicator
            if let Some(hint) = &app.hint_text {
                if hint.is_empty() {
                    // Show animated loader while waiting for first token
                    let spinner_frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
                    let spinner =
                        spinner_frames[(app.blink_counter as usize) % spinner_frames.len()];
                    all_lines.push(Line::from(vec![
                        Span::styled(
                            spinner,
                            Style::default()
                                .fg(Color::Cyan)
                                .add_modifier(Modifier::BOLD),
                        ),
                        Span::raw("  Waiting for response..."),
                    ]));
                } else {
                    // Show actual hint content as it streams in
                    for line in hint.lines() {
                        all_lines.push(Line::from(line.to_string()));
                    }
                }
            } else {
                all_lines.push(Line::from("Generating hint..."));
            }

            // Apply manual scrolling by slicing the lines
            let visible_lines: Vec<Line> =
                all_lines.into_iter().skip(app.scroll_position).collect();

            (Text::from(visible_lines), "Hint", Color::White)
        }
        DisplayMode::ModelSelection => {
            // Use List widget for model selection
            let items: Vec<ListItem> = app
                .available_models
                .iter()
                .map(|model| {
                    let is_current = app.config.get_model() == Some(model);
                    let content = if is_current {
                        format!("✓ {} (current)", model)
                    } else {
                        model.clone()
                    };

                    let style = if model.contains("Error:") || model.contains("No models") {
                        Style::default().fg(Color::Red)
                    } else if is_current {
                        Style::default().fg(Color::Green)
                    } else {
                        Style::default().fg(Color::White)
                    };

                    ListItem::new(content).style(style)
                })
                .collect();

            let list = List::new(items)
                .block(
                    Block::default()
                        .borders(Borders::ALL)
                        .title("Select Ollama Model"),
                )
                .highlight_style(
                    Style::default()
                        .bg(Color::DarkGray)
                        .add_modifier(Modifier::BOLD),
                )
                .highlight_symbol(">> ");

            let mut state = app.model_list_state.clone();
            f.render_stateful_widget(list, area, &mut state);
            return;
        }
        DisplayMode::EditorSelection => {
            // Use List widget for editor selection
            let items: Vec<ListItem> = if app.available_editors.is_empty() {
                vec![ListItem::new(
                    "No editors found. Install VSCode, Vim, or set manually in config.json",
                )
                .style(Style::default().fg(Color::Red))]
            } else {
                app.available_editors
                    .iter()
                    .map(|editor| {
                        let is_current = app
                            .config
                            .get_editor()
                            .map(|(path, _)| path == editor.executable)
                            .unwrap_or(false);
                        let content = if is_current {
                            format!("✓ {} (current)", editor.name)
                        } else {
                            editor.name.clone()
                        };

                        let style = if is_current {
                            Style::default().fg(Color::Green)
                        } else {
                            Style::default().fg(Color::White)
                        };

                        ListItem::new(content).style(style)
                    })
                    .collect()
            };

            let list = List::new(items)
                .block(
                    Block::default()
                        .borders(Borders::ALL)
                        .title("Select Code Editor"),
                )
                .highlight_style(
                    Style::default()
                        .bg(Color::DarkGray)
                        .add_modifier(Modifier::BOLD),
                )
                .highlight_symbol(">> ");

            let mut state = app.editor_list_state.clone();
            f.render_stateful_widget(list, area, &mut state);
            return;
        }
        DisplayMode::RunAllTests => {
            let mut all_lines = Vec::new();

            // Header
            all_lines.push(Line::from(Span::styled(
                "🚀 RUNNING ALL TESTS",
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            )));
            all_lines.push(Line::from(""));

            // Progress bar
            let total = app.run_all_progress.len();
            let completed = app.run_all_current_index;
            let percentage = if total > 0 {
                (completed * 100) / total
            } else {
                0
            };

            let bar_width = 40;
            let filled = (completed * bar_width) / total.max(1);
            let empty = bar_width - filled;

            let progress_bar = format!(
                "[{}{}] {}/{} ({}%)",
                "█".repeat(filled),
                "░".repeat(empty),
                completed,
                total,
                percentage
            );

            all_lines.push(Line::from(Span::styled(
                progress_bar,
                Style::default().fg(Color::Yellow),
            )));
            all_lines.push(Line::from(""));
            all_lines.push(Line::from(Span::styled(
                "─".repeat(50),
                Style::default().fg(Color::DarkGray),
            )));
            all_lines.push(Line::from(""));

            // Test results
            for line in &app.run_all_output {
                let styled_line = if line.starts_with("✓") {
                    Line::from(Span::styled(
                        line.as_str(),
                        Style::default().fg(Color::Green),
                    ))
                } else if line.starts_with("✗") {
                    Line::from(Span::styled(line.as_str(), Style::default().fg(Color::Red)))
                } else if line.starts_with("Total:") {
                    Line::from(Span::styled(
                        line.as_str(),
                        Style::default()
                            .fg(Color::Cyan)
                            .add_modifier(Modifier::BOLD),
                    ))
                } else {
                    Line::from(line.as_str())
                };
                all_lines.push(styled_line);
            }

            // Show currently running test
            if app.is_running_all_tests && completed < total {
                if let Some((exercise_id, _)) = app.run_all_progress.get(completed) {
                    if let Some(exercise) = app.all_exercises.iter().find(|e| &e.id == exercise_id) {
                        all_lines.push(Line::from(""));
                        let spinner_frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
                        let spinner =
                            spinner_frames[(app.blink_counter as usize) % spinner_frames.len()];
                        all_lines.push(Line::from(vec![
                            Span::styled(
                                spinner,
                                Style::default()
                                    .fg(Color::Yellow)
                                    .add_modifier(Modifier::BOLD),
                            ),
                            Span::raw(format!("  Running: {}", exercise.title)),
                        ]));
                    }
                }
            }

            // Apply scrolling
            let visible_lines: Vec<Line> =
                all_lines.into_iter().skip(app.scroll_position).collect();

            (Text::from(visible_lines), "Run All Tests", Color::White)
        }
        DisplayMode::PlaygroundConfirm => {
            // Show confirmation prompt
            let all_lines = vec![
                Line::from(Span::styled(
                    "⚠ Playground Already Exists",
                    Style::default()
                        .fg(Color::Yellow)
                        .add_modifier(Modifier::BOLD),
                )),
                Line::from(""),
                Line::from(Span::styled(
                    "─".repeat(50),
                    Style::default().fg(Color::DarkGray),
                )),
                Line::from(""),
                Line::from("A playground folder already exists for this exercise."),
                Line::from(""),
                Line::from("Do you want to overwrite it?"),
                Line::from("All existing files in the playground will be deleted."),
                Line::from(""),
                Line::from(""),
                Line::from(Span::styled(
                    "Press 'y' to overwrite, 'n' or 'Esc' to cancel",
                    Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                )),
            ];

            (Text::from(all_lines), "Confirm Overwrite", Color::Yellow)
        }
    };

    let paragraph = Paragraph::new(content)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .title(title)
                .border_style(Style::default().fg(border_color)),
        )
        .wrap(Wrap { trim: false });

    f.render_widget(paragraph, area);
}
