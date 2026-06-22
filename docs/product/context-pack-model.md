# Context Pack Model

**類型**：product | **權重**：2

## Three layers

| Layer         | Location                                                 | Responsibility                                            |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Platform      | `app/services`, `packages/shared-contracts`, `/metadata` | Generic context catalog, policy, GenUI, MCP               |
| Context pack  | `content/context-packs/*`                                | Swappable fixtures: assets, metrics, glossary, bindings   |
| Domain module | `app/features/*`                                         | Business entities (food/recipe); linked only via bindings |

## Pack layout

```
content/context-packs/<pack-id>/
  pack.json       # manifest
  assets.json     # metadata catalog assets
  metrics.json    # context metrics (MAU, price index, …)
  glossary.json   # business terms
  bindings.json   # optional links to domain module entity ids
```

## Active pack resolution

Priority: `?pack=` query → `context_pack` cookie → `CONTEXT_PACK` env → `enterprise-mau`.

## Demo packs

| Pack id          | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| `enterprise-mau` | Generic MAU / customer_profile / PII policy demo             |
| `agri-supply`    | Procurement / wholesale price context + food domain bindings |

Vertical product copy for agri lives in [context-packs/agri-supply.md](./context-packs/agri-supply.md), not in platform code.

## Related

- [domain-food-recipe.md](./domain-food-recipe.md)
- [ADR context-pack-domain-binding](../adr/context-pack-domain-binding.md)
