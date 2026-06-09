# wolfe-security — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket
slots). Uniform output is what makes one-glance human triage possible.

**No PR body — by design.** `security` is file-only ABSOLUTELY: no autonomy
level and no `routing_overrides` entry turns a security finding into a PR, so
there is no draft-PR template here. The issue body (or the private vulnerability
report) carries the FULL evidence package — severity, impact, reachability
evidence, and the fix sketch a human will act on. A wrong autonomous security
"fix" is the worst possible outcome; humans gate every remediation.

## Issue body (public — private vulnerability reporting NOT enabled)

Lead with severity + impact + reachability evidence. Use measured wording:
mechanism and location, never a step-by-step how-to-exploit. Redact every secret
to its location and first-4-char prefix.

```markdown
## 🔒 <one-line vulnerability statement>

**Area:** `<area>` · **Class:** `<vuln_class>` · **Severity:** <low|medium|high|critical> · **Confidence:** <0.NN> (<verified: reachability|verified: tool|unverified>)

### Impact

<2–4 sentences: what an attacker gains, against whom, through which public
entry point. Impact is the lead — severity is justified here, not asserted.>

### Reachability evidence

<Lane A — reachability-verified: "A probe through the `<handler>` entry point
reaches `<sink>` unescaped; the repro asserts `<observed malformed
query/command/redirect>`." Describe the test SHAPE — never paste a copy-ready
exploit (no weaponized PoC).>

<Lane B — tool-verified: cite the scanner/audit output verbatim — advisory ID,
package, affected range, or the SAST rule id — secrets redacted to first 4
chars.>

### Evidence

- `<file>` — <quoted sink line; payloads and secrets stripped/redacted>
- `<file>` — <…>

### Suggested remediation

<approach only: parameterize the query, add the authz check, rotate + remove the
committed secret, pin/upgrade the dependency. A human implements — the pack does
not auto-fix security.>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=security date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:security`, `wolfe:needs-triage` (+ the repo's own
`severity:`/`type:` labels when WOLFE.md says those families exist). Branch
prefix for any human-driven follow-up: `wolfe/security/<YYYY-MM-DD>-<slug>`.

## Private vulnerability report (private reporting IS enabled)

When `gh api repos/{owner}/{repo}/private-vulnerability-reporting` shows enabled
(unique gate 1), file the finding through GitHub private vulnerability reporting
INSTEAD of a public issue. The private report uses the SAME body as the public
issue above (full detail is appropriate in a private channel — but the
no-weaponized-PoC and secret-redaction gates still hold). In the PUBLIC run
summary, record only a count:

```yaml
  outcomes:
    private_reports: <n>
```

Never write the mechanism or location of a privately-reported finding into the
public run log, the pinned run-log issue, or any public artifact.

## `[unverified]` issue body (degradation rule)

Same as the public issue body, with the title prefixed `[unverified]`, the label
`wolfe:unverified` added, the verification tag set to `unverified`, and this
callout inserted directly under the title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

An unverified finding is still file-only and still routes through the
disclosure check (gate 1). It is NEVER opened as a PR — at any confidence, at
any autonomy level.

## Dry-run report (`.wolfe/reports/<date>-security-dryrun.md`)

The dry-run report stays local — zero `gh` writes, zero pushes — so full detail
is appropriate here (still no weaponized PoC; still redact secrets). Note which
findings WOULD have gone to a private report vs a public issue.

```markdown
# wolfe-security dry run — <date> — area: <area>

<for each would-be artifact: the full body it would have filed, prefixed by
`## WOULD FILE: public issue` / `## WOULD FILE: private vulnerability report`>

## Run summary

<the same YAML block the live run would print, including private_reports>
```
