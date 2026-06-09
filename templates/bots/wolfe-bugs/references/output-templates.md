# wolfe-bugs — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket
slots). Uniform output is what makes one-glance human triage possible.

## Draft PR body (verified, ≥0.85, autonomy ≥2)

```markdown
## 🐛 <one-line bug statement>

**Area:** `<area>` · **Class:** `<bug_class>` · **Confidence:** <0.NN> (verified)

### What's wrong

<2–5 sentences: the mechanism, not just the symptom. Root cause, when it
bites, who/what it affects.>

### Evidence

- `<file>` — <quoted line(s) and what they show>
- `<file>` — <…>

### Verification

- [x] Reproducer `<test file>` fails on `<default branch>` (3/3 runs)
- [x] Reproducer passes with this fix
- [x] `<verify command>` green — no regressions

### The fix

<1–3 sentences: what changed and why this is the minimal correct fix.>

### Reviewer notes

This is an autonomous wolfe-pack finding. If this is wrong or unwanted,
closing the PR is a valid review outcome — add the `wolfe:rejected` label and
the pack will never re-file it.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=bugs date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:bug`, `wolfe:fix` (+ the repo's own `type:`/`severity:` labels
when WOLFE.md says those families exist). PR is a **draft**. Branch:
`wolfe/bugs/<YYYY-MM-DD>-<slug>`.

## Issue body (0.6–0.85, or file-routed)

```markdown
## 🐛 <one-line bug statement>

**Area:** `<area>` · **Class:** `<bug_class>` · **Confidence:** <0.NN>

### What looks wrong

<the mechanism hypothesis; symptom vs cause distinguished.>

### Evidence

- `<file>` — <quoted line(s)>

### Suggested verification

<the concrete failing test that would prove it — what to assert, where.>

### Suggested fix sketch

<approach only; nobody has verified this yet.>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=bugs date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:bug`, `wolfe:needs-triage`.

## `[unverified]` issue body (degradation rule)

Same as the issue body, with the title prefixed `[unverified]`, the label
`wolfe:unverified` added, and this callout inserted directly under the title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

## Dry-run report (`.wolfe/reports/<date>-bugs-dryrun.md`)

```markdown
# wolfe-bugs dry run — <date> — area: <area>

<for each would-be artifact: the full body it would have filed, prefixed by
`## WOULD OPEN: draft PR` / `## WOULD FILE: issue`>

## Run summary

<the same YAML block the live run would print>
```
