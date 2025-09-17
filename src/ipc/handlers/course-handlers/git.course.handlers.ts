import { IpcHandlersDef } from '../shared.types.js';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { app, BrowserWindow } from 'electron';
import { createEmitter } from '../../register-handlers.js';

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

export const gitCourseHandlers: IpcHandlersDef = {
  async 'git-course:clone'(win, { slug, repoUrl, branch = 'main', id: _id }) {
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
      repoUrl,
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
};
