# AI instructions for this project

Purpose

- Desktop Electron app (Electron Forge + Vite) with Vue 3 + Pinia + PrimeVue + Tailwind.
- Teaches programming via Git-backed courses. Exercises are copied to a user workspace before editing/running/testing.

Key entry points

- Electron main: `src/main.ts` (creates window, registers IPC handlers).
- Preload: `src/preload.ts` (exposes `window.electronAPI` by wrapping IPC invoke/send/events + convenience helpers).
- Renderer bootstrap: `src/renderer.ts` (creates Vue app, installs router/pinia/PrimeVue/Toast, loads appearance).
- Routes/layouts: `src/renderer/routes.ts`, layouts in `src/renderer/layouts/`.

Important conventions

- TypeScript moduleResolution is NodeNext; imports between TS files must use `.js` extension (see existing imports). Keep this when adding files.
- Path alias: `~/*` -> `src/*`. Prefer absolute alias imports for cross-folder references.
- Renderer/Node separation: filesystem, git, child processes, sqlite run in main process only; renderer calls via IPC.

IPC architecture (add/modify features here)

- Contract-first types: `src/ipc/contracts.ts` defines
  - Request/response channels in `IpcInvoke`
  - Fire-and-forget `IpcSend` (currently unused)
  - Streaming/events in `IpcEvents`
- Registration: `src/ipc/register-handlers.ts` wires `ipcMain.handle` for all keys in an implementation object.
- Implementations: `src/ipc/handlers/` folder. Compose in `src/ipc/handlers/index.ts`.
- Preload exposure: `src/preload.ts` attaches typed helpers onto `window.electronAPI`.
- Renderer typings for `window.electronAPI`: `src/types/electron-api.d.ts`.

Typical change workflow (IPC backed feature)

1) Define/extend channel types in `src/ipc/contracts.ts`.
2) Implement handler in `src/ipc/handlers/...` (create a new file if needed) and export it via `src/ipc/handlers/index.ts`.
3) If renderer needs a convenience method, add it in `src/preload.ts` and update `src/types/electron-api.d.ts`.
4) Consume from renderer via `window.electronAPI.yourMethod()` and/or subscribe to events with `window.electronAPI.on('channel', cb)`.

Courses and filesystem layout

- Repo root for cloned courses: `${app.getPath('userData')}/courses`.
- Per-exercise editable workspace: `${app.getPath('userData')}/courses-workspace`.
- A course is a Git repo mapped by slug: `src/ipc/handlers/course-handlers/course-repos.ts`.
- Exercises and navigation:
  - Sidebar tree lists folders with numeric prefixes only (e.g., `1_intro`, `2_1_basics`). See `git.course.handlers.ts` → `buildTreeWithCompletion()`.
  - Exercise markdown is searched in priority order inside the workspace: `_meta/todo.md`, `_meta/README.md`, `_meta/overview.md`, `README.md`. Fallback to repo `_overview/overview.md`.
  - Visible editable files are those at exercise root not starting with `_`. `_meta/` holds tests/solution and is copied to workspace.

Run and test

- `course:run`: executes first `.js` file in workspace via `node` and streams logs on `course:run-log`, completion on `course:run-done`.
- `course:test`: reads optional `_meta/meta.json` `test` command; otherwise falls back. Streams `course:test-log`, completion on `course:test-done`.
- Completion is persisted in SQLite when tests pass.

Persistence

- Settings: `electron-store` in `src/electron-store.ts` (currently theme only).
- Progress DB: `src/db/progress.ts` (SQLite, file at `${app.getPath('userData')}/progress.db`). Exposes `markExerciseCompleted`, `isExerciseCompleted`, `clearExerciseCompletion`.

Renderer structure (where to change UI)

- Layouts: `src/renderer/layouts/MainLayout.vue`, `CourseLayout.vue`.
- Main views: `src/renderer/views/CoursesView.vue`, `CourseView.vue`, `SettingsView.vue` and nested `views/settings/*`.
- State: Pinia stores in `src/renderer/stores/*` (notably `appearance.ts`, `course.ts`).
- Styling: `src/renderer/styles.css` (Tailwind + PrimeUI integration, dark mode via `.app-dark`).

Common tasks and file hotspots

- Add a new course slug → `src/ipc/handlers/course-handlers/course-repos.ts`.
- Change sidebar course tree logic/completion flags → `src/ipc/handlers/course-handlers/git.course.handlers.ts` (functions: `buildTreeWithCompletion`, `isExerciseCompleted`).
- Add new course file operations → same handler file; define contract first.
- Modify run/test behavior or environment → same handler file in sections `'course:run'` / `'course:test'`.
- Update theme behavior → `src/renderer/stores/appearance.ts` (renderer) and `src/ipc/handlers/theme.handlers.ts` (main) + preload helpers.
- Add a new settings page → add a view under `src/renderer/views/settings/`, register route in `src/renderer/routes.ts` and nav in `SettingsView.vue`.

Event/channel naming

- Theme: `theme:get`, `theme:set`, event `theme:changed` (currently not emitted).
- Git course: `git-course:*` (clone/check/pull + progress/log/done events).
- Course operations: `course:*` (list/read/write/read-markdown/run/test/is-completed/reset/apply-solution + run/test log/done events).

Search tips

- Contracts and types: `src/ipc/contracts.ts` and `src/types/*`.
- Main process logic: `src/ipc/handlers/**/*` and `src/db/*`.
- Preload/bridge: `src/ipc/bridge.ts`, `src/preload.ts`.
- Renderer UI/state: `src/renderer/**/*`.
- Keep an eye on `.js` import suffixes when editing TS files.

Safety notes

- Do not perform filesystem or process operations in the renderer; add an IPC channel.
- Validate/normalize paths using `path.join` and ensure they stay under the expected root (see current checks with `startsWith(root)`).
- Long-running ops should stream progress via events (see examples above).

Dev notes

- Vite builds the renderer from `src/renderer.ts`. Electron Forge drives the app. Tailwind v4 integration is configured in `vite.renderer.config.ts`.
- Router uses in-memory history.

Checklist when adding features

- [ ] Update `contracts.ts`
- [ ] Implement handler and export via `handlers/index.ts`
- [ ] Expose helper in `preload.ts` (optional)
- [ ] Update `src/types/electron-api.d.ts`
- [ ] Consume in renderer + add UI/state changes
- [ ] Consider streaming events for progress/feedback
- [ ] Mind `.js` suffixed imports in TS
