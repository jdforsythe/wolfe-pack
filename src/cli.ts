import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { pc } from './lib/ui.js';
import { VALID_BOTS } from './lib/bots.js';

// Version: injected at build time by tsup; falls back to package.json at runtime.
declare const __WOLFE_PACK_VERSION__: string;

function getVersion(): string {
  try {
    return __WOLFE_PACK_VERSION__;
  } catch {
    // Fallback for dev/test runs where the define is absent
    try {
      const pkgPath = join(fileURLToPath(new URL('..', import.meta.url)), 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
      return pkg.version;
    } catch {
      return '0.0.0';
    }
  }
}

const HELP = `
${pc.bold(pc.cyan('wolfe-pack'))} — autonomous, verification-gated review-and-fix bots for your repo

${pc.bold('Usage:')}
  npx wolfe-pack <command> [options]

${pc.bold('Commands:')}
  ${pc.cyan('init')} [--deep]
      Initialize wolfe-pack in the current repo (or reconcile an existing setup).
      --deep    Run the full relentless interview for per-class configuration.

  ${pc.cyan('run')} <bot> [options]
      Run a bot against the current repo.
      Bots: ${VALID_BOTS.join(', ')}
      --area=<name>    Scope to a specific area defined in WOLFE.md.
      --since=<Nd>     Restrict to changes in the last N days (e.g. --since=7d).
      --dry-run        Write a report to .wolfe/reports/ instead of filing issues/PRs.
      --headless       Non-interactive: stream output to .wolfe/runs/ logfile.
      --yolo           Skip all tool permission checks (dangerous — use with care).
      --timeout=<Nm>   Timeout in minutes (default: 90m).

  ${pc.cyan('doctor')}
      Check your environment: claude CLI, gh CLI, git repo, initialization status.

  ${pc.cyan('app')} setup [--no-browser]
      Create a GitHub App for unattended Actions runs via the manifest flow.
      --no-browser    Manual mode: print manifest JSON + instructions instead of opening a browser.

${pc.bold('Global options:')}
  --version    Print version and exit.
  --help       Show this help text.

${pc.bold('Quick start:')}
  npx wolfe-pack init
  npx wolfe-pack run bugs --dry-run
  npx wolfe-pack doctor

${pc.bold('Docs:')} https://github.com/jdforsythe/wolfe-pack#readme
`.trim();

async function main(): Promise<void> {
  // Parse top-level args
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: false,
    options: {
      version: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
      deep: { type: 'boolean' },
      area: { type: 'string' },
      since: { type: 'string' },
      'dry-run': { type: 'boolean' },
      headless: { type: 'boolean' },
      yolo: { type: 'boolean' },
      timeout: { type: 'string' },
      'no-browser': { type: 'boolean' },
    },
  });

  if (values.version) {
    console.log(getVersion());
    return;
  }

  if (values.help || positionals.length === 0) {
    console.log(HELP);
    return;
  }

  const command = positionals[0];
  const cwd = process.cwd();

  if (command === 'init') {
    const { runInit } = await import('./commands/init.js');
    await runInit({ deep: values.deep === true, cwd });
    return;
  }

  if (command === 'run') {
    const bot = positionals[1];
    if (!bot) {
      console.error(pc.red('Error: run requires a bot name.\n'));
      console.log(`Valid bots: ${VALID_BOTS.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    const { runRun, parseTimeoutArg } = await import('./commands/run.js');
    const area = typeof values.area === 'string' ? values.area : undefined;
    const since = typeof values.since === 'string' ? values.since : undefined;
    const timeout = typeof values.timeout === 'string' ? values.timeout : undefined;
    await runRun({
      bot,
      area,
      since,
      dryRun: values['dry-run'] === true,
      headless: values.headless === true,
      yolo: values.yolo === true,
      timeoutMs: parseTimeoutArg(timeout),
      cwd,
    });
    return;
  }

  if (command === 'doctor') {
    const { runDoctor } = await import('./commands/doctor.js');
    await runDoctor(cwd);
    return;
  }

  if (command === 'app') {
    const sub = positionals[1];
    if (sub === 'setup') {
      const { runAppSetup } = await import('./commands/app-setup.js');
      await runAppSetup({ noBrowser: values['no-browser'] === true, cwd });
      return;
    }
    console.error(pc.red(`Unknown app subcommand: ${sub ?? '(none)'}`));
    console.log('Available: app setup');
    process.exitCode = 1;
    return;
  }

  console.error(pc.red(`Unknown command: ${command}`));
  console.log(`\nRun ${pc.cyan('wolfe-pack --help')} to see available commands.`);
  process.exitCode = 1;
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(pc.red(`\nError: ${msg}`));
  if (process.env['WOLFE_DEBUG'] && err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exitCode = 1;
});
