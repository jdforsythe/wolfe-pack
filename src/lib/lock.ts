import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface LockData {
  pid: number;
  startedAt: string;
}

const LOCK_DIR = '.wolfe/runs';
const LOCK_FILE = '.lock';
const STALE_MS = 2 * 60 * 60 * 1000; // 2 hours

function lockPath(cwd: string): string {
  return join(cwd, LOCK_DIR, LOCK_FILE);
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function acquireRunLock(cwd: string): void {
  const dir = join(cwd, LOCK_DIR);
  mkdirSync(dir, { recursive: true });

  const lp = lockPath(cwd);

  if (existsSync(lp)) {
    let data: LockData | null = null;
    try {
      data = JSON.parse(readFileSync(lp, 'utf8')) as LockData;
    } catch {
      // Corrupt lock — treat as stale
    }

    if (data) {
      const age = Date.now() - new Date(data.startedAt).getTime();
      const alive = isProcessAlive(data.pid);

      if (alive && age < STALE_MS) {
        throw new Error(
          `Another wolfe-pack run is in progress (pid ${data.pid}, started ${data.startedAt}). ` +
          'Wait for it to finish, or remove .wolfe/runs/.lock manually if it is stale.',
        );
      }
      // Stale or dead — reclaim
    }
  }

  const lockData: LockData = { pid: process.pid, startedAt: new Date().toISOString() };
  writeFileSync(lp, JSON.stringify(lockData, null, 2), 'utf8');
}

export function releaseRunLock(cwd: string): void {
  const lp = lockPath(cwd);
  try {
    if (existsSync(lp)) {
      unlinkSync(lp);
    }
  } catch {
    // Best-effort cleanup
  }
}
