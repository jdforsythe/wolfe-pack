import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Check whether wolfe-pack has been previously initialized in the given directory.
 * Considers the repo initialized if WOLFE.md exists at root OR any
 * .claude/skills/wolfe-* directory exists.
 */
export function isInitialized(cwd: string): boolean {
  if (existsSync(join(cwd, 'WOLFE.md'))) {
    return true;
  }

  const skillsDir = join(cwd, '.claude', 'skills');
  if (!existsSync(skillsDir)) {
    return false;
  }

  try {
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    return entries.some(e => e.isDirectory() && e.name.startsWith('wolfe-'));
  } catch {
    return false;
  }
}
