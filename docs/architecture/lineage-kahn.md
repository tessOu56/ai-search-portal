# Metadata Lineage Topological Sort

## Context

Metadata lineage edges model dependency direction as `source -> target`: an upstream asset must be available before the asset that depends on it. T-2026-016 needs the lineage view to expose a dependency order when the graph is acyclic and reject cyclic lineage for ordering.

## Decision

Use Kahn's topological sort in a pure TypeScript module at `app/lib/lineage/kahn.ts`.

The algorithm:

1. Build an in-degree count for every lineage node.
2. Queue nodes with zero in-degree in stable input order.
3. Remove queued nodes one by one, appending them to the dependency order and decrementing their outgoing targets.
4. If every node is removed, the graph is acyclic and the order is valid.
5. If nodes remain with non-zero in-degree, the graph contains a cycle and no dependency order is returned.

## UX On Cycle

`resolveMetadataLineage` returns `dependencyOrder` only when Kahn succeeds. When a cycle is detected, it returns `cycleError` with the affected node ids. `MetadataLineageGraph` renders this as an inline alert and hides the dependency order, while still showing the available lineage edges so data stewards can identify and fix the metadata relationship.
