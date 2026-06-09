# wolfe-test-gaps — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket
slots). Uniform output is what makes one-glance human triage possible.
`test-gaps` is auto-fixable, so verified high-confidence findings become
**tests-only** draft PRs — the PR diff touches ONLY test files and test
fixtures/helpers. Findings that can't be verified, or that need production-code
changes, route to issues (or a bug/debt handoff note in the run summary).

## Draft PR body (verified, ≥0.85, autonomy ≥2) — tests-only

```markdown
## 🧪 <one-line gap statement>

**Area:** `<area>` · **Class:** `<gap_class>` · **Confidence:** <0.NN> (verified)

### The gap

<2–5 sentences: what behavior or surface had no faithful test, why it matters
(public API? error/rejection path?), and what this PR now covers. Mechanism,
not just "coverage was low".>

### Evidence

- `<target file>` — <the untested export/branch/error path, quoted>
- `<existing test file>` — <what it does or doesn't assert, quoted>

### Faithful-test verification

- [x] New test `<test file>` is RED before it is green — <fails on uncovered
  behavior | fails under the named mutation: `<plausible mutation>`>
- [x] Assertions check values/shapes/relations/errors — no proxy assertions,
  no snapshot-only body
- [x] No production-code change — diff is tests/fixtures/helpers only
- [x] `<verify command>` green — suite passes 3/3, no flakes, no regressions

### What was added

<1–3 sentences: which tests, which layer (unit/integration/contract), and the
oracle each one checks.>

### Reviewer notes

This is an autonomous wolfe-pack finding. The diff is tests-only by contract;
no production behavior changed. If this is wrong or unwanted, closing the PR is
a valid review outcome — add the `wolfe:rejected` label and the pack will never
re-file it.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=test-gaps date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:test-gap`, `wolfe:fix` (+ the repo's own `type:`/`severity:`
labels when WOLFE.md says those families exist). PR is a **draft**. Branch:
`wolfe/test-gaps/<YYYY-MM-DD>-<slug>`.

## Issue body (0.6–0.85, or file-routed)

```markdown
## 🧪 <one-line gap statement>

**Area:** `<area>` · **Class:** `<gap_class>` · **Confidence:** <0.NN>

### The gap

<the untested surface or weak-assertion hypothesis; why it's risk-weighted
where it is — public API, error path, critical seam.>

### Evidence

- `<target file>` — <untested export/branch/error path, quoted>
- `<existing test file>` — <weak/absent assertion, quoted>

### Suggested test

<the concrete faithful test that would close it — which layer, what to assert
(value/shape/relation/error), and how it goes red first (uncovered behavior, or
the plausible mutation it must catch).>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=test-gaps date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:test-gap`, `wolfe:needs-triage`.

## `[unverified]` issue body (degradation rule)

Same as the issue body, with the title prefixed `[unverified]`, the label
`wolfe:unverified` added, and this callout inserted directly under the title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

A gap whose authored test was never run red-then-green here is NEVER a PR — it
files as this `[unverified]` issue carrying the full evidence package and the
suggested faithful test, for a human (or a re-run in a fuller environment) to
verify.

## Dry-run report (`.wolfe/reports/<date>-test-gaps-dryrun.md`)

```markdown
# wolfe-test-gaps dry run — <date> — area: <area>

<for each would-be artifact: the full body it would have filed, prefixed by
`## WOULD OPEN: draft PR` / `## WOULD FILE: issue`. For each bug-handoff, prefix
`## WOULD HAND OFF: bugs` with the file and the failing assertion.>

## Run summary

<the same YAML block the live run would print>
```
