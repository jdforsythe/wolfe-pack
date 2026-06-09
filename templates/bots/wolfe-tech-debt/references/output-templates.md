# wolfe-tech-debt — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket
slots). Uniform output is what makes one-glance human triage possible.

**No PR body.** tech-debt is a file-only category — it NEVER opens a PR at any
autonomy level. There is therefore no draft-PR template here. Instead, the
issue body below carries the FULL evidence package: the interest math, the
behavior-preservation lane, the proven anchor (existing-suite result + exports
diff for Lane A, or the characterization-test file + result for Lane B), and
the ordered `test → refactor` plan. Everything the fixer or a human needs to
execute the refactor under the inherited gate lives in that one issue.

## Issue body (every verified or file-routed finding)

```markdown
## ♻️ <one-line debt statement>

**Area:** `<area>` · **Class:** `<debt_class>` · **Lane:** <A|B|C> · **Confidence:** <0.NN> (anchored)

### The debt

<2–5 sentences: what the debt is (duplication / shallow module / dead code /
type erosion / layer violation / premature abstraction), where it lives, and
why it compounds. Shape problem, never a behavior problem.>

### Interest (why this ranks)

`interest = churn_count × log2(complexity_max + 1) × debt_signal_count`

- **churn_count:** <n> touches over the last <Nd> (git log over the area)
- **complexity_max:** <n>
- **debt_signal_count:** <n> (<list the signals: duplication, dead-export, …>)
- **interest:** **<computed value>**

### Evidence

- `<file>` — <quoted block / dead export / `any`-cast / crossing import>
- `<file>` — <…the second/third duplicate, or the empty-implementer abstraction…>

### Behavior-preservation anchor

<Lane A:> Existing suite passes UNCHANGED against the refactored shape, and the
exported-symbol diff is empty:

- [x] `<verify command>` green on the refactored code — no test edits
- [x] Exports diff empty (public API surface unchanged)

<Lane B:> Characterization tests pin the CURRENT behavior and pass on the
current code; they must pass UNCHANGED after the refactor:

- [x] `<char test file>` passes on current code (3/3 runs)
- [ ] `<char test file>` passes UNCHANGED after the refactor (fixer confirms)

<Lane C:> No runnable anchor — explain why a characterization test cannot pin
this here, and treat the proposal as a plan a human must validate before any
change.

### Refactor plan (the gate travels with this issue)

<Lane A:> A single bounded change — <rename | extract | delete dead export |
tighten type>. ≤15 files, ≤500 changed LOC. Existing suite is the gate.

<Lane B:>
- `commit 1 — test: <pin current behavior with characterization tests>`
- `commit 2 — refactor: <the shape change>` — char tests pass UNCHANGED

<Lane C:> Concrete proposal only; do not change behavior until a human anchors it.

### Scope

<n> files · ~<n> changed LOC (within the ≤15 files / ≤500 LOC bound).

### Triage

Queue it for the fixer by adding `wolfe:queued` — the lane + plan above ARE the
fixer's gate. Reject it permanently by closing with `wolfe:rejected`. Closing
this issue is a valid review outcome — add the `wolfe:rejected` label and the
pack will never re-file it.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=tech-debt date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:tech-debt`, `wolfe:needs-triage` (+ the repo's own
`type:`/`severity:` labels when WOLFE.md says those families exist). Branch (if
the fixer later executes it): `wolfe/tech-debt/<YYYY-MM-DD>-<slug>`.

## `[unverified]` issue body (degradation rule)

Same as the issue body, with the title prefixed `[unverified]`, the label
`wolfe:unverified` added, and this callout inserted directly under the title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

Use this when you could not run the existing suite (Lane A) or author-and-run
the characterization tests (Lane B) because the environment blocked it. The
anchor section then carries the exact commands a human can run to build it.
A finding whose anchor could never be RUN is never queued as if it were
verified — `wolfe:unverified` says so on its face.

## Dry-run report (`.wolfe/reports/<date>-tech-debt-dryrun.md`)

```markdown
# wolfe-tech-debt dry run — <date> — area: <area>

<for each would-be finding: the full issue body it would have filed, prefixed
by `## WOULD FILE: issue` — including the interest math and the proven anchor
(suite result / exports diff / char-test result). There is no `WOULD OPEN: PR`
line — tech-debt never opens a PR.>

## Run summary

<the same YAML block the live run would print>
```
