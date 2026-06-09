export const VALID_BOTS = [
  'bugs', 'security', 'docs', 'test-gaps', 'a11y', 'i18n',
  'perf', 'tech-debt', 'arch', 'infra', 'fixer',
] as const;

export type BotName = (typeof VALID_BOTS)[number];
