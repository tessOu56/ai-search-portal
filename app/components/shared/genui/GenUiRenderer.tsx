import type { GenUiDocumentContract } from "~/shared/contracts";
import {
  genUiDocumentSchema,
  lineageGraphPropsSchema,
  metadataColumnsTablePropsSchema,
  metadataSummaryCardPropsSchema,
} from "~/shared/contracts";

import { MetadataColumnsTable } from "./MetadataColumnsTable";
import { MetadataLineageGraph } from "./MetadataLineageGraph";
import { MetadataSummaryCard } from "./MetadataSummaryCard";

const NODE_LINEAGE_GRAPH = "data-lineage-graph";
const NODE_COLUMNS_TABLE = "metadata-columns-table";
const NODE_SUMMARY_CARD = "metadata-summary-card";

export type GenUiRendererProps = {
  document: GenUiDocumentContract;
};

function nodeRenderKey(type: string, index: number): string {
  return `${type}-${index}`;
}

export function GenUiRenderer({ document }: GenUiRendererProps) {
  const parsed = genUiDocumentSchema.safeParse(document);
  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Invalid GenUI document
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {parsed.data.nodes.map((node, index) => {
        if (node.type === NODE_LINEAGE_GRAPH) {
          const props = lineageGraphPropsSchema.safeParse(node.props);
          if (!props.success) return null;
          return (
            <MetadataLineageGraph
              key={nodeRenderKey(node.type, index)}
              nodes={props.data.nodes}
              edges={props.data.edges}
              themeMode={props.data.themeMode}
            />
          );
        }
        if (node.type === NODE_COLUMNS_TABLE) {
          const props = metadataColumnsTablePropsSchema.safeParse(node.props);
          if (!props.success) return null;
          return (
            <MetadataColumnsTable
              key={nodeRenderKey(node.type, index)}
              columns={props.data.columns}
              maskFields={props.data.maskFields}
            />
          );
        }
        if (node.type === NODE_SUMMARY_CARD) {
          const props = metadataSummaryCardPropsSchema.safeParse(node.props);
          if (!props.success) return null;
          return (
            <MetadataSummaryCard
              key={nodeRenderKey(node.type, index)}
              {...props.data}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

export function buildLineageGenUiDocument(args: {
  nodes: { id: string; label: string; type: string }[];
  edges: { source: string; target: string }[];
  assetId: string;
}): GenUiDocumentContract {
  return genUiDocumentSchema.parse({
    version: "1",
    nodes: [
      {
        type: NODE_LINEAGE_GRAPH,
        props: {
          nodes: args.nodes,
          edges: args.edges,
          themeMode: "dark",
        },
      },
    ],
  });
}

export function buildDetailGenUiDocument(args: {
  name: string;
  fqn: string;
  owner: string;
  classification: string;
  tags: string[];
  columns: {
    name: string;
    dataType: string;
    description?: string;
    tags?: string[];
    sensitive?: boolean;
  }[];
  maskFields: string[];
  lineageNodes: { id: string; label: string; type: string }[];
  lineageEdges: { source: string; target: string }[];
}): GenUiDocumentContract {
  return genUiDocumentSchema.parse({
    version: "1",
    nodes: [
      {
        type: NODE_SUMMARY_CARD,
        props: {
          name: args.name,
          fqn: args.fqn,
          owner: args.owner,
          classification: args.classification,
          tags: args.tags,
        },
      },
      ...(args.columns.length > 0
        ? [
            {
              type: NODE_COLUMNS_TABLE as const,
              props: {
                columns: args.columns,
                maskFields: args.maskFields,
              },
            },
          ]
        : []),
      {
        type: NODE_LINEAGE_GRAPH,
        props: {
          nodes: args.lineageNodes,
          edges: args.lineageEdges,
          themeMode: "dark",
        },
      },
    ],
  });
}
