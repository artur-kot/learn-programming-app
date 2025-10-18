use crate::course::{Course, Exercise};
use crate::database::Database;
use crate::test_runner::{TestResult, TestRunner};
use crate::watcher::Watcher;
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

pub enum AppMode {
    List,
    Watch,
}

pub struct App {
    course: Course,
    exercises: Vec<Exercise>,
    database: Database,
    test_runner: TestRunner,
    selected_index: usize,
    list_state: ListState,
    mode: AppMode,
    watcher: Option<Watcher>,
    last_test_result: Option<TestResult>,
    status_message: String,
}

impl App {
    pub fn new(course_path: PathBuf) -> Result<Self> {
        let (course, exercises) = Course::load_from_path(&course_path)?;
        let database = Database::new(&course.name)?;
        let test_runner = TestRunner::new(&course_path);

        let mut list_state = ListState::default();
        if !exercises.is_empty() {
            list_state.select(Some(0));
        }

        Ok(Self {
            course,
            exercises,
            database,
            test_runner,
            selected_index: 0,
            list_state,
            mode: AppMode::List,
            watcher: None,
            last_test_result: None,
            status_message: String::from("Press 'w' to watch, 'q' to quit"),
        })
    }

    fn select_next(&mut self) {
        if self.exercises.is_empty() {
            return;
        }
        self.selected_index = (self.selected_index + 1) % self.exercises.len();
        self.list_state.select(Some(self.selected_index));
    }

    fn select_previous(&mut self) {
        if self.exercises.is_empty() {
            return;
        }
        if self.selected_index == 0 {
            self.selected_index = self.exercises.len() - 1;
        } else {
            self.selected_index -= 1;
        }
        self.list_state.select(Some(self.selected_index));
    }

    fn get_selected_exercise(&self) -> Option<&Exercise> {
        self.exercises.get(self.selected_index)
    }

    async fn start_watching(&mut self) -> Result<()> {
        if let Some(exercise) = self.get_selected_exercise() {
            let path = exercise.path.clone();
            let title = exercise.metadata.title.clone();

            self.watcher = Some(Watcher::new(&path)?);
            self.mode = AppMode::Watch;
            self.status_message = format!(
                "Watching {}... Press 'Esc' to stop, 'r' to run tests manually",
                title
            );

            // Run tests initially
            self.run_current_test().await?;
        }
        Ok(())
    }

    fn stop_watching(&mut self) {
        self.watcher = None;
        self.mode = AppMode::List;
        self.last_test_result = None;
        self.status_message = String::from("Press 'w' to watch, 'q' to quit");
    }

    async fn run_current_test(&mut self) -> Result<()> {
        if let Some(exercise) = self.get_selected_exercise() {
            let exercise_id = exercise.metadata.id.clone();
            let title = exercise.metadata.title.clone();

            self.status_message = format!("Running tests for {}...", title);

            let result = self.test_runner.run_test(&exercise_id).await?;

            match &result {
                TestResult::Passed => {
                    self.database.mark_completed(&exercise_id)?;
                    self.status_message = format!("✓ {} completed!", title);
                }
                TestResult::Failed => {
                    self.database.mark_attempted(&exercise_id)?;
                    self.status_message = format!("✗ Tests failed for {}", title);
                }
                TestResult::Error(err) => {
                    self.status_message = format!("Error: {}", err);
                }
            }

            self.last_test_result = Some(result);
        }
        Ok(())
    }

    async fn check_file_changes(&mut self) -> Result<()> {
        if let Some(watcher) = &self.watcher {
            if watcher.check_for_changes().is_some() {
                self.run_current_test().await?;
            }
        }
        Ok(())
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
        terminal.draw(|f| ui::<B>(f, app))?;

        // Handle file changes in watch mode
        if matches!(app.mode, AppMode::Watch) {
            app.check_file_changes().await?;
        }

        // Poll for events with timeout
        if event::poll(std::time::Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    match app.mode {
                        AppMode::List => match key.code {
                            KeyCode::Char('q') => return Ok(()),
                            KeyCode::Down | KeyCode::Char('j') => app.select_next(),
                            KeyCode::Up | KeyCode::Char('k') => app.select_previous(),
                            KeyCode::Char('w') | KeyCode::Enter => {
                                app.start_watching().await?;
                            }
                            _ => {}
                        },
                        AppMode::Watch => match key.code {
                            KeyCode::Esc => app.stop_watching(),
                            KeyCode::Char('r') => {
                                app.run_current_test().await?;
                            }
                            KeyCode::Char('q') => return Ok(()),
                            _ => {}
                        },
                    }
                }
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
        .map(|exercise| {
            let is_completed = progress_map
                .get(&exercise.metadata.id)
                .copied()
                .unwrap_or(false);

            let status_icon = if is_completed { "✓" } else { " " };
            let content = format!(
                "{} {} - {}",
                status_icon, exercise.metadata.order, exercise.metadata.title
            );

            let style = if is_completed {
                Style::default().fg(Color::Green)
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
    let content = if let Some(exercise) = app.get_selected_exercise() {
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

                for line in readme.lines().take(15) {
                    lines.push(Line::from(line.to_string()));
                }
            }
        }

        // Show test result if in watch mode
        if matches!(app.mode, AppMode::Watch) {
            lines.push(Line::from(""));
            lines.push(Line::from(Span::styled(
                "─".repeat(40),
                Style::default().fg(Color::DarkGray),
            )));

            if let Some(result) = &app.last_test_result {
                match result {
                    TestResult::Passed => {
                        lines.push(Line::from(Span::styled(
                            "✓ All tests passed!",
                            Style::default().fg(Color::Green).add_modifier(Modifier::BOLD),
                        )));
                    }
                    TestResult::Failed => {
                        lines.push(Line::from(Span::styled(
                            "✗ Tests failed",
                            Style::default().fg(Color::Red).add_modifier(Modifier::BOLD),
                        )));
                    }
                    TestResult::Error(err) => {
                        lines.push(Line::from(Span::styled(
                            format!("Error: {}", err),
                            Style::default().fg(Color::Red),
                        )));
                    }
                }
            }
        }

        Text::from(lines)
    } else {
        Text::from("No exercise selected")
    };

    let title = match app.mode {
        AppMode::List => "Details",
        AppMode::Watch => "Details (Watching)",
    };

    let paragraph = Paragraph::new(content)
        .block(Block::default().borders(Borders::ALL).title(title))
        .wrap(Wrap { trim: true });

    f.render_widget(paragraph, area);
}
