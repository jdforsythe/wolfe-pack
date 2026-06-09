# The reviewable plan (Phase 5)

One rendered artifact, in-session. The user approves the whole thing or edits
line items — interrogation happens here, not in twenty questions. Every claim
shows its evidence. Nothing executes until "approve".

## Required sections, in order

### 1. Detected stack

Table: detection → value → evidence (file or command). Include the
ambiguities you resolved and how.

### 2. Verification trial

The tier verdict with consequences spelled out:

> **Tier: partial.** Install and build are green; the integration tests need
> a running Postgres (connection refused on :5432 — `compose.yaml` service
> `db`). Findings the pack can't verify here will be filed as issues marked
> `[unverified]` — never auto-PR'd. Unit tests (`<test_subset>`) are green
> and will be used for verification where they cover the finding.

### 3. Roster

Every catalog bot, grouped:

- **Enabled** — with the one-line reason ("test framework: vitest →
  test-gaps on").
- **Available but off** — with the reason ("no UI surface detected → a11y
  off; enable any time in WOLFE.md — it no-ops gracefully").

Plus the autonomy level chosen in Q1 and what it means in one sentence.

### 4. Specialists

Table: slot → action (reuse / enhance / forge) → file path → provenance.
Enhancement offers appear as explicit opt-in items with their diffs
attached. Exotic/uncovered slots state the fallback (generic language
specialist, or specialist-less degraded mode — gates hold either way).

### 5. Files to be written

The exact tree, nothing elided:

```
WOLFE.md
CLAUDE.md                      (+1 pointer line | created with pointer)
.gitignore                     (+2 lines)
.claude/skills/wolfe-init/     (re-run interview)
.claude/skills/wolfe-bugs/     ...one per enabled bot
.claude/agents/wolfe-*.md      ...forged specialists
.wolfe/freshness.yml
.wolfe/manifest.yml
.github/workflows/wolfe-*.yml  (Actions rung only)
```

### 6. GitHub changes (only with `gh` authenticated)

- Labels: the `wolfe:` set to create; the existing `type:`/`severity:`
  families that will be reused.
- Branch protection: current state → proposed state, with the exact JSON
  payload that would be applied, additions-only, and the honest framing
  ("guarantees a bot PR can't merge without CI green + a human approval").
  If rulesets govern the branch: report-only, with a suggested ruleset
  snippet.
- Workflows: each file with its cron, spelled out ("bugs: Mondays 08:23 UTC
  — minute is a per-repo hash so the world's wolfe packs don't stampede").

### 7. Secrets

What will be set (`CLAUDE_CODE_OAUTH_TOKEN`; at autonomy ≥2 `WOLFE_APP_ID` +
`WOLFE_APP_PRIVATE_KEY` via `npx wolfe-pack app setup`), and the handling
rule: values flow stdin-only, never echoed, never written to disk.

### 8. Cost posture

Seed calibration (`minutes_per_kloc`, ceiling multiplier, hard cap), what a
typical weekly run of this roster costs in budget-minutes at this repo's
size, and the note that calibration self-corrects from real run history.

## The gate

End with exactly: **approve** (execute Phases 6–8 as written) / **edit**
(adjust line items → re-render the plan) / **abort** (end with zero changes).
No other path writes anything.
