# ADR: Context Pack and Domain Binding

## Status

Accepted — 2026-06-22

## Context

The metadata catalog POC demonstrated context graph concepts (lineage, policy, GenUI) with enterprise MAU fixtures. Product direction also requires a Taiwan agri/spice supply-chain narrative without embedding vertical domain knowledge in platform code.

## Decision

Introduce a **three-layer model**:

1. **Platform** — domain-neutral contracts, services, routes, GenUI registry, OPA input shape, MCP/agent tools.
2. **Context packs** — declarative JSON under `content/context-packs/<pack-id>/` (assets, metrics, glossary, bindings).
3. **Domain modules** — optional features (e.g. food/recipe) referenced only via `bindings.json` opaque refs.

Default pack: `enterprise-mau`. Second pack: `agri-supply`. UI pack switcher sets cookie + `?pack=` query.

## Consequences

- Core TypeScript must not contain vertical product names; packs hold domain copy.
- `metadata-assets.json` remains as transitional mirror; SoT is pack `assets.json`.
- Backend bindings API returns `resolved: false` when food seed entities are absent (Remix resolves when seeded).

## Related

- [stateless-mcp-genui-metadata.md](./stateless-mcp-genui-metadata.md)
- [docs/product/context-pack-model.md](../product/context-pack-model.md)
