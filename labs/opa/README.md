# OPA local (optional)

Run Open Policy Agent for policy evaluation against `specs/policies/access-request.rego`.

```bash
docker compose -f labs/opa/docker-compose.yml up -d
```

Set `OPA_URL=http://localhost:8181` when running `backend` to use live OPA instead of in-process fallback.

Policy tests (no Docker required if `opa` CLI installed):

```bash
pnpm run test:policies
```
