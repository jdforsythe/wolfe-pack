import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * Locate the templates/ directory at runtime.
 *
 * Published layout:
 *   <pkg>/dist/cli.js      ← import.meta.url resolves here
 *   <pkg>/templates/       ← one level up from dist/
 *
 * Dev layout (ts-node / vitest):
 *   <pkg>/src/lib/templates.ts  ← two levels up is project root
 *   <pkg>/templates/
 */
export function templatesRoot(): string {
  // import.meta.url is the URL of THIS file
  const thisFile = fileURLToPath(import.meta.url);

  // Candidate 1: sibling of the directory containing this file's parent (dist/ or src/lib/)
  // For dist/cli.js → dist/../templates → <pkg>/templates
  // This handles both the "dist/cli.js" bundle (single file) and an adjacent lib file.
  const candidates: string[] = [];

  // Walk up: from thisFile's dir → parent → look for templates/
  // dist/cli.js is a flat bundle so import.meta.url is dist/cli.js
  // We need to go up ONE level from dist/ to reach the package root.
  // But since the lib files are bundled INTO dist/cli.js at runtime,
  // at runtime import.meta.url will be the dist/cli.js file itself.
  // During dev/test runs (vitest), it's the actual source file.

  // Level 1 up from file's directory
  const dir = new URL('.', import.meta.url);
  const level1 = join(fileURLToPath(dir), '..', 'templates');
  candidates.push(level1);

  // Level 2 up (for src/lib/templates.ts → src/ → root)
  const level2 = join(fileURLToPath(dir), '..', '..', 'templates');
  candidates.push(level2);

  // Level 3 up (extra safety for nested structures)
  const level3 = join(fileURLToPath(dir), '..', '..', '..', 'templates');
  candidates.push(level3);

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `wolfe-pack: templates/ directory not found. Searched:\n${candidates.map(c => `  ${c}`).join('\n')}\n` +
    'This is a packaging issue — please file a bug at https://github.com/jdforsythe/wolfe-pack/issues',
  );
}
