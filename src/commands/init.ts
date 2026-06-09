import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { platform } from 'node:os';
import { findClaude, claudeVersion, spawnClaude } from '../lib/claude.js';
import { isGitRepo, isDirty, defaultBranch, hasGithubRemote } from '../lib/git.js';
import { ghAuthOk } from '../lib/gh.js';
import { templatesRoot } from '../lib/templates.js';
import { isInitialized } from '../lib/rerun.js';
import { buildInitPrompt } from '../lib/prompt-builder.js';
import { intro, outro, outroNeutral, warn, error, note, confirm, pc } from '../lib/ui.js';

export interface InitOpts {
  deep: boolean;
  cwd: string;
}

export async function runInit(opts: InitOpts): Promise<void> {
  const { deep, cwd } = opts;

  intro('init');

  // 1. Platform guard
  if (platform() === 'win32') {
    error(
      'wolfe-pack requires a POSIX shell environment.\n' +
      'On Windows, use WSL (Windows Subsystem for Linux):\n' +
      '  https://docs.microsoft.com/en-us/windows/wsl/install\n' +
      'Then run wolfe-pack from inside your WSL terminal.',
    );
    process.exitCode = 1;
    return;
  }

  // 2. Claude CLI check
  const claudePath = findClaude();
  if (!claudePath) {
    error(
      'The claude CLI is required but was not found on this system.\n\n' +
      'Install it with one of:\n' +
      '  npm install -g @anthropic-ai/claude-code\n' +
      '  (or use the native installer)\n\n' +
      'Docs: https://docs.anthropic.com/claude/docs/claude-code',
    );
    process.exitCode = 1;
    return;
  }

  // 3. Git repo check
  if (!isGitRepo(cwd)) {
    error(
      'wolfe-pack must be run inside a git repository.\n\n' +
      'Why: the pack reads your commit history, checks out branches, and opens PRs —\n' +
      'all of which require git.\n\n' +
      'To initialize a repo:\n' +
      '  git init && git add . && git commit -m "initial commit"',
    );
    process.exitCode = 1;
    return;
  }

  // 4. Dirty tree warning
  const dirty = isDirty(cwd);
  if (dirty) {
    warn(
      'Your repo has uncommitted changes.\n' +
      'The scaffold is easiest to review as a clean diff — commit or stash first.',
    );
    const proceed = await confirm({
      message: 'Continue with uncommitted changes in the repo?',
      initialValue: false,
    });
    if (!proceed) {
      outroNeutral('Tip: commit or stash your changes, then re-run wolfe-pack init.');
      return;
    }
  }

  // 5. Reconcile mode check
  const reconcile = isInitialized(cwd);
  if (reconcile) {
    note(
      'WOLFE.md (or wolfe skill files) detected — entering reconcile mode.\n' +
      'The wizard will review existing configuration and propose updates.',
      'Reconcile mode',
    );
  }

  // 6. Gather preflight facts
  const branch = defaultBranch(cwd);
  const hasRemote = hasGithubRemote(cwd);
  const ghAuthed = ghAuthOk();
  const ver = claudeVersion(claudePath);

  // 7. Build the prompt
  let tplRoot: string;
  try {
    tplRoot = templatesRoot();
  } catch (e) {
    error(String(e instanceof Error ? e.message : e));
    process.exitCode = 1;
    return;
  }

  const prompt = buildInitPrompt({
    templatesRoot: tplRoot,
    mode: reconcile ? 'reconcile' : 'fresh',
    depth: deep ? 'deep' : 'light',
    facts: {
      defaultBranch: branch,
      hasRemote,
      ghAuthed,
      dirty,
      claudeVersion: ver,
    },
  });

  // 8. Spawn claude interactively — the prompt is a positional argument so the
  // session stays interactive (the interview asks questions and gates on plan
  // approval; --print would run headless and break that).
  const result = spawnClaude(
    ['--add-dir', tplRoot, prompt],
    { cwd, inherit: true },
  );

  const exitCode = result.status ?? 1;

  // 9. Epilogue
  const wolfeExists = existsSync(join(cwd, 'WOLFE.md'));
  if (wolfeExists) {
    outro(
      'wolfe-pack initialized! Try it out:\n\n' +
      pc.cyan('  npx wolfe-pack run bugs --dry-run'),
    );
  } else {
    outroNeutral(
      'Nothing was changed unless you approved it.\n' +
      'You can re-run wolfe-pack init at any time.',
    );
  }

  process.exitCode = exitCode === 0 ? 0 : exitCode;
}
