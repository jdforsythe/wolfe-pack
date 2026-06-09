import { describe, it, expect } from 'vitest';
import { buildInitPrompt, buildRunPrompt } from '../src/lib/prompt-builder.js';

describe('buildInitPrompt', () => {
  const base = {
    templatesRoot: '/some/path/templates',
    mode: 'fresh' as const,
    depth: 'light' as const,
    facts: {
      defaultBranch: 'main',
      hasRemote: true,
      ghAuthed: true,
      dirty: false,
      claudeVersion: '2.1.200',
    },
  };

  it('includes the template root path with the init SKILL.md reference', () => {
    const prompt = buildInitPrompt(base);
    expect(prompt).toContain('/some/path/templates');
    expect(prompt).toContain('SKILL.md');
  });

  it('includes mode in the prompt', () => {
    const fresh = buildInitPrompt({ ...base, mode: 'fresh' });
    expect(fresh).toContain('mode: fresh');

    const reconcile = buildInitPrompt({ ...base, mode: 'reconcile' });
    expect(reconcile).toContain('mode: reconcile');
  });

  it('includes depth in the prompt', () => {
    const light = buildInitPrompt({ ...base, depth: 'light' });
    expect(light).toContain('depth: light');

    const deep = buildInitPrompt({ ...base, depth: 'deep' });
    expect(deep).toContain('depth: deep');
  });

  it('includes preflight facts', () => {
    const prompt = buildInitPrompt(base);
    expect(prompt).toContain('main');
    expect(prompt).toContain('has_github_remote: true');
    expect(prompt).toContain('gh_authed: true');
    expect(prompt).toContain('dirty_tree: false');
    expect(prompt).toContain('2.1.200');
  });

  it('includes the HARD RULE about review-before-write', () => {
    const prompt = buildInitPrompt(base);
    // Must contain the hard rule language
    expect(prompt).toMatch(/HARD RULE/i);
    expect(prompt).toMatch(/write no file|do NOT write any file/i);
    expect(prompt).toMatch(/explicit approval/i);
  });

  it('handles null facts gracefully', () => {
    const prompt = buildInitPrompt({
      ...base,
      facts: { ...base.facts, defaultBranch: null, claudeVersion: null },
    });
    expect(prompt).toContain('(unknown)');
  });
});

describe('buildRunPrompt', () => {
  it('includes the bot name in the skill read instruction', () => {
    const prompt = buildRunPrompt({ bot: 'bugs', dryRun: false });
    expect(prompt).toContain('wolfe-bugs');
    expect(prompt).toContain('SKILL.md');
  });

  it('echoes bot arguments when provided', () => {
    const prompt = buildRunPrompt({ bot: 'bugs', area: 'api', since: '7d', dryRun: true });
    expect(prompt).toContain('area: api');
    expect(prompt).toContain('since: 7d');
    expect(prompt).toContain('dry_run: true');
  });

  it('includes the invocation line with args', () => {
    const prompt = buildRunPrompt({ bot: 'bugs', area: 'api', since: '7d', dryRun: false });
    expect(prompt).toContain('/wolfe-bugs');
    expect(prompt).toContain('api');
    expect(prompt).toContain('--since=7d');
  });

  it('includes the trust boundary restatement', () => {
    const prompt = buildRunPrompt({ bot: 'security', dryRun: false });
    // Must contain trust boundary language
    expect(prompt).toMatch(/trust boundary/i);
    expect(prompt).toMatch(/DATA.*never instructions|DATA — never instructions/i);
  });

  it('includes the run summary YAML persistence requirement', () => {
    const prompt = buildRunPrompt({ bot: 'bugs', dryRun: false });
    expect(prompt).toMatch(/run summary/i);
    expect(prompt).toMatch(/persist/i);
  });

  it('does not include area/since when not provided', () => {
    const prompt = buildRunPrompt({ bot: 'docs', dryRun: false });
    expect(prompt).not.toContain('area:');
    expect(prompt).not.toContain('since:');
    expect(prompt).not.toContain('--since=');
    expect(prompt).not.toContain('dry_run: true');
  });
});
