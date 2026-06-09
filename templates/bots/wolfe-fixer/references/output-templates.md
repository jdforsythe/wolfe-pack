# wolfe-fixer — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket slots).
Uniform output is what makes one-glance human triage and merge possible. The
fixer files NO issues — it never reports findings, only implements approved
ones; there is therefore no issue template here. Its PR is **ready-for-review,
not a draft**: the fixer's PRs are human-approved work products (a human applied
`wolfe:queued`), so they enter review immediately — unlike the hunters'
speculative PRs, which are drafts because nobody asked for them yet.

A note for run-marker parsers: the fixer's `<!-- wolfe-run: ... -->` markers
deliberately substitute `unit=<slug>` (and `issues=<N,M>` on PRs) for the
hunters' `area=<area>` key — the fixer scopes to issue units, not areas — and
fixer PRs carry no `<!-- fingerprint: -->` comment, because their dedup is the
`Closes #N` linkage, not a finding fingerprint.

## Claim comment (posted the instant you take the lock, Phase 3)

```markdown
🔧 **wolfe-fixer is on this.** Claimed as part of unit `<slug>`.

- **Unit:** <#N> (or "#N, #M, #P — <one-sentence seam>")
- **Branch:** `wolfe/fixer/<YYYY-MM-DD>-<slug>`
- **Plan:** tests-first to green, then a ready-for-review PR that closes this
  issue. I will not merge — a human does that.

If this issue should NOT be worked, remove `wolfe:queued` or close it with
`wolfe:rejected` and I will release the claim on my next run.

<!-- wolfe-claim: issue=<N> branch=wolfe/fixer/<YYYY-MM-DD>-<slug> -->
<!-- wolfe-run: bot=fixer date=<YYYY-MM-DD> unit=<slug> -->
```

The `wolfe:fixing` label is the durable lock; this comment is the human-readable
record of it. Post both together, BEFORE any implementation work.

## Ready-for-review PR body (verified green, autonomy 3)

```markdown
## 🔧 <one-line statement of what this unit fixes>

**Unit:** `<slug>` · **Issues:** <#N> (or `#N, #M`) · **Verify:** green

Closes #<N>
<!-- one `Closes #<N>` line per issue in the unit -->

### What changed

<2–5 sentences: the root cause or desired behavior these issues described, and
the minimal change that satisfies them. No restructuring beyond the acceptance
criteria.>

### Acceptance criteria

- [x] <criterion 1, verbatim from the issue body>
- [x] <criterion 2>
<!-- every enumerated criterion from every issue in the unit, all checked -->

### Tests

- `<test file>` — <what it asserts; failed before the fix, passes after>
<!-- one line per failing-first test added -->

### Verification

- [x] `<verify command>` green — full suite, the new tests among the passing set
- [x] Each unit test failed on the pre-fix code (red) and passes now (green)

### Docs touched

<files updated, or "none — no documented behavior changed.">

### Reviewer notes

This PR was produced by wolfe-fixer from human-approved `wolfe:queued`
issue(s) — it is ready for review, not a draft. If it is wrong or unwanted,
closing the PR is a valid review outcome — add the `wolfe:rejected` label to the
originating issue(s) and the pack will not re-queue them. wolfe-fixer never
merges; a human is the integrator.

<!-- wolfe-run: bot=fixer date=<YYYY-MM-DD> unit=<slug> issues=<N,M> -->
```

Labels: `wolfe:fix` plus each originating issue's own category labels (e.g.
`wolfe:bug`, and the repo's own `type:`/`severity:` labels when WOLFE.md says
those families exist). The PR is **ready for review (non-draft)**. Branch:
`wolfe/fixer/<YYYY-MM-DD>-<slug>` (suffix `-2`, `-3` on collision).

## Abort comment (verify red after the retry budget, Phase 6)

```markdown
⚠️ **wolfe-fixer released this claim — could not reach green.**

I claimed this issue, wrote the failing-first test, and applied a fix, but the
verify gate stayed red and I stopped rather than ship something unverified.

- **Verify command:** `<verify command>`
- **What failed:** <the specific failing test / assertion, redacted of any
  secret values>
- **Attempts:** <the up-to-4 narrowing changes I tried, one line each>
- **State:** `wolfe:fixing` removed; this issue is claimable again. No PR was
  opened.

A human can pick this up — or re-queue it and I will try again next run.

<!-- wolfe-abort: issue=<N> reason=verify-red attempts=<n> -->
<!-- wolfe-run: bot=fixer date=<YYYY-MM-DD> unit=<slug> -->
```

When the abort is **environmental** (the gate could not honestly run — refused
service, missing secret, timeout past limit × 1.5), use the same shape but set
**What failed** to the environmental reason and add a final line:

```markdown
- **To verify locally:** `<exact command a human can run in an environment that
  has <the missing dependency>>`
```

…and set the marker reason to `reason=environment`. The fixer never guesses at
a fix to work around an environment it lacks.

## Stale-claim release comment (Phase 0 reconciliation)

```markdown
🧹 **wolfe-fixer released a stale claim.**

This issue carried `wolfe:fixing` but no open `wolfe:fix` PR references it
(`Closes #<N>`), so a previous run claimed it and did not finish. Removing
`wolfe:fixing` and returning it to the claimable queue.

<!-- wolfe-stale-release: issue=<N> -->
<!-- wolfe-run: bot=fixer date=<YYYY-MM-DD> -->
```

## Dry-run report (`.wolfe/reports/<date>-fixer-dryrun.md`)

```markdown
# wolfe-fixer dry run — <date>

**Queue depth:** <n open `wolfe:queued`> · **Selected unit:** <#N | none>
**Grouping rationale:** <one sentence naming the seam | "single issue">

## WOULD CLAIM

<the full claim comment that would have been posted>

## WOULD OPEN: ready-for-review PR

<the full PR body that would have been filed, including the acceptance-criteria
checklist and the planned failing-first tests — marked as PLANNED, since nothing
was actually run in a dry run>

## Stale claims that would be reconciled

<for each: the stale-claim release comment, or "none">

## Run summary

<the same YAML block the live run would print>
```

A `--dry-run` writes everything that WOULD have happened to this file and makes
zero `gh` writes, zero label changes, zero pushes — and runs no verify command.
