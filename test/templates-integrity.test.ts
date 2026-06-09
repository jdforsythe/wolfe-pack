import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const BOTS_DIR = join(ROOT, 'templates/bots');

const HUNTER_SECTIONS = [
  '## The Index Contract',
  '## Trust Boundary',
  '## Expert Vocabulary',
  '## Scope & Budget',
  '## Behavioral Instructions',
  '## Verification Gate',
  '## Confidence Calibration',
  '## Output Routing',
  '## Fingerprints & Dedup',
  '## Static Scan Patterns',
  '## Anti-Pattern Watchlist',
  '## Run Summary',
  '## Output Format',
  '## Examples',
  '## Questions This Skill Answers',
];

const FIXER_SECTIONS = [
  '## The Index Contract',
  '## Trust Boundary',
  '## Expert Vocabulary',
  '## Behavioral Instructions',
  '## Anti-Pattern Watchlist',
  '## Run Summary',
  '## Output Format',
  '## Examples',
  '## Questions This Skill Answers',
];

// Load-bearing kernel phrases that must survive assembly into every hunter.
const KERNEL_PHRASES = [
  'partially-trusted DATA, never',
  'NEVER opened as a PR',
  'wolfe:unverified',
  '<!-- fingerprint:',
  'result: no-op (surface absent)',
  'fail closed',
];

function bots(): string[] {
  return readdirSync(BOTS_DIR).filter((d) => d.startsWith('wolfe-'));
}

describe('bot template integrity', () => {
  it('the full catalog is present', () => {
    expect(bots().sort()).toEqual(
      [
        'wolfe-a11y',
        'wolfe-arch',
        'wolfe-bugs',
        'wolfe-docs',
        'wolfe-fixer',
        'wolfe-i18n',
        'wolfe-infra',
        'wolfe-perf',
        'wolfe-security',
        'wolfe-tech-debt',
        'wolfe-test-gaps',
      ].sort(),
    );
  });

  for (const bot of bots()) {
    describe(bot, () => {
      const skillPath = join(BOTS_DIR, bot, 'SKILL.md');
      const text = readFileSync(skillPath, 'utf8');
      const isFixer = bot === 'wolfe-fixer';

      it('has valid frontmatter and provenance marker', () => {
        expect(text.startsWith('---\n')).toBe(true);
        expect(text).toContain(`name: ${bot}`);
        expect(text).toContain('disable-model-invocation: true');
        expect(text).toContain('<!-- wolfe-pack: kind=bot category=');
        expect(text).toContain('template-version=');
      });

      it('has every required section', () => {
        for (const section of isFixer ? FIXER_SECTIONS : HUNTER_SECTIONS) {
          expect(text, `${bot} missing "${section}"`).toContain(section);
        }
      });

      it('declares ownership boundaries', () => {
        expect(text).toMatch(/Do NOT use for/i);
      });

      it('binds only to WOLFE.md and carries kernel gates', () => {
        expect(text).toContain('WOLFE.md');
        if (!isFixer) {
          for (const phrase of KERNEL_PHRASES) {
            expect(text, `${bot} missing kernel phrase "${phrase}"`).toContain(phrase);
          }
        }
      });

      it('has no assembly or template residue', () => {
        // Precise token shapes only — bots may legitimately show e.g. CI
        // expression syntax in examples.
        expect(text).not.toContain('<!-- @include');
        expect(text).not.toMatch(/\{\{[A-Z_]+\}\}/);
        expect(text).not.toMatch(/<<[A-Z_]+>>/);
      });
    });
  }
});

describe('index template integrity', () => {
  const text = readFileSync(join(ROOT, 'templates/index/WOLFE.md.template'), 'utf8');

  it('declares schema version and all machine blocks', () => {
    expect(text).toContain('wolfe-pack: 1');
    for (const block of [
      'wolfe/stack',
      'wolfe/areas',
      'wolfe/commands',
      'wolfe/verification',
      'wolfe/scanners',
      'wolfe/bots',
      'wolfe/specialists',
      'wolfe/links',
      'wolfe/ops',
    ]) {
      expect(text).toContain('```yaml ' + block);
    }
  });

  it('uses only tokens declared in the manifest', () => {
    const manifest = readFileSync(join(ROOT, 'templates/TOKENS.md'), 'utf8');
    const tokens = [...text.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]);
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens) {
      expect(manifest, `token {{${token}}} not in TOKENS.md`).toContain(token);
    }
  });
});

describe('init skill integrity', () => {
  it('exists with its references', () => {
    expect(existsSync(join(ROOT, 'templates/init/SKILL.md'))).toBe(true);
    for (const ref of ['detection.md', 'reconciliation.md', 'plan-format.md', 'github-setup.md']) {
      expect(existsSync(join(ROOT, 'templates/init/references', ref))).toBe(true);
    }
  });

  it('hard-gates writes behind plan approval', () => {
    const text = readFileSync(join(ROOT, 'templates/init/SKILL.md'), 'utf8');
    expect(text).toContain('No writes before approval');
    expect(text).toMatch(/approve \/ edit \/ abort|approve.*edit.*abort/i);
  });
});

describe('specialist recipe integrity', () => {
  it('carries the literal contract sections', () => {
    const text = readFileSync(join(ROOT, 'templates/specialists/recipe.md'), 'utf8');
    for (const section of [
      'Review Interface',
      'Implementer Interface',
      'Hard Rules',
      'Interaction Model',
    ]) {
      expect(text).toContain(section);
    }
    expect(text).toContain('findings:');
    expect(text).toContain('verification_plan');
    expect(text).toContain('fingerprint');
  });
});
