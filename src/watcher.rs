use anyhow::Result;
use notify::{Event, EventKind, RecursiveMode, Watcher as NotifyWatcher};
use std::path::Path;
use std::sync::mpsc;
use std::time::Duration;

pub enum WatchEvent {
    FileChanged,
}

pub struct Watcher {
    _watcher: notify::RecommendedWatcher,
    receiver: mpsc::Receiver<WatchEvent>,
}

impl Watcher {
    pub fn new<P: AsRef<Path>>(exercise_path: P) -> Result<Self> {
        let (tx, rx) = mpsc::channel();

        let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                match event.kind {
                    EventKind::Modify(_) | EventKind::Create(_) => {
                        // Check if it's a JavaScript file
                        for path in &event.paths {
                            if let Some(ext) = path.extension() {
                                if ext == "js" {
                                    let _ = tx.send(WatchEvent::FileChanged);
                                    break;
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        })?;

        watcher.watch(exercise_path.as_ref(), RecursiveMode::Recursive)?;

        Ok(Self {
            _watcher: watcher,
            receiver: rx,
        })
    }

    pub fn check_for_changes(&self) -> Option<WatchEvent> {
        match self.receiver.recv_timeout(Duration::from_millis(100)) {
            Ok(event) => Some(event),
            Err(_) => None,
        }
    }
}
