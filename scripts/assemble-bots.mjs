#!/usr/bin/env node
/**
 * Assembles the shipped bot skills from single-source kernel text.
 *
 *   kernel/bots/<bot>.md     — per-bot source containing include directives
 *   kernel/partials/<x>.md   — shared kernel text (gates, phases, schemas)
 *     → templates/bots/wolfe-<bot>/SKILL.md   (committed; ships in the tarball)
 *
 * Include directive (whole line):  <!-- @include partials/<name>.md -->
 *
 * Usage:
 *   node scripts/assemble-bots.mjs           # write assembled files
 *   node scripts/assemble-bots.mjs --check   # verify committed files match (CI)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kernelDir = join(root, 'kernel');
const botsSrcDir = join(kernelDir, 'bots');
const outRoot = join(root, 'templates', 'bots');

const INCLUDE_RE = /^<!-- @include (partials\/[a-z0-9-]+\.md) -->$/;

// Bots ship at `templates/bots/wolfe-<name>/` by default. The namesake keeps
// its own name (no `wolfe-` prefix) — that's the whole point of the joke.
const DIR_OVERRIDES = { 'winston-wolfe': 'winston-wolfe' };
const dirFor = (bot) => DIR_OVERRIDES[bot] ?? `wolfe-${bot}`;

function assemble(sourcePath) {
  const lines = readFileSync(sourcePath, 'utf8').split('\n');
  const out = [];
  for (const line of lines) {
    const m = line.match(INCLUDE_RE);
    if (!m) {
      out.push(line);
      continue;
    }
    const partialPath = join(kernelDir, m[1]);
    if (!existsSync(partialPath)) {
      throw new Error(`${sourcePath}: missing partial ${m[1]}`);
    }
    out.push(readFileSync(partialPath, 'utf8').trimEnd());
  }
  return out.join('\n');
}

const check = process.argv.includes('--check');
const sources = readdirSync(botsSrcDir).filter((f) => f.endsWith('.md'));
if (sources.length === 0) {
  console.error('assemble-bots: no sources found in kernel/bots/');
  process.exit(1);
}

let drifted = 0;
for (const src of sources) {
  const bot = src.replace(/\.md$/, '');
  const dirName = dirFor(bot);
  const assembled = assemble(join(botsSrcDir, src));
  const outDir = join(outRoot, dirName);
  const outPath = join(outDir, 'SKILL.md');
  if (check) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
    if (current !== assembled) {
      console.error(`DRIFT: templates/bots/${dirName}/SKILL.md does not match kernel sources`);
      drifted += 1;
    }
  } else {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, assembled);
    console.log(`assembled templates/bots/${dirName}/SKILL.md`);
  }
}

if (check) {
  if (drifted > 0) {
    console.error(`assemble-bots --check: ${drifted} file(s) drifted. Run: npm run assemble`);
    process.exit(1);
  }
  console.log(`assemble-bots --check: ${sources.length} bot(s) clean`);
}
