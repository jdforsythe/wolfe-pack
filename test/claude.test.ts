import { describe, it, expect, vi, afterEach } from 'vitest';
import { spawnSync, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
  execFileSync: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, existsSync: vi.fn(actual.existsSync) };
});

const mockSpawnSync = vi.mocked(spawnSync);
const mockExecFileSync = vi.mocked(execFileSync);
const mockExistsSync = vi.mocked(existsSync);

import { findClaude, claudeVersion, compareSemver, MIN_TESTED_VERSION } from '../src/lib/claude.js';

afterEach(() => {
  vi.clearAllMocks();
});

describe('compareSemver', () => {
  it('returns 0 for equal versions', () => {
    expect(compareSemver('2.1.170', '2.1.170')).toBe(0);
  });

  it('returns negative when a < b', () => {
    expect(compareSemver('2.1.169', '2.1.170')).toBeLessThan(0);
    expect(compareSemver('1.9.9', '2.0.0')).toBeLessThan(0);
  });

  it('returns positive when a > b', () => {
    expect(compareSemver('2.1.171', '2.1.170')).toBeGreaterThan(0);
    expect(compareSemver('3.0.0', '2.9.9')).toBeGreaterThan(0);
  });
});

describe('MIN_TESTED_VERSION', () => {
  it('is a valid semver string', () => {
    expect(/^\d+\.\d+\.\d+$/.test(MIN_TESTED_VERSION)).toBe(true);
  });
});

describe('findClaude', () => {
  it('returns the path when found on PATH', () => {
    mockSpawnSync.mockReturnValue({
      status: 0, stdout: '/usr/local/bin/claude\n', stderr: '', pid: 1,
      signal: null, output: [], error: undefined,
    } as ReturnType<typeof spawnSync>);
    mockExistsSync.mockReturnValue(false);

    const result = findClaude();
    expect(result).toBe('/usr/local/bin/claude');
  });

  it('falls back to ~/.claude/local/claude when not on PATH', () => {
    mockSpawnSync.mockReturnValue({
      status: 1, stdout: '', stderr: '', pid: 1,
      signal: null, output: [], error: undefined,
    } as ReturnType<typeof spawnSync>);
    // existsSync returns true for the fallback path
    mockExistsSync.mockImplementation((p: Parameters<typeof existsSync>[0]) =>
      typeof p === 'string' && p.includes('.claude/local/claude'),
    );

    const result = findClaude();
    expect(result).toMatch(/\.claude\/local\/claude$/);
  });

  it('returns null when claude is not found anywhere', () => {
    mockSpawnSync.mockReturnValue({
      status: 1, stdout: '', stderr: '', pid: 1,
      signal: null, output: [], error: undefined,
    } as ReturnType<typeof spawnSync>);
    mockExistsSync.mockReturnValue(false);

    const result = findClaude();
    expect(result).toBeNull();
  });
});

describe('claudeVersion', () => {
  it('parses a semver from "Claude Code 2.1.170" output', () => {
    mockSpawnSync.mockReturnValue({
      status: 0, stdout: '/usr/local/bin/claude\n', stderr: '', pid: 1,
      signal: null, output: [], error: undefined,
    } as ReturnType<typeof spawnSync>);
    mockExistsSync.mockReturnValue(false);
    mockExecFileSync.mockReturnValue('Claude Code 2.1.200\n' as ReturnType<typeof execFileSync>);

    const ver = claudeVersion('/usr/local/bin/claude');
    expect(ver).toBe('2.1.200');
  });

  it('returns null when execFileSync throws', () => {
    mockSpawnSync.mockReturnValue({
      status: 0, stdout: '/usr/local/bin/claude\n', stderr: '', pid: 1,
      signal: null, output: [], error: undefined,
    } as ReturnType<typeof spawnSync>);
    mockExecFileSync.mockImplementation(() => { throw new Error('not found'); });

    const ver = claudeVersion('/nonexistent/claude');
    expect(ver).toBeNull();
  });

  it('returns null when no path found', () => {
    mockSpawnSync.mockReturnValue({
      status: 1, stdout: '', stderr: '', pid: 1,
      signal: null, output: [], error: undefined,
    } as ReturnType<typeof spawnSync>);
    mockExistsSync.mockReturnValue(false);

    const ver = claudeVersion();
    expect(ver).toBeNull();
  });
});
