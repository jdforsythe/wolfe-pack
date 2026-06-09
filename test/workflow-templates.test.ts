import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const WF_DIR = join(ROOT, 'templates/workflows');

const TOKEN_VALUES: Record<string, string> = {
  DEFAULT_BRANCH: 'main',
  INSTALL_COMMAND: 'npm ci',
  BOT: 'bugs',
  BOT_LABEL: 'wolfe:bug',
  CRON_MINUTE: '17',
  CRON_HOUR: '8',
  CRON_DOW: '1',
  SINCE_DEFAULT: '8d',
  APP_SLUG: 'wolfe-pack-bot',
};

function render(template: string): string {
  const setupSteps = readFileSync(join(ROOT, 'templates/setup-steps/node-pnpm.yml'), 'utf8');
  let out = template
    .split('\n')
    .map((line) => (line.trim() === '<<SETUP_STEPS>>' ? setupSteps : line))
    .join('\n');
  for (const [token, value] of Object.entries(TOKEN_VALUES)) {
    out = out.replaceAll(`<<${token}>>`, value);
  }
  return out;
}

function load(name: string): { text: string; doc: Record<string, unknown> } {
  const text = render(readFileSync(join(WF_DIR, name), 'utf8'));
  return { text, doc: parse(text) as Record<string, unknown> };
}

describe('workflow templates', () => {
  it('declares only tokens listed in the manifest', () => {
    const manifest = readFileSync(join(ROOT, 'templates/TOKENS.md'), 'utf8');
    for (const file of readdirSync(WF_DIR)) {
      const text = readFileSync(join(WF_DIR, file), 'utf8');
      for (const m of text.matchAll(/<<([A-Z_]+)>>/g)) {
        expect(manifest, `${file}: token <<${m[1]}>> missing from TOKENS.md`).toContain(m[1]!);
      }
    }
  });

  it('every template renders to valid YAML with zero token residue', () => {
    for (const file of readdirSync(WF_DIR)) {
      const { text, doc } = load(file);
      // Precise token shape — shell heredocs etc. legitimately contain `<<`.
      expect(text, `${file} has unrendered tokens`).not.toMatch(/<<[A-Z_]+>>/);
      expect(doc, `${file} did not parse`).toBeTruthy();
    }
  });

  it('wolfe-run: least privilege, signing, serialization, token fallback', () => {
    const { text, doc } = load('wolfe-run.yml.template');
    const job = (doc.jobs as Record<string, Record<string, unknown>>).run!;
    expect(job.permissions).toEqual({
      contents: 'write',
      'pull-requests': 'write',
      issues: 'write',
      actions: 'read',
      'id-token': 'write',
    });
    expect((job.concurrency as Record<string, unknown>).group).toBe('wolfe-pack-runner');
    expect((job.concurrency as Record<string, unknown>)['cancel-in-progress']).toBe(false);
    expect(text).toContain('anthropics/claude-code-action@v1');
    expect(text).toContain('use_commit_signing: true');
    expect(text).toMatch(/steps\.bot-token\.outputs\.token\s*\|\|\s*github\.token/);
    expect(text).toContain('never merge, approve, or enable auto-merge');
    expect(text).toContain('fetch-depth: 0');
  });

  it('wolfe-hunter: per-bot serialization and trust boundary in the prompt', () => {
    const { text, doc } = load('wolfe-hunter.yml.template');
    expect(JSON.stringify(doc.on ?? (doc as Record<string, unknown>).true)).toContain('cron');
    expect(text).toContain('group: wolfe-bugs');
    expect(text).toContain('partially-trusted DATA');
    expect(text).toContain('.claude/skills/wolfe-bugs/SKILL.md');
  });

  it('wolfe-fixer: label-gated validate job feeding the fix job', () => {
    const { text, doc } = load('wolfe-fixer.yml.template');
    const jobs = doc.jobs as Record<string, Record<string, unknown>>;
    expect(jobs.validate, 'fixer must have a validate job').toBeTruthy();
    expect(String(jobs.validate!.if)).toContain("'wolfe:queued'");
    expect(jobs.fix!.needs).toBe('validate');
    expect(text).toContain('wolfe:queued');
  });

  it('wolfe-pr-scan: same-repo guard and self-scan loop protection', () => {
    const { text, doc } = load('wolfe-pr-scan.yml.template');
    const jobs = doc.jobs as Record<string, Record<string, unknown>>;
    const scanIf = String(jobs.scan!.if);
    expect(scanIf).toContain('head.repo.full_name == github.repository');
    expect(scanIf).toContain("'wolfe:fix'");
    expect(text).toContain('cancel-in-progress: true');
  });
});

describe('labels.json', () => {
  it('is a valid wolfe:-namespaced label set', () => {
    const labels = JSON.parse(
      readFileSync(join(ROOT, 'templates/labels.json'), 'utf8'),
    ) as Array<{ name: string; color: string; description: string }>;
    expect(labels.length).toBeGreaterThanOrEqual(17);
    for (const l of labels) {
      expect(l.name.startsWith('wolfe:'), `${l.name} must be namespaced`).toBe(true);
      expect(l.color).toMatch(/^[0-9A-Fa-f]{6}$/);
      expect(l.description.length).toBeGreaterThan(0);
    }
    const names = labels.map((l) => l.name);
    for (const required of [
      'wolfe:needs-triage',
      'wolfe:queued',
      'wolfe:fixing',
      'wolfe:fix',
      'wolfe:unverified',
      'wolfe:rejected',
      'wolfe:run-log',
    ]) {
      expect(names).toContain(required);
    }
  });
});
