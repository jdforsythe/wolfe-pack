# GitHub setup (Phase 7)

Everything here was itemized in the approved plan. Each subsection is
skippable independently; `gh` must be authenticated for any of it. All
mutations are idempotent so reconcile-mode re-runs are safe.

## 1. Labels

Create the namespace set from `<template-root>/labels.json`:

```bash
gh label create "<name>" --color "<color>" --description "<description>" --force
```

`--force` updates color/description if the label exists — safe because the
pack owns the `wolfe:` namespace outright. Never create a label outside it.
Record detected `type:`/`severity:` families in the plan and in WOLFE.md
prose so bots apply them *in addition to* `wolfe:` labels.

## 2. Branch protection (detect → propose → apply-on-approval)

Detect:

```bash
gh api "repos/{owner}/{repo}/branches/{branch}/protection"   # 404 = none
gh api "repos/{owner}/{repo}/rulesets"                        # rulesets present?
```

Detect CI check names worth requiring:

```bash
gh api "repos/{owner}/{repo}/commits/{branch}/check-runs" --jq '[.check_runs[].name] | unique'
```

Propose **additions only** — never remove existing rules, never touch
`enforce_admins`. The baseline recommendation: require a PR, ≥1 approving
review, and the detected status checks. Apply exactly the JSON the user
approved, via stdin:

```bash
gh api -X PUT "repos/{owner}/{repo}/branches/{branch}/protection" --input - <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["<detected check names>"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Failure handling: 403 (no admin rights) → print the JSON and manual
instructions; protection unavailable on this plan (free-tier private repos) →
warn and suggest staying at autonomy 1; rulesets already govern the branch →
report-only with a suggested ruleset snippet (merging into user rulesets is
out of scope).

## 3. Workflows (Actions rung)

Render from `<template-root>/workflows/`:

| Template | Scaffolds to | Notes |
|---|---|---|
| `wolfe-run.yml.template` | `.github/workflows/wolfe-run.yml` | splice the stack's `setup-steps/` fragment at `<<SETUP_STEPS>>`; `<<INSTALL_COMMAND>>` from WOLFE.md; `<<DEFAULT_BRANCH>>` |
| `wolfe-hunter.yml.template` | one `wolfe-<bot>.yml` per enabled hunter | `<<BOT>>`, `<<SINCE_DEFAULT>>` from the bot's charter, cron tokens below |
| `wolfe-fixer.yml.template` | `wolfe-fixer.yml` | autonomy 3 only |
| `wolfe-pr-scan.yml.template` | `wolfe-pr-scan.yml` | only if the user opted into on-PR scanning; `<<APP_SLUG>>` after App setup (placeholder + comment if not yet created) |

**Cron stagger — two axes.** Canonical day/hour per bot (UTC):

| bot | day | hour | | bot | day | hour |
|---|---|---|---|---|---|---|
| bugs | Mon | 08 | | tech-debt | Sat | 08 |
| security | Tue | 08 | | arch | Sun | 08 |
| docs | Wed | 08 | | a11y | Mon | 20 |
| test-gaps | Thu | 08 | | i18n | Tue | 20 |
| perf | Fri | 08 | | infra | Wed | 20 |

Minute = a stable hash of `owner/repo` modulo 60 (compute once, use for all
bots, including the fixer's daily 06:MM safety net). This dodges GitHub's
top-of-hour cron congestion AND keeps every wolfe-pack repo in the world from
firing simultaneously. Politeness only — the `wolfe-pack-runner` concurrency
group in `wolfe-run.yml` is the correctness backstop.

Every `<<TOKEN>>` must be substituted; verify none survive (Phase 8).

## 4. Secrets

**Model credential** (required for any Actions run):

```bash
# user runs: claude setup-token   (or uses an API key)
gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo <owner>/<repo>   # value via stdin
# or: gh secret set ANTHROPIC_API_KEY --repo <owner>/<repo>
```

Read the value with a hidden prompt and pipe it to stdin. Never echo it,
never write it to a file, never pass it in argv.

**Bot identity (autonomy ≥2 only): the user's own GitHub App.** Why: a PR
opened with the default `GITHUB_TOKEN` does not trigger the repo's CI
(GitHub blocks recursive workflow runs), so a bot PR authored that way can
never satisfy "require CI green" — breaking both the safety rail and the
fixer loop. The user's own App (created via GitHub's manifest flow — it's
THEIR App, no third party) fixes that, with least-privilege permissions:
contents/issues/pull-requests write, metadata/actions/checks read, no admin,
no workflows-write (bot PRs can never modify CI definitions).

Walk the user through `npx wolfe-pack app setup`, which: opens the manifest
flow in the browser → exchanges the one-time code → plants `WOLFE_APP_ID` +
`WOLFE_APP_PRIVATE_KEY` via stdin → opens the install page ("install on ONLY
this repo"). Headless machines: `--no-browser` prints manual instructions.
The scaffolded workflow falls back to `github.token` automatically when the
App secrets are absent, so issues-only autonomy needs none of this.

## The friction ramp (tell the user where they are)

| Autonomy | Needs |
|---|---|
| 0–1 local | nothing — your existing `claude` + `gh` auth |
| 0–1 Actions | model credential secret only |
| 2–3 Actions | + the 2-minute App walkthrough + branch protection recommended |
