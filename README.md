# wolfe-pack

> A coordinated team ("pack") of autonomous review-and-fix bots you drop into any repository.
> Open-source, Claude-Code-native. The fixer (Winston Wolfe) is the namesake — closing the loop is the point.

**Status: pre-implementation.** This repo currently contains the locked product design only.

## What it does (the short version)

Run `npx wolfe-pack init`. It explores your repo, asks a few questions, and scaffolds a tailored
crew **into your repo** (you own every file). The bots hunt across categories — bugs, security,
docs, test gaps, a11y, i18n, performance, tech debt, architecture, infrastructure — and, depending
on the autonomy you grant, file issues or open **draft PRs with a failing test + a verified fix**.
Everything is gated by an always-on verification step, so the defining promise is **no slop**. Runs
locally on a loop with zero setup, or unattended via GitHub Actions once you opt in.

## Start here

📄 **[DESIGN.md](./DESIGN.md)** — the complete, self-contained design & implementation brief: every
locked decision with rationale and rejected alternatives, the architecture, the proven internal
patterns to port, the genuinely-open questions, and a suggested build order.

If you're an agent picking up implementation: read `DESIGN.md` in full first. It assumes no prior
context and tells you exactly what's settled, what's yours to decide, and where the proven internals
live.

## License

MIT (planned).
