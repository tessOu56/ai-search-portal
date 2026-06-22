# Context Pack: agri-supply

**類型**：product | **權重**：2

Product specification for the `agri-supply` context pack. Implementation is data-only under `content/context-packs/agri-supply/`.

## Scope

- Procurement lots, ingredient dimension, wholesale price index metric
- Bindings to food domain seed entities (`ingredient-basil`, `vendor-taipei-wholesale`, `dish-three-cup-chicken`)

## Demo questions

- Why did the northern wholesale price index rise this month?
- Which dashboards depend on procurement lot data?
- Which recipes are linked via bindings for cost estimation?

## Not in platform code

All crop/spice names, market regions, and procurement copy belong in this pack's JSON fixtures and this doc—not in shared contracts or React components.
