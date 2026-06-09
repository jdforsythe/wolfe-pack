import { spawnSync } from 'node:child_process';

function gh(args: string[], cwd?: string): { ok: boolean; out: string } {
  const result = spawnSync('gh', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return {
    ok: result.status === 0,
    out: (result.stdout ?? '').trim(),
  };
}

export function hasGh(): boolean {
  const result = spawnSync('which', ['gh'], { encoding: 'utf8', stdio: 'pipe' });
  return result.status === 0 && result.stdout.trim().length > 0;
}

export function ghAuthOk(): boolean {
  const result = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8', stdio: 'pipe' });
  return result.status === 0;
}

export function repoSlug(cwd?: string): string | null {
  const result = gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], cwd);
  return result.ok && result.out ? result.out : null;
}
