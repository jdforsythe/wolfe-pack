import * as clack from '@clack/prompts';
import pc from 'picocolors';

export { pc };

export function intro(title: string): void {
  clack.intro(pc.bold(pc.cyan(` wolfe-pack — ${title} `)));
}

export function outro(message: string): void {
  clack.outro(pc.green(message));
}

export function outroNeutral(message: string): void {
  clack.outro(message);
}

export function note(message: string, title?: string): void {
  clack.note(message, title);
}

export function log(message: string): void {
  clack.log.info(message);
}

export function warn(message: string): void {
  clack.log.warn(pc.yellow(message));
}

export function error(message: string): void {
  clack.log.error(pc.red(message));
}

export function step(message: string): void {
  clack.log.step(message);
}

export function spinner(): ReturnType<typeof clack.spinner> {
  return clack.spinner();
}

export async function confirm(opts: {
  message: string;
  initialValue?: boolean;
}): Promise<boolean> {
  const result = await clack.confirm(opts);
  if (clack.isCancel(result)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result as boolean;
}

export async function password(opts: { message: string }): Promise<string> {
  const result = await clack.password(opts);
  if (clack.isCancel(result)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result as string;
}

export async function text(opts: {
  message: string;
  placeholder?: string;
  validate?: (value: string) => string | undefined;
}): Promise<string> {
  const result = await clack.text(opts);
  if (clack.isCancel(result)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }
  return result as string;
}

export function printTable(rows: Array<[string, string, string?]>): void {
  const col1 = Math.max(...rows.map(([a]) => a.length)) + 2;
  const col2 = Math.max(...rows.map(([, b]) => b.length)) + 2;
  for (const [label, value, status] of rows) {
    const icon = status === 'ok' ? pc.green('✓') : status === 'warn' ? pc.yellow('⚠') : status === 'fail' ? pc.red('✗') : ' ';
    console.log(`  ${icon} ${label.padEnd(col1)}${value.padEnd(col2)}`);
  }
}
