import type { Edge, Node } from "reactflow";
import type { AwsNodeConfig, AwsResourceType, EdgeKind, InfraGraphV1 } from "./types";
import type { CanvasEdgeData, CanvasNodeData } from "./store";

export function defaultConfigForType(t: AwsResourceType): AwsNodeConfig {
  switch (t) {
    case "vpc":
      return { type: "vpc", cidrBlock: "10.0.0.0/16", enableDnsHostnames: true, enableDnsSupport: true };
    case "subnet":
      return { type: "subnet", cidrBlock: "10.0.1.0/24", az: "us-east-1a", mapPublicIpOnLaunch: true };
    case "igw":
      return { type: "igw" };
    case "security_group":
      return {
        type: "security_group",
        description: "Security group",
        ingress: [{ protocol: "tcp", fromPort: 22, toPort: 22, cidr: "0.0.0.0/0" }],
        egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidr: "0.0.0.0/0" }],
      };
    case "ec2_instance":
      return { type: "ec2_instance", ami: "ami-1234567890abcdef0", instanceType: "t3.micro", keyName: "my-keypair" };
  }
}

export function inferEdgeKind(sourceType?: AwsResourceType, targetType?: AwsResourceType): EdgeKind {
  if (sourceType === "vpc" && targetType === "subnet") return "contains";
  if (sourceType === "vpc" && targetType === "igw") return "attaches";
  if (sourceType === "subnet" && targetType === "ec2_instance") return "hosts";
  if (sourceType === "ec2_instance" && targetType === "security_group") return "uses";
  if (sourceType === "subnet" && targetType === "igw") return "routes_to";
  return "hosts";
}

export function buildInfraGraph(
  nodes: Node<CanvasNodeData>[],
  edges: Edge<CanvasEdgeData>[],
  configsById: Record<string, AwsNodeConfig>,
  region?: string
): InfraGraphV1 {
  return {
    schemaVersion: "cloudweaver.aws.v1",
    provider: { name: "aws", region },
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.resourceType,
      name: n.data.label,
      rf: { x: n.position.x, y: n.position.y },
      config: configsById[n.id] ?? defaultConfigForType(n.data.resourceType),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      kind: e.data?.kind ?? "hosts",
      source: e.source,
      target: e.target,
      meta: e.data?.meta,
    })),
    variables: {},
  };
}

