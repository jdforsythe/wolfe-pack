import { describe, it, expect, beforeAll } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(new URL('..', import.meta.url).pathname);
const CLI = join(ROOT, 'dist', 'cli.js');

let buildFailed = false;

beforeAll(() => {
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'pipe', timeout: 60_000 });
  } catch (e) {
    buildFailed = true;
    console.warn('Build failed — skipping CLI black-box tests.', e instanceof Error ? e.message : e);
  }
}, 90_000);

function skipIfBuildFailed(): void {
  if (buildFailed) {
    // Use vitest's skip mechanism via expect
    expect.soft(buildFailed).toBe(false);
  }
}

interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], opts?: { cwd?: string }): CliResult {
  const result = spawnSync('node', [CLI, ...args], {
    cwd: opts?.cwd ?? ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 15_000,
  });
  return {
    status: result.status,
    stdout: typeof result.stdout === 'string' ? result.stdout : String(result.stdout ?? ''),
    stderr: typeof result.stderr === 'string' ? result.stderr : String(result.stderr ?? ''),
  };
}

describe('CLI black-box tests', () => {
  it('--help outputs all commands', () => {
    skipIfBuildFailed();
    const result = runCli(['--help']);
    expect(result.status).toBe(0);
    const out = (result.stdout ?? '') + (result.stderr ?? '');
    expect(out).toContain('init');
    expect(out).toContain('run');
    expect(out).toContain('doctor');
    expect(out).toContain('app');
  });

  it('--version outputs a semver string', () => {
    skipIfBuildFailed();
    const result = runCli(['--version']);
    expect(result.status).toBe(0);
    const ver = (result.stdout ?? '').trim();
    expect(ver).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('init in a non-git directory exits 1 and mentions git', () => {
    skipIfBuildFailed();
    const tmpDir = mkdtempSync(join(tmpdir(), 'wolfe-cli-test-'));
    try {
      const result = runCli(['init'], { cwd: tmpDir });
      expect(result.status).toBe(1);
      const out = (result.stdout ?? '') + (result.stderr ?? '');
      expect(out.toLowerCase()).toMatch(/git/);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('run with an unknown bot exits 1 and names valid bots', () => {
    skipIfBuildFailed();
    const tmpDir = mkdtempSync(join(tmpdir(), 'wolfe-cli-test-'));
    try {
      const result = runCli(['run', 'bogus-bot'], { cwd: tmpDir });
      expect(result.status).toBe(1);
      const out = (result.stdout ?? '') + (result.stderr ?? '');
      // Should mention valid bots
      expect(out).toMatch(/bugs/);
      expect(out).toMatch(/security/);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('doctor runs and exits 0 or 1 without crashing', () => {
    skipIfBuildFailed();
    const result = runCli(['doctor']);
    // Either 0 (all good) or 1 (some check failed) but must not crash (not 2, not null)
    expect([0, 1]).toContain(result.status);
    // Must not throw/crash (exit code 2 or -1 would indicate crash)
    expect(result.status).not.toBeNull();
  });

  it('unknown command exits 1 with a helpful message', () => {
    skipIfBuildFailed();
    const result = runCli(['not-a-real-command']);
    expect(result.status).toBe(1);
    const out = (result.stdout ?? '') + (result.stderr ?? '');
    expect(out.toLowerCase()).toMatch(/unknown command|not-a-real-command/);
  });

  it('no arguments shows help without error', () => {
    skipIfBuildFailed();
    const result = runCli([]);
    expect(result.status).toBe(0);
    const out = (result.stdout ?? '') + (result.stderr ?? '');
    expect(out).toContain('wolfe-pack');
  });
});
