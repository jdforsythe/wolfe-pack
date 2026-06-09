# wolfe-a11y — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket slots).
Uniform output is what makes one-glance human triage possible.

## Draft PR body (verified, ≥0.85, auto-fixable, autonomy ≥2)

Only findings that passed the **automated-check-or-issue** gate — an a11y engine,
lint rule, or component test that failed before the fix and passes after — are
ever PR'd. Judgment-only rules (color-only signaling, focus-order quality,
alt-text quality) never reach this shape; they file as issues.

```markdown
## ♿ <one-line accessibility defect statement>

**Area:** `<area>` · **Rule:** `<rule_id / WCAG SC>` · **Confidence:** <0.NN> (verified)

### What's wrong

<2–5 sentences: who is locked out and how. The mechanism — which assistive-tech
or keyboard interaction breaks, not just "it's inaccessible".>

### Offending element

```html
<the exact offending markup, quoted verbatim — character-for-character>
```

- `<file>` — <what this element does and why it fails the rule>

### Verification

- [x] Automated check `<engine / lint rule / test file>` fails on `<default branch>` (3/3 runs) with `<violation id>`
- [x] Check passes with this fix
- [x] `<verify command>` green — no regressions
- [x] No layout or business-logic change (appearance preserved)
- [x] Native semantics preferred — no ARIA sprayed over a non-semantic element

### The fix

<1–3 sentences: what changed and why this is the minimal correct fix. State the
native element used; if ARIA was unavoidable, say why no native element fit.>

### Reviewer notes

This is an autonomous wolfe-pack finding. If this is wrong or unwanted, closing
the PR is a valid review outcome — add the `wolfe:rejected` label and the pack
will never re-file it.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=a11y date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:a11y`, `wolfe:fix` (+ the repo's own `type:`/`severity:` labels
when WOLFE.md says those families exist). PR is a **draft**. Branch:
`wolfe/a11y/<YYYY-MM-DD>-<slug>`.

## Issue body (0.6–0.85, judgment-only, or file-routed)

Used for every finding that is NOT a verified, automated-check-provable,
auto-fixable defect — including all human-judgment rules (color-only signaling,
focus-order quality, alt-text quality). The element is always quoted verbatim.

```markdown
## ♿ <one-line accessibility defect statement>

**Area:** `<area>` · **Rule:** `<rule_id / WCAG SC>` · **Confidence:** <0.NN>

### What looks wrong

<the mechanism: who is affected and how. If this is a human-judgment rule
(color-only, focus order, alt-text quality), say so explicitly — a machine cannot
prove it, so it files as an issue rather than a PR.>

### Offending element

```html
<the exact offending markup, quoted verbatim — character-for-character>
```

- `<file>` — <what this element does and why it fails the rule>

### Suggested verification

<the concrete automated check that would prove it — the engine rule, lint rule,
or component assertion to add, and what it should assert. For judgment-only rules,
the concrete check a human applies.>

### Suggested fix sketch

<approach only; nobody has verified this yet. Prefer a NATIVE semantic element —
name it. If the image's meaning is unknown, do NOT invent alt text: suggest
`<!-- TODO: human alt -->` and flag for a human to supply intent.>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by closing
with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=a11y date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:a11y`, `wolfe:needs-triage`.

## `[unverified]` issue body (degradation rule)

Used when no a11y tooling exists in the repo, or the check can't be run in this
environment. Same as the issue body, with the title prefixed `[unverified]`, the
label `wolfe:unverified` added, and this callout inserted directly under the
title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

When the block is "no a11y tooling detected in the repo," ALSO append this line so
the gap is closeable, naming the `wolfe/scanners` entry init would record:

```markdown
> **No accessibility scanner detected.** Consider adding one — init would record
> `<scanner-name, e.g. axe-core integration>` under `wolfe/scanners` so future
> findings can be verified and PR'd.
```

## Dry-run report (`.wolfe/reports/<date>-a11y-dryrun.md`)

```markdown
# wolfe-a11y dry run — <date> — area: <area>

<for each would-be artifact: the full body it would have filed, prefixed by
`## WOULD OPEN: draft PR` / `## WOULD FILE: issue`>

## Run summary

<the same YAML block the live run would print>
```
