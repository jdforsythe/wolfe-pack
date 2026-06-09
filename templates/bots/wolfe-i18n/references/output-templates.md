# wolfe-i18n — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket
slots). Uniform output is what makes one-glance human triage possible.

The draft-PR body is for MECHANICAL classes only — `missing-key`, `parity`,
`icu-mismatch`, `dead-key`. Hardcoded-string findings are ISSUE-ONLY: they use
the issue body, never the PR body, because extraction changes the render path
and a human must approve it.

## Draft PR body (verified, ≥0.85, mechanical class, autonomy ≥2)

```markdown
## 🌐 <one-line i18n statement>

**Area:** `<area>` · **Class:** `<missing-key|parity|icu-mismatch|dead-key>` · **Confidence:** <0.NN> (verified)

### What's wrong

<2–5 sentences: the mechanism, not just the symptom. Which keys/locales, why it
breaks at runtime or diverges across locales, and who/what it affects.>

### Affected keys & locales

| Key | Source locale | Affected locale(s) |
|---|---|---|
| `<key path>` | `<src>` | `<locale, locale>` |

### Evidence

- `<code file>` — <quoted reference / call site>
- `<locale file>` — <quoted catalog state>

### Verification

- [x] Mechanical check `<test/extractor/comparison>` FAILS on `<default branch>` (3/3 runs)
- [x] Same check passes with this fix
- [x] ICU/argument set comparison shows parity after (command + output recorded below)
- [x] `<verify command>` green — no regressions

<recorded command invocations and before/after output for the argument-set
comparison or extractor, where applicable.>

### Source-locale fallbacks added

<REQUIRED whenever a missing value was filled. List EVERY key filled with the
source-locale string via the framework's explicit fallback/TODO convention,
per locale. If none were added, write `None — only mechanical key/argument
changes.` NEVER list a machine-translated or hand-composed target string here;
that is a hard-gate violation.>

| Key | Locale | Fallback value (source-locale) |
|---|---|---|
| `<key>` | `<locale>` | `<source string>` |

### The fix

<1–3 sentences: which keys were added/removed/aligned, and why this is the
minimal correct change. Only the affected keys are touched — no catalog churn.>

### Reviewer notes

This is an autonomous wolfe-pack finding. If this is wrong or unwanted,
closing the PR is a valid review outcome — add the `wolfe:rejected` label and
the pack will never re-file it.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=i18n date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:i18n`, `wolfe:fix` (+ the repo's own `type:`/`severity:` labels
when WOLFE.md says those families exist). PR is a **draft**. Branch:
`wolfe/i18n/<YYYY-MM-DD>-<slug>`.

## Issue body (0.6–0.85, hardcoded-string findings, or file-routed)

```markdown
## 🌐 <one-line i18n statement>

**Area:** `<area>` · **Class:** `<class>` · **Confidence:** <0.NN>

### What looks wrong

<the mechanism hypothesis; which keys/locales/strings, runtime-breakage vs
divergence vs hardcoded distinguished.>

### Affected keys & locales

| Key / string | Source locale | Affected locale(s) |
|---|---|---|
| `<key or quoted string>` | `<src>` | `<locale, locale>` |

### Evidence

- `<code file>` — <quoted reference or hardcoded literal>
- `<locale file>` — <quoted catalog state>

### Suggested verification

<the concrete mechanical check that would prove it — the key-resolution test to
write, the extractor/linter command to run, or the ICU argument-set comparison.
For a hardcoded string: what the extracted key would be and why a human must
approve moving the string out of the render path.>

### Suggested fix sketch

<approach only; nobody has verified this yet. For missing keys a translator
cannot fall back: list the keys per locale so words can be supplied. NEVER
propose a target-language translation.>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=i18n date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:i18n`, `wolfe:needs-triage`.

## `[unverified]` issue body (degradation rule)

Same as the issue body, with the title prefixed `[unverified]`, the label
`wolfe:unverified` added, and this callout inserted directly under the title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

## Dry-run report (`.wolfe/reports/<date>-i18n-dryrun.md`)

```markdown
# wolfe-i18n dry run — <date> — area: <area>

<for each would-be artifact: the full body it would have filed, prefixed by
`## WOULD OPEN: draft PR` (mechanical classes only) / `## WOULD FILE: issue`
(hardcoded-string and all file-routed findings)>

## Run summary

<the same YAML block the live run would print>
```
