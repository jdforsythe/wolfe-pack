import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');

describe('kernel → templates assembly', () => {
  it('committed bot files match kernel sources (no drift)', () => {
    // Throws (non-zero exit) on drift; output names the drifted files.
    execSync('node scripts/assemble-bots.mjs --check', { cwd: ROOT, stdio: 'pipe' });
  });

  it('every kernel source has a shipped bot and vice versa', () => {
    // Bots ship at `wolfe-<name>/` except the namesake, which keeps its own dir.
    const sources = readdirSync(join(ROOT, 'kernel/bots'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
    const shipped = readdirSync(join(ROOT, 'templates/bots'))
      .filter((d) => d.startsWith('wolfe-') || d === 'winston-wolfe')
      .map((d) => (d === 'winston-wolfe' ? d : d.replace(/^wolfe-/, '')))
      .sort();
    expect(shipped).toEqual(sources);
  });

  it('every shipped bot has output templates', () => {
    const bots = readdirSync(join(ROOT, 'templates/bots')).filter(
      (d) => d.startsWith('wolfe-') || d === 'winston-wolfe',
    );
    for (const bot of bots) {
      expect(
        existsSync(join(ROOT, 'templates/bots', bot, 'references/output-templates.md')),
        `${bot} is missing references/output-templates.md`,
      ).toBe(true);
    }
  });
});
