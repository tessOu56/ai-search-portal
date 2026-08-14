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
- Use example files (e.g. `.env.*.example`) with **placeholders only**.
- Optional LLM: `OPENAI_API_KEY` must be set **server-side** only; the public demo defaults to offline fixtures.
- Host deploy secrets (e.g. Vercel) belong in CI secret stores, not in git.

## Public narrative

This repository is public. Follow [docs/PUBLIC-NARRATIVE.md](docs/PUBLIC-NARRATIVE.md) for what must not appear in README, commits, tickets, or docs.
