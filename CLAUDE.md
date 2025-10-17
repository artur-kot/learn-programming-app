# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Tauri + SvelteKit + TypeScript** desktop application. The project uses:
- **Frontend**: SvelteKit with Svelte 5 (runes mode), running in SPA mode (SSR disabled)
- **Backend**: Tauri 2.0 (Rust-based desktop app framework)
- **Package Manager**: Bun (configured in tauri.conf.json)

## Architecture

### Hybrid Frontend/Backend Structure

The application has two distinct parts that work together:

1. **Frontend (SvelteKit SPA)**: `src/` directory
   - Configured as a Single Page Application (SPA) using `@sveltejs/adapter-static`
   - SSR is disabled (`src/routes/+layout.ts` sets `export const ssr = false`)
   - Builds to static files in `build/` directory
   - Uses Svelte 5 runes (`$state`, `$derived`, etc.)

2. **Backend (Rust/Tauri)**: `src-tauri/` directory
   - Rust application that creates the native desktop window
   - Exposes commands callable from frontend via `@tauri-apps/api/core`
   - Entry point: `src-tauri/src/main.rs` → `src-tauri/src/lib.rs`

### Frontend-Backend Communication

- Frontend calls Rust functions using `invoke()` from `@tauri-apps/api/core`
- Rust functions marked with `#[tauri::command]` macro are exposed to frontend
- Commands registered in `src-tauri/src/lib.rs` via `.invoke_handler(tauri::generate_handler![...])`
- Example: `await invoke("greet", { name })` calls the `greet` Rust function

## Development Commands

### Running the Application

```bash
# Development mode (starts both Vite dev server and Tauri)
bun tauri dev
```

**Important**: The `bun tauri dev` command:
- Runs `beforeDevCommand` from tauri.conf.json (`bun run dev`)
- Starts Vite dev server on port 1420
- Launches Tauri window that loads `http://localhost:1420`

### Building

```bash
# Build for production
bun tauri build
```

This runs `beforeBuildCommand` (`bun run build`) then creates native installers.

### Frontend-Only Development

```bash
# Run Vite dev server only (no Tauri window)
bun run dev

# Build frontend only
bun run build

# Preview production build
bun run preview
```

### Type Checking

```bash
# Run Svelte type checking
bun run check

# Run type checking in watch mode
bun run check:watch
```

## Key Configuration Details

### Vite Configuration (`vite.config.js`)
- Fixed port: 1420 (required by Tauri)
- Ignores `src-tauri/` directory from watch
- Uses `clearScreen: false` to prevent obscuring Rust errors

### Svelte Configuration (`svelte.config.js`)
- Uses `adapter-static` with fallback to `index.html` for SPA mode
- Preprocessor: `vitePreprocess()`

### Tauri Configuration (`src-tauri/tauri.conf.json`)
- Frontend dist: `../build`
- Dev URL: `http://localhost:1420`
- Window: 800x600 default size

## Adding New Tauri Commands

When adding Rust commands callable from the frontend:

1. Add function in `src-tauri/src/lib.rs` with `#[tauri::command]` macro
2. Register in `.invoke_handler()` using `tauri::generate_handler![...]`
3. Call from frontend using `invoke("command_name", { params })`

Example:
```rust
// src-tauri/src/lib.rs
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

// Register in run() function
.invoke_handler(tauri::generate_handler![greet])
```

```typescript
// Frontend
import { invoke } from "@tauri-apps/api/core";
const result = await invoke("greet", { name: "World" });
```

## Dependencies

### Rust Dependencies (`src-tauri/Cargo.toml`)
- `tauri` v2
- `tauri-plugin-opener` v2
- `serde` and `serde_json` for serialization

### Frontend Dependencies (`package.json`)
- `@tauri-apps/api` v2
- `svelte` v5
- `@sveltejs/kit` v2
- `vite` v6
