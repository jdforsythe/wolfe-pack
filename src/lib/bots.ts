export const VALID_BOTS = [
  'bugs', 'security', 'docs', 'test-gaps', 'a11y', 'i18n',
  'perf', 'tech-debt', 'arch', 'infra', 'winston-wolfe',
] as const;

export type BotName = (typeof VALID_BOTS)[number];

/** Friendly aliases accepted on the CLI, resolved to a canonical bot id. */
export const BOT_ALIASES: Record<string, BotName> = {
  fixer: 'winston-wolfe',
};

/** Resolve a user-supplied bot argument (canonical id or alias) to a canonical id, or null. */
export function resolveBot(arg: string): BotName | null {
  if ((VALID_BOTS as readonly string[]).includes(arg)) return arg as BotName;
  return BOT_ALIASES[arg] ?? null;
}

/**
 * The on-disk skill directory for a canonical bot id. Every bot lives at
 * `wolfe-<id>` EXCEPT the namesake, which keeps its own name.
 */
export function skillDirFor(bot: BotName): string {
  return bot === 'winston-wolfe' ? 'winston-wolfe' : `wolfe-${bot}`;
}
