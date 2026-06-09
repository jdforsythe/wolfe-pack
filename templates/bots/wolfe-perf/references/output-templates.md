# wolfe-perf — output templates

Every artifact uses one of these shapes verbatim (fill the angle-bracket
slots). Uniform output is what makes one-glance human triage possible.

**Perf is file-only — there is NO draft-PR template.** wolfe-perf never opens a
PR: a human owns the memory/complexity/behavior-under-load trade-off. The issue
body below IS the deliverable, so it carries the FULL evidence package — the
verification lane, the honest before/after delta or profiling plan, the
measurement parameters, and the suggested change sketch. A human triages it,
then the fixer (or a person) implements.

## Issue body (verified Lane A/B, or Lane C with a plan)

```markdown
## ⚡ <one-line performance statement>

**Area:** `<area>` · **Class:** `<perf_class>` · **Lane:** <A microbench | B query-plan | C profiling-plan> · **Confidence:** <0.NN>

### The cost

<2–5 sentences: where the time/allocation/bytes go, on which path, and how hot
that path is. Evidence-of-hotness, expected win, and — for any Big-O claim —
the production input size you expect.>

### Evidence

- `<file>` — <quoted line(s) and what they show>
- `<file>` — <…>

### Measurement (Lane A — microbench)

- Harness: `<bench command or inline harness>` · fixtures: `<real corpus source>`
- Warmup: <≥3> iterations · Measured: <≥10> iterations
- **Before:** median <Nms> (σ <Nms>) · **After:** median <Nms> (σ <Nms>)
- Honest delta: <median Nms → Nms> — <"significant: exceeds combined σ" / state it>

### Measurement (Lane B — query plan)

- Query-plan tool: `<EXPLAIN ANALYZE / equivalent, with BUFFERS when available>`
- **Before plan:** <round trips, scan type, est/actual rows>
- **After plan:** <round trips, scan type, est/actual rows>
- Result-set equivalence test: `<test file>` — proves same rows, same order
  for ordered queries

### Profiling plan (Lane C — no bench surface)

- **What to measure:** <the metric — wall time / allocations / round trips>
- **How:** <profiler, harness, or instrumentation to add>
- **Where:** `<file/function>` — <the exact hot path to attribute cost to>
- Confidence is capped at 0.6: this is a hypothesis with a recipe, not a
  proven win.

### Suggested change

<approach only; for memoization include the hit-rate argument, for concurrency
state the bounded batch/pool size (backpressure). A human decides whether the
win is worth the memory/complexity cost.>

### Triage

Queue it for the fixer by adding `wolfe:queued`. Reject it permanently by
closing with `wolfe:rejected`.

<!-- fingerprint: <16-hex> -->
<!-- wolfe-run: bot=perf date=<YYYY-MM-DD> area=<area> -->
```

Labels: `wolfe:perf`, `wolfe:needs-triage` (+ the repo's own `type:`/`severity:`
labels when WOLFE.md says those families exist). Include ONLY the measurement
block matching the recorded lane; drop the other two. Branch (when a human or
the fixer later implements): `wolfe/perf/<YYYY-MM-DD>-<slug>`.

## `[unverified]` issue body (degradation rule)

Same as the issue body, with the title prefixed `[unverified]`, the label
`wolfe:unverified` added, and this callout inserted directly under the title:

```markdown
> **Verification blocked:** couldn't run `<command>` in this environment —
> <reason>. To verify locally: `<exact command>`.
```

An `[unverified]` perf issue claims NO measured number it could not measure: it
carries the Lane A/B harness a human can run, or the Lane C profiling plan, and
nothing more. The measure-first promise holds by construction.

## Reviewer / closing note

Every issue body ends its Triage section with the standard pack note: if this
finding is wrong or unwanted, closing the issue is a valid triage outcome — add
the `wolfe:rejected` label and the pack will never re-file this fingerprint.

## Dry-run report (`.wolfe/reports/<date>-perf-dryrun.md`)

```markdown
# wolfe-perf dry run — <date> — area: <area>

<for each would-be artifact: the full issue body it would have filed, prefixed
by `## WOULD FILE: issue` (perf files no PRs — file-only)>

## Run summary

<the same YAML block the live run would print>
```
