# Forging guide — how `init` forges a wolfe-pack specialist

> **This file is tooling, not output.** It instructs the wolfe-pack `init`
> interview on how to fill `recipe.md` into a concrete specialist. It is NOT
> copied into adopter repositories — only the forged specialist files and their
> registry entries in `WOLFE.md` land in the user's repo. If you are reading
> this inside an adopted repo, something went wrong; this file should not be here.
>
> *Methodology distilled from the open forge project
> (github.com/jdforsythe/forge).*

A specialist has two kinds of content. The **`[LITERAL]` sections of `recipe.md`
are byte-copied** — never paraphrase them, never "improve" them; the dispatching
bots depend on the exact wording of the Review Interface, Implementer Interface,
Hard Rules, Decision Authority skeleton, and Interaction Model. The
**`{{FORGED:...}}` slots are generated per-technology** by the procedure below.
Everything that follows is about filling those slots well, because a weak
specialist degrades expertise (the bot's gates still hold, but the review is
shallower).

---

## (a) Persona discipline

The Role Identity is a routing instruction to the model, not decoration.

- **Brief identities outperform long ones.** Keep Role Identity **at or under 50
  tokens**. A short, real identity routes cleanly; a long one dilutes.
- **A REAL job title routes to domain expertise.** "Staff Postgres engineer,"
  "Angular performance reviewer," "Terraform infrastructure auditor" — titles a
  hiring manager would post. The title is what pulls the right knowledge into
  context.
- **Flattery and superlatives actively degrade output.** Banned from the
  identity: *expert, world-class, seasoned, brilliant, 10x, guru, ninja,
  rockstar, master.* They add tokens, add no routing signal, and measurably
  lower accuracy.
- **The alignment–accuracy tradeoff:** longer, flattering personas make the
  model *agree* more and *reason* less. Keep it short and real so the specialist
  argues with the evidence instead of with you.

The forged title always drops into the literal crew frame: "...You are part of
an autonomous review crew; you report findings to an orchestrating bot that
gates everything you return." That frame is fixed; only the title is forged.

## (b) Vocabulary routing

Precise expert terminology activates the right knowledge clusters in the model.
The Domain Vocabulary section is the single highest-leverage forged slot.

- **15–30 terms in 3–5 named clusters.** The clusters must mirror how
  practitioners actually partition the domain — not an arbitrary alphabetization.
  For a datastore: query-planning terms, locking/concurrency terms,
  index/storage terms. For a frontend framework: change-detection terms,
  rendering terms, lifecycle terms.
- **Originator attribution amplifies routing.** When a term has a known
  originator, attribute it: "circuit breaker (Nygard)," "bulkhead (Nygard),"
  "value object (Evans)," "humble object (Feathers)." The attribution pulls the
  source material into context alongside the term.
- **The 15-year-practitioner test governs every term.** Ask: would someone who
  has done this for 15 years use this word unprompted, and would a novice not?
  If a beginner would say it, or a practitioner never would, cut it.
- **Consultant-speak is banned:** *leverage, best practices, robust, holistic,
  streamline, synergy* — and their neighbors. They signal generic output and
  route nowhere.

## (c) Anti-pattern watchlists

A named watchlist steers generation away from the generic-output failure modes —
the "distribution center" the model defaults to when it has nothing specific to
hold onto. Derive **5–10 anti-patterns from the technology's real failure
taxonomy**, each with an **observable Detection** and a **concrete Resolution**
(plus a one-sentence "Why it fails").

Cover the failure families:

- **Communication failures** — misinterpretation of artifacts (a specialist
  reads a config/schema/diff and infers the wrong intent).
- **Coordination failures** — role confusion and authority vacuums (the
  specialist deciding a route the bot owns; two concerns colliding on one file).
- **Quality failures** — rubber-stamp approval (signing off without evidence),
  error cascading (one mistaken finding spawning more), capability saturation
  (the specialist out of its depth but still asserting confidence).

Each row must be *observable* — "Detection: a column added with `NOT NULL` and
no default in a migration" beats "Detection: risky schema change." Vague
detection produces no steering.

## (d) The forging procedure (step by step)

Per slot detected at init (e.g. `language:typescript`, `datastore:postgres`,
`framework-frontend:angular`, `infra:aws`):

1. **Take the slot.** Read its `kind:tech` name and look up its category set in
   `slot-category-matrix.md`. Those categories are what you write into the
   provenance comment and the registry entry — they are not your choice.
2. **Write Role Identity** — section (a): a real job title for this technology,
   ≤50 tokens, inside the fixed crew frame.
3. **Build Domain Vocabulary** — section (b): 15–30 terms, 3–5 clusters,
   originators attributed, every term passing the practitioner test.
4. **Write the SOP** — 4–8 imperative inspection steps framed inside REVIEWER
   and IMPLEMENTER modes, with IF/THEN branches at decision points and OUTPUT
   lines where a step produces something the bot consumes.
5. **Write the Anti-Pattern Watchlist** — section (c): 5–10 named patterns from
   the real failure taxonomy, each with observable Detection + Why + Resolution.
6. **Contribute Static Scan Patterns** — 5–10 rows the orchestrating bots can
   **grep or invoke mechanically**. Each row: a grep-able signal or a concrete
   tool invocation, what it finds, the class, and the `applies-tags`. These feed
   the bots' Phase 2 directly.
7. **Fill the Decision Authority escalation rows** — 2–4 tech-specific judgment
   calls this specialist should *report as low-confidence findings* rather than
   decide. The Autonomous and Out-of-scope lines are literal; only Escalate is
   forged.
8. **Interface-validate** (the contract must still hold):
   - The `[LITERAL]` sections byte-match `recipe.md` — Review Interface,
     Implementer Interface, Hard Rules, Decision Authority skeleton, Interaction
     Model. Diff them; any drift fails the forge.
   - Every Static Scan Pattern is **mechanically executable** — a real grep
     pattern or a real tool command, not prose. If a bot can't run it, cut it.
   - The `categories` written everywhere come from the slot-category matrix, not
     from invention.
9. **PRISM-validate** (the persona must be sound):
   - Role Identity is **≤50 tokens**.
   - **No flattery / no superlatives** anywhere in the identity.
   - **Every vocabulary term passes the 15-year-practitioner test.**
   - Consultant-speak banned-list is clean.

A forge that fails either validation is not registered; fix it or fall back (e).

## (e) Exotic-stack fallback

When a detected slot has no rich technology profile to forge from (an obscure
language, a niche datastore), degrade in this order — gates hold at every step:

1. **Forge from the language alone.** Write a generic "language-X reviewer" from
   the language's own failure modes, with a **reduced vocabulary floor of ≥12
   terms** (below the normal 15–30, but still real and practitioner-tested).
   Categories still come from the matrix (`language:*`).
2. **Register nothing.** If even the language is too thin to forge honestly,
   register no specialist for that slot. The bots run **specialist-less degraded
   mode**: they do their own generalist pass at specialist tier. Review is
   shallower; **the bot's verification, confidence, dedup, and routing gates are
   unchanged.** A missing specialist never weakens a gate — only the expertise.

Never fabricate vocabulary or anti-patterns to hit a count. A thin-but-honest
specialist beats a padded one.

## (f) Reconciliation rules (the polite guest)

Many adopters already keep `.claude/agents/*.md`. Forge only genuine gaps.

- **Reuse first.** An existing user agent that matches a slot is **REUSED**: wire
  the bots to it, forge nothing, leave the file untouched. Registry provenance:
  `reused`.
- **Enhance only on opt-in.** Offer a forge-grade upgrade (the vocabulary
  payload, the watchlist, the scan patterns) as a **reviewable diff** — never
  silently. The user approves before anything changes. Registry provenance:
  `enhanced`.
- **Forge new** only where no existing agent covers the slot. Registry
  provenance: `forged`.
- **The steward maintains only `forged` specialists.** For `reused` and
  `enhanced` (user-owned) files it **suggests** corrections as issues/PRs but
  never auto-edits. This keeps the anti-rot loop from clobbering user work.
