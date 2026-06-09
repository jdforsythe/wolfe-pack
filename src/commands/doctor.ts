import { platform } from 'node:os';
import { compareSemver, findClaude, claudeVersion, MIN_TESTED_VERSION } from '../lib/claude.js';
import { isGitRepo } from '../lib/git.js';
import { hasGh, ghAuthOk } from '../lib/gh.js';
import { isInitialized } from '../lib/rerun.js';
import { intro, outroNeutral, printTable, pc } from '../lib/ui.js';

interface CheckRow {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'fail';
}

export async function runDoctor(cwd: string): Promise<void> {
  intro('doctor');

  const rows: CheckRow[] = [];

  // Platform
  const plat = platform();
  rows.push({
    label: 'Platform',
    value: plat,
    status: plat === 'win32' ? 'warn' : 'ok',
  });

  // Node version
  const nodeVer = process.version;
  const nodeMajor = parseInt(nodeVer.slice(1), 10);
  rows.push({
    label: 'Node.js',
    value: nodeVer,
    status: nodeMajor >= 20 ? 'ok' : 'fail',
  });

  // Claude CLI
  const claudePath = findClaude();
  if (!claudePath) {
    rows.push({ label: 'claude CLI', value: 'not found', status: 'fail' });
  } else {
    const ver = claudeVersion(claudePath);
    if (!ver) {
      rows.push({ label: 'claude CLI', value: `found (version unknown)`, status: 'warn' });
    } else {
      const tooOld = compareSemver(ver, MIN_TESTED_VERSION) < 0;
      rows.push({
        label: 'claude CLI',
        value: `${ver}${tooOld ? ` (min tested: ${MIN_TESTED_VERSION})` : ''}`,
        status: tooOld ? 'warn' : 'ok',
      });
    }
  }

  // Git repo
  const inRepo = isGitRepo(cwd);
  rows.push({
    label: 'Git repo',
    value: inRepo ? 'yes' : 'no',
    status: inRepo ? 'ok' : 'fail',
  });

  // gh CLI
  const ghPresent = hasGh();
  if (!ghPresent) {
    rows.push({ label: 'gh CLI', value: 'not found', status: 'fail' });
  } else {
    const authed = ghAuthOk();
    rows.push({
      label: 'gh CLI',
      value: authed ? 'found + authenticated' : 'found (not authenticated)',
      status: authed ? 'ok' : 'warn',
    });
  }

  // Initialized
  const initialized = isInitialized(cwd);
  rows.push({
    label: 'Initialized (WOLFE.md)',
    value: initialized ? 'yes' : 'no — run: npx wolfe-pack init',
    status: initialized ? 'ok' : 'warn',
  });

  // Print table
  console.log('');
  printTable(rows.map(r => [r.label, r.value, r.status]));
  console.log('');

  const failures = rows.filter(r => r.status === 'fail');
  const warnings = rows.filter(r => r.status === 'warn');

  if (failures.length > 0) {
    outroNeutral(
      pc.red(`${failures.length} check(s) failed`) +
      (warnings.length > 0 ? pc.yellow(`, ${warnings.length} warning(s)`) : ''),
    );
    process.exitCode = 1;
  } else if (warnings.length > 0) {
    outroNeutral(pc.yellow(`All checks passed with ${warnings.length} warning(s).`));
  } else {
    outroNeutral(pc.green('All checks passed.'));
  }
}
