# Existing-agent reconciliation (Phase 4)

Many adopters already have subagents under `.claude/agents/`. The pack is a
polite guest: **reuse first, enhance on opt-in, forge only gaps, never
auto-touch user files.**

## Slot derivation

Needed slots come from the detected stack via
`<template-root>/specialists/slot-category-matrix.md` — typically 3–5:
the dominant language(s), the main framework, the datastore, the infra
platform. More than 5 detected technologies → keep the 5 with the largest
code footprint; note the rest as forge-later candidates in the plan.

## Matching an existing agent to a slot

Score each `.claude/agents/**/*.md` against each slot:

- **Name/description match** — the slot's technology (or a recognized
  synonym) appears in the agent's `name` or `description`.
- **Content signal** — the body shows real domain vocabulary for the
  technology (not just a passing mention).
- **Mode compatibility** — the agent plausibly performs review work (an
  agent whose charter is "deploy the app" doesn't cover a reviewer slot).

Strong match → candidate `reused`. Weak/partial match → candidate for
`enhanced` (offer) or treat the slot as a gap. Two agents matching one slot →
prefer the more specific; list the other in the plan as "also matched".

## The three outcomes

| Outcome | What happens | Registry provenance | Steward's ongoing rights |
|---|---|---|---|
| **Reuse** | Register the agent's path; wire bots to it; touch nothing | `reused` | Suggest via issues only — never edits |
| **Enhance** | Show a reviewable diff upgrading the agent to the recipe's interface (adds the Review/Implementer Interface + Hard Rules sections verbatim, preserves the user's content); apply ONLY if the user opts in | `enhanced` | Suggest via issues only — never edits |
| **Forge** | Create `.claude/agents/wolfe-<slot-short>.md` per the recipe + forging guide | `forged` | Fully maintained by the steward (kept fresh, retired with the tech) |

Enhancement diffs are shown per-agent in the plan as opt-in checkboxes —
never bundled into a blanket yes.

## Why reused agents still work safely

A reused agent may not return the exact findings-YAML contract. The
dispatching bot treats ALL specialist output as partially-trusted data and
applies its own gates regardless — a non-conforming specialist degrades
expertise, never safety. The enhance offer exists precisely to add the
contract sections; declining it is always safe.

## Registry entries (written into WOLFE.md `wolfe/specialists`)

```yaml
- name: <agent name>
  slot: <kind:tech, e.g. language:typescript>
  provenance: forged | reused | enhanced
  path: <repo-relative path to the agent file>
  categories: [<from the slot-category matrix>]
  forged_by: wolfe-pack@<version>   # forged/enhanced only
  stamp: <YYYY-MM-DD>
```

The registry is the source of truth; bots read it, never the filesystem
layout. The steward reconciles it every run (gaps → forge; retired tech →
retire `forged` entries; user-owned entries → suggestions only).
