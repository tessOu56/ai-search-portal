import { Link } from "@remix-run/react";

export type MetadataLineageGraphProps = {
  nodes: { id: string; label: string; type: string }[];
  edges: { source: string; target: string }[];
  dependencyOrder?: { id: string; label: string; type: string }[];
  cycleError?: { message: string; nodeIds: string[] } | null;
  themeMode?: "light" | "dark";
};

export function MetadataLineageGraph({
  nodes,
  edges,
  dependencyOrder = [],
  cycleError = null,
}: MetadataLineageGraphProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const cycleLabels = cycleError?.nodeIds.map(
    (nodeId) => nodeMap.get(nodeId)?.label ?? nodeId
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Lineage</h3>
      {cycleError ? (
        <div
          className="border-destructive/40 bg-destructive/10 mb-3 rounded-md border p-3 text-sm text-destructive"
          role="alert"
        >
          <p className="font-medium">Cycle detected in metadata lineage.</p>
          <p>{cycleError.message}</p>
          {cycleLabels && cycleLabels.length > 0 ? (
            <p className="mt-1">Affected assets: {cycleLabels.join(", ")}</p>
          ) : null}
        </div>
      ) : null}
      {!cycleError && dependencyOrder.length > 0 ? (
        <div className="mb-3 rounded-md bg-muted p-3 text-sm">
          <p className="mb-2 font-medium">Dependency order</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            {dependencyOrder.map((node) => (
              <li key={node.id}>
                <Link
                  to={`/metadata/${node.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {node.label}
                </Link>{" "}
                <span className="text-xs">({node.type})</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <ul className="space-y-2 text-sm">
        {edges.map((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;
          return (
            <li
              key={`${edge.source}-${edge.target}`}
              className="flex flex-wrap items-center gap-2"
            >
              <Link
                to={`/metadata/${edge.source}`}
                className="font-medium text-primary hover:underline"
              >
                {source.label}
              </Link>
              <span className="text-muted-foreground" aria-hidden>
                →
              </span>
              <Link
                to={`/metadata/${edge.target}`}
                className="font-medium text-primary hover:underline"
              >
                {target.label}
              </Link>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {source.type} → {target.type}
              </span>
            </li>
          );
        })}
      </ul>
      {edges.length === 0 ? (
        <p className="text-sm text-muted-foreground">No lineage edges.</p>
      ) : null}
    </div>
  );
}
