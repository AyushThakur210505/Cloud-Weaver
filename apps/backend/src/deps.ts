import { InfraGraphV1, InfraNode } from "./infraGraph";

export type DiagnosticLevel = "error" | "warn" | "info";

export interface Diagnostic {
  level: DiagnosticLevel;
  message: string;
  nodeIds?: string[];
  edgeIds?: string[];
  details?: unknown;
}

export interface DepResult {
  ok: boolean;
  diagnostics: Diagnostic[];
  depEdges: Array<{ from: string; to: string }>;
  orderedNodeIds?: string[];
}

export function buildDependencyGraphAndTopo(graph: InfraGraphV1): DepResult {
  const diagnostics: Diagnostic[] = [];

  const nodeById = new Map<string, InfraNode>();
  graph.nodes.forEach((n) => nodeById.set(n.id, n));

  const depEdges: Array<{ from: string; to: string }> = [];

  // Visual edges -> dependency edges
  for (const e of graph.edges) {
    const src = nodeById.get(e.source);
    const tgt = nodeById.get(e.target);
    if (!src || !tgt) continue;

    switch (e.kind) {
      case "contains":
      case "attaches":
      case "hosts":
        depEdges.push({ from: e.source, to: e.target });
        break;
      case "uses":
        // UI: ec2 -> sg ; Dependency: sg -> ec2
        depEdges.push({ from: e.target, to: e.source });
        break;
      case "routes_to":
        // v1: ignore for ordering (route table resources not yet modeled)
        break;
    }
  }

  // Implicit dependencies (v1 simplified)
  const vpcs = graph.nodes.filter((n) => n.type === "vpc");
  const subnets = graph.nodes.filter((n) => n.type === "subnet");

  for (const node of graph.nodes) {
    if (node.type === "subnet") {
      const explicitVpcId = node.refs?.vpcId;
      if (explicitVpcId) depEdges.push({ from: explicitVpcId, to: node.id });
      else if (vpcs.length === 1) depEdges.push({ from: vpcs[0].id, to: node.id });
    }

    if (node.type === "security_group") {
      const explicitVpcId = node.refs?.vpcId;
      if (explicitVpcId) depEdges.push({ from: explicitVpcId, to: node.id });
      else if (vpcs.length === 1) depEdges.push({ from: vpcs[0].id, to: node.id });
    }

    if (node.type === "ec2_instance") {
      const explicitSubnetId = node.refs?.subnetId;
      if (explicitSubnetId) depEdges.push({ from: explicitSubnetId, to: node.id });
      else if (subnets.length === 1) depEdges.push({ from: subnets[0].id, to: node.id });

      for (const sgId of node.refs?.securityGroupIds ?? []) {
        depEdges.push({ from: sgId, to: node.id });
      }
    }
  }

  // Dedupe dependency edges
  const seen = new Set<string>();
  const uniqueDepEdges = depEdges.filter((e) => {
    const key = `${e.from}->${e.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Kahn's algorithm
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) {
    indegree.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const { from, to } of uniqueDepEdges) {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from)!.push(to);
    indegree.set(to, (indegree.get(to) ?? 0) + 1);
  }

  const queue: string[] = [];
  indegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const order: string[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of adj.get(u) ?? []) {
      indegree.set(v, (indegree.get(v) ?? 0) - 1);
      if (indegree.get(v) === 0) queue.push(v);
    }
  }

  if (order.length !== graph.nodes.length) {
    const remainingNodeIds = [...indegree.entries()]
      .filter(([_, deg]) => (deg ?? 0) > 0)
      .map(([id]) => id);

    diagnostics.push({
      level: "error",
      message: "Circular dependency detected in infrastructure graph",
      nodeIds: remainingNodeIds,
    });

    return { ok: false, diagnostics, depEdges: uniqueDepEdges };
  }

  return { ok: true, diagnostics, depEdges: uniqueDepEdges, orderedNodeIds: order };
}

