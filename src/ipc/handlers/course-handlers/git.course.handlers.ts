import { IpcHandlersDef } from '../shared.types.js';
import path from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { app } from 'electron';
import { createEmitter } from '../../register-handlers.js';
import type { CourseTreeNode } from '../../contracts.js';
import { courseSlugToRepoUrl } from './course-repos.js';

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

function ensureId(id?: string) {
  return id ?? Math.random().toString(36).slice(2);
}

function isNumericPrefixed(name: string) {
  // Matches: 1_overview, 01_intro, 1_1_example, 10_2_topic, etc.
  return /^\d+(?:_\d+)*(?:_.*)?$/.test(name);
}

function labelFromSegment(seg: string) {
  // Strip leading number parts and underscores up to first non-number token
  // E.g., '1_overview' -> 'overview', '1_2_arrays' -> 'arrays'
  const parts = seg.split('_');
  while (parts.length && /^\d+$/.test(parts[0]!)) parts.shift();
  const label = parts.join(' ');
  // Fallback to original if empty
  return label || seg;
}

function buildTree(rootAbs: string, rel: string = ''): CourseTreeNode[] {
  const full = path.join(rootAbs, rel);
  const entries = readdirSync(full, { withFileTypes: true });
  // Keep only directories
  const dirs = entries.filter((e) => e.isDirectory());
  // Filter by numeric-prefixed pattern
  const filtered = dirs.filter((d) => isNumericPrefixed(d.name));
  // Sort using natural order by numbers then by name to preserve repo order if already numbered
  filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return filtered.map((dirent): CourseTreeNode => {
    const name = dirent.name;
    const childRel = rel ? path.posix.join(rel, name) : name;
    const children: CourseTreeNode[] = buildTree(rootAbs, childRel);
    return {
      key: childRel,
      label: labelFromSegment(name),
      path: childRel,
      children: children.length ? children : undefined,
    };
  });
}

function resolveExerciseRoot(slug: string, exercisePath: string) {
  return path.join(getCoursesRoot(), slug, exercisePath);
}

function listExerciseFiles(absExerciseRoot: string) {
  // list only files not starting with '_' in the exercise root (non-recursive for simplicity)
  const entries = readdirSync(absExerciseRoot, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort();
}

export const gitCourseHandlers: IpcHandlersDef = {
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

    let res = await runGitStreaming(win!, id, slug, 'pull', ['checkout', branch], dest);
    if (res.code !== 0) {
      emitter.emit('git-course:done', {
        id,
        slug,
        op: 'pull',
        success: false,
        error: res.stderr || res.stdout,
      });
      throw new Error(`git checkout failed: ${res.stderr || res.stdout}`);
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
    if (res.code !== 0) {
      emitter.emit('git-course:done', {
        id,
        slug,
        op: 'pull',
        success: false,
        error: res.stderr || res.stdout,
      });
      throw new Error(`git pull failed: ${res.stderr || res.stdout}`);
    }

    emitter.emit('git-course:done', { id, slug, op: 'pull', success: true });
    return { id, updated: true, output: res.stdout };
  },

  async 'git-course:list-tree'(_win, { slug }) {
    const root = path.join(getCoursesRoot(), slug);
    if (!existsSync(root)) throw new Error('Course not found.');
    return buildTree(root);
  },

  // Course file/exercise operations
  async 'course:list-files'(_win, { slug, exercisePath }) {
    const root = resolveExerciseRoot(slug, exercisePath);
    if (!existsSync(root)) throw new Error('Exercise not found');
    return { files: listExerciseFiles(root) };
  },

  async 'course:read-file'(_win, { slug, exercisePath, file }) {
    const root = resolveExerciseRoot(slug, exercisePath);
    const abs = path.join(root, file);
    if (!abs.startsWith(root)) throw new Error('Invalid path');
    const content = readFileSync(abs, 'utf-8');
    return { content };
  },

  async 'course:write-file'(_win, { slug, exercisePath, file, content }) {
    const root = resolveExerciseRoot(slug, exercisePath);
    const abs = path.join(root, file);
    if (!abs.startsWith(root)) throw new Error('Invalid path');
    writeFileSync(abs, content, 'utf-8');
    return { ok: true as const };
  },

  async 'course:read-markdown'(_win, { slug, exercisePath }) {
    const exerciseRoot = resolveExerciseRoot(slug, exercisePath);
    const courseRoot = path.join(getCoursesRoot(), slug);
    const candidates = [
      path.join(exerciseRoot, '_meta', 'README.md'),
      path.join(exerciseRoot, '_meta', 'overview.md'),
      path.join(exerciseRoot, 'README.md'),
      path.join(courseRoot, '_overview', 'overview.md'),
    ];
    for (const abs of candidates) {
      if (existsSync(abs)) {
        return { markdown: readFileSync(abs, 'utf-8') };
      }
    }
    return { markdown: '' };
  },

  async 'course:run'(win, { slug, exercisePath, id: _id }) {
    const id = ensureId(_id);
    const emitter = createEmitter(win!.webContents);
    const cwd = resolveExerciseRoot(slug, exercisePath);
    // Find a default runnable file (first .js file) if exists
    const files = listExerciseFiles(cwd);
    const mainFile = files.find((f) => f.endsWith('.js')) || files[0];
    if (!mainFile) throw new Error('No runnable file found');

    const child = spawn(process.execPath, [mainFile], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

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

    return { id };
  },

  async 'course:test'(win, { slug, exercisePath, id: _id }) {
    const id = ensureId(_id);
    const emitter = createEmitter(win!.webContents);
    const cwd = resolveExerciseRoot(slug, exercisePath);

    // Convention: `_meta/meta.json` has a `test` command
    const metaPath = path.join(cwd, '_meta', 'meta.json');
    let cmd = process.execPath;
    let args: string[] = [];
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as { test?: string };
        if (meta.test) {
          const parts = meta.test.trim().split(/\s+/);
          cmd = parts.shift() || cmd;
          args = parts;
          // If first arg points to non-existing file and an _meta alternative exists, rewrite
          if (cmd === 'node' && args[0]) {
            const candidate = path.join(cwd, args[0]);
            if (!existsSync(candidate)) {
              const alt = path.join(cwd, '_meta', args[0].replace(/^\.\//, ''));
              if (existsSync(alt)) {
                args[0] = './_meta/' + args[0].replace(/^\.\//, '');
              }
            }
          }
        }
      } catch {}
    }

    const child = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });
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
    child.on('close', (code) =>
      emitter.emit('course:test-done', {
        id,
        slug,
        exercisePath,
        success: (code ?? 0) === 0,
        code: code ?? 0,
      })
    );
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

    return { id };
  },
};
