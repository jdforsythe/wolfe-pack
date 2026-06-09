# wolfe-pack — Product Design & Implementation Brief

> **Status:** v1 design locked · **Authored:** 2026-06-09 · **Origin:** a structured "grill-me" design interview.
> **Audience:** the implementation-planning agent (and humans). This document is **self-contained** — it assumes no access to the conversation that produced it.

---

## 0. How to use this document

You are (likely) an agent asked to plan and/or build wolfe-pack. Read this whole file first.

- **The design below is LOCKED.** Each decision records its *rationale* and the *alternatives we rejected* so you understand the "why" and don't accidentally undo a deliberate choice. Do not re-litigate locked decisions; if you believe one is wrong, flag it explicitly with new evidence rather than silently changing course.
- **§9 lists what is genuinely still open.** That is where your judgment is wanted.
- **You have read access to the Shipyard monorepo**, which contains the *internal, production* version of this idea that wolfe-pack generalizes. Study the files referenced in §2 and §8 — they are the proven patterns to port. Shipyard lives at `~/dev/yard`; the relevant work is on branch **`jforsythe/meet-the-bots`**. All Shipyard paths in this doc are relative to that repo root.
- **Your job is to produce an implementation plan**, not to start coding blind. Decompose the architecture in §4 into milestones (a suggested sequencing is in §10), identify the real engineering risks (§7, §9), and propose a build order.

---

## 1. What wolfe-pack is (one paragraph)

wolfe-pack is an **open-source, Claude-Code-native** package that drops a coordinated team ("pack") of autonomous review-and-fix bots into *any* repository. You run `npx wolfe-pack init`; it explores your repo, asks a few questions, and scaffolds a tailored crew **directly into your repo** (you own every file). The bots hunt for issues across categories — bugs, security, docs, test gaps, a11y, i18n, performance, tech debt, architecture, infrastructure — and, depending on how much autonomy you grant, either file issues or open **draft PRs with a failing test + a verified fix**. A "fixer" bot (Winston Wolfe, the namesake) drains a human-triaged issue queue into PRs. Everything is gated by an **always-on verification step** (no finding is surfaced unless it's reproduced/tested/benchmarked), so the pack's defining promise is **no slop**. It runs locally on a loop with zero setup, or unattended via GitHub Actions once you opt in.

The name: **Winston Wolfe** ("the Wolf," the *fixer* from *Pulp Fiction*) → a **pack** of bots. The loop-closer is the namesake because closing the loop — turning findings into merged fixes — is the whole point.

---

## 2. Provenance — what this generalizes from

wolfe-pack is the generalization of an internal, production bot crew running in the **Shipyard** monorepo (SenSource). That crew is the proof that this works; wolfe-pack's job is to strip the Shipyard-specific tuning and make the *architecture* portable to any repo.

### The internal crew (study these)

Seven autonomous bots, each a Claude Code skill at `.claude/skills/<name>/SKILL.md`, invoked on a schedule by GitHub Actions:

| Internal bot | Persona logic | Category it owns | wolfe-pack equivalent |
|---|---|---|---|
| `orkin-man` | pest control | runtime/logic **bugs**, races, data-integrity | **bugs** bot |
| `dave-ramsey` | pay down debt | **tech debt**, duplication, dead code, shallow modules | **tech-debt** bot |
| `erin-brockovich` | finds what's uncovered | **test gaps** | **test-gaps** bot |
| `paul-walker` | speed | **performance** (hot paths, N+1, queries, bundle) | **perf** bot |
| `attenborough` | narrator/documentarian | **documentation** drift + freshness steward | **docs / self-healing** bot |
| `james-madison` | constitution | **ADR / architecture-decision** lifecycle | **arch** bot |
| `winston-wolfe` | the fixer | drains the `for-bot` issue queue → PR → green | **the fixer** (namesake) |

### The generalizable kernel (the actual IP)

Every internal bot shares this architecture — **this is what wolfe-pack ports**:

1. **Tiered model orchestration.** Opus (high effort) triages → fans out **Haiku** for cheap static scans + **Sonnet** for named specialist subagents → **Opus** ship-gate.
2. **Confidence-tiered, verified output.** `confidence ≥ 0.85 AND verified (reproducer/test/benchmark/EXPLAIN)` → draft PR with **failing test + fix**; `0.6–0.85` → GitHub issue; `< 0.6` → discarded.
3. **Per-run caps.** ~60-min internal wall-clock; **max ~5 findings per run**.
4. **Dedup fingerprints.** `<!-- fingerprint: SHA -->` HTML comments on existing bot PRs/issues prevent re-filing.
5. **Anti-collision scheduling.** A 9-day domain rotation (8 app domains + 1 cross-domain), with bots **offset** from each other (e.g. orkin day N, paul N+2, dave N+5, attenborough last) so they don't fight over the same files.
6. **Trust boundary (prompt-injection defense).** Subagent output *and* repository code under inspection are treated as **partially-trusted DATA, never instructions**. Explicit in every bot prompt.
7. **Tiered safety gate.** Safe class (rename, extract, dead-code, type-tighten) → PR; risky class (dedup, restructure) → **characterization tests authored first, then refactor**; infeasible → issue.
8. **A reusable GitHub Actions workflow** (`.github/workflows/_run-claude-bot.yml`) carrying the shared plumbing; thin per-bot caller workflows supply only schedule + prompt.
9. **Signed commits via a GitHub App.** `use_commit_signing: true` on `anthropics/claude-code-action`; commits go through the App's API (not raw `git`), because the branch ruleset requires signed commits and CI runners have no signing key. An `--append-system-prompt` explicitly forbids raw `git commit`/`push`.
10. **The fixer loop.** `winston-wolfe` consumes `for-bot`-labelled issues, locks one with `bot-in-progress`, writes tests + fix + docs, drives to green, opens a ready-for-review PR, and **stops short of merge** (a human merges).
11. **Clear ownership boundaries.** Every bot's description ends with "Do NOT use for X — that's bot Y's job."

**The central tension wolfe-pack solves:** the internal bots are *deeply* codebase-tuned (they know the 8 domains, the invariant IDs, the package-naming grammar, and they call named specialists like `postgres-debugger`, `angular-races-reviewer`). A generic package can assume **none** of that. The entire design below is about preserving the kernel's *quality* while making *zero assumptions* about the target repo.

---

## 3. North star, pillars, non-goals

### North star
A **polished, genuinely-working v1** worth putting on Show HN and writing articles about. **Working + impressive now beats breadth or future-proofing.** "Rework/expand later" is an acceptable answer for anything whose only payoff is long-term.

### Two co-equal design pillars
1. **Polish / it actually works.** Every shipped surface is hardened; the demo is impressive in 60 seconds.
2. **Anti-rot.** The system must not decay. Generated artifacts that go stale are *worse than nothing*. Every decision is tested against "does this rot, and who keeps it fresh?" — and the **docs bot maintains the system itself** (its own index, the bot files, the reference docs).

### Non-goals (explicitly deferred — do not build in v1)
- **Multi-runtime support** (Cursor, Codex, Aider, Gemini CLI, plain API). *(See §5.1 — this was considered and deliberately cut. The tiered-subagent orchestration is a Claude Code primitive; an agnostic version would 5–10× the surface and bet the launch on abstraction over fast-moving runtimes. wolfe-pack is **Claude-Code-native**.)*
- **Clean in-repo update mechanism** (re-running init and merging). v1 scaffolds; better update ergonomics come later.
- **A community bot registry / marketplace.** Curated core only in v1 (see §5).

---

## 4. Core architecture (locked)

### 4.1 Two layers — only one is forged

This is the single most important architectural idea, and it is subtle. **Get it right.**

- **Bots = a known, curated, FIXED catalog.** They are the *orchestrators*. They own all the gates (verification, confidence tiers, fix-vs-file routing, dedup, caps, trust-boundary). They are generic, battle-tested, and **never generated on the fly**.
- **Specialists = the tech/platform/language-specific subagents the bots fan out to**, for both **review (finding)** and **implementation (fixing)**. *These* are **forged** at init from the detected stack (~3–5 of them: dominant language(s), main framework/platform, datastore, infra). Example: a repo detected as TypeScript + Angular + Postgres + AWS gets `{ts, angular, postgres, aws}` specialists forged.

> ⚠️ **Common misread to avoid:** "forge" does **not** mean generating whole new bespoke *bots*. The bots are fixed. Forging is **only** for the specialist subagents the fixed bots use. This was an explicit correction during design.

**Why forge specialists (not ship them):** you cannot pre-ship a specialist for every language × framework × platform combination; forging the relevant handful at init is the only scalable answer.

**Why this is the safe place to put the bespoke/generated surface:** a specialist *advises* the hunt and *informs* the fix, but **the bot still applies its verification/confidence/routing gates to everything the specialist returns.** A weak forged specialist degrades *expertise* (less-expert review), but it **cannot** emit an unverified PR or slop — the bot's gates hold regardless. Forging whole bots would not have this property (a forged bot could ship weak gates); forging specialists does. This is why the two-layer split exists.

**Forging mechanism:** specialists fill a **recipe template** — a known reviewer/implementer *interface* (what they must return to the bot) plus bespoke tech *content* (domain vocabulary, anti-pattern watchlist) generated via the **forge methodology** (`forge:agent-creator` — PRISM persona structure, expert vocabulary payloads, MAST failure-mode taxonomy). The user owns `github.com/jdforsythe/forge`; the `forge:*` skills are available in Claude Code.

**Exotic/unrecognized stacks:** fall back to a generic "language-X reviewer" forged from the language alone, or run the bot specialist-less (degraded but still fully gated).

**Specialist reconciliation (polite-guest principle).** Many adopters already have `.claude/agents/*.md`. At init *and* in the self-healing loop:
- **Detect** existing agents under `.claude/agents/**`; match against each needed specialist slot.
- **Reuse-first:** an existing agent covers the slot → register it, wire bots to it, forge nothing.
- **Enhance on opt-in:** offer a forge-grade upgrade (the "scientific backing") as a reviewable diff — **never silent**, it's the user's file.
- **Forge new** only for genuine gaps.
- **Ownership is tracked as provenance in the index registry** (`forged` / `reused` / `enhanced`). The self-healing loop **maintains only `forged` specialists**; for `reused`/`enhanced` (user-owned) it **suggests** (issue/PR) but never auto-edits. This keeps the anti-rot loop from clobbering user work.

**Specialist lifecycle:** the docs/self-healing bot reconciles the specialist roster against the detected stack **each run** (new framework with no specialist → forge; retired tech → retire specialist + registry entry), **plus on-PR detection** ("this PR introduces Redis → forge a Redis specialist?" inline at the moment it lands). Forged specialists never silently rot.

### 4.2 The index — the anti-rot spine

A single **bot-owned sibling file** holds the machine-maintained structural index. (Concretely: in a single-package repo — the common case — this is **one file at the repo root**. See §9 for the exact filename, still open.)

- **It is co-located and forms a shallow tree.** Target repos are overwhelmingly 1–5 packages (usually 1), so the "tree" is almost always a single node. For the rare multi-package monorepo it degrades to one index per package with the root linking down.
- **`CLAUDE.md` carries only a one-line pointer to it.** The index loads **on demand** (only when a bot needs it), so it never taxes normal coding sessions — preserving the progressive-disclosure / token-economy goal. The big map is never auto-loaded.
- **It is the bot's only hardcoded link.** A bot file hardcodes exactly one link: the index. **Strict hub-and-spoke, never mesh** — bots → index → progressive-disclosure leaves. Nothing else cross-links. (This is the core anti-rot rule: it bounds the rot surface to one file.)
- **It binds to slow-moving abstractions — globs, area names, commands — not exact paths or line numbers.** A rename must not rot the index.
- **It holds:** operational bindings (stack, areas→globs, verify/test commands, scanner config, enabled bots) **and the specialist registry** (which specialists exist + their provenance). Bots read the index to learn which specialists to fan out to — they never hardcode specialist names.
- **It links *out* to** the adopter's `CONTEXT.md` (domain glossary) and `docs/adr/` (decisions) **when those exist**, but never duplicates them. (These are conventions from the author's other toolkit; most adopters won't have them. init offers to backfill, never forces — see §4.8.)
- **The docs/self-healing bot owns its freshness**, plus the bot files and the reference leaves.

> **Why a sibling, not `CLAUDE.md` itself, and not `CONTEXT.md`:** overloading `CLAUDE.md` would auto-load the whole index into every session (token tax) and force a machine-rewritten section to live inside human-authored prose (collision/fragility). `CONTEXT.md` is reserved (in the author's convention) for *domain glossary only, no implementation detail* — exactly what the bots can't use — so reusing it would collide with that charter on any repo running both.

### 4.3 Output model, autonomy dial, fix-vs-file

**Verification is always-on and non-negotiable** — the crown jewel and the entire anti-slop guarantee. It never gets dialed down. Critically, it **degrades safely:** a bot must run the repo (install + test/repro) to verify; where it *can't* (tests need services/secrets, deps won't install in that environment), the finding **downgrades to an issue** clearly marked "unverified — couldn't run X" and is **never auto-PR'd**. "No unverified PR" thus holds **by construction**, even on a repo the bot can't fully build.

**Autonomy is a separate dial** — what a *verified* finding becomes. Conservative default; the user cranks it up as trust grows. `init` asks the **one** auto-PR question even on the quick path ("enable auto-PRs for high-confidence findings?").

```
autonomy levels (default = 1):
  0  report artifact only
  1  + open issues                         ← DEFAULT
  2  + verified ≥0.85 → draft PR (test+fix)
  3  + fixer drives PRs to green
verification gate, caps, dedup: ON at every level
articles/demo run at level 2–3; default protects strangers' repos
```

**Fix-vs-file = three ANDed gates × two routes.**
- Gates: `verification/confidence` × `class fixability` × `autonomy setting`.
- **Fast route** (autonomy on + verified ≥0.85 + an *auto-fixable* class) → bot opens a `wolfe:fix` draft PR directly.
- **Reviewed route** (everything else) → bot files a `wolfe:needs-triage` issue; a human applies `wolfe:queued`; the fixer turns it into a PR. This path serves medium-confidence findings, file-only classes, and "autonomy off."

**Default auto-fix line** (per-class, overridable in `init --deep`):
- **Auto-fixable (fast route):** bugs (with a failing reproducer) · docs · test-gaps · a11y · i18n. *(Fix is proven by a passing test; low blast radius.)*
- **File-issue-only (reviewed route):** security · perf · tech-debt/refactor · architecture. *(Blast radius / human judgment / trade-off. A wrong security "fix" is the worst possible first impression — humans gate it. Override available in `--deep`.)*

### 4.4 Execution backends — ramped

Two backends; friction scales with how much you want.

- **Local `/loop` (or `wolfe-pack run`) — the zero-setup on-ramp + demo.** Runs in the user's session/machine using their **already-authenticated identity** (Claude subscription + `gh` + local commit-signing key). Bot PRs therefore **trigger CI and are signed for free**, with **no GitHub App and no repo secrets**. Limitation: only runs while the machine + session are live. This is the front door and the demo.
- **GitHub Actions — the unattended "while you sleep" upgrade.** Offered in the same `init`. Runs without the user's machine. **This is the only rung that needs the creds-in-CI setup.**

**Bot identity (Actions rung only):** the **user's *own* GitHub App**, created via GitHub's one-click **App-manifest flow** (it's *their* App, not a maintainer-hosted third-party App — no external trust ask). Required because:

> ⚠️ **Non-obvious, load-bearing fact:** a PR opened with the default `GITHUB_TOKEN` does **not** trigger the repo's CI (GitHub blocks recursive workflow runs). So a bot PR authored by `GITHUB_TOKEN` has **zero CI checks** and can **never** satisfy a "require CI green" branch-protection rule — breaking both the safety rail and the fixer loop. The user's-own App (or a real user identity, as in the local rung) is what makes signed commits + CI-on-bot-PRs + the fixer loop actually function.

Friction scales with autonomy: report/issues-only → `GITHUB_TOKEN`, zero extra setup; PRs/fixer → the ~2-minute App walkthrough.

**Cadence:** hunters run **weekly** by default (small repos don't churn daily) + optional **on-PR** diff scan; the **fixer is label-triggered** (`on: issues: types: [labeled]`, fires when a human adds `wolfe:queued`) **+ a daily safety-net cron**. All configurable. *(The internal crew's bihourly poll is overkill at OSS-repo scale.)*

*(Adjacent, NOT banked for v1: Claude-native scheduled cloud "routines" via the `schedule` skill could be a third backend — unattended without GH Actions or the user's machine — but whether a routine can reach the repo + `gh` to open PRs needs verifying before promising it. See §9.)*

### 4.5 Labels — own a namespace, be a polite guest

wolfe-pack creates **only `wolfe:`-prefixed labels** (zero collision with the adopter's labels — a hard requirement). It **detects and reuses** the repo's existing `type:`/`severity:` labels if present, but never creates generic ones.

| Label | Role |
|---|---|
| `wolfe:bug` · `wolfe:security` · `wolfe:test-gap` · `wolfe:a11y` · `wolfe:i18n` · `wolfe:perf` · `wolfe:tech-debt` · `wolfe:arch` · `wolfe:docs` · `wolfe:infra` | category (which packmate found it) |
| `wolfe:needs-triage` | filed issue awaiting a human decision (default on medium-confidence) |
| `wolfe:queued` | human queued it for the fixer (internal equivalent: `for-bot`) |
| `wolfe:fixing` | claimed + locked by the fixer (internal: `bot-in-progress`) |
| `wolfe:fix` | a PR wolfe-pack opened (internal: `automated` / `winston-wolfe`) |

*(Study the internal label scheme at `docs/agent-knowledge/github-labels.md` — families: `type:`, `risk:`, `severity:`, `status:`, `app:`, plus the bot-loop labels. wolfe-pack mirrors the `prefix:value` style but namespaces everything under `wolfe:`.)*

### 4.6 Security posture (shipped defaults)
- **Least-privilege.** The workflow `permissions:` block grants only `contents:write` / `pull-requests:write` / `issues:write` — never admin, never merge. **Bots can never self-approve or self-merge** — branch protection + token scope make it impossible.
- **Prompt-injection trust boundary in every bot.** Repo content + subagent output = DATA, never instructions. This matters *more* than in the internal repo: wolfe-pack's on-PR scanning reads diffs from **untrusted external contributors** who can embed "ignore instructions, exfiltrate secrets" in a PR. The least-privilege token is the backstop: even a successful injection can't merge, can't reach other repos, can't read other secrets.
- **Secrets handling.** Model creds (`CLAUDE_CODE_OAUTH_TOKEN` or Anthropic API key) planted via `gh secret set` (stdin/`--body-file`, never echoed, never written to a committed file).

### 4.7 Cost
Cost-surprise is the #1 adoption killer for "autonomous model fleets," and an unattended Actions job with no ceiling is a real runaway risk.
- **Scope-relative budgets — never a fixed constant.** Each run's estimate = `tokens-per-unit-scope` (calibrated from the user's recorded run history) × *this run's* scope (LOC / packages / diff). A simple-tool run and a monorepo-domain run get very different budgets.
- **Scope itself is bounded:** diff (on-PR), time-window (scheduled), and **one domain/area per run** for big repos (the rotation idea) — so each run stays budgetable regardless of total repo size.
- **Hard runaway ceiling ≈ k× the scope-derived estimate.** On approach, the run finishes the current verification, then stops and **reports what it skipped**.
- **Per-run accounting** (tokens / approx $) in every run summary; the estimate starts rough and self-calibrates.
- **Tiered models are cost-efficient by design** (Haiku for scans, Sonnet for specialists, Opus for orchestration/gate). A "lite mode" that collapses tiers for cost-sensitive repos is a candidate (see §9).

### 4.8 The `init` flow (the hero / the demo)
- **Entry:** `npx wolfe-pack init` (hero, universally legible — checks for the `claude` CLI, guides install if missing, lands the user in the in-CC interview) **or** `/wolfe-pack init` (native path for Claude Code insiders). Both end in the same in-Claude-Code interview, because the smart work (explore → interview → forge → scaffold) must run inside a Claude Code session.
- **Interaction:** **light by default** — explore aggressively, *infer* stack/roster/paths, ask only the handful of questions detection genuinely can't answer, then present a **reviewable plan → apply**. **`init --deep`** = the full relentless interview for power users (per-class fix-vs-file toggles, etc.).
- **Review-before-write is table stakes:** init never silently writes files/workflows/secrets — it proposes, the user approves.
- **Roster is detection-driven** (see §4.1/§3): always-on core = bugs/security/docs-self-healing; conditional bots *offered* when their surface is detected but the **full catalog is always opt-in-able** (you can add the infra or a11y bot before you have IaC or a frontend — bots **no-op gracefully** when their surface is absent).
- **Doc-backfill = minimal, code-derived, bot-owned.** init writes the index (always, code-derived) + reference leaves only where the code supports them (e.g. `testing.md` from the detected test setup, area notes from real package structure). It **does not invent domain prose**; unknowns become a clearly-marked `TODO:` stub or a question, never a confident guess. The self-healing bot owns it all thereafter so it can't rot. `CONTEXT.md`/ADR scaffolding is offered only in `--deep`, never pushed.
- init also: detects + reconciles existing agents (§4.1), and **offers branch-protection setup** — detects current protection, recommends "require PR + ≥1 review + CI green before merge," and **offers to apply via `gh api`** showing exactly what it'll set (never silent). Framed honestly: "wolfe-pack opens PRs; these rules guarantee a bot PR can't merge without your CI passing and a human approving."

---

## 5. Decision ledger (scannable index)

Every locked decision, with the rejected alternative and the one-line "why." Detail is in §4.

| # | Area | Decision | Rejected | Why |
|---|---|---|---|---|
| 1 | Substrate | **Claude-Code-native** | runtime-agnostic; "agnostic v1, portable later" | tiered subagent orchestration is a CC primitive; agnostic 5–10×'s surface & bets launch on abstraction. *(Reversed twice in design; final = native.)* |
| 2 | Footprint | **Everything scaffolded in-repo, user owns it** | plugin owns bots; split | simplest to make work (no plugin-in-CI), most transparent, best `git diff` demo. Update ergonomics deferred. |
| 3 | Fixed-vs-forged | **Generic bots + per-repo specialization centralized in an index** | baked scattered refs; static-generic-only | scattered baked refs rot; one index = one thing to maintain. |
| 4 | Index home | **Bot-owned sibling file; 1-line pointer in `CLAUDE.md`; on-demand** | overload `CLAUDE.md`; reuse `CONTEXT.md` | avoids auto-load tax + human/machine collision + `CONTEXT.md`'s domain-only charter. |
| 5 | Index linking | **Strict hub-and-spoke; bind to globs/commands not paths** | mesh of cross-links; exact paths | bounds rot surface to one file; survives renames. |
| 6 | Roster | **Detection-driven defaults; full catalog opt-in-able; graceful no-op** | ship-everything-enabled; minimal-core-only | honest (no a11y bot on a CLI), cost scales with repo, each bot hardened. |
| 7 | Two layers | **Bots fixed/known; specialists forged** | forge whole bots; ship all specialists | forging specialists is slop-safe (gated by the bot); forging bots isn't; can't pre-ship every stack. |
| 8 | Forge constraint | **Recipe-template-constrained specialists** | free-form generation | inherits proven interface/gates; only tech-content is bespoke. |
| 9 | Reconciliation | **Reuse-first; enhance on opt-in; never auto-touch user agents** | prefer-our-forged; reuse-only-no-enhance | polite guest; protects user work + the anti-rot loop from clobbering it. |
| 10 | Specialist lifecycle | **Self-healing bot reconciles each run + on-PR suggestions** | re-run-init only; forge-once-static | specialists must not silently rot as the stack evolves. |
| 11 | init interaction | **Light default + `--deep` opt-in; review-before-write** | deep-grill-only; zero-interview-auto | low friction for launch conversion; trust via review gate. |
| 12 | Output/autonomy | **Verification always-on; autonomy dial; conservative default; init asks** | full PRs day-1; reports-only | no-slop guarantee fixed; autonomy ramps with trust. |
| 13 | Verify degradation | **Can't verify → issue, never auto-PR** | discard; PR anyway | "no unverified PR" by construction, even on unbuildable repos. |
| 14 | Fix-vs-file | **3 gates × 2 routes; mechanical auto-fix line; per-class `--deep`** | aggressive (incl. security); docs+tests-only | auto-fix only mechanical + fully-verifiable; humans gate blast-radius classes. |
| 15 | Labels | **`wolfe:`-namespaced only; reuse adopter's type/severity** | bare labels | zero collision; polite guest. |
| 16 | Cadence | **Hunters weekly + on-PR; fixer label-triggered + daily net** | bihourly poll | cheaper + more responsive at OSS scale. |
| 17 | Branch protection | **Detect → recommend → offer-apply, never silent; no self-merge** | auto-apply; ignore | safety rail for autonomous PRs; respect user's repo. |
| 18 | Bot identity (Actions) | **User's own GitHub App (manifest flow)** | third-party hosted App; PAT/`GITHUB_TOKEN` | signed + CI-triggers + loop works; no third-party trust; least-privilege. |
| 19 | Execution | **Both backends; local `/loop` on-ramp default + Actions upgrade** | Actions-only; local-only-v1 | zero-friction demo + real unattended automation; App only on the Actions rung. |
| 20 | Cost | **Scope-relative estimate + hard cap + post-run accounting** | defaults+report-only; document-only | no surprise bills; safe unattended; #1 HN question answered in-product. |
| 21 | Distribution | **`npx wolfe-pack init` hero + native skill secondary** | marketplace-primary; manual clone | most legible launch command; no marketplace setup to try. |
| 22 | License/governance | **MIT; curated core + open PR contribution; registry later** | Apache+registry-in-v1; fully-open catalog | reputation (bots write to repos) needs a quality gate; registry is scope tax. |

---

## 6. Cross-cutting principles (apply these everywhere)

- **No slop, by construction.** Nothing is surfaced unverified; unverifiable → issue, never PR. This is the product's identity.
- **Anti-rot is a pillar, not a feature.** One index, hub-and-spoke, globs-not-paths, and a self-healing docs bot that maintains the system itself (index + bot files + reference docs + specialist roster).
- **Polite guest.** Own the `wolfe:` label namespace and `forged` artifacts; *reuse, suggest, never clobber* everything the user already has (their labels, their agents, their docs, their repo settings).
- **Friction scales with autonomy.** Report/issues = zero setup; PRs/fixer/unattended = progressively more (App, secrets, branch protection). Never front-load friction.
- **Review-before-write.** init proposes; the human approves. Nothing lands silently.
- **Bounded blast radius.** Least-privilege tokens, no self-merge, draft PRs, per-run caps, dedup, scope-relative budgets. Every autonomous action has a ceiling.

---

## 7. Non-obvious technical facts the implementer MUST internalize

1. **`GITHUB_TOKEN`-authored PRs don't trigger CI** → they can't satisfy "require CI green" → the safety rail and the fixer loop both break. This is *why* the local rung (real user identity) and the Actions rung (user's own App) exist. (§4.4)
2. **Verification needs a runnable repo.** Getting an arbitrary repo to install + test + reproduce inside a CI runner (or even locally) is the real engineering risk behind the always-on gate. The degradation rule (→ issue) is the safety net, but the *happy path* (bring-up) is non-trivial and stack-specific. Study how the internal `_run-claude-bot.yml` does pnpm install / verify. (§9)
3. **Progressive disclosure controls context, not files.** A big `.claude/skills/` tree does *not* bloat context — skills load on demand. The index is the thing that must stay off the auto-load path (hence the sibling + 1-line pointer). (§4.2)
4. **Signed commits in CI need the App's API path**, not raw `git` (runners have no signing key). Mirror the internal `use_commit_signing: true` + the `--append-system-prompt` that forbids raw `git commit`/`push`. (§2)
5. **The forged layer is slop-safe only because the bot gates everything it returns.** Never let a specialist open a PR or skip verification on its own. (§4.1)

---

## 8. Proven patterns to port (read these in Shipyard, branch `jforsythe/meet-the-bots`)

- `.claude/skills/orkin-man/SKILL.md` — the canonical bug-hunter; the clearest example of tiered orchestration + confidence gates + caps + trust boundary. **Start here.**
- `.claude/skills/winston-wolfe/SKILL.md` — the fixer loop (queue → claim → fix → green → stop-short-of-merge).
- `.claude/skills/attenborough/SKILL.md` — the documentation/self-healing steward (the model for wolfe-pack's docs bot + the freshness machinery).
- `.claude/skills/{dave-ramsey,erin-brockovich,paul-walker,james-madison}/SKILL.md` — tech-debt, test-gaps, perf, arch/ADR. Note the per-bot safety gates and the "Do NOT use for X" ownership boundaries.
- `.github/workflows/_run-claude-bot.yml` — **the reusable workflow to generalize.** Checkout, pnpm/node, cache, install, `anthropics/claude-code-action` with `use_commit_signing: true`, session-log artifact, dry-run artifact. Thin per-bot callers supply schedule + prompt.
- `.github/workflows/nightly-orkin-man.yml` — a reference caller: workflow_dispatch inputs, the trust-boundary preamble, the post-PR `/ss-fix` follow-up, the run-summary contract.
- `.github/workflows/bihourly-winston-wolfe.yml` — the fixer's scheduled caller.
- `docs/agent-knowledge/github-labels.md` — the label scheme to mirror (namespaced).
- `forge:agent-creator` / `forge:skill-creator` skills (and `github.com/jdforsythe/forge`) — the specialist-forging methodology (PRISM / vocabulary payloads / MAST).

**What to strip when porting:** the 8 hardcoded domain names + 9-day rotation (replace with detection-driven scope + scope-relative budgets), the named codebase-specific specialists (replace with forged-from-stack specialists), invariant-ID references, `@sensource` package grammar, `pnpm`/Turbo assumptions (detect the package manager + verify command), and signed-commit-is-mandatory assumptions (detect whether the repo requires it).

---

## 9. Open / deferred (genuinely unresolved — your judgment wanted)

1. **Exact index filename** now that the product is named. Candidates: `WOLFE.md` (visible, root, readable — preferred for the "all prompts readable" demo value) vs `.wolfe/map.md` (namespaced dir) vs other. Decision was deferred to naming; a **visible, root-level, readable** file was favored over a hidden dotfile.
2. **Verification environment bring-up** for arbitrary repos in Actions (install deps, stand up services/datastores). The biggest engineering risk. Degradation rule exists; the happy path does not yet. Needs a design.
3. **Multi-package index-tree mechanics** for the rare monorepo (per-package sibling + root linking down). Sketched, not specified. Power-user case.
4. **Model-tier defaults + a "lite mode"** (collapse tiers / cheaper models for cost-sensitive repos). Sketched, not specified.
5. **Claude-native scheduled cloud routines** as a third execution backend — verify whether a routine can reach the repo + `gh` to open PRs before promising it.
6. **In-repo scaffold update path** (re-run init, diff/merge new bot/specialist versions). Deliberately deferred ("rework later").
7. **Cost calibration constants** — the estimate is rough until real-run data exists. Need a way to seed reasonable defaults.
8. **The recipe-template format** for both bots (the fixed skeleton) and specialists — implementation detail, but it's the heart of the system; design it carefully and early.

*(These are real follow-ups. When you build, track each one explicitly — do not silently drop scope. Per the author's working style, deferred work gets surfaced, not buried.)*

---

## 10. Suggested implementation sequencing (a starting point, not a mandate)

A possible build order that front-loads the demo and de-risks the hard parts:

1. **The recipe-template format + one bot end-to-end, locally.** Port `orkin-man` → a generic `bugs` bot that reads an index, runs the verify command, gates findings, and opens a draft PR — driven by `wolfe-pack run` against a sample repo. This proves the kernel works generically and is the demo spine. *(Tackle §9.2 verification bring-up here — it's the gating risk.)*
2. **The index + detection + `init` (light path).** Explore → infer stack → write the index (code-derived backfill) → scaffold the one bot → reviewable plan. This is the hero flow.
3. **Specialist forging + reconciliation.** Add the forged-specialist layer + `forge:agent-creator` integration + existing-agent reconciliation + the registry/provenance in the index.
4. **The rest of the core roster** (security, docs/self-healing) + the self-healing/anti-rot loop (the docs bot maintaining index + bot files + specialist roster). The self-healing loop is what makes the anti-rot pillar real — don't skip it.
5. **The fixer + labels + the issue→queue→PR loop** (label-triggered).
6. **The Actions backend** — the reusable workflow, the user's-own-App manifest flow, secret setup, branch-protection offer. *(Everything before this works locally with zero creds; this is the unattended upgrade.)*
7. **Cost machinery** (scope-relative estimate + cap + accounting) — weave in as runs become real.
8. **Conditional bots** (test-gaps, a11y, i18n, perf, tech-debt, arch, infra) — each behind detection, each hardened before it ships.
9. **Polish + the launch artifacts** (README, the article, the 60-second demo, the contribution recipe template + quality bar).

Throughout: **lean toward thoroughness on the verification gate and the anti-rot loop** — those two are the product. Everything else is in service of them.

---

## 11. References

- **Shipyard monorepo** (the internal source-of-truth this generalizes): `~/dev/yard`, branch `jforsythe/meet-the-bots`. See §8 for specific files.
- **forge** (specialist-forging methodology): `github.com/jdforsythe/forge`; `forge:agent-creator`, `forge:skill-creator` skills in Claude Code.
- **Claude Code** primitives used: skills (`SKILL.md`), subagents (`.claude/agents/*.md`), `anthropics/claude-code-action`, `/loop` and `schedule` skills, `CLAUDE_CODE_OAUTH_TOKEN`.
- **Naming:** Winston Wolfe (the fixer, *Pulp Fiction*) → wolfe-pack.

---

*End of brief. This document is the complete locked design as of 2026-06-09. Treat §1–§8 as settled, §9 as your mandate, §10 as a suggestion.*
