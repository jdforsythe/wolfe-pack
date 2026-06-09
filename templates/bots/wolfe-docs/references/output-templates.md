# wolfe-docs — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket slots).
Uniform output is what makes one-glance human triage possible. The steward emits
two PR shapes — a Charter-1 **drift PR** and a Charter-2 **maintenance PR** — plus
issues, the `[unverified]` variant, and the dry-run report.

## Drift draft-PR body (verified, ≥0.85, autonomy ≥2 — Charter 1)

```markdown
## 📝 <one-line drift statement>

**Area:** `<area>` · **Lane:** `<A mechanical | B prose>` · **Class:** `<drift_class>` · **Confidence:** <0.NN> (verified)

### What drifted

<2–5 sentences: what the doc claims, what reality says, and why a reader who
follows the doc fails. Reader impact, not just the discrepancy.>

### Evidence

- `<doc file>:<line>` — <the stale claim, quoted>
- `<source-of-truth file>:<line>` — <what reality actually says>

### Verification

- [x] Lane A: re-checked mechanically — <link resolves | anchor exists | command present in `wolfe/commands` | literal matches config>
- [x] Lane B: every new sentence cites a `file:line` read this run; new prose ≤ 2× sibling length
- [x] `<verify command>` green — docs change does not break the build

### The fix

<1–3 sentences: what changed and why this is the minimal correct edit.>

### Freshness ledger

- [x] Advanced `last_verified` for `<doc file>` in `.wolfe/freshness.yml` (audit resolved) — committed with this PR

### Reviewer notes

This is an autonomous wolfe-pack finding. If this is wrong or unwanted, closing
the PR is a valid review outcome — add the `wolfe:rejected` label and the pack
will never re-file it.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=docs date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:docs`, `wolfe:fix` (+ the repo's own `type:`/`severity:` labels
when WOLFE.md says those families exist). PR is a **draft**. Branch:
`wolfe/docs/<YYYY-MM-DD>-<slug>`.

## Maintenance PR body (Charter 2 — Phase 7.5, uncapped, ONE PR)

```markdown
## 🔧 wolfe-pack maintenance — <date>

Self-healing pass. Each item below is independent; review them separately.

### Index reconciliation (WOLFE.md)

<for each index-edit proposal: the `wolfe/*` block + field, detected reality vs
the current value, and the source `file:line` that proves the new value. Empty
section if none.>

### Specialist roster

<technologies with no specialist (forged, with recipe path) or retired
(removed); `reused`/`enhanced` entries are USER-OWNED and appear here only as a
note pointing to the suggestion issue filed instead. Empty section if none.>

### Calibration refresh (wolfe/ops)

<per-bot recomputed `minutes_per_kloc` medians from the last 5 non-degraded run
records; note any `seeded: false` flips. Empty section if none.>

### Run-log hygiene

<"recreated the pinned wolfe:run-log issue" or "ok — present">

### Freshness stamps

<docs whose `last_verified` advanced this run (verification stamps for untouched
docs + resolved audits).>

### Reviewer notes

I am the only writer of `WOLFE.md`. These are proposals — closing this PR is a
valid review outcome. Bot-file edits and `reused`/`enhanced` specialists are
NEVER auto-changed here; they get their own restore-PR or a suggestion issue.

<!-- wolfe-run: bot=docs date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:docs`. PR is a **draft**. Branch:
`wolfe/docs/<YYYY-MM-DD>-maintenance`. Open NOTHING when every section is empty;
record `maintenance: none` in the run summary instead. No fingerprint marker:
maintenance PRs are Charter-2 system artifacts, not fingerprinted findings —
the fingerprint rule in Output Routing applies to findings (Charter 1).

### Restore-PR body (bot-file integrity — its OWN separate PR)

```markdown
## ♻️ Restore proposal — `<.claude/skills/wolfe-*/SKILL.md>`

A human edited a generated bot file; its checksum no longer matches
`.wolfe/manifest.yml`. This PR shows the difference so you can choose. I do NOT
silently overwrite human edits.

### The human edit vs the manifest baseline

<the diff between the on-disk file and the manifest baseline>

### Tradeoff

<restoring discards the human edit and re-syncs the bot to the pack baseline;
keeping it means the file diverges from the manifest checksum and future
integrity checks will keep flagging it. Recommend one, explain why.>

<!-- wolfe-run: bot=docs date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:docs`, `wolfe:needs-triage`. PR is a **draft**. Branch:
`wolfe/docs/<YYYY-MM-DD>-restore-<skill>`. No fingerprint marker: restore PRs
are Charter-2 system artifacts, not fingerprinted findings.

## Issue body (0.6–0.85, Lane C ambiguity, or file-routed)

```markdown
## 📝 <one-line drift statement>

**Area:** `<area>` · **Class:** `<drift_class>` · **Confidence:** <0.NN>

### What looks wrong

<the doc/reality disagreement; for Lane C, state BOTH readings and that you
cannot tell which is canonical.>

### Evidence

- `<doc file>:<line>` — <the doc claim, quoted>
- `<source-of-truth file>:<line>` — <what reality says>

### Suggested resolution

<for drift: the concrete edit a reader could verify. For Lane C: the question for
a human — which reading is canonical?>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by closing
with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=docs date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:docs`, `wolfe:needs-triage`.

### Bug-Papering issue variant (hard gate)

When a doc/code disagreement has the CODE looking wrong, do NOT edit the doc.
File the issue body above with these changes: title prefixed `Suspected bug:`,
labels `wolfe:bug` + `wolfe:needs-triage` (NOT `wolfe:docs`), confidence capped
at 0.5, and the "Suggested resolution" section names the suspected bug and hands
off to wolfe-bugs / a human. The doc edit waits until the code is resolved.

## `[unverified]` issue body (degradation rule)

Same as the issue body, with the title prefixed `[unverified]`, the label
`wolfe:unverified` added, and this callout inserted directly under the title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

## Dry-run report (`.wolfe/reports/<date>-docs-dryrun.md`)

```markdown
# wolfe-docs dry run — <date> — area: <area>

<for each would-be artifact: the full body it would have filed, prefixed by
`## WOULD OPEN: drift draft PR` / `## WOULD OPEN: maintenance PR` /
`## WOULD OPEN: restore-PR` / `## WOULD FILE: issue`>

## WOULD STAMP

<docs whose `last_verified` would advance, with reason: `untouched (empty audit
scope)` or `audit resolved`. Zero `gh` writes, zero ledger writes in dry-run.>

## Run summary

<the same YAML block the live run would print, with the docs `outcomes` keys:
`stamps`, `maintenance`>
```
