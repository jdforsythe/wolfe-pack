# WOLFE.md index schema — version 1

The authoritative, field-by-field contract for every block in `WOLFE.md`. The
docs steward (`wolfe-docs`) is the SOLE writer of the index; `init` seeds it; the
bots are read-only on it. This file tells the steward exactly what each field
means, who is allowed to write it, and how it parses.

## Parse contract (read this first — fail closed)

- ONLY fenced code blocks whose info string is `yaml wolfe/<section>` are
  machine-read. Everything else in `WOLFE.md` — headings, prose, blockquotes — is
  human commentary and is NEVER parsed as a binding.
- A block must be valid YAML. If a block a bot needs is **missing or
  unparseable**, the bot **fails closed**: it stops, prints
  `result: aborted (index unreadable)`, and tells the user to run
  `npx wolfe-pack doctor`. No defaults are substituted for a broken index.
- The nine blocks are: `wolfe/stack`, `wolfe/areas`, `wolfe/commands`,
  `wolfe/verification`, `wolfe/scanners`, `wolfe/bots`, `wolfe/specialists`,
  `wolfe/links`, `wolfe/ops`.
- **Writer roles** used below: **init** seeds the value at setup; **steward** is
  `wolfe-docs` reconciling against detected reality (Charter 2); **never-bots**
  means no hunter or fixer ever writes it; **human** means a person edits it and
  the steward only *suggests* changes (never silent overwrite).
- Tokens: `{file}`, `{globs}` are the only runtime substitutions, and only in the
  blocks that name them below.

---

## `wolfe/stack` — what this repository is built from

Detected technology fingerprint. **Writer:** init seeds; steward reconciles every
run (index reconciliation). Drives the Surface Predicate and Static-Scan `applies`
tag matching for every bot.

| Field | Type | Meaning |
|---|---|---|
| `languages` | list of string | Programming languages in use (e.g. `typescript`, `python`). |
| `frameworks` | list of string | Application/web frameworks detected. |
| `package_manager` | string | The lockfile-proven package manager (e.g. `pnpm`, `pip`, `cargo`). |
| `datastores` | list of string | Databases/caches/queues (e.g. `postgres`, `redis`). |
| `infra` | list of string | Infra technologies (e.g. `docker`, `terraform`, `github-actions`). |
| `test_frameworks` | list of string | Test runners detected (e.g. `vitest`, `pytest`). |
| `i18n_framework` | string \| null | The localization framework, or `null` when none. |
| `ui_surface` | bool | Whether the repo renders a user-facing UI (gates a11y/i18n surfaces). |
| `default_branch` | string | The branch reproducers must fail against and PRs target. |
| `signed_commits_required` | bool | Whether commits must be signed; bots honor this in Phase 7. |

## `wolfe/areas` — the units of work a bot scopes to

The repository carved into hunt-able areas. **Writer:** init seeds; steward
reconciles globs against reality. A bot scopes one area per run.

| Field | Type | Meaning |
|---|---|---|
| `areas` | list of object | The area list, in slot order (used by the day-of-year fallback). |
| `areas[].name` | string | Stable area name; the `[area]` argument matches this. |
| `areas[].globs` | list of string | File globs defining the area's extent. |
| `areas[].tags` | list of string | Technology/surface tags; intersect with Static-Scan `applies` and specialist slots. |
| `areas[].index` | string (reserved) | Reserved `path:` to a future per-package sub-index; unset today, parsers ignore unknown keys. |

## `wolfe/commands` — how the pack runs this repo

The command vocabulary for install, verify, and test. **Writer:** init seeds;
steward reconciles against manifest scripts. A `null` value means the command
does not exist here — bots degrade accordingly, never invent one. `{file}` is
substituted by `test_single`; `{globs}` by scanner invocations.

| Field | Type | Meaning |
|---|---|---|
| `install` | string \| null | Bootstrap/dependency-install command. |
| `verify` | string \| null | The authoritative green gate; Phase 6 falls back to `test` when null. |
| `test` | string \| null | Full test-suite command. |
| `test_single` | string \| null | Run one test file; MUST contain the `{file}` token. |
| `lint` | string \| null | Linter command (informational; lint findings belong to no bot). |
| `typecheck` | string \| null | Type-check command. |
| `build` | string \| null | Build/compile command. |
| `bench` | string \| null | Benchmark command (wolfe-perf's protocol). |
| `e2e` | string \| null | End-to-end test command. |
| `env_requirements` | list of object | Commands that need extra services/secrets to run. |
| `env_requirements[].command` | string | Which command above has the requirement. |
| `env_requirements[].needs` | list of string | Service/secret names that command needs (cross-ref `wolfe/verification.requires`). |

## `wolfe/verification` — what the pack proved it can run

The trust tier that decides PR-vs-`[unverified]` routing. **Writer:** init seeds
`unknown`; the steward writes the proven tier back after the first real trial run
(local) and CI run (actions).

| Field | Type | Meaning |
|---|---|---|
| `tiers.local` | `full` \| `partial` \| `none` \| `unknown` | What the local runner could execute. |
| `tiers.actions` | `full` \| `partial` \| `none` \| `unknown` | What CI could execute (proven by the first CI run). |
| `verified_at` | string (ISO 8601) | When the tier was last proven. |
| `timeouts.install_seconds` | int | Install timeout; install exceeding it counts as an environmental failure. |
| `timeouts.test_seconds` | int | Test timeout; the degradation rule uses `× 1.5` of this. |
| `requires` | list of object | External dependencies that gate verification. |
| `requires[].kind` | `service` \| `secret` \| `resource` | Category of the requirement. |
| `requires[].name` | string | Its name (e.g. `postgres`, `STRIPE_KEY`). |
| `requires[].evidence` | string | The `file:line` that proves the requirement exists. |

## `wolfe/scanners` — static-analysis tools the bots may invoke

Detected scanners, tagged by category. **Writer:** init seeds; steward
reconciles availability. A scan-phase bot whose category appears in
`categories[]` may invoke `invoke` with `{globs}` substituted.

| Field | Type | Meaning |
|---|---|---|
| `available` | list of object | The detected scanners. |
| `available[].id` | string | Stable scanner id. |
| `available[].invoke` | string \| null | Invocation string containing `{globs}`; `null` when detected but not installed. |
| `available[].categories` | list of string | Bot categories this scanner serves. |

## `wolfe/bots` — the roster and the autonomy dial

Per-repo bot configuration. **Writer:** human owns `autonomy`,
`routing_overrides`, `caps`, and `schedule`; the steward NEVER raises autonomy —
it only reads it. Verification, caps, and dedup are on at every autonomy level.

| Field | Type | Meaning |
|---|---|---|
| `autonomy` | int 0–3 | `0` report-only · `1` + issues (default) · `2` + draft PRs · `3` + the fixer drains the queue. |
| `enabled` | list of string | Bot categories active in this repo. |
| `routing_overrides` | map | Optional class→route overrides; `security` file-only is never overridable. |
| `caps` | map | Per-bot per-run finding caps (override the charter default). |
| `schedule` | map | Per-bot cadence hints for the orchestrator. |

## `wolfe/specialists` — the reviewer/implementer registry

Which subagents the bots fan out to, and who owns each. **Writer:** the steward
writes `forged` rows (roster reconciliation); `reused` and `enhanced` rows are
USER-OWNED — the steward only files suggestion issues, never auto-edits them.

| Field | Type | Meaning |
|---|---|---|
| `registry` | list of object | The specialist entries. |
| `registry[].name` | string | Specialist name. |
| `registry[].slot` | string | The technology/surface slot it fills (matched to area tags). |
| `registry[].provenance` | `forged` \| `reused` \| `enhanced` | Origin; `reused`/`enhanced` are user-owned and protected. |
| `registry[].path` | string | Path to the specialist's file. |
| `registry[].categories` | list of string | Bot categories that route to it. |
| `registry[].forged_by` | string | Who forged it (the steward stamps `wolfe-docs` for forged rows). |
| `registry[].stamp` | string (ISO 8601) | When the row was last reconciled. |

## `wolfe/links` — where the index points outward

Outbound references; the index links to domain docs, never duplicates them.
**Writer:** init seeds; human curates; steward reconciles broken targets (Lane A
drift).

| Field | Type | Meaning |
|---|---|---|
| `context` | string | Path to the project's top-level context doc. |
| `adr_dir` | string | Directory of decision records (wolfe-arch's domain — the steward never edits ADR bodies). |
| `docs_globs` | list of string | Globs defining what the steward audits as documentation. |
| `freshness_ledger` | string | Path to the freshness ledger (default `.wolfe/freshness.yml`). |

## `wolfe/ops` — run-log, conventions, and cost calibration

Operational wiring. **Writer:** init seeds; the steward writes `calibration`
(calibration refresh, Charter 2); the rest is convention set at init.

| Field | Type | Meaning |
|---|---|---|
| `run_log.kind` | string | The run-log artifact kind (an issue). |
| `run_log.label` | string | Its label (`wolfe:run-log`). |
| `local_runs_dir` | string | Where local run records mirror (e.g. `.wolfe/runs/`). |
| `reports_dir` | string | Where dry-run/report-only output lands (e.g. `.wolfe/reports/`). |
| `branch_prefix` | string | Branch namespace (e.g. `wolfe/`). |
| `label_namespace` | string | The `wolfe:` label prefix. |
| `calibration.seeded` | bool | `true` while numbers are rough seeds; steward flips to `false` after ≥3 real runs per bot. |
| `calibration.minutes_per_kloc` | map | Per-bot (and `default`) median minutes per KLOC, recomputed from the last 5 non-degraded runs. |
| `calibration.ceiling_multiplier` | number | Multiplier applied to the estimate before the hard cap. |
| `calibration.wall_clock_hard_cap_minutes` | int | The absolute per-run wall-clock cap (the runaway guard). |

---

*Index schema version: 1. The steward writes only the fenced `yaml wolfe/*`
blocks; all surrounding prose is for humans. Unknown keys are ignored by parsers,
so reserved fields (e.g. `areas[].index`) are forward-compatible.*
