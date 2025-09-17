import { IpcHandlersDef } from '../shared.types.js';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { app } from 'electron';

function runGit(
  args: string[],
  cwd?: string
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

function getCoursesRoot(): string {
  // Store courses under the application's userData directory
  return path.join(app.getPath('userData'), 'courses');
}

export const gitCourseHandlers: IpcHandlersDef = {
  async 'git-course:clone'(_win, { slug, repoUrl, branch = 'main' }) {
    const root = getCoursesRoot();
    const dest = path.join(root, slug);

    // Ensure root exists
    if (!existsSync(root)) await mkdir(root, { recursive: true });

    // If destination exists, remove it to ensure a fresh clone
    if (existsSync(dest)) await rm(dest, { recursive: true, force: true });

    const { code, stdout, stderr } = await runGit([
      'clone',
      '--branch',
      branch,
      '--single-branch',
      repoUrl,
      dest,
    ]);
    if (code !== 0) throw new Error(`Failed to clone repo: ${stderr || stdout}`);

    return { path: dest };
  },

  async 'git-course:is-update-available'(_win, { slug, branch = 'main' }) {
    const root = getCoursesRoot();
    const dest = path.join(root, slug);
    if (!existsSync(dest)) throw new Error('Course not found. Clone it first.');

    // Fetch latest from origin
    let res = await runGit(['fetch', 'origin'], dest);
    if (res.code !== 0) throw new Error(`git fetch failed: ${res.stderr || res.stdout}`);

    // Compare local branch with origin/branch
    // Use rev-list to count commits ahead/behind
    res = await runGit(
      ['rev-list', '--left-right', '--count', `${branch}...origin/${branch}`],
      dest
    );
    if (res.code !== 0) throw new Error(`git rev-list failed: ${res.stderr || res.stdout}`);

    // Output like: "<behind>\t<ahead>\n" when using --left-right <A>...<B>
    const m = res.stdout.trim().match(/^(\d+)\s+(\d+)$/);
    let aheadBy = 0; // commits local has that origin doesn't
    let behindBy = 0; // commits origin has that local doesn't
    if (m) {
      aheadBy = parseInt(m[1]!, 10);
      behindBy = parseInt(m[2]!, 10);
    } else {
      // Some git versions separate with tab
      const parts = res.stdout.trim().split(/\s+/);
      if (parts.length >= 2) {
        aheadBy = parseInt(parts[0]!, 10) || 0;
        behindBy = parseInt(parts[1]!, 10) || 0;
      }
    }

    return { updateAvailable: behindBy > 0, aheadBy, behindBy };
  },

  async 'git-course:pull'(_win, { slug, branch = 'main' }) {
    const root = getCoursesRoot();
    const dest = path.join(root, slug);
    if (!existsSync(dest)) throw new Error('Course not found. Clone it first.');

    // Ensure we are on target branch
    let res = await runGit(['checkout', branch], dest);
    if (res.code !== 0) throw new Error(`git checkout failed: ${res.stderr || res.stdout}`);

    // Pull latest
    res = await runGit(['pull', '--ff-only', 'origin', branch], dest);
    if (res.code !== 0) throw new Error(`git pull failed: ${res.stderr || res.stdout}`);

    return { updated: true, output: res.stdout };
  },
};
