import { IpcHandlersDef } from '../shared.types.js';
import path from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { mkdir, rm, cp } from 'node:fs/promises';
import { spawn, type ChildProcess } from 'node:child_process';
import { app, dialog } from 'electron';
import { createEmitter } from '../../register-handlers.js';
import type { CourseTreeNode } from '../../contracts.js';
import { courseSlugToRepoUrl } from './course-repos.js';
import { markExerciseCompleted, isExerciseCompleted } from '../../../db/progress.js';

function runGitStreaming(
  win: Electron.BrowserWindow,
  id: string,
  slug: string,
  op: 'clone' | 'check' | 'pull',
  args: string[],
  cwd?: string
): Promise<{ code: number; stdout: string; stderr: string }> {
  const emitter = createEmitter(win.webContents);
  const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => {
    const chunk = d.toString();
    stdout += chunk;
    emitter.emit('git-course:log', { id, slug, op, stream: 'stdout', chunk });
  });
  child.stderr.on('data', (d) => {
    const chunk = d.toString();
    stderr += chunk;
    emitter.emit('git-course:log', { id, slug, op, stream: 'stderr', chunk });
  });
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

function getCoursesRoot(): string {
  return path.join(app.getPath('userData'), 'courses');
}
function getWorkspaceRoot(): string {
  return path.join(app.getPath('userData'), 'courses-workspace');
}

function ensureId(id?: string) {
  return id ?? Math.random().toString(36).slice(2);
}

function isNumericPrefixed(name: string) {
  // Matches: 1_overview, 01_intro, 1_1_example, 10_2_topic, etc.
  return /^\d+(?:_\d+)*(?:_.*)?$/.test(name);
}

function labelFromSegment(seg: string) {
  // Strip leading numeric parts (e.g., 1_ or 1_2_) and convert remaining to Title Case
  const parts = seg.split('_');
  while (parts.length && /^\d+$/.test(parts[0]!)) parts.shift();
  const titled = parts
    .filter((p) => p.length > 0)
    .map((p) =>
      p
        .split('-')
        .map((q) => (q ? q.charAt(0).toUpperCase() + q.slice(1) : q))
        .join(' ')
    )
    .join(' ');
  return titled || seg;
}

async function buildTreeWithCompletion(
  slug: string,
  rootAbs: string,
  rel: string = ''
): Promise<CourseTreeNode[]> {
  const full = path.join(rootAbs, rel);
  const entries = readdirSync(full, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());
  const filtered = dirs.filter((d) => isNumericPrefixed(d.name));
  filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const nodes: CourseTreeNode[] = [];
  for (const dirent of filtered) {
    const name = dirent.name;
    const childRel = rel ? path.posix.join(rel, name) : name;
    const children = await buildTreeWithCompletion(slug, rootAbs, childRel);
    const node: CourseTreeNode = {
      key: childRel,
      label: labelFromSegment(name),
      path: childRel,
      // Leaf nodes represent exercises; mark completion
      ...(children.length === 0 ? { completed: await isExerciseCompleted(slug, childRel) } : {}),
      children: children.length ? children : undefined,
    };
    nodes.push(node);
  }
  return nodes;
}

function resolveRepoExerciseRoot(slug: string, exercisePath: string) {
  return path.join(getCoursesRoot(), slug, exercisePath);
}
function resolveExerciseWorkspaceRoot(slug: string, exercisePath: string) {
  return path.join(getWorkspaceRoot(), slug, exercisePath);
}

function listExerciseFiles(absExerciseRoot: string) {
  // list only files not starting with '_' in the exercise root (non-recursive for simplicity)
  const entries = readdirSync(absExerciseRoot, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort();
}

async function ensureExerciseWorkspace(slug: string, exercisePath: string) {
  const src = resolveRepoExerciseRoot(slug, exercisePath);
  const dst = resolveExerciseWorkspaceRoot(slug, exercisePath);
  if (!existsSync(src)) throw new Error('Exercise not found');
  const firstCreate = !existsSync(dst);
  if (firstCreate) {
    await mkdir(dst, { recursive: true });
    // Copy visible exercise files once (don't overwrite user's work later)
    for (const file of listExerciseFiles(src)) {
      const from = path.join(src, file);
      const to = path.join(dst, file);
      writeFileSync(to, readFileSync(from));
    }
    // Initial population of _meta from the repo
    const metaSrc = path.join(src, '_meta');
    const metaDst = path.join(dst, '_meta');
    if (existsSync(metaSrc)) {
      await rm(metaDst, { recursive: true, force: true });
      await cp(metaSrc, metaDst, { recursive: true, force: true });
    }
  }
}

// After a successful course pull, sync the latest _meta from the repo into any existing workspaces
async function syncCourseMetaIntoWorkspaces(slug: string): Promise<number> {
  const wsRoot = path.join(getWorkspaceRoot(), slug);
  const repoRoot = path.join(getCoursesRoot(), slug);
  if (!existsSync(wsRoot) || !existsSync(repoRoot)) return 0;

  // Collect relative paths of all directories under the workspace course root
  const relDirs: string[] = [];
  function walk(rel: string) {
    const abs = path.join(wsRoot, rel);
    const entries = readdirSync(abs, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const childRel = rel ? path.posix.join(rel, e.name) : e.name;
        relDirs.push(childRel);
        walk(childRel);
      }
    }
  }
  walk('');

  let synced = 0;
  for (const rel of relDirs) {
    const repoMeta = path.join(repoRoot, rel, '_meta');
    if (!existsSync(repoMeta)) continue;
    const wsMeta = path.join(wsRoot, rel, '_meta');
    await rm(wsMeta, { recursive: true, force: true });
    await cp(repoMeta, wsMeta, { recursive: true, force: true });
    synced++;
  }
  return synced;
}
async function resetExerciseWorkspace(slug: string, exercisePath: string) {
  const dst = resolveExerciseWorkspaceRoot(slug, exercisePath);
  if (existsSync(dst)) {
    await rm(dst, { recursive: true, force: true });
  }
  await ensureExerciseWorkspace(slug, exercisePath);
}

async function applySolutionToWorkspace(slug: string, exercisePath: string) {
  const src = resolveRepoExerciseRoot(slug, exercisePath);
  const dst = resolveExerciseWorkspaceRoot(slug, exercisePath);
  await ensureExerciseWorkspace(slug, exercisePath);
  const solutionDir = path.join(src, '_meta', 'solution');
  if (!existsSync(solutionDir) || !statSync(solutionDir).isDirectory()) {
    throw new Error('No solution available for this exercise');
  }
  const entries = readdirSync(solutionDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile()) {
      const from = path.join(solutionDir, e.name);
      const to = path.join(dst, e.name);
      writeFileSync(to, readFileSync(from));
    }
  }
}

export const gitCourseHandlers: IpcHandlersDef = {
  // --- Runtime process tracking & termination helpers ---
  // Track children per exercise so we can terminate on route leave
  // Keyed by `${slug}|${exercisePath}`

  async 'course:terminate'(
    _win: Electron.BrowserWindow | undefined,
    {
      slug,
      exercisePath,
    }: {
      slug: string;
      exercisePath: string;
    }
  ) {
    const key = `${slug}|${exercisePath}`;
    const set = runningChildren.get(key);
    if (!set || set.size === 0) return { terminated: 0 as const };
    const procs = Array.from(set);
    let terminated = 0;
    await Promise.all(
      procs.map(async (child) => {
        try {
          await terminateChild(child);
          terminated++;
        } catch {
          // ignore
        }
      })
    );
    return { terminated } as const;
  },
  async 'git-course:clone'(win, { slug, branch = 'main', id: _id }) {
    const id = ensureId(_id);
    const emitter = createEmitter(win!.webContents);
    const root = getCoursesRoot();
    const dest = path.join(root, slug);

    emitter.emit('git-course:progress', { id, slug, op: 'clone', step: 'prepare', percent: 5 });

    if (!existsSync(root)) await mkdir(root, { recursive: true });

    if (existsSync(dest)) {
      emitter.emit('git-course:progress', { id, slug, op: 'clone', step: 'cleanup', percent: 10 });
      await rm(dest, { recursive: true, force: true });
    }

    emitter.emit('git-course:progress', { id, slug, op: 'clone', step: 'cloning', percent: 20 });

    const { code, stdout, stderr } = await runGitStreaming(win!, id, slug, 'clone', [
      'clone',
      '--branch',
      branch,
      '--single-branch',
      courseSlugToRepoUrl[slug as keyof typeof courseSlugToRepoUrl],
      dest,
    ]);

    if (code !== 0) {
      emitter.emit('git-course:done', {
        id,
        slug,
        op: 'clone',
        success: false,
        error: stderr || stdout,
      });
      throw new Error(`Failed to clone repo: ${stderr || stdout}`);
    }

    emitter.emit('git-course:progress', { id, slug, op: 'clone', step: 'finalize', percent: 95 });

    emitter.emit('git-course:done', { id, slug, op: 'clone', success: true });
    return { path: dest, id };
  },

  async 'git-course:is-update-available'(win, { slug, branch = 'main', id: _id }) {
    const id = ensureId(_id);
    const emitter = createEmitter(win!.webContents);
    const root = getCoursesRoot();
    const dest = path.join(root, slug);
    if (!existsSync(dest)) throw new Error('Course not found. Clone it first.');

    emitter.emit('git-course:progress', { id, slug, op: 'check', step: 'fetch', percent: 10 });

    let res = await runGitStreaming(win!, id, slug, 'check', ['fetch', 'origin'], dest);
    if (res.code !== 0) {
      emitter.emit('git-course:done', {
        id,
        slug,
        op: 'check',
        success: false,
        error: res.stderr || res.stdout,
      });
      throw new Error(`git fetch failed: ${res.stderr || res.stdout}`);
    }

    emitter.emit('git-course:progress', { id, slug, op: 'check', step: 'compare', percent: 60 });

    res = await runGitStreaming(
      win!,
      id,
      slug,
      'check',
      ['rev-list', '--left-right', '--count', `${branch}...origin/${branch}`],
      dest
    );
    if (res.code !== 0) {
      emitter.emit('git-course:done', {
        id,
        slug,
        op: 'check',
        success: false,
        error: res.stderr || res.stdout,
      });
      throw new Error(`git rev-list failed: ${res.stderr || res.stdout}`);
    }

    const m = res.stdout.trim().match(/^(\d+)\s+(\d+)$/);
    let aheadBy = 0;
    let behindBy = 0;
    if (m) {
      aheadBy = parseInt(m[1]!, 10);
      behindBy = parseInt(m[2]!, 10);
    } else {
      const parts = res.stdout.trim().split(/\s+/);
      if (parts.length >= 2) {
        aheadBy = parseInt(parts[0]!, 10) || 0;
        behindBy = parseInt(parts[1]!, 10) || 0;
      }
    }

    emitter.emit('git-course:done', { id, slug, op: 'check', success: true });
    return { id, updateAvailable: behindBy > 0, aheadBy, behindBy };
  },

  async 'git-course:pull'(win, { slug, branch = 'main', id: _id }) {
    const id = ensureId(_id);
    const emitter = createEmitter(win!.webContents);
    const root = getCoursesRoot();
    const dest = path.join(root, slug);
    if (!existsSync(dest)) throw new Error('Course not found. Clone it first.');

    emitter.emit('git-course:progress', { id, slug, op: 'pull', step: 'checkout', percent: 10 });

    // Try to checkout the branch; if it doesn't exist locally, create it from origin
    let res = await runGitStreaming(win!, id, slug, 'pull', ['checkout', branch], dest);
    if (res.code !== 0) {
      // Attempt to create local branch tracking origin/<branch>
      const fallback = await runGitStreaming(
        win!,
        id,
        slug,
        'pull',
        ['checkout', '-B', branch, `origin/${branch}`],
        dest
      );
      if (fallback.code !== 0) {
        emitter.emit('git-course:done', {
          id,
          slug,
          op: 'pull',
          success: false,
          error: res.stderr || res.stdout || fallback.stderr || fallback.stdout,
        });
        throw new Error(
          `git checkout failed: ${res.stderr || res.stdout || ''}\n${fallback.stderr || fallback.stdout || ''}`
        );
      }
      res = fallback;
    }

    emitter.emit('git-course:progress', { id, slug, op: 'pull', step: 'pulling', percent: 40 });

    res = await runGitStreaming(
      win!,
      id,
      slug,
      'pull',
      ['pull', '--ff-only', 'origin', branch],
      dest
    );
    let forced = false;
    if (res.code !== 0) {
      // If fast-forward pull failed (diverged or conflicts), force sync to origin as source of truth
      emitter.emit('git-course:progress', {
        id,
        slug,
        op: 'pull',
        step: 'force-sync:fetch',
        percent: 55,
      });
      let forceRes = await runGitStreaming(
        win!,
        id,
        slug,
        'pull',
        ['fetch', '--prune', 'origin'],
        dest
      );
      if (forceRes.code !== 0) {
        emitter.emit('git-course:done', {
          id,
          slug,
          op: 'pull',
          success: false,
          error: forceRes.stderr || forceRes.stdout || res.stderr || res.stdout,
        });
        throw new Error(`git fetch (force-sync) failed: ${forceRes.stderr || forceRes.stdout}`);
      }

      emitter.emit('git-course:progress', {
        id,
        slug,
        op: 'pull',
        step: 'force-sync:reset',
        percent: 75,
      });
      forceRes = await runGitStreaming(
        win!,
        id,
        slug,
        'pull',
        ['reset', '--hard', `origin/${branch}`],
        dest
      );
      if (forceRes.code !== 0) {
        emitter.emit('git-course:done', {
          id,
          slug,
          op: 'pull',
          success: false,
          error: forceRes.stderr || forceRes.stdout,
        });
        throw new Error(`git reset --hard failed: ${forceRes.stderr || forceRes.stdout}`);
      }

      // Optionally clean untracked files to fully match origin state
      emitter.emit('git-course:progress', {
        id,
        slug,
        op: 'pull',
        step: 'force-sync:clean',
        percent: 90,
      });
      const cleanRes = await runGitStreaming(win!, id, slug, 'pull', ['clean', '-fd'], dest);
      if (cleanRes.code !== 0) {
        // Not fatal; proceed but include output
      }
      forced = true;
      res = forceRes;
    }

    // After pulling, sync latest _meta into any existing workspaces for this course
    emitter.emit('git-course:progress', {
      id,
      slug,
      op: 'pull',
      step: 'workspace-meta-sync',
      percent: 95,
    });
    const syncedCount = await syncCourseMetaIntoWorkspaces(slug);

    emitter.emit('git-course:done', { id, slug, op: 'pull', success: true });
    return { id, updated: true, output: res.stdout, forced, syncedMetaFor: syncedCount };
  },

  async 'git-course:list-tree'(_win, { slug }) {
    const root = path.join(getCoursesRoot(), slug);
    if (!existsSync(root)) throw new Error('Course not found.');
    return await buildTreeWithCompletion(slug, root);
  },

  // Course file/exercise operations (use workspace)
  async 'course:list-files'(_win, { slug, exercisePath }) {
    await ensureExerciseWorkspace(slug, exercisePath);
    const root = resolveExerciseWorkspaceRoot(slug, exercisePath);
    if (!existsSync(root)) throw new Error('Exercise not found');
    return { files: listExerciseFiles(root) };
  },

  async 'course:read-file'(_win, { slug, exercisePath, file }) {
    await ensureExerciseWorkspace(slug, exercisePath);
    const root = resolveExerciseWorkspaceRoot(slug, exercisePath);
    const abs = path.join(root, file);
    if (!abs.startsWith(root)) throw new Error('Invalid path');
    const content = readFileSync(abs, 'utf-8');
    return { content };
  },

  async 'course:write-file'(_win, { slug, exercisePath, file, content }) {
    await ensureExerciseWorkspace(slug, exercisePath);
    const root = resolveExerciseWorkspaceRoot(slug, exercisePath);
    const abs = path.join(root, file);
    if (!abs.startsWith(root)) throw new Error('Invalid path');
    writeFileSync(abs, content, 'utf-8');
    return { ok: true as const };
  },

  async 'course:read-markdown'(_win, { slug, exercisePath }) {
    // Keep workspace prepared (for user files), but prefer reading docs from the repo clone
    await ensureExerciseWorkspace(slug, exercisePath);
    const exerciseRootWs = resolveExerciseWorkspaceRoot(slug, exercisePath);
    const exerciseRootRepo = resolveRepoExerciseRoot(slug, exercisePath);
    const courseRoot = path.join(getCoursesRoot(), slug);

    const candidates = [
      // Prefer latest exercise docs from repo
      path.join(exerciseRootRepo, '_meta', 'todo.md'),
      path.join(exerciseRootRepo, '_meta', 'README.md'),
      path.join(exerciseRootRepo, '_meta', 'overview.md'),
      path.join(exerciseRootRepo, 'README.md'),
      // Fallback to workspace copies if needed
      path.join(exerciseRootWs, '_meta', 'todo.md'),
      path.join(exerciseRootWs, '_meta', 'README.md'),
      path.join(exerciseRootWs, '_meta', 'overview.md'),
      path.join(exerciseRootWs, 'README.md'),
      // Legacy/root course overview fallback
      path.join(courseRoot, '_overview', 'overview.md'),
    ];
    for (const abs of candidates) {
      if (existsSync(abs)) {
        return { markdown: readFileSync(abs, 'utf-8'), baseDir: path.dirname(abs) };
      }
    }
    return { markdown: '', baseDir: exerciseRootWs };
  },

  async 'course:run'(win, { slug, exercisePath, id: _id }) {
    const id = ensureId(_id);
    const emitter = createEmitter(win!.webContents);
    await ensureExerciseWorkspace(slug, exercisePath);
    const cwd = resolveExerciseWorkspaceRoot(slug, exercisePath);
    // Find a default runnable file (first .js file) if exists
    const files = listExerciseFiles(cwd);
    const mainFile = files.find((f) => f.endsWith('.js')) || files[0];
    if (!mainFile) throw new Error('No runnable file found');

    const child = spawn(process.execPath, [mainFile], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    trackChild(slug, exercisePath, child);

    child.stdout.on('data', (d) =>
      emitter.emit('course:run-log', {
        id,
        slug,
        exercisePath,
        stream: 'stdout',
        chunk: d.toString(),
      })
    );
    child.stderr.on('data', (d) =>
      emitter.emit('course:run-log', {
        id,
        slug,
        exercisePath,
        stream: 'stderr',
        chunk: d.toString(),
      })
    );

    child.on('close', (code) =>
      emitter.emit('course:run-done', {
        id,
        slug,
        exercisePath,
        success: (code ?? 0) === 0,
        code: code ?? 0,
      })
    );
    child.on('error', (err) =>
      emitter.emit('course:run-done', {
        id,
        slug,
        exercisePath,
        success: false,
        code: 1,
        error: String(err),
      })
    );
    child.on('close', () => untrackChild(slug, exercisePath, child));
    child.on('error', () => untrackChild(slug, exercisePath, child));

    return { id };
  },

  async 'course:test'(win, { slug, exercisePath, id: _id }) {
    const id = ensureId(_id);
    const emitter = createEmitter(win!.webContents);
    await ensureExerciseWorkspace(slug, exercisePath);
    // Make sure meta is fresh from the repo before running tests
    // (ensureExerciseWorkspace already refreshes _meta, so this is guaranteed)
    const cwd = resolveExerciseWorkspaceRoot(slug, exercisePath);

    // Convention: `_meta/meta.json` has a `test` command (present in workspace)
    const metaPath = path.join(cwd, '_meta', 'meta.json');
    let cmd = process.execPath;
    let args: string[] = [];
    if (existsSync(metaPath)) {
      const metaRaw = JSON.parse(readFileSync(metaPath, 'utf-8')) as
        | { test?: string; run?: string; title?: string }
        | { meta?: { test?: string; run?: string; title?: string } };
      const meta = (metaRaw as any).meta ?? metaRaw;
      if (meta && typeof meta === 'object' && (meta as any).test) {
        const parts = String((meta as any).test)
          .split(/\s+/)
          .filter((p) => p.length > 0);
        cmd = parts[0]!;
        args = parts.slice(1);
      }
    }

    const normalizedArgs = args.map((a) => a.replace(/\b(?:\.\/)?tests\//g, ''));

    const child = spawn(cmd, normalizedArgs, {
      cwd: path.join(cwd, '_meta', 'tests'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    trackChild(slug, exercisePath, child);
    child.stdout.on('data', (d) =>
      emitter.emit('course:test-log', {
        id,
        slug,
        exercisePath,
        stream: 'stdout',
        chunk: d.toString(),
      })
    );
    child.stderr.on('data', (d) =>
      emitter.emit('course:test-log', {
        id,
        slug,
        exercisePath,
        stream: 'stderr',
        chunk: d.toString(),
      })
    );
    child.on('close', async (code) => {
      const success = (code ?? 0) === 0;
      // Mark as completed in DB on success
      if (success) {
        try {
          await markExerciseCompleted(slug, exercisePath);
        } catch (e) {
          // swallow DB errors to not break UX; logs can be added if needed
        }
      }
      emitter.emit('course:test-done', {
        id,
        slug,
        exercisePath,
        success,
        code: code ?? 0,
      });
      untrackChild(slug, exercisePath, child);
    });
    child.on('error', (err) =>
      emitter.emit('course:test-done', {
        id,
        slug,
        exercisePath,
        success: false,
        code: 1,
        error: String(err),
      })
    );
    child.on('error', () => untrackChild(slug, exercisePath, child));

    return { id };
  },

  async 'course:is-completed'(_win, { slug, exercisePath }) {
    return { completed: await isExerciseCompleted(slug, exercisePath) } as const;
  },

  async 'course:reset'(_win, { slug, exercisePath }) {
    await resetExerciseWorkspace(slug, exercisePath);
    return { ok: true as const };
  },

  async 'course:apply-solution'(_win, { slug, exercisePath }) {
    await applySolutionToWorkspace(slug, exercisePath);
    return { ok: true as const };
  },

  async 'course:export-workspace'(win, { slug, exercisePath }) {
    await ensureExerciseWorkspace(slug, exercisePath);
    const srcRoot = resolveExerciseWorkspaceRoot(slug, exercisePath);

    // Show folder picker
    const res = await dialog.showOpenDialog(win!, {
      title: 'Select destination folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (res.canceled || res.filePaths.length === 0) {
      return { canceled: true as const };
    }
    const destRoot = res.filePaths[0]!;

    // Copy only visible exercise files (exclude _meta)
    const entries = readdirSync(srcRoot, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && !e.name.startsWith('_')) {
        const from = path.join(srcRoot, e.name);
        const to = path.join(destRoot, e.name);
        try {
          writeFileSync(to, readFileSync(from));
        } catch (err) {
          throw new Error(`Failed to export ${e.name}: ${String(err)}`);
        }
      }
    }

    return { exportedTo: destRoot } as const;
  },
};

// --- Internal helpers & state for process tracking ---
const runningChildren = new Map<string, Set<ChildProcess>>();

function keyFor(slug: string, exercisePath: string) {
  return `${slug}|${exercisePath}`;
}
function trackChild(slug: string, exercisePath: string, child: ChildProcess) {
  const key = keyFor(slug, exercisePath);
  let set = runningChildren.get(key);
  if (!set) {
    set = new Set();
    runningChildren.set(key, set);
  }
  set.add(child);
}
function untrackChild(slug: string, exercisePath: string, child: ChildProcess) {
  const key = keyFor(slug, exercisePath);
  const set = runningChildren.get(key);
  if (!set) return;
  set.delete(child);
  if (set.size === 0) runningChildren.delete(key);
}
function terminateChild(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (!child.pid) return resolve();
    // Try graceful first
    try {
      child.kill('SIGTERM');
    } catch {}
    const timeout = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {}
      resolve();
    }, 1500);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.once('close', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
