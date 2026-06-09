import { spawnSync } from 'node:child_process';

function git(args: string[], cwd?: string): { ok: boolean; out: string } {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return {
    ok: result.status === 0,
    out: (result.stdout ?? '').trim(),
  };
}

export function isGitRepo(cwd?: string): boolean {
  return git(['rev-parse', '--git-dir'], cwd).ok;
}

export function isDirty(cwd?: string): boolean {
  const result = git(['status', '--porcelain'], cwd);
  return result.ok && result.out.length > 0;
}

export function currentBranch(cwd?: string): string | null {
  const result = git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
  return result.ok ? result.out : null;
}

export function defaultBranch(cwd?: string): string | null {
  // Try symbolic-ref for origin/HEAD first
  const sym = git(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], cwd);
  if (sym.ok && sym.out) {
    // "origin/main" → "main"
    return sym.out.replace(/^origin\//, '');
  }
  // Fallback to current branch
  return currentBranch(cwd);
}

export function hasGithubRemote(cwd?: string): boolean {
  const result = git(['remote', '-v'], cwd);
  return result.ok && result.out.includes('github.');
}
