use crate::course::{Course, Exercise};
use crate::database::Database;
use crate::test_runner::{TestResult, TestRunner};
use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},
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

pub enum DisplayMode {
    Readme,
    TestOutput,
}

pub struct App {
    course: Course,
    exercises: Vec<Exercise>,
    database: Database,
    test_runner: TestRunner,
    selected_index: usize,
    list_state: ListState,
    display_mode: DisplayMode,
    last_test_result: Option<TestResult>,
    test_output_lines: Vec<String>,
    status_message: String,
    is_running_test: bool,
    scroll_position: usize,
    output_receiver: Option<mpsc::Receiver<String>>,
    result_receiver: Option<mpsc::Receiver<TestResult>>,
    running_exercise_id: Option<String>,
    blink_toggle: bool,
    blink_counter: u8,
}

impl App {
    pub fn new(course_path: PathBuf) -> Result<Self> {
        let (course, exercises) = Course::load_from_path(&course_path)?;
        let database = Database::new(&course.name)?;
        let test_runner = TestRunner::new(&course_path);

        // Find first incomplete exercise to select on startup
        let progress_map: std::collections::HashMap<String, bool> = database
            .get_all_progress()
            .unwrap_or_default()
            .into_iter()
            .map(|p| (p.exercise_id, p.completed))
            .collect();

        let mut initial_index = 0;
        for (index, exercise) in exercises.iter().enumerate() {
            let is_completed = progress_map
                .get(&exercise.metadata.id)
                .copied()
                .unwrap_or(false);

            if !is_completed {
                initial_index = index;
                break;
            }
        }

        let mut list_state = ListState::default();
        if !exercises.is_empty() {
            list_state.select(Some(initial_index));
        }

        Ok(Self {
            course,
            exercises,
            database,
            test_runner,
            selected_index: initial_index,
            list_state,
            display_mode: DisplayMode::Readme,
            last_test_result: None,
            test_output_lines: Vec::new(),
            status_message: String::from("Press Enter to run tests, 'r' to show README, 'q' to quit"),
            is_running_test: false,
            scroll_position: 0,
            output_receiver: None,
            result_receiver: None,
            running_exercise_id: None,
            blink_toggle: false,
            blink_counter: 0,
        })
    }

    fn get_first_incomplete_index(&self) -> Option<usize> {
        let progress_map: std::collections::HashMap<String, bool> = self
            .database
            .get_all_progress()
            .unwrap_or_default()
            .into_iter()
            .map(|p| (p.exercise_id, p.completed))
            .collect();

        for (index, exercise) in self.exercises.iter().enumerate() {
            let is_completed = progress_map
                .get(&exercise.metadata.id)
                .copied()
                .unwrap_or(false);

            if !is_completed {
                return Some(index);
            }
        }

        None
    }

    fn is_exercise_unlocked(&self, index: usize) -> bool {
        if let Some(first_incomplete) = self.get_first_incomplete_index() {
            // Allow navigation to completed exercises and the current (first incomplete) exercise
            index <= first_incomplete
        } else {
            // All exercises completed - allow navigation to all
            true
        }
    }

    fn select_next(&mut self) {
        if self.exercises.is_empty() {
            return;
        }

        let first_incomplete = self.get_first_incomplete_index();
        let max_index = first_incomplete.unwrap_or(self.exercises.len() - 1);

        // Find next unlocked exercise
        let mut next_index = self.selected_index + 1;
        while next_index <= max_index {
            if self.is_exercise_unlocked(next_index) {
                self.selected_index = next_index;
                self.list_state.select(Some(self.selected_index));

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
        if self.exercises.is_empty() {
            return;
        }

        // Find previous unlocked exercise
        if self.selected_index > 0 {
            let mut prev_index = self.selected_index - 1;
            loop {
                if self.is_exercise_unlocked(prev_index) {
                    self.selected_index = prev_index;
                    self.list_state.select(Some(self.selected_index));

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

    fn get_selected_exercise(&self) -> Option<&Exercise> {
        self.exercises.get(self.selected_index)
    }

    async fn run_current_test(&mut self) -> Result<()> {
        if let Some(exercise) = self.get_selected_exercise() {
            let exercise_id = exercise.metadata.id.clone();
            let title = exercise.metadata.title.clone();

            self.is_running_test = true;
            self.running_exercise_id = Some(exercise_id.clone());
            self.status_message = format!("Running tests for {}... (↑/↓ to scroll, Esc to exit)", title);
            self.display_mode = DisplayMode::TestOutput;
            self.test_output_lines = vec![
                String::from("Running tests..."),
                String::new(),
            ];
            self.scroll_position = 0;

            // Create channels for streaming output and result
            let (output_tx, output_rx) = mpsc::channel(100);
            let (result_tx, result_rx) = mpsc::channel(1);
            self.output_receiver = Some(output_rx);
            self.result_receiver = Some(result_rx);

            // Spawn test runner in background
            let test_runner = self.test_runner.clone();
            let exercise_id_clone = exercise_id.clone();
            let db = self.database.clone();

            tokio::spawn(async move {
                let result = match test_runner.run_test_streaming(&exercise_id_clone, output_tx).await {
                    Ok(result) => {
                        // Update database based on result
                        match &result {
                            TestResult::Passed => {
                                let _ = db.mark_completed(&exercise_id_clone);
                            }
                            TestResult::Failed => {
                                let _ = db.mark_attempted(&exercise_id_clone);
                            }
                            _ => {}
                        }
                        result
                    }
                    Err(_) => TestResult::Error("Failed to run test".to_string())
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
                if !line.is_empty() || self.test_output_lines.last().map_or(false, |l| !l.is_empty()) {
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
                    let title = &exercise.metadata.title;
                    match result {
                        TestResult::Passed => {
                            self.status_message = format!("✓ {} completed! Press 'r' or Esc to show README, Enter to run again", title);
                        }
                        TestResult::Failed => {
                            self.status_message = format!("✗ Tests failed for {}. Press 'r' or Esc to show README, Enter to run again", title);
                        }
                        TestResult::Error(err) => {
                            self.status_message = format!("Error: {}. Press 'r' or Esc to show README, Enter to try again", err);
                        }
                    }
                }
            }
        }
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
        self.status_message = String::from("Press Enter to run tests, 'r' to show README, 'q' to quit");
    }

    fn scroll_up(&mut self) {
        self.scroll_position = self.scroll_position.saturating_sub(1);
    }

    fn scroll_down(&mut self) {
        let max_scroll = self.test_output_lines.len().saturating_sub(1);
        self.scroll_position = self.scroll_position.saturating_add(1).min(max_scroll);
    }

    fn scroll_to_top(&mut self) {
        self.scroll_position = 0;
    }

    fn scroll_to_bottom(&mut self) {
        self.scroll_position = self.test_output_lines.len().saturating_sub(1);
    }

    fn page_up(&mut self) {
        self.scroll_position = self.scroll_position.saturating_sub(10);
    }

    fn page_down(&mut self) {
        let max_scroll = self.test_output_lines.len().saturating_sub(1);
        self.scroll_position = self.scroll_position.saturating_add(10).min(max_scroll);
    }

    fn apply_scroll_delta(&mut self, delta: i32) {
        let max_scroll = self.test_output_lines.len().saturating_sub(1);

        if delta > 0 {
            // Scrolling down
            self.scroll_position = self.scroll_position
                .saturating_add(delta as usize)
                .min(max_scroll);
        } else if delta < 0 {
            // Scrolling up
            self.scroll_position = self.scroll_position
                .saturating_sub((-delta) as usize);
        }
    }
}

pub async fn run_app(course_path: PathBuf) -> Result<()> {
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::new(course_path)?;
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

        terminal.draw(|f| ui::<B>(f, app))?;

        // Poll for events with timeout
        if event::poll(std::time::Duration::from_millis(50))? {
            // Batch process all available events to prevent scroll artifacts
            let mut scroll_delta: i32 = 0;
            let mut should_quit = false;

            // Read all available events
            while event::poll(std::time::Duration::from_millis(0))? {
                if let Event::Key(key) = event::read()? {
                    if key.kind == KeyEventKind::Press {
                        match key.code {
                            KeyCode::Char('q') => {
                                should_quit = true;
                                break;
                            }
                            KeyCode::Down if !matches!(app.display_mode, DisplayMode::TestOutput) => {
                                app.select_next();
                            }
                            KeyCode::Up if !matches!(app.display_mode, DisplayMode::TestOutput) => {
                                app.select_previous();
                            }
                            KeyCode::Char('j') if !matches!(app.display_mode, DisplayMode::TestOutput) => {
                                app.select_next();
                            }
                            KeyCode::Char('k') if !matches!(app.display_mode, DisplayMode::TestOutput) => {
                                app.select_previous();
                            }
                            // Batch scrolling in test output mode
                            KeyCode::Down if matches!(app.display_mode, DisplayMode::TestOutput) => {
                                scroll_delta += 1;
                            }
                            KeyCode::Up if matches!(app.display_mode, DisplayMode::TestOutput) => {
                                scroll_delta -= 1;
                            }
                            KeyCode::PageDown => {
                                scroll_delta += 10;
                            }
                            KeyCode::PageUp => {
                                scroll_delta -= 10;
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
                                if matches!(app.display_mode, DisplayMode::TestOutput) {
                                    app.show_readme();
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Enter => {
                                if !app.is_running_test {
                                    app.run_current_test().await?;
                                    scroll_delta = 0;
                                }
                            }
                            KeyCode::Char('r') => {
                                app.show_readme();
                                scroll_delta = 0;
                            }
                            _ => {}
                        }
                    }
                }
            }

            if should_quit {
                return Ok(());
            }

            // Apply batched scroll changes once
            if scroll_delta != 0 && matches!(app.display_mode, DisplayMode::TestOutput) {
                app.apply_scroll_delta(scroll_delta);
            }
        }
    }
}

fn ui<B: Backend>(f: &mut Frame, app: &App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),
            Constraint::Min(0),
            Constraint::Length(3),
        ])
        .split(f.area());

    // Title
    let title = Paragraph::new(app.course.name.clone())
        .style(Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD))
        .alignment(Alignment::Center)
        .block(Block::default().borders(Borders::ALL));
    f.render_widget(title, chunks[0]);

    // Main content area
    let main_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(40), Constraint::Percentage(60)])
        .split(chunks[1]);

    // Exercise list
    render_exercise_list::<B>(f, app, main_chunks[0]);

    // Exercise details
    render_exercise_details::<B>(f, app, main_chunks[1]);

    // Status bar
    let status = Paragraph::new(app.status_message.clone())
        .style(Style::default().fg(Color::Yellow))
        .block(Block::default().borders(Borders::ALL).title("Status"));
    f.render_widget(status, chunks[2]);
}

fn render_exercise_list<B: Backend>(f: &mut Frame, app: &App, area: Rect) {
    let progress_map: std::collections::HashMap<String, bool> = app
        .database
        .get_all_progress()
        .unwrap_or_default()
        .into_iter()
        .map(|p| (p.exercise_id, p.completed))
        .collect();

    let items: Vec<ListItem> = app
        .exercises
        .iter()
        .enumerate()
        .map(|(index, exercise)| {
            let is_completed = progress_map
                .get(&exercise.metadata.id)
                .copied()
                .unwrap_or(false);

            let is_running = app.running_exercise_id.as_ref() == Some(&exercise.metadata.id);
            let is_locked = !app.is_exercise_unlocked(index);

            // Status icon: checkmark if completed, blinking dot if running, space otherwise
            let status_icon = if is_completed {
                "✓"
            } else if is_running {
                if app.blink_toggle { "●" } else { " " }
            } else {
                " "
            };

            let content = format!(
                "{} {} - {}",
                status_icon, exercise.metadata.order, exercise.metadata.title
            );

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
}

fn render_exercise_details<B: Backend>(f: &mut Frame, app: &App, area: Rect) {
    let (content, title) = match app.display_mode {
        DisplayMode::Readme => {
            if let Some(exercise) = app.get_selected_exercise() {
                let mut lines = vec![
                    Line::from(vec![
                        Span::styled("Title: ", Style::default().add_modifier(Modifier::BOLD)),
                        Span::raw(&exercise.metadata.title),
                    ]),
                    Line::from(vec![
                        Span::styled("Description: ", Style::default().add_modifier(Modifier::BOLD)),
                        Span::raw(&exercise.metadata.description),
                    ]),
                    Line::from(""),
                ];

                // Show README content if available
                if exercise.readme_file.exists() {
                    if let Ok(readme) = std::fs::read_to_string(&exercise.readme_file) {
                        lines.push(Line::from(Span::styled(
                            "README:",
                            Style::default().add_modifier(Modifier::BOLD | Modifier::UNDERLINED),
                        )));
                        lines.push(Line::from(""));

                        for line in readme.lines() {
                            lines.push(Line::from(line.to_string()));
                        }
                    }
                }

                (Text::from(lines), "Exercise Details")
            } else {
                (Text::from("No exercise selected"), "Exercise Details")
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
                            Style::default().fg(Color::Green).add_modifier(Modifier::BOLD),
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

            // Show test output - each line is already stored separately
            for line in &app.test_output_lines {
                all_lines.push(Line::from(line.as_str()));
            }

            // Apply manual scrolling by slicing the lines
            let visible_lines: Vec<Line> = all_lines
                .into_iter()
                .skip(app.scroll_position)
                .collect();

            (Text::from(visible_lines), "Test Output")
        }
    };

    let paragraph = Paragraph::new(content)
        .block(Block::default().borders(Borders::ALL).title(title))
        .wrap(Wrap { trim: false });

    f.render_widget(paragraph, area);
}
