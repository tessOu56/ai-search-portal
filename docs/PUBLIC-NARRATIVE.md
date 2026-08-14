# Public narrative rules

This repo is **public on GitHub**. Treat every commit, PR, README, and tracked doc as visible to strangers, employers, and crawlers.

Git history may still contain older wording; a full history scrub is a separate optional ticket (not done by default). Prefer clean `main` going forward.

## Never put in tracked files or commit messages

- Employer / recruiting targets, resume framing, or “interview demo” pitch decks as product docs
- Third-party / company product names used as “upstream we mirrored from” (including Able / able_portal / calatlog-*)
- Private orchestration repo URLs presented as required control plane
- Real secrets, DSNs, tokens, npm tokens, OIDC blobs
- Absolute machine paths or personal vault names as SSOT links in public docs
- `docs/platform-inbox/` ticket dumps (local-only; gitignored)

## Prefer

- Generic “enterprise AI search / governance showcase” language
- Offline fixture / demo-role disclaimers
- Live demo URL and reproducible journeys without employer names
- Secret **names** only when documenting CI (values stay in GitHub Settings)

## Agent / contributor checklist

Before commit:

1. `rg -i 'able|dentscape|bito|calatlog|career-vault|VERCEL_TOKEN=.|sk-' README.md docs app` (adjust; expect no hits for forbidden names)
2. Do not `git add docs/platform-inbox`
3. README stays showcase-safe ([README.md](../README.md))

See also [SECURITY.md](../SECURITY.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).
