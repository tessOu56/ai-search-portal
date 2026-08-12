# Portal prod readiness — QA / Security signoff

**Date**: 2026-08-12  
**Targets**: [ai-search-portal.vercel.app](https://ai-search-portal.vercel.app) · Plinth [metalcraft-storefront-eta.vercel.app](https://metalcraft-storefront-eta.vercel.app)

Maturity: **public showcase / integrated demo** (ADR-005) — operable by humans, **not** enterprise RBAC / SOC2.

## Browser / HTTP path

| Step        | Check                                                                                                          | Result                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Home        | `GET /` 200; brand + ask + CTA in first viewport (`justify-center`, not empty bottom)                          | **PASS**                               |
| Chat        | Golden PII query → `agentMode: offline_fixture`; answer on-topic; References → `/metadata` + `/catalog-search` | **PASS**                               |
| Catalog     | `GET /catalog-search` 200; spacing `space-y-8`                                                                 | **PASS**                               |
| Metadata    | `GET /metadata` 200                                                                                            | **PASS**                               |
| Vitals      | `GET /vitals` **200**; session-only metrics copy; no DSN/collector                                             | **PASS**                               |
| Access demo | `?sessionRole=owner` shows **Demo role switcher — not authentication**                                         | **PASS**                               |
| Footer      | Web Vitals link + Synthetic fixture + Demo roles ≠ auth                                                        | **PASS**                               |
| Plinth      | Auction `endsAt` ≈ now+48h (was ~3398h vs “48h” copy)                                                          | **PASS** (`metalcraft-storefront-eta`) |

Smoke script: `pnpm prod:smoke` → all four routes **200**.

## Security checklist

| Item                                     | Result   | Notes                                                                                                            |
| ---------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| No API key / npm token in client or repo | **PASS** | Client asset scan: no `OPENAI_API_KEY` / `sk-` / `npm_` / `VERCEL_TOKEN`                                         |
| Chat length limit + stable failure       | **PASS** | Guardrail + schema max **2000**; in-memory rate limit 40/min; gateway failures use stable message (no stack/env) |
| Optional LLM key server-only             | **PASS** | `packages/agent-core/src/llm/optional-openai.ts` reads `process.env.OPENAI_API_KEY` only; absent → fixture       |
| `sessionRole` demo labelling             | **PASS** | UI disclaimer + footer                                                                                           |
| Synthetic fixture labelling              | **PASS** | Fixture copy + footer; no real PII import                                                                        |
| `/vitals` public DTO only                | **PASS** | Browser session store; page states no internal probe/DSN                                                         |
| Access review not claimed as prod auth   | **PASS** | Panel copy updated                                                                                               |

## Deploy notes

- GitHub `Deploy to Vercel` still blocked without repo secrets `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` (T-079).
- Prod aligned via **Vercel CLI** (`vercel deploy --prod`) after fixing SSR: `ssr.noExternal` for `@is_tess/*` (package uses extensionless `./ux` re-export that Node ESM rejects when externalized).
- `vercel.json`: re-enabled `git.deploymentEnabled.main` (removed main ignoreCommand) for future git deploys once secrets exist.

## Out of scope (explicit)

OAuth / real RBAC · WAF / enterprise rate limits · real PII · Trusted Publishing.
