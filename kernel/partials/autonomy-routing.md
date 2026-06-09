## Output Routing

Read `autonomy` and `routing_overrides` from `wolfe/bots`. Three gates AND
together to choose the route — verification + confidence × class fixability ×
autonomy. Failing any one gate takes the slower route.

| Autonomy | Verified, ≥0.85, auto-fixable class | Everything else surfaced |
|---|---|---|
| 0 | report entry in `.wolfe/reports/` | report entry |
| 1 (default) | issue, `wolfe:needs-triage` | issue, `wolfe:needs-triage` |
| 2 | **draft PR** (`wolfe:fix`) with failing test + verified fix | issue, `wolfe:needs-triage` |
| 3 | draft PR, eligible for the fixer loop | issue, `wolfe:needs-triage` |

**Class fixability defaults** (a `routing_overrides` entry in `wolfe/bots` may
flip a class, with one exception):

- auto-fixable: `bugs`, `docs`, `test-gaps`, `a11y`, `i18n` — mechanical,
  provable by a passing test, low blast radius.
- file-only: `security`, `perf`, `tech-debt`, `arch`, `infra` — blast radius or
  human trade-offs; a human triages, then the fixer (or a human) implements.
- `security` is file-only ABSOLUTELY: no override is honored.

Every artifact you create (PR or issue) carries, at the bottom of its body:

- `<!-- fingerprint: <16-hex> -->` (per Fingerprints & Dedup)
- `<!-- wolfe-run: bot=<bot> date=YYYY-MM-DD area=<area> -->`

Hunter PRs are ALWAYS drafts (the fixer's charter governs its own PRs). You
never merge, approve, or enable auto-merge on any PR. You never modify
`.github/workflows/**` in a PR — propose workflow changes as an issue instead.
Apply the repository's own `type:`/`severity:` labels alongside `wolfe:` labels
when WOLFE.md recorded that those families exist — but never create a
non-`wolfe:` label.
