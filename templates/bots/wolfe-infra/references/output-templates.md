# wolfe-infra — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket
slots). Uniform output is what makes one-glance human triage possible.

**This bot is FILE-ONLY: there is NO draft-PR body.** A wrong infra change takes
down deploys, so a human gates every remediation. The issue body therefore
carries the FULL evidence package — including any remediation patch, embedded as
a diff inside the body, never pushed as a PR. Workflow-file remediations
especially live only in the issue body (the routing partial forbids workflow
edits in PRs for every bot).

## Issue body (verified, or 0.6–0.85, or file-routed — the primary artifact)

```markdown
## 🏗️ <one-line infra-posture statement>

**Area:** `<area>` · **Class:** `<check_id>` · **Blast radius:** <prod-touching | deploy-path | dev-only> · **Confidence:** <0.NN> (<validator-verified | static-inspection, no validator>)

> Validated statically only. wolfe-infra never deploys, applies, or runs
> containers — behavior under a real deploy is a human's call.

### What's wrong

<2–5 sentences: the posture or correctness defect, the mechanism, and when it
bites. For supply-chain: what mutable reference can change under you. For
ci-injection: what untrusted input reaches which privileged context.>

### Evidence

- `<file>` — <quoted line(s); for secret-shaped values, location + redacted prefix ONLY, never the value>
- `<file>` — <…>

### Validator

- [<x|/>] `<validator command>` (<workflow linter | container-file linter | IaC validate/plan no-op | schema dry-run>) reproduces the flag on `<file>:<lines>`
- No validator available → state: "no `<class>` validator detected; flagged by static inspection of `<file>:<lines>`."

### Remediation (patch in body — NOT a PR)

<the minimal correct change as a fenced ```diff. For pins: cite the EXACT
resolved digest/SHA/version AND where it resolved from (pin-with-provenance).
For destructive changes (delete/replace/rename of a deployed resource): DO NOT
provide an apply-ready patch — describe the change and add an explicit
blast-radius warning instead.>

- Validator goes clean on the patched file: [<x|/>]
- `<verify command>` still passes: [<x|/>]

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

### Reviewer notes

This is an autonomous wolfe-pack finding. If this is wrong or unwanted, closing
the issue is a valid review outcome — add the `wolfe:rejected` label and the
pack will never re-file it.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=infra date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:infra`, `wolfe:needs-triage` (+ the repo's own
`type:`/`severity:` labels when WOLFE.md says those families exist). Branch
prefix (for the human-implemented or fixer-implemented remediation, never
authored by this bot): `wolfe/infra/<YYYY-MM-DD>-<slug>`.

## `[unverified]` issue body (degradation rule)

Same as the issue body, with the title prefixed `[unverified]`, the label
`wolfe:unverified` added, and this callout inserted directly under the title.
Use this ONLY when the environment blocked the validator from running (per the
degradation rule) — NOT when the validator is simply absent (an absent validator
caps confidence at 0.6–0.85 on a normal issue and cites the exact lines):

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

## Dry-run report (`.wolfe/reports/<date>-infra-dryrun.md`)

```markdown
# wolfe-infra dry run — <date> — area: <area>

<for each would-be artifact: the full issue body it would have filed, prefixed
by `## WOULD FILE: issue`. This bot opens no PRs, so there is no
`WOULD OPEN: draft PR` section.>

## Run summary

<the same YAML block the live run would print>
```
