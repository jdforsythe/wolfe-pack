# TOKENS.md — wolfe-pack template token manifest

## Two token conventions and why they differ

| Convention | Syntax | Used in | Filled by |
|---|---|---|---|
| Workflow tokens | `<<TOKEN>>` | `templates/workflows/*.yml.template` | `npx wolfe-pack init` interview (sed/replace at scaffold time) |
| Markdown tokens | `{{TOKEN}}` | `templates/index/WOLFE.md.template` | `npx wolfe-pack init` interview (string replacement at scaffold time) |

**Why two conventions?**

GitHub Actions workflows already use `${{ }}` for expression syntax. Using
`{{TOKEN}}` in a workflow template would create visual and tooling ambiguity
(linters, editors, and actionlint would misread template tokens as malformed
expressions). `<<TOKEN>>` (double angle-bracket) is unambiguous in a YAML
context, never conflicts with `${{ }}`, and is easy to grep.

Markdown files have no such conflict, so the more familiar `{{TOKEN}}`
convention is used there.

Both conventions are replaced exactly once at scaffold time by the init
interview. Neither convention appears in any file that lands in the target
repository.

---

## Workflow template tokens (`<<TOKEN>>`)

These appear in `templates/workflows/*.yml.template`.

### `<<DEFAULT_BRANCH>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-run.yml.template` (ref input default), `wolfe-hunter.yml.template` (ref default + prompt), `winston-wolfe.yml.template` (ref field) |
| Filled by | init detects via `gh repo view --json defaultBranchRef` or `git symbolic-ref refs/remotes/origin/HEAD` |
| Example | `master` |

---

### `<<SETUP_STEPS>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-run.yml.template` (stack setup section, step (d)) |
| Filled by | init detects the stack package manager and splices the matching `templates/setup-steps/<variant>.yml` fragment verbatim |
| Example (node-pnpm) | The two steps from `setup-steps/node-pnpm.yml`: `pnpm/action-setup@v4` then `actions/setup-node@v4` with `cache: "pnpm"` |

---

### `<<INSTALL_COMMAND>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-run.yml.template` (install step, step (e)) |
| Filled by | init detects the package manager and lock-file presence |
| Example | `pnpm install --frozen-lockfile` |
| Other examples | `npm ci`, `yarn install --immutable`, `bun install --frozen-lockfile`, `pip install -r requirements.txt`, `go mod download`, `cargo fetch` |

---

### `<<BOT>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-hunter.yml.template` (workflow name, cron group, job prompt, skill path) |
| Filled by | init uses the bot slug from the enabled roster |
| Example | `bugs` |
| Other examples | `security`, `docs`, `test-gaps`, `perf`, `tech-debt`, `arch`, `a11y`, `i18n`, `infra` |

---

### `<<BOT_LABEL>>`

| Field | Value |
|---|---|
| Appears in | Reserved for future use in hunter prompt label creation hints |
| Filled by | init: the bot's category label from `templates/labels.json` |
| Example | `wolfe:bug` |

---

### `<<CRON_MINUTE>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-hunter.yml.template` (cron schedule), `winston-wolfe.yml.template` (daily safety-net cron) |
| Filled by | init computes a per-repo minute offset (0–59) from a hash of the repo name to spread load off the top-of-hour spike |
| Example | `17` |

---

### `<<CRON_HOUR>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-hunter.yml.template` (cron schedule hour) |
| Filled by | init uses the canonical per-bot hour from the stagger table in the init skill's `references/github-setup.md` (UTC): 08 for bugs/security/docs/test-gaps/perf/tech-debt/arch, 20 for a11y/i18n/infra |
| Example | `8` |

---

### `<<CRON_DOW>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-hunter.yml.template` (cron day-of-week) |
| Filled by | init uses the canonical per-bot day from the stagger table in `references/github-setup.md`: bugs=1 (Mon), security=2 (Tue), docs=3 (Wed), test-gaps=4 (Thu), perf=5 (Fri), tech-debt=6 (Sat), arch=0 (Sun), a11y=1, i18n=2, infra=3 (evening slot) |
| Example | `1` |

---

### `<<SINCE_DEFAULT>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-hunter.yml.template` (workflow_dispatch since default, prompt fallback) |
| Filled by | init reads the bot skill's charter `Since-window default` field; falls back to `8d` if unspecified |
| Example | `8d` |

---

### `<<APP_SLUG>>`

| Field | Value |
|---|---|
| Appears in | `wolfe-pr-scan.yml.template` (self-scan loop guard: `<< APP_SLUG >>[bot]`) |
| Filled by | init reads the GitHub App slug from `gh api /app` after the App is created via the manifest flow; left as `wolfe-pack-bot` placeholder if no App is configured |
| Example | `my-org-wolfe-bot` |

---

## Markdown index template tokens (`{{TOKEN}}`)

These appear in `templates/index/WOLFE.md.template`.

> **Schema authority:** the examples below are illustrative shape only. The
> authoritative field-by-field schema for every `wolfe/*` block is
> `templates/bots/wolfe-docs/references/index-schema.md` (it ships with the
> docs steward, the index's owner). When in doubt, that file wins.

### `{{GENERATED_DATE}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md front-matter (`generated:` and `last-verified:`) |
| Filled by | init at scaffold time (ISO 8601 date) |
| Example | `2026-06-09` |

---

### `{{STACK_PROSE}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `## Stack` prose section |
| Filled by | init: one or two sentences summarizing the detected stack in plain English |
| Example | `TypeScript monorepo using pnpm workspaces. Main framework: Angular (frontend) + Koa (API). Datastore: PostgreSQL. CI: GitHub Actions.` |

---

### `{{STACK_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/stack `` block |
| Filled by | init: machine-readable stack map (see index-schema.md for every field) |
| Example | `languages: [typescript] \nframeworks: [angular, koa] \npackage_manager: pnpm \ndatastores: [postgres] \ninfra: [docker, github-actions] \ntest_frameworks: [vitest] \ni18n_framework: null \nui_surface: true \ndefault_branch: main \nsigned_commits_required: true` |

---

### `{{AREAS_PROSE}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `## Areas` prose section |
| Filled by | init: one sentence describing detected areas (packages, top-level directories) |
| Example | `Three areas detected from the workspace manifest: api, frontend, shared.` |

---

### `{{AREAS_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/areas `` block |
| Filled by | init: list of area entries with name, globs, and tags (run history lives on the `wolfe:run-log` issue, never in this block) |
| Example | `areas: \n  - name: api \n    globs: ["packages/api/src/**"] \n    tags: [backend, typescript, koa, postgres]` |

---

### `{{COMMANDS_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/commands `` block |
| Filled by | init: detected install/verify/test/test_single/lint/typecheck/build/bench/e2e commands (`null` = absent; `test_single` MUST contain the `{file}` token) plus `env_requirements` entries |
| Example | `install: pnpm install --frozen-lockfile \nverify: pnpm run test:ci \ntest: pnpm test \ntest_single: pnpm vitest run {file} \nlint: pnpm lint \ntypecheck: null \nbuild: null \nbench: null \ne2e: null \nenv_requirements: \n  - command: e2e \n    needs: [postgres]` |

---

### `{{VERIFICATION_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/verification `` block |
| Filled by | init (seeded from the trial run; the docs steward writes the proven `actions` tier back after the first CI run) |
| Example | `tiers: { local: full, actions: unknown } \nverified_at: 2026-06-09 \ntimeouts: { install_seconds: 300, test_seconds: 600 } \nrequires: \n  - kind: service \n    name: postgres \n    evidence: "compose.yaml service db; connection refused on :5432 during trial"` |

---

### `{{SCANNERS_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/scanners `` block |
| Filled by | init: static-analysis tools detected in the repo with the categories they serve (`invoke: null` = detected but not installed) |
| Example | `available: \n  - id: eslint \n    invoke: "pnpm eslint {globs} --format json" \n    categories: [bugs, a11y]` |

---

### `{{BOTS_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/bots `` block |
| Filled by | init: ONE repo-wide autonomy dial + the enabled roster (category names, not per-bot objects) |
| Example | `autonomy: 1 \nenabled: [bugs, security, docs, test-gaps, perf, tech-debt, arch] \nrouting_overrides: {} \ncaps: {} \nschedule: { hunters: weekly, fixer: label+daily }` |

---

### `{{SPECIALISTS_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/specialists `` block |
| Filled by | init (forged at scaffold time) + docs steward (updated each reconciliation cycle) |
| Example | `registry: \n  - name: wolfe-typescript \n    slot: language:typescript \n    provenance: forged \n    path: .claude/agents/wolfe-typescript.md \n    categories: [bugs, test-gaps, tech-debt, perf] \n    forged_by: wolfe-pack@0.1.0 \n    stamp: 2026-06-09` |

---

### `{{LINKS_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/links `` block |
| Filled by | init: outward links to domain docs, ADR directory, and CONTEXT.md when detected |
| Example | `context: null \nadr_dir: null \ndocs_globs: ["README.md", "docs/**/*.md"] \nfreshness_ledger: .wolfe/freshness.yml` |

---

### `{{OPS_YAML}}`

| Field | Value |
|---|---|
| Appears in | WOLFE.md `` ```yaml wolfe/ops `` block |
| Filled by | init (seeds defaults); the docs steward recomputes the `calibration:` map after ≥3 real runs |
| Example | `run_log: { kind: github-issue, label: "wolfe:run-log" } \nlocal_runs_dir: .wolfe/runs \nreports_dir: .wolfe/reports \nbranch_prefix: wolfe \nlabel_namespace: "wolfe:" \ncalibration: \n  seeded: true \n  minutes_per_kloc: { bugs: 1.8, docs: 1.2, default: 1.5 } \n  ceiling_multiplier: 3 \n  wall_clock_hard_cap_minutes: 60` |
