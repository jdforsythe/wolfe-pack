import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isInitialized } from '../src/lib/rerun.js';

let tmpDirs: string[] = [];

function makeTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'wolfe-rerun-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const d of tmpDirs) {
    try { rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  tmpDirs = [];
});

describe('isInitialized', () => {
  it('returns false for an empty directory', () => {
    const dir = makeTmp();
    expect(isInitialized(dir)).toBe(false);
  });

  it('returns true when WOLFE.md exists at root', () => {
    const dir = makeTmp();
    writeFileSync(join(dir, 'WOLFE.md'), '# WOLFE.md\n');
    expect(isInitialized(dir)).toBe(true);
  });

  it('returns true when a wolfe-* skill directory exists', () => {
    const dir = makeTmp();
    const skillDir = join(dir, '.claude', 'skills', 'wolfe-bugs');
    mkdirSync(skillDir, { recursive: true });
    expect(isInitialized(dir)).toBe(true);
  });

  it('returns false when a non-wolfe skill directory exists', () => {
    const dir = makeTmp();
    const skillDir = join(dir, '.claude', 'skills', 'my-custom-skill');
    mkdirSync(skillDir, { recursive: true });
    expect(isInitialized(dir)).toBe(false);
  });

  it('returns true with multiple wolfe skills', () => {
    const dir = makeTmp();
    mkdirSync(join(dir, '.claude', 'skills', 'wolfe-bugs'), { recursive: true });
    mkdirSync(join(dir, '.claude', 'skills', 'wolfe-security'), { recursive: true });
    expect(isInitialized(dir)).toBe(true);
  });

  it('returns false when .claude/skills exists but is empty', () => {
    const dir = makeTmp();
    mkdirSync(join(dir, '.claude', 'skills'), { recursive: true });
    expect(isInitialized(dir)).toBe(false);
  });
});
