import { existsSync, mkdirSync, readFileSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { findClaude } from '../lib/claude.js';
import { isInitialized } from '../lib/rerun.js';
import { acquireRunLock, releaseRunLock } from '../lib/lock.js';
import { buildRunPrompt } from '../lib/prompt-builder.js';
import { intro, outroNeutral, error, warn, note, confirm, pc } from '../lib/ui.js';
import { VALID_BOTS, resolveBot, skillDirFor } from '../lib/bots.js';

export { VALID_BOTS };
export type { BotName } from '../lib/bots.js';

export interface RunOpts {
  bot: string;
  area?: string;
  since?: string;
  dryRun: boolean;
  headless: boolean;
  yolo: boolean;
  timeoutMs: number;
  cwd: string;
}

function parseTimeoutArg(val: string | undefined): number {
  if (!val) return 90 * 60 * 1000; // 90 minutes default
  const match = /^(\d+)m$/.exec(val);
  if (match) return parseInt(match[1]!, 10) * 60 * 1000;
  const mins = parseInt(val, 10);
  if (!isNaN(mins)) return mins * 60 * 1000;
  return 90 * 60 * 1000;
}

export { parseTimeoutArg };

/**
 * Parse simple YAML key: value pairs (one per line, no nesting, no anchors).
 * Sufficient for the wolfe/commands block which contains string values only.
 */
function parseSimpleYamlMap(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const match = /^(\w[\w_-]*):\s*(.+)$/.exec(line.trim());
    if (match && match[1] && match[2]) {
      result[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
    }
  }
  return result;
}

/** Extract allowed tool programs from WOLFE.md wolfe/commands block. */
function extractAllowedTools(cwd: string): string[] {
  const wolfePath = join(cwd, 'WOLFE.md');
  const base = ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Task', 'WebSearch', 'Bash(git:*)', 'Bash(gh:*)'];

  if (!existsSync(wolfePath)) return base;

  try {
    const content = readFileSync(wolfePath, 'utf8');
    const blockMatch = /```yaml wolfe\/commands\n([\s\S]*?)```/.exec(content);
    if (!blockMatch?.[1]) return base;

    // Parse simple YAML key:value pairs (no yaml lib to avoid CJS bundling issues)
    const commands = parseSimpleYamlMap(blockMatch[1]);
    if (!commands || typeof commands !== 'object') return base;

    const programs = new Set<string>(base);

    for (const value of Object.values(commands)) {
      if (typeof value === 'string' && value.trim()) {
        // Take the first token as the program name
        const prog = value.trim().split(/\s+/)[0];
        if (prog && prog !== 'git' && prog !== 'gh') {
          programs.add(`Bash(${prog}:*)`);
        }
      }
    }

    return [...programs];
  } catch {
    return base;
  }
}

export async function runRun(opts: RunOpts): Promise<void> {
  const { bot: botArg, area, since, dryRun, headless, yolo, timeoutMs, cwd } = opts;

  // 1. Validate / resolve bot name (accepts the `fixer` alias for winston-wolfe)
  const bot = resolveBot(botArg);
  if (!bot) {
    intro(`run ${botArg}`);
    error(
      `Unknown bot: ${pc.bold(botArg)}\n\n` +
      `Valid bots: ${VALID_BOTS.join(', ')}\n` +
      `(\`fixer\` also works as an alias for \`winston-wolfe\`.)`,
    );
    process.exitCode = 1;
    return;
  }

  intro(`run ${bot}`);

  // 2. Require initialization
  if (!isInitialized(cwd)) {
    error(
      `This directory has not been initialized with wolfe-pack.\n\n` +
      `Run: ${pc.cyan('npx wolfe-pack init')}`,
    );
    process.exitCode = 1;
    return;
  }

  // 3. Check for bot skill file
  const skillDir = skillDirFor(bot);
  const skillPath = join(cwd, '.claude', 'skills', skillDir, 'SKILL.md');
  if (!existsSync(skillPath)) {
    error(
      `Skill file not found: .claude/skills/${skillDir}/SKILL.md\n\n` +
      `This bot was not installed during init. Re-run:\n` +
      `  ${pc.cyan('npx wolfe-pack init')}`,
    );
    process.exitCode = 1;
    return;
  }

  // 4. YOLO warning
  if (yolo) {
    warn(
      pc.bold(pc.red('WARNING: --yolo skips all tool permission checks.')) + '\n' +
      'The bot can run ANY command. Only use this in a throwaway/sandboxed environment.',
    );
    const proceed = await confirm({
      message: 'Are you sure you want to run with --yolo (no permission restrictions)?',
      initialValue: false,
    });
    if (!proceed) {
      outroNeutral('Aborted. Re-run without --yolo for the safe default.');
      return;
    }
  }

  // 5. Acquire lock
  try {
    acquireRunLock(cwd);
  } catch (e) {
    error(String(e instanceof Error ? e.message : e));
    process.exitCode = 1;
    return;
  }

  const releaseLock = (): void => {
    try { releaseRunLock(cwd); } catch { /* best-effort */ }
  };

  process.on('exit', releaseLock);
  process.on('SIGINT', () => { releaseLock(); process.exit(130); });
  process.on('SIGTERM', () => { releaseLock(); process.exit(143); });

  try {
    const claudePath = findClaude();
    if (!claudePath) {
      error('claude CLI not found. Run wolfe-pack doctor for guidance.');
      process.exitCode = 1;
      return;
    }

    const prompt = buildRunPrompt({ bot, area, since, dryRun });

    if (!headless) {
      // Interactive mode: the prompt is a positional argument so the session
      // stays interactive (the user approves tool permissions live).
      const result = spawn(claudePath, [prompt], {
        cwd,
        stdio: 'inherit',
      });

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          result.kill('SIGTERM');
          error(`Run timed out after ${Math.round(timeoutMs / 60000)} minutes.`);
          process.exitCode = 1;
          resolve();
        }, timeoutMs);

        result.on('close', (code) => {
          clearTimeout(timer);
          process.exitCode = code ?? 1;
          resolve();
        });
      });
    } else {
      // Headless mode: stream to file + console
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const runsDir = join(cwd, '.wolfe', 'runs');
      mkdirSync(runsDir, { recursive: true });
      const logFile = join(runsDir, `${ts}-${bot}.jsonl`);

      const allowedTools = yolo ? [] : extractAllowedTools(cwd);

      const args: string[] = ['-p', prompt, '--output-format', 'stream-json', '--verbose'];

      if (yolo) {
        args.push('--dangerously-skip-permissions');
      } else {
        args.push('--allowedTools', allowedTools.join(','));
      }

      note(`Streaming output to ${logFile}`, 'Headless run');

      const child = spawn(claudePath, args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const logStream = createWriteStream(logFile, { flags: 'a' });

      child.stdout?.on('data', (chunk: Buffer) => {
        const str = chunk.toString();
        process.stdout.write(str);
        logStream.write(str);
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        process.stderr.write(chunk);
      });

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          child.kill('SIGTERM');
          error(`Run timed out after ${Math.round(timeoutMs / 60000)} minutes.`);
          process.exitCode = 1;
          resolve();
        }, timeoutMs);

        child.on('close', (code) => {
          clearTimeout(timer);
          logStream.end();
          process.exitCode = code ?? 1;
          resolve();
        });
      });
    }
  } finally {
    releaseLock();
  }
}
