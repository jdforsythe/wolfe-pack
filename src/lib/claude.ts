import { execFileSync, spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const MIN_TESTED_VERSION = '2.1.170';

/** Locate the claude CLI: PATH first, then ~/.claude/local/claude. */
export function findClaude(): string | null {
  // Try PATH lookup
  const which = spawnSync('which', ['claude'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) {
    return which.stdout.trim();
  }

  // Fallback: well-known local install path
  const local = join(homedir(), '.claude', 'local', 'claude');
  if (existsSync(local)) {
    return local;
  }

  return null;
}

/** Return the version string from `claude --version`, or null on failure. */
export function claudeVersion(claudePath?: string): string | null {
  const bin = claudePath ?? findClaude();
  if (!bin) return null;
  try {
    const out = execFileSync(bin, ['--version'], { encoding: 'utf8', timeout: 5000 });
    // Typical output: "Claude Code 2.1.170" or just "2.1.170"
    const match = /(\d+\.\d+\.\d+)/.exec(out);
    return match ? (match[1] ?? null) : null;
  } catch {
    return null;
  }
}

/** Compare two semver strings. Returns negative if a < b, 0 if equal, positive if a > b. */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export interface SpawnClaudeOpts {
  cwd?: string;
  /** When true, inherit stdio (interactive). When false/omitted, pipe stdio. */
  inherit?: boolean;
}

/**
 * Spawn the claude CLI with the given args.
 * Returns the SpawnSyncReturns object so callers can inspect status / output.
 */
export function spawnClaude(
  args: string[],
  opts: SpawnClaudeOpts = {},
): ReturnType<typeof spawnSync> {
  const bin = findClaude();
  if (!bin) {
    throw new Error('claude CLI not found. Install it and retry.');
  }

  const spawnOpts: SpawnSyncOptions = {
    cwd: opts.cwd,
    stdio: opts.inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
  };

  return spawnSync(bin, args, spawnOpts);
}
