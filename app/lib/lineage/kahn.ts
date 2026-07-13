export type LineageEdge = {
  source: string;
  target: string;
};

export type TopologicalSortResult =
  | {
      status: "sorted";
      order: string[];
    }
  | {
      status: "cycle";
      cyclicNodeIds: string[];
      remainingEdges: LineageEdge[];
    };

function edgeKey(edge: LineageEdge): string {
  return `${edge.source}\u0000${edge.target}`;
}

export function topologicalSort(
  nodeIds: readonly string[],
  edges: readonly LineageEdge[]
): TopologicalSortResult {
  const orderedNodeIds: string[] = [];
  const nodeSet = new Set<string>();

  for (const nodeId of nodeIds) {
    if (!nodeSet.has(nodeId)) {
      nodeSet.add(nodeId);
      orderedNodeIds.push(nodeId);
    }
  }

  const uniqueEdges: LineageEdge[] = [];
  const edgeKeys = new Set<string>();

  for (const edge of edges) {
    if (!nodeSet.has(edge.source)) {
      nodeSet.add(edge.source);
      orderedNodeIds.push(edge.source);
    }
    if (!nodeSet.has(edge.target)) {
      nodeSet.add(edge.target);
      orderedNodeIds.push(edge.target);
    }

    const key = edgeKey(edge);
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      uniqueEdges.push(edge);
    }
  }

  const inDegree = new Map<string, number>(
    orderedNodeIds.map((nodeId) => [nodeId, 0])
  );
  const outgoing = new Map<string, string[]>(
    orderedNodeIds.map((nodeId) => [nodeId, []])
  );

  for (const edge of uniqueEdges) {
    outgoing.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const ready = orderedNodeIds.filter((nodeId) => inDegree.get(nodeId) === 0);
  const order: string[] = [];

  for (let index = 0; index < ready.length; index += 1) {
    const nodeId = ready[index];
    order.push(nodeId);

    for (const target of outgoing.get(nodeId) ?? []) {
      const nextDegree = (inDegree.get(target) ?? 0) - 1;
      inDegree.set(target, nextDegree);
      if (nextDegree === 0) {
        ready.push(target);
      }
    }
  }

  if (order.length === orderedNodeIds.length) {
    return { status: "sorted", order };
  }

  const cyclicNodeIds = orderedNodeIds.filter(
    (nodeId) => (inDegree.get(nodeId) ?? 0) > 0
  );
  const cyclicNodeSet = new Set(cyclicNodeIds);
  const remainingEdges = uniqueEdges.filter(
    (edge) => cyclicNodeSet.has(edge.source) && cyclicNodeSet.has(edge.target)
  );

  return {
    status: "cycle",
    cyclicNodeIds,
    remainingEdges,
  };
}
