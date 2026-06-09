import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { acquireRunLock, releaseRunLock } from '../src/lib/lock.js';

let tmpDirs: string[] = [];

function makeTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'wolfe-lock-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const d of tmpDirs) {
    try { rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  tmpDirs = [];
});

describe('acquireRunLock / releaseRunLock', () => {
  it('creates the lock file on acquire', () => {
    const dir = makeTmp();
    acquireRunLock(dir);
    const lockPath = join(dir, '.wolfe', 'runs', '.lock');
    expect(existsSync(lockPath)).toBe(true);
    releaseRunLock(dir);
  });

  it('lock file contains valid JSON with pid and startedAt', () => {
    const dir = makeTmp();
    acquireRunLock(dir);
    const lockPath = join(dir, '.wolfe', 'runs', '.lock');
    const data = JSON.parse(readFileSync(lockPath, 'utf8')) as { pid: number; startedAt: string };
    expect(data.pid).toBe(process.pid);
    expect(typeof data.startedAt).toBe('string');
    expect(new Date(data.startedAt).getTime()).toBeGreaterThan(0);
    releaseRunLock(dir);
  });

  it('removes the lock file on release', () => {
    const dir = makeTmp();
    acquireRunLock(dir);
    releaseRunLock(dir);
    const lockPath = join(dir, '.wolfe', 'runs', '.lock');
    expect(existsSync(lockPath)).toBe(false);
  });

  it('throws when an active lock exists from the current process', () => {
    const dir = makeTmp();
    acquireRunLock(dir);
    // Second acquire from same process — same PID is alive
    expect(() => acquireRunLock(dir)).toThrow(/in progress/i);
    releaseRunLock(dir);
  });

  it('reclaims a stale lock (dead pid)', () => {
    const dir = makeTmp();
    const lockDir = join(dir, '.wolfe', 'runs');
    mkdirSync(lockDir, { recursive: true });
    const lockPath = join(lockDir, '.lock');

    // Write a lock for a definitely-dead PID (very high number unlikely to be alive)
    const staleData = { pid: 9999999, startedAt: new Date().toISOString() };
    writeFileSync(lockPath, JSON.stringify(staleData));

    // Should not throw — dead pid means stale lock
    expect(() => acquireRunLock(dir)).not.toThrow();
    releaseRunLock(dir);
  });

  it('reclaims a lock older than 2 hours', () => {
    const dir = makeTmp();
    const lockDir = join(dir, '.wolfe', 'runs');
    mkdirSync(lockDir, { recursive: true });
    const lockPath = join(lockDir, '.lock');

    // Write a lock with an old timestamp (3 hours ago)
    const oldDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const staleData = { pid: process.pid, startedAt: oldDate };
    writeFileSync(lockPath, JSON.stringify(staleData));

    // Should not throw — expired by time
    expect(() => acquireRunLock(dir)).not.toThrow();
    releaseRunLock(dir);
  });

  it('handles missing lock file gracefully on release', () => {
    const dir = makeTmp();
    expect(() => releaseRunLock(dir)).not.toThrow();
  });

  it('handles corrupt lock file by reclaiming', () => {
    const dir = makeTmp();
    const lockDir = join(dir, '.wolfe', 'runs');
    mkdirSync(lockDir, { recursive: true });
    writeFileSync(join(lockDir, '.lock'), 'not valid json {{{');
    expect(() => acquireRunLock(dir)).not.toThrow();
    releaseRunLock(dir);
  });
});
