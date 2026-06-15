# Detection probes (Phase 1)

The authoritative probe tables. Prefer Read/Glob/Grep; use shell only where
listed. Every detection records its evidence (file or command output) for the
plan. Absence of evidence = absence of the feature; never infer from vibes.

## Package manager & language ecosystem

| Signal | Conclusion |
|---|---|
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `bun.lock` / `bun.lockb` | bun |
| `package-lock.json` | npm |
| `package.json` `packageManager` field | overrides lockfile inference |
| `Cargo.toml` (+`Cargo.lock`) | rust / cargo |
| `go.mod` | go |
| `pyproject.toml` (`[tool.poetry]` → poetry; `[tool.uv]`/`uv.lock` → uv; else pip), `requirements.txt`, `Pipfile.lock` | python + manager |
| `Gemfile.lock` | ruby / bundler |
| `composer.json` | php / composer |
| `pom.xml` / `build.gradle*` | java / maven or gradle |
| `mix.exs` | elixir / mix |
| `*.csproj` / `*.sln` | dotnet |

Multiple ecosystems may coexist (e.g. a Python service with a JS frontend) —
record all, mark the dominant one by file census.

## Language census

`git ls-files` (respects .gitignore, cheap), bucket by extension, weight by
file count. Top 2–3 languages become `wolfe/stack.languages`. A
`tsconfig.json` promotes typescript over javascript.

## Frameworks & platform

- `package.json` dependency probe: `react`, `next`, `vue`, `nuxt`, `svelte`,
  `@angular/core`, `solid-js`, `express`, `koa`, `fastify`, `@nestjs/core`,
  `hono`, `electron`, `react-native`/`expo`.
- Config files: `next.config.*`, `angular.json`, `vite.config.*`,
  `svelte.config.*`, `nuxt.config.*`, `remix.config.*`.
- Python: `manage.py` (Django), `fastapi` / `flask` in deps, `app = FastAPI(`
  grep.
- Ruby: `config/application.rb` (Rails). Go: import census of common
  frameworks (gin, echo, fiber, chi). Java: spring-boot in build files.
- `ui_surface: true` when any frontend framework or an `index.html`-rooted
  app is detected.

## Datastores

- Driver/ORM deps: `pg`, `mysql2`, `mongoose`, `mongodb`, `ioredis`/`redis`,
  `prisma` (read `prisma/schema.prisma` provider), `drizzle.config.*`,
  `typeorm`, `sequelize`, `knex`, `sqlalchemy`, `psycopg`, `asyncpg`,
  `redis-py`, `pymongo`, `database/sql` driver imports (go), `diesel`/`sqlx`
  (rust).
- `docker-compose*.yml` / `compose*.yml` service images: `postgres`, `mysql`,
  `mariadb`, `redis`, `valkey`, `mongo`, `kafka`, `rabbitmq`,
  `elasticsearch`.
- Migration dirs: `migrations/`, `db/migrate/`, `alembic/`, `prisma/migrations/`.

## Infra surfaces (drives the infra bot)

`Dockerfile*`, `compose*.yml`, `*.tf` (+ `.terraform.lock.hcl`), `cdk.json`,
`serverless.yml`, `Chart.yaml`/`helm/`, k8s manifests
(`kind: Deployment|Service` greps under `k8s/`/`manifests/`/`deploy/`),
`fly.toml`, `vercel.json`, `netlify.toml`, `.github/workflows/*` (always
present once Actions is chosen — CI files count as infra surface).

## Test frameworks & i18n

- Test: `vitest.config.*`/`vitest` dep, `jest.config.*`/`jest`,
  `playwright.config.*`, `cypress.config.*`, `pytest.ini`/`pytest` in
  pyproject, `tox.ini`, `go test` (always for go), `cargo test` (always for
  rust), `*_test.go` / `*.spec.*` / `test_*.py` census.
- i18n: deps `i18next`, `react-intl`, `vue-i18n`, `@angular/localize`,
  `ngx-translate`, `next-intl`, `formatjs`; or locale resource trees
  (`locales/`, `i18n/`, `lang/` with per-locale JSON/YAML).

## Commands (highest-value detection)

Priority order for the verify command — **what CI runs is what green means**:

1. Parse `.github/workflows/*.y*ml` `run:` steps on push/PR triggers; collect
   install/build/test/lint invocations.
2. `package.json` scripts named `verify`, `check`, `ci`, `test`, `lint`,
   `typecheck`, `build` (and what they chain).
3. Runner configs (vitest/jest/playwright/pytest) for `test_single` shapes:
   vitest/jest → `<runner> run {file}`; pytest → `pytest {file}`;
   go → `go test ./<pkg>`; cargo → `cargo test --test {file}`.
4. `Makefile` targets `test`, `check`, `lint`, `build`.
5. Ecosystem defaults: `go build ./... && go test ./...`,
   `cargo build && cargo test`.

Ambiguity rule: zero or multiple credible verify candidates → ask Q3.
One credible candidate → don't ask, surface it in the plan.

## Conditional-bot surface predicates

| Bot | Enabled by default when |
|---|---|
| bugs / security / docs | always (core) |
| test-gaps | any test framework detected |
| a11y | `ui_surface: true` |
| i18n | i18n framework or locale tree detected |
| perf | always available — enable by default |
| tech-debt | always available — enable by default |
| arch | always (full mode only when an ADR dir exists) |
| infra | any infra surface beyond bare CI |
| winston-wolfe (fixer) | autonomy 3 |

## Existing assets

- Agents: `.claude/agents/**/*.md` — parse frontmatter `name` +
  `description`; match against needed slots by technology keywords.
- Docs: `CLAUDE.md` (pointer target), `CONTEXT.md`, `docs/adr/`/`docs/adrs/`
  /`adr/` (sets arch full mode), candidate doc files for the freshness
  ledger (`README.md`, `docs/**/*.md`, capped at the 20 most-linked).
- Labels (`gh` authed only): `gh label list --json name,color,description` —
  detect `type:`/`severity:`/`priority:` families for reuse.
- Branch protection: `gh api repos/{owner}/{repo}/branches/{branch}/protection`
  (404 = none) and `gh api repos/{owner}/{repo}/rulesets` (rulesets present →
  report-only; never merge into user rulesets).
- Signed commits: protection/ruleset `required_signatures` →
  `signed_commits_required: true`.

## Monorepo / workspaces

`pnpm-workspace.yaml`, `package.json` `workspaces`, `Cargo.toml [workspace]`,
`go.work`. 2+ packages → derive areas from package groups (by directory
prefix), cap at 5 areas, record honest globs. One `WOLFE.md` regardless —
per-package index trees are deferred (the `index:` field in `wolfe/areas` is
reserved for them).
