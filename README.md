# wolfe-pack

> A coordinated pack of autonomous review-and-fix bots you drop into any
> repository. Claude-Code-native. Verification-gated. **No slop.**

```bash
npx wolfe-pack init
```

That's the whole setup. It explores your repo, asks **two questions**, shows
you a complete plan, and — only after you approve — scaffolds a tailored bot
crew **into your repo**. You own every file, and every prompt is readable
markdown.

## What you get

The pack hunts across ten categories and closes the loop on what it finds:

| Bot | Hunts | Verified means |
|---|---|---|
| `wolfe-bugs` | runtime/logic errors, races, data integrity | a reproducer test that fails before the fix, passes after |
| `wolfe-security` | injection, authz flaws, secrets, vulnerable deps | reachability proven locally or tool-verified (always file-only — humans gate security) |
| `wolfe-docs` | documentation drift — and the pack's own files | the broken thing mechanically re-checked; prose claims cite `file:line` |
| `wolfe-test-gaps` | untested paths, vacuous tests, weak assertions | the new test fails before the gap closes (or under a stated mutation) |
| `wolfe-a11y` | accessibility defects in your UI code | an automated check goes red → green |
| `wolfe-i18n` | locale key parity, ICU mismatches, hardcoded strings | a mechanical check goes red → green; never machine-translates |
| `wolfe-perf` | N+1s, hot-path waste, query wins | a real benchmark (warmups, iterations, median±stdev) or query-plan diff |
| `wolfe-tech-debt` | duplication, dead code, shallow modules | existing tests pass **unchanged** (risky refactors get characterization tests first) |
| `wolfe-arch` | undocumented decisions, violated ADRs | anchored quotes — decision sentence + offending `file:line` |
| `wolfe-infra` | Dockerfiles, CI workflows, IaC posture | the validator reproduces the flag, then goes clean |
| `winston-wolfe` | **the namesake** — drains your approved-issue queue into merge-ready PRs | the repo's own verify command, fully green, tests-first |

Bots whose surface doesn't exist in your repo no-op gracefully — a CLI tool
gets no a11y bot unless you ask for it.

## No slop, by construction

The defining promise: **nothing is surfaced unverified.**

- A finding only becomes a **draft PR** when it carries a failing test + a
  verified fix and clears a confidence gate (≥0.85).
- Medium confidence (0.6–0.85) → a labeled issue with evidence and a
  suggested verification. Below that → discarded, counted, never filed.
- Where the pack *can't* run your code (tests need a database it doesn't
  have), findings **degrade to issues marked `[unverified]`** — never PRs.
  No environment, no exceptions, no override.
- Every artifact carries a fingerprint; rejected findings (`wolfe:rejected`)
  are never re-filed. Per-run caps, scope-relative budgets, and a hard
  wall-clock ceiling bound every run.

## The autonomy dial

Verification is always on. Autonomy only decides what a *verified* finding
becomes — and it starts conservative:

```
0  report artifact only
1  + file issues                      ← default
2  + draft PRs (failing test + fix)
3  + the fixer drains your queue
```

The loop at autonomy 3: a bot files an issue → **you** label it
`wolfe:queued` → the fixer claims it (`wolfe:fixing`), writes the failing
test, fixes it, drives your CI green, opens a ready-for-review PR — and
**stops short of merge. Always.** Bots can't approve, can't merge, can't
touch your workflow files; branch protection plus least-privilege tokens
make that structural, not aspirational.

## Two ways to run

**Local (zero setup).** `npx wolfe-pack run bugs --dry-run` runs in your
authenticated session — your Claude subscription, your `gh` login, your
commit signature. Bot PRs trigger CI like yours do. Loop it however you like.

**GitHub Actions (while you sleep).** Opt in during init: weekly staggered
hunts, a label-triggered fixer, optional on-PR diff scans. Issues-only
autonomy needs one secret (your Claude credential). Draft-PR autonomy adds a
~2-minute walkthrough that creates **your own** GitHub App (no third-party
trust) — required because `GITHUB_TOKEN`-authored PRs never trigger CI, and
a bot PR without CI can't satisfy your safety rails.

## What lands in your repo

```
WOLFE.md                        ← the index: stack, areas, commands, roster, registry
CLAUDE.md                       ← +1 pointer line
.claude/skills/wolfe-*/         ← the bots (readable markdown, verbatim, you own them)
.claude/agents/wolfe-*.md       ← specialists forged for *your* stack
.wolfe/                         ← freshness ledger + run history (runs gitignored)
.github/workflows/wolfe-*.yml   ← only if you chose Actions
```

`WOLFE.md` is the pack's single source of repo truth — visible, readable,
machine-maintained by the docs steward, and the only file bots hardcode a
link to. Your existing agents are **reused, never overwritten**; your labels
are reused; everything the pack creates is namespaced `wolfe:`/`wolfe-*`.

## Cost, honestly

Autonomous fleets die by surprise bills, so budgets are structural: every
run's budget scales with its scope (KLOC or diff size), calibrated from your
own run history; at 75% it stops fanning out, at 90% it triages what it has,
and it always reports what it skipped. Tiered models (cheap scans → mid-tier
specialists → top-tier gates) keep the floor low, and every run summary
records tokens and approximate cost.

## About the name

In *Pulp Fiction*, when two guys have a catastrophe on their hands and no idea
what to do, somebody makes a call and **Winston Wolfe** shows up. He doesn't
panic, doesn't moralize, doesn't make it weird — he looks at the mess, makes a
plan, and cleans it up. Calm, fast, exact. *The Wolf solves problems.*

That's the bot the whole package is named after: `winston-wolfe` is the fixer
— the one that takes a triaged issue and quietly turns it into a merged fix.
The hunters find the bodies; the Wolf makes them disappear (the right way:
with a failing test, a verified fix, and a PR a human actually merges). A
*pack* of bots, led in spirit by the Wolf. Naturally, he stops short of
merging — even the Wolf knows the cleanup ends when a human signs off.

> And yes, he's polite about it. The pack reuses your labels, never clobbers
> your files, and asks before it writes anything — a courteous guest who
> cleans up after himself and lets you have the final say.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`claude` CLI)
- `git`, and `gh` (authenticated) for anything beyond report-only
- Node ≥ 20 to run `npx wolfe-pack`
- macOS / Linux / WSL

## FAQ

**Why Claude-Code-native instead of runtime-agnostic?** The tiered subagent
orchestration the gates depend on is a Claude Code primitive. An agnostic v1
would multiply the surface 5–10× and bet the product on abstractions over
fast-moving runtimes. Deliberate scope, recorded in
[DESIGN.md](https://github.com/jdforsythe/wolfe-pack/blob/master/DESIGN.md).

**What if a specialist is wrong?** Specialists *advise*; bots *gate*. A weak
specialist degrades expertise, never safety — nothing a specialist returns
can skip verification or open a PR by itself.

**Prompt injection?** Repository content, issue bodies, diffs, and all
subagent output are treated as partially-trusted data, never instructions —
stated in every bot, enforced by least-privilege tokens that can't merge or
reach other repos even if something slips.

**Can I turn a bot off? Add one later?** Yes — the roster lives in
`WOLFE.md` (`wolfe/bots`). Every catalog bot is opt-in-able any time; absent
surfaces no-op.

**Where do I read the design?**
[DESIGN.md](https://github.com/jdforsythe/wolfe-pack/blob/master/DESIGN.md) —
every locked decision with its rationale and rejected alternatives.
[docs/architecture.md](https://github.com/jdforsythe/wolfe-pack/blob/master/docs/architecture.md)
covers implementation mechanics;
[docs/deferred.md](https://github.com/jdforsythe/wolfe-pack/blob/master/docs/deferred.md)
tracks what v1 deliberately left out. (Absolute links — the design docs live
in the repo, not the npm tarball.)

## License

MIT
