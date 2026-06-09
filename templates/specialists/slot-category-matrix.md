# Slot → category matrix

The fixed mapping from a specialist **slot** to the bot **categories** that slot
serves. This table is authoritative: the forging procedure reads categories from
here, never invents them. A specialist's `categories` (in its provenance comment
and its `wolfe/specialists` registry entry) determine which bots fan out to it.

| Slot | Categories |
|---|---|
| `language:*` | bugs, test-gaps, tech-debt, perf |
| `framework-frontend:*` | bugs, a11y, perf, test-gaps, i18n |
| `framework-backend:*` | bugs, perf, test-gaps, security |
| `datastore:*` | bugs, perf |
| `infra:*` | infra, security |

A bot fans out to a registered specialist when the bot's own category appears in
that specialist's category set **and** the specialist's slot is relevant to the
scoped area (see area-tag mapping below). A `framework-backend` specialist is
dispatched by `wolfe-bugs`, `wolfe-perf`, `wolfe-test-gaps`, and `wolfe-security`
— but only when the run's area touches that framework.

> **Intentionally absent: `docs` and `arch`.** Those two bots review
> cross-cutting concerns (documentation drift, architecture decisions) that
> don't map to a single technology slot — they always run their own
> generalist review pass instead of fanning out to forged specialists.
> Registering a specialist with `categories: [docs]` or `categories: [arch]`
> has no effect by design.

## How many specialists per repo

Forge **3–5 specialists per repository** — enough to cover the stack, few enough
to stay maintainable. Cover, in priority order:

1. The **dominant language(s)** — one `language:*` specialist each (usually one,
   occasionally two for a polyglot repo).
2. The **main framework** — a `framework-frontend:*` or `framework-backend:*`
   specialist (both if the repo is genuinely full-stack).
3. The **datastore**, if the repo has one — a `datastore:*` specialist.
4. The **infrastructure**, if the repo has IaC / deploy config — an `infra:*`
   specialist.

A repo with no datastore forges no `datastore:*` specialist; a CLI tool with no
frontend forges no `framework-frontend:*` specialist. Forge for what is detected,
not for what is possible.

## Slot naming convention

Slots are `kind:tech`, lowercase, the `tech` being the canonical lowercase tool
name:

- `language:typescript`, `language:python`, `language:go`
- `framework-frontend:angular`, `framework-frontend:react`
- `framework-backend:django`, `framework-backend:express`
- `datastore:postgres`, `datastore:redis`
- `infra:aws`, `infra:terraform`

The forged agent's `name` is `wolfe-<tech>` (the slot's short form): slot
`datastore:postgres` → agent `wolfe-postgres`. The full `kind:tech` slot is
recorded in the provenance comment and the registry; the short form names the
file and the agent.

## How area tags map slots to areas at dispatch time

`WOLFE.md`'s `wolfe/areas` block tags each area with the technologies present in
it. At dispatch, a bot resolves which specialists to call by **intersecting the
scoped area's tags with each registered specialist's slot technology**:

- An area tagged `[typescript, angular]` pulls in the `language:typescript` and
  `framework-frontend:angular` specialists (when the dispatching bot's category
  is in their category sets).
- An area tagged `[python, postgres]` pulls in `language:python` and
  `datastore:postgres`.
- An infra area tagged `[terraform, aws]` pulls in `infra:terraform` and
  `infra:aws` — and only the `wolfe-infra` and `wolfe-security` bots dispatch
  them, per the matrix.

This indirection is the anti-rot lever: bots bind to **area tags and slot
technologies**, never to specialist file paths. Renaming a specialist file or
adding a new one changes only the registry — no bot edit, no area edit.
