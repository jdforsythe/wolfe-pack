# Deferred work tracker

Deferred work gets surfaced, not buried. This file tracks every item the v1 design
left open or explicitly deferred, with its current disposition. When you pick one up,
move it to "Resolved" with a pointer to where the decision landed.

## Resolved in v1 implementation

| Item | Disposition |
|---|---|
| Exact index filename | **`WOLFE.md`** at the adopter repo root — visible, readable, demo-friendly. Machine data lives in `.wolfe/`. See `docs/architecture.md`. |
| The recipe-template format | Designed and shipped: static bot skills assembled from `kernel/bots/` (per-bot sources) + `kernel/partials/` (shared gates/phases/schemas) by `scripts/assemble-bots.mjs`, plus the specialist recipe with literal interfaces + forged content slots (`templates/specialists/recipe.md`). |
| Verification environment bring-up (v1 line) | init runs a trial (install → build → test), records commands, timeouts, tier (`full / partial / none`) and evidence-backed `env_requirements` in `WOLFE.md`. Bots consult the tier and pre-route unverifiable findings to `[unverified]` issues. GitHub Actions runs the recorded commands only — **no service/datastore bring-up in v1** (the degradation rule keeps "no unverified PR" true by construction). |
| Cost calibration seeds | Rough `minutes_per_kloc` seeds ship in the `WOLFE.md` template, labeled as seeds; the docs steward recomputes medians from real run history and flips `seeded: false` after ≥3 real runs. |

## Still deferred (do not silently drop)

| Item | Why deferred | Notes for whoever picks it up |
|---|---|---|
| Multi-runtime support (other agent CLIs / plain API) | Deliberate non-goal: the tiered-subagent orchestration is a Claude Code primitive; an agnostic v1 would 5–10× the surface. | Re-evaluate only after launch traction. |
| Clean in-repo update path (re-run init, diff/merge new bot versions) | v1 scaffolds; re-runs enter a scoped *reconcile* mode (roster / specialists / labels only). | Bot files are byte-identical verbatim copies + checksums in `.wolfe/manifest.yml`, so a future updater can diff cleanly. Reconcile mode must not creep into a half-built updater. |
| Community bot registry / marketplace | Curated core only in v1 — reputation requires a quality gate. | Contribution recipe + quality bar belong in CONTRIBUTING.md first. |
| Claude-native scheduled cloud routines as a third backend | Unverified whether a routine can reach the repo + `gh` to open PRs. | Verify before promising anything publicly. |
| Multi-package monorepo index-tree mechanics | Rare power-user case. Schema reserves an `index:` field per area for per-package indexes with the root linking down. | Sketched in the `WOLFE.md` template comments; not specified. |
| Model-tier "lite mode" (collapse tiers for cost-sensitive repos) | Needs real-run cost data first. | Run history (`wolfe:run-log` issue + `.wolfe/runs/`) is the data source. |
| Fork-PR scanning | `pull_request` from forks gets no secrets; `pull_request_target` + head checkout is an injection trap. | Revisit with a secrets-free static-only mode. |
| Actions service/datastore bring-up for verification | Unbounded per-stack work; degradation rule makes its absence safe. | Users may hand-add `services:` to `wolfe-run.yml` (they own it) and bump `tiers.actions` in `WOLFE.md`. |
| Cross-backend calibration unification | Local mirror and Actions artifacts don't share state beyond the run-log issue. | The pinned `wolfe:run-log` issue is readable from both backends — distillation already goes through it; only raw-record unification is open. |
| GHES + free-plan private repo branch protection | Branch protection API unavailable / different there. | init fails politely with manual instructions today. |
| Post-PR drive-to-green follow-up for hunter PRs | The internal pattern this generalizes used a repo-specific skill; not ported. | The fixer's daily cron + draft-PR semantics cover the gap; a generic follow-up loop could land later. |
