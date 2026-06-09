import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');

/**
 * wolfe-pack generalizes a private internal system. No tracked file may
 * reference that origin. Tokens are stored base64-encoded so this test file
 * never contains the strings it forbids, and failures report only the token
 * index (CI logs are public) — decode locally to see the match.
 */
const FORBIDDEN: string[] = [
  'c2Vuc291cmNl', // 0
  'c2hpcHlhcmQ=', // 1
  'ZGV2L3lhcmQ=', // 2
  'bWVldC10aGUtYm90cw==', // 3
  'amZvcnN5dGhl', // 4 (note: does NOT match the public handle, different char sequence)
  'b3JraW4tbWFu', // 5 (full name — the bare first word is a substring of common English words)
  'YXR0ZW5ib3JvdWdo', // 6
  'YnJvY2tvdmljaA==', // 7
  'ZGF2ZS1yYW1zZXk=', // 8
  'cGF1bC13YWxrZXI=', // 9
  'amFtZXMtbWFkaXNvbg==', // 10
  'c2VuLnNy', // 11
  'dHVyYm9jYWNoZQ==', // 12
  'dHVyYm9fdG9rZW4=', // 13
  'YWdlbnQta25vd2xlZGdl', // 14
  'Ym90LWluLXByb2dyZXNz', // 15
  'Zm9yLWJvdA==', // 16
  'd2lsZGViZWVzdA==', // 17
  'aWxsdW1pbmE=', // 18
  'eG92aXM=', // 19
  'c3MtZml4', // 20
  'YWxsOnE=', // 21
].map((b) => Buffer.from(b, 'base64').toString('utf8').toLowerCase());

const NUL = String.fromCharCode(0);

describe('no private-origin references in tracked files', () => {
  it('finds zero forbidden tokens', () => {
    // Tracked files PLUS untracked-but-not-ignored files, so the guardrail
    // covers everything that could ever be committed or shipped — not just
    // what already was.
    const files = execSync('git ls-files -z --cached --others --exclude-standard', { cwd: ROOT })
      .toString()
      .split(NUL)
      .filter(Boolean)
      .filter((f) => !f.startsWith('test/forbidden-strings'));

    const hits: string[] = [];
    for (const f of files) {
      let text: string;
      try {
        text = readFileSync(join(ROOT, f), 'utf8');
      } catch {
        continue;
      }
      if (text.includes(NUL)) continue; // binary
      const lower = text.toLowerCase();
      FORBIDDEN.forEach((tok, i) => {
        if (lower.includes(tok)) hits.push(`${f}: forbidden token #${i}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
