import { Link } from "@remix-run/react";

export type MetadataLineageGraphProps = {
  nodes: { id: string; label: string; type: string }[];
  edges: { source: string; target: string }[];
  themeMode?: "light" | "dark";
};

export function MetadataLineageGraph({
  nodes,
  edges,
}: MetadataLineageGraphProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Lineage</h3>
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
