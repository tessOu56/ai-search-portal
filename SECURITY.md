# Security Policy

## Supported versions

The `main` branch and the production demo deployment are the supported surfaces for security fixes.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for sensitive findings.

Report privately via GitHub **Security Advisories** for this repository (or contact the repository owner through a private channel). Include:

- Affected URL or package path
- Steps to reproduce
- Impact summary

We will acknowledge and work on a fix or mitigation as reasonably possible.

## Secrets and credentials

- Never commit `.env`, API keys, tokens, private keys, or connection strings.
- Use [`.env.example`](.env.example) (placeholders only) as the local template; copy to `.env` / `.env.local`.
- Optional LLM: `OPENAI_API_KEY` must be set **server-side** only; the public demo defaults to offline fixtures.
- Host deploy secrets (e.g. Vercel) belong in CI secret stores, not in git.
- Optional Sentry source-map upload uses `SENTRY_AUTH_TOKEN` (build-time only). The public `SENTRY_DSN` / `VITE_SENTRY_DSN` is not a secret; never commit the auth token.
- Governance writes, audit, chat, and the MCP gateway are **fail-closed** without `ADMIN_API_TOKEN`. Optional `REVIEWER_API_TOKEN` / `REQUESTER_API_TOKEN` mint extra principals. Never trust `role` / `requesterId` from the client body.
- Review requires `authRole ∈ {reviewer, admin}` and `user.id !== application.requesterId`.
- Rate limiting uses platform IPs (`x-real-ip` / `x-vercel-forwarded-for` on Vercel). The first `X-Forwarded-For` hop is not trusted.

## Public narrative

This repository is public. Follow [docs/PUBLIC-NARRATIVE.md](docs/PUBLIC-NARRATIVE.md) for what must not appear in README, commits, tickets, or docs.
