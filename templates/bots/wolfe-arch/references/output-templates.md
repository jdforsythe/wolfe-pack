# wolfe-arch — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket
slots). Uniform output is what makes one-glance human triage possible.

**Code findings are FILE-ONLY.** Violations, undocumented decisions, and
premise-erosion revisits NEVER become PRs — they file as issues whose body
carries the full evidence package (the anchor block, the existence proof, the
signal). The ONLY PR shape `wolfe-arch` ever opens is the Proposed-ADR scaffold
below — pure additive documentation, opened as a draft, status `Proposed`, that
a human must still accept.

## Proposed-ADR scaffold PR body (undocumented decision, autonomy ≥2)

This is the only PR template. The PR adds exactly one new ADR file and nothing
else — no code changes anywhere.

```markdown
## 🏛️ Proposed ADR: <decision title>

**Area:** `<area>` · **Class:** `undocumented` · **Status:** `Proposed` · **Confidence:** <0.NN> (verified)

### The undocumented decision

<2–5 sentences: the decision-grade signal observed and why it deserves a record.
What changed, when, and which boundary/dependency/regime it set.>

### Existence proof (verification)

- [x] Artifact exists: `<dep in manifest / directory in tree / module on disk>` — re-read at write time
- [x] No existing ADR covers it (cross-referenced titles + related paths)
- [x] Passes the two-year test (decision-grade, not trivia)
- [x] Number `<NNNN>` is `max+1`, re-validated against the ADR directory at write time
- [x] Status is `Proposed` (a human accepts — the pack never does)
- [x] `<verify command>` / lint green on the additive file

### What this PR adds

A single new file `<adr_dir>/<NNNN>-<slug>.md` with status `Proposed`. Context,
deciders, and consequences that the pack cannot know are marked
`TBD — please fill in` — never invented. Accept the decision by editing status
to `Accepted` and filling the TBD markers, or close this PR to reject.

### Reviewer notes

This is an autonomous wolfe-pack finding. The pack does not accept decisions on
your behalf — this ADR is `Proposed` until a human accepts it. If this is wrong
or unwanted, closing the PR is a valid review outcome — add the `wolfe:rejected`
label and the pack will never re-file it.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=arch date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:arch` (+ the repo's own `type:` labels when WOLFE.md says those
families exist). PR is a **draft**. Branch: `wolfe/arch/<YYYY-MM-DD>-<slug>`.

## Violation issue body (Accepted ADR contradicted — grouped per ADR)

One issue per Accepted ADR, listing every mechanical violation of it. The body
carries the full anchor-required evidence package.

```markdown
## 🏛️ Violation of <ADR-NNNN>: <ADR title>

**Area:** `<area>` · **Class:** `violation` · **Confidence:** <0.NN>

### The decision being violated

> <the exact decision sentence quoted verbatim from the ADR's Decision section>

— `<adr_dir>/<NNNN>-<slug>.md` (status `Accepted`)

### The contradicting code

- `<file>:<line>` — <quoted line(s)> — <one-paragraph plain explanation of how
  this does the opposite of the decision sentence; mechanical, not interpretive>
- `<file>:<line>` — <… each additional violation of the SAME ADR …>

### Why this is a mechanical violation

<1–3 sentences confirming no interpretation is required: the code does the
opposite of what the sentence mandates. If reasonable engineers could disagree,
this should have been filed as the discussion-framed issue instead.>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=arch date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:arch`, `wolfe:needs-triage`.

For **interpretive tension** (confidence capped at 0.7), use the same body but
frame the title as a question — `Does <file> still honor <ADR-NNNN>?` — and
replace "Why this is a mechanical violation" with a "Why this is debatable"
section. Never assert a flat violation when engineers could reasonably disagree.

## Undocumented-decision issue body (FULL MODE, when not a scaffold PR; LITE MODE always)

Used when autonomy < 2, or in LITE MODE where you never scaffold files into a
repo with no ADR convention. The body carries the full evidence package.

```markdown
## 🏛️ Undocumented decision: <decision title>

**Area:** `<area>` · **Class:** `undocumented` · **Confidence:** <0.NN>

### The decision-grade signal

<the signal: new dependency / service boundary / datastore regime / IaC module /
build-tooling regime / shared library. What changed and when.>

### Existence proof

- `<dep in manifest / directory in tree / module on disk>` — re-read at write time
- No existing ADR covers it (cross-referenced titles + related paths)
- Passes the two-year test: <one line on why anyone will care about this choice>

### Why it deserves a record

<1–3 sentences: reversibility, blast radius, the boundary it sets.>

### Suggested next step

<FULL MODE: scaffold ADR-<NNNN> Proposed (raise autonomy to ≥2 to let the pack
open it). LITE MODE: record this decision once a convention exists — see the
one-time ADR-convention offer issue.>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=arch date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:arch`, `wolfe:needs-triage`.

## Premise-erosion (revisit) issue body

A revisit REQUIRES age plus a concrete re-checked signal — never age alone.

```markdown
## 🏛️ Revisit <ADR-NNNN>: <ADR title>

**Area:** `<area>` · **Class:** `revisit` · **Confidence:** <0.NN>

### The decision

> <the relevant decision sentence quoted from the Accepted ADR>

— `<adr_dir>/<NNNN>-<slug>.md` (accepted <date>)

### The eroded premise (the concrete signal)

<exactly one of, quoted and re-checked: a named dependency is deprecated per the
registry / a related path no longer exists / a stated scale assumption is off by
≥5× (show both numbers) / a rejected alternative's blocker has materially
changed.> Age alone is NOT sufficient and is not the basis here.

### What a superseding decision might consider

<approach only; the pack never rewrites the Accepted body. Drift becomes a NEW
superseding Proposed ADR, authored by a human or a future scaffold run.>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=arch date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:arch`, `wolfe:needs-triage`.

## One-time ADR-convention offer issue (LITE MODE only)

Filed at most once per repository (dedup on its fingerprint). It never scaffolds
files — it proposes adopting a convention and links a standard format.

```markdown
## 🏛️ Adopt an architecture decision record (ADR) convention?

**Area:** `repo` · **Class:** `convention-offer` · **Confidence:** n/a

This repository has no ADR directory (`wolfe/links.adr_dir` is null), so
`wolfe-arch` is running in LITE MODE: it surfaces decisions worth recording but
will not scaffold files into a repo with no convention.

### Why adopt one

<2–3 sentences: the decisions this run already surfaced suggest a record would
help. Reference the open undocumented-decision issues.>

### A standard format to consider

A lightweight ADR format (Title · Status · Context · Decision · Consequences),
one file per decision, numbered sequentially under `docs/adr/` or similar. See a
widely-used template such as the Michael Nygard ADR format.

### How to enable FULL MODE

Create the ADR directory and set `wolfe/links.adr_dir` in `WOLFE.md`. On the
next run, `wolfe-arch` will cross-reference decisions against your records and
(at autonomy ≥2) propose `Proposed` ADR scaffolds for undocumented ones.

### Triage

Adopt by creating the directory and binding it. Reject permanently by closing
with `wolfe:rejected` — the pack will not re-offer.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=arch date=<YYYY-MM-DD> area=repo -->
```

Labels: `wolfe:arch`, `wolfe:needs-triage`.

## `[unverified]` issue body (degradation rule)

Used when the existence/anchor check could not be completed in this environment
(for example, the registry that confirms a deprecation could not be reached, or
`verify`/lint for a scaffold could not run). Same as the matching issue body
above, with the title prefixed `[unverified]`, the label `wolfe:unverified`
added, and this callout inserted directly under the title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

A finding that was never verified is NEVER opened as a PR — including a scaffold
PR — at any confidence, at any autonomy level.

## Dry-run report (`.wolfe/reports/<date>-arch-dryrun.md`)

```markdown
# wolfe-arch dry run — <date> — area: <area> — mode: <FULL|LITE>

<for each would-be artifact: the full body it would have filed, prefixed by
`## WOULD OPEN: scaffold PR` / `## WOULD FILE: issue`>

## Run summary

<the same YAML block the live run would print>
```
