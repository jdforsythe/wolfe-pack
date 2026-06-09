# wolfe-pack — implementation architecture

The implementation-level decisions behind v1, recorded so contributors don't
accidentally undo deliberate choices. Product-level decisions (and their
rejected alternatives) live in [DESIGN.md](../DESIGN.md).

## The two-layer rule, made concrete

**Bots are fixed; specialists are forged.** In code terms:

- Every bot ships as a **fully static SKILL.md** — zero template tokens,
  byte-identical in every adopter repo. All repo specifics (stack, areas,
  commands, roster, specialist registry) live in `WOLFE.md`, which bots read
  at runtime. This is what makes the anti-rot story real: updating a bot is
  replacing a verbatim file, and nothing repo-specific is ever baked into
  prompt text.
- Specialists are generated at init from `templates/specialists/recipe.md`:
  four **[LITERAL]** contract sections (Review Interface, Implementer
  Interface, Hard Rules, Interaction Model) that must be byte-identical in
  every specialist, plus forged content slots (role identity, vocabulary,
  SOP, watchlist, contributed scan patterns).

## Single-source kernel text

The safety-critical prose — trust boundary, verification degradation rule,
confidence calibration, output routing, budget mechanics, the 9-phase
skeletons, fingerprint spec, run-summary schema — lives **once** in
`kernel/partials/`. Per-bot sources in `kernel/bots/*.md` pull them in with
`<!-- @include partials/<name>.md -->` directives;
`scripts/assemble-bots.mjs` expands them into the committed, shipped
`templates/bots/wolfe-*/SKILL.md` files. `npm run assemble:check` (wired into
`verify`) fails on drift, so the shipped files can never silently diverge
from the kernel. Edit kernel sources, run `npm run assemble`, commit both.

## The index (`WOLFE.md`)

- One visible file at the adopter repo root. Machine surface = fenced blocks
  whose info string is `yaml wolfe/<section>`; everything else is
  non-normative human prose.
- Parse contract is **fail-closed**: a bot that can't read a block it needs
  aborts with `result: aborted (index unreadable)` — it never guesses.
- Exactly one writer at steady state: the docs steward (`wolfe-docs`). init
  writes it once; every other bot is read-only on it.
- Binds to globs, area names, and commands — never exact paths or line
  numbers. The only runtime substitution bots perform is `{file}`/`{globs}`
  inside recorded command strings.
- Machine data that doesn't belong in a reviewed file lives in `.wolfe/`:
  `freshness.yml` + `manifest.yml` are committed; `runs/` + `reports/` are
  gitignored.
- The authoritative field-by-field schema lives with its owner:
  `templates/bots/wolfe-docs/references/index-schema.md`.

## Scope selection & anti-collision

The internal pattern this generalizes used a fixed domain rotation with
schedule offsets. Genericized:

- **Scope:** least-recently-hunted area per bot, derived from the run log;
  deterministic `day_of_year % area_count` fallback; single-area repos use
  since-windows.
- **Anti-collision:** a runtime **file-skip set** built in Phase 1 from every
  open wolfe PR/issue across all categories. Correctness no longer depends on
  cron choreography (crons are still staggered for politeness; the
  `wolfe-pack-runner` concurrency group in CI is the backstop).

## Run history & cost

- Per-run YAML records append as comments to a pinned `wolfe:run-log` issue
  (readable from both backends) and mirror to `.wolfe/runs/`.
- Calibration (`minutes_per_kloc` per bot) distills into `wolfe/ops` in the
  index, recomputed by the steward from real runs; shipped values are labeled
  seeds.
- The cost ceiling is enforced on **observables** — wall-clock checkpoints
  (75% freeze fan-out / 90% force triage) and absolute fan-out caps. Token
  counts are recorded post-hoc, not estimated mid-run. Honest v1; revisit
  when run data accrues.

## Execution backends

- **Local** (`wolfe-pack run <bot>`): the user's authenticated identity —
  PRs trigger CI natively, commits sign with their key, zero secrets.
  Interactive by default (the demo); `--headless` builds an `--allowedTools`
  list from the index's recorded commands.
- **Actions**: a reusable `wolfe-run.yml` + thin per-bot callers. Stack setup
  is **materialized at scaffold time** (concrete steps, no runtime
  conditionals — the user owns the file). The same workflow serves every
  autonomy level: an App-token step with a step-level secrets-presence `if`
  falls back to `github.token` when the App isn't configured.
- The GitHub App is the **user's own**, created via the manifest flow
  (`wolfe-pack app setup`) — required at autonomy ≥2 because
  `GITHUB_TOKEN`-authored PRs trigger no CI. Least privilege:
  contents/issues/PRs write; no admin; no workflows-write.

## Verification bring-up (v1 line)

init proves what it can actually run (install → build → test), records the
tier (`full`/`partial`/`none`), timeouts, and evidence-backed blockers
(`requires`) in `wolfe/verification`. Bots consult the tier and pre-route
unverifiable findings to `[unverified]` issues. CI runs recorded commands
only — **no service/datastore bring-up in v1** (users may hand-add
`services:` to the workflow they own). "No unverified PR" therefore holds by
construction everywhere.

## The CLI's job (deliberately dumb)

`npx wolfe-pack init` does preflight, builds a bootstrap prompt, and launches
`claude --add-dir <templates>` — the npx package directory is the read-only
staging area, so nothing is written before the in-session plan is approved.
All intelligence (detection, interview, scaffolding, forging) lives in
`templates/init/SKILL.md`. The CLI never writes into the user's repo (the
`run` lockfile and headless logs under `.wolfe/runs/` are the one exception).

## Privacy guardrail

wolfe-pack generalizes a private production system. `test/forbidden-strings.test.ts`
scans every tracked file for a base64-encoded token list (so the test file
itself stays clean) covering the private origin's names, paths, labels, and
hosts. It runs in `npm run verify` and must stay green forever. Commit
messages are swept manually at release time.

## Package mechanics

TypeScript, ESM-only, Node ≥ 20. Zero runtime dependencies — the CLI bundles
its few libraries via tsup `noExternal` into a single `dist/cli.js`.
`templates/` ships raw in the tarball (readable prompts are part of the
product). `DESIGN.md` stays in the repo but out of the tarball.
