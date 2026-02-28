export type AwsResourceType = "vpc" | "subnet" | "igw" | "security_group" | "ec2_instance";

export type EdgeKind = "contains" | "attaches" | "hosts" | "uses" | "routes_to";

export type VpcConfig = {
  type: "vpc";
  cidrBlock: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
};

export type SubnetConfig = {
  type: "subnet";
  cidrBlock: string;
  az?: string;
  mapPublicIpOnLaunch?: boolean;
};

export type IgwConfig = {
  type: "igw";
};

export type SecurityGroupRule = {
  protocol: "tcp" | "udp" | "icmp" | "-1";
  fromPort: number;
  toPort: number;
  cidr?: string;
};

export type SecurityGroupConfig = {
  type: "security_group";
  description?: string;
  ingress?: SecurityGroupRule[];
  egress?: SecurityGroupRule[];
};

export type Ec2Config = {
  type: "ec2_instance";
  ami: string;
  instanceType: string;
  keyName?: string;
  userDataBase64?: string;
};

export type AwsNodeConfig = VpcConfig | SubnetConfig | IgwConfig | SecurityGroupConfig | Ec2Config;

export type InfraNode = {
  id: string;
  type: AwsResourceType;
  name: string;
  rf: { x: number; y: number };
  config: AwsNodeConfig;
  refs?: {
    vpcId?: string;
    subnetId?: string;
    securityGroupIds?: string[];
    igwId?: string;
  };
};

export type InfraEdge = {
  id: string;
  kind: EdgeKind;
  source: string;
  target: string;
  meta?: Record<string, unknown>;
};

export type InfraGraphV1 = {
  schemaVersion: "cloudweaver.aws.v1";
  provider: { name: "aws"; region?: string };
  nodes: InfraNode[];
  edges: InfraEdge[];
  variables?: Record<string, { type: "string" | "number" | "bool"; default?: unknown; description?: string }>;
};

export type Diagnostic = {
  level: "error" | "warn" | "info";
  message: string;
  nodeIds?: string[];
  edgeIds?: string[];
  details?: unknown;
};

