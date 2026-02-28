import { z } from "zod";

export const AwsResourceTypeEnum = z.enum([
  "vpc",
  "subnet",
  "igw",
  "security_group",
  "ec2_instance",
]);

export const EdgeKindEnum = z.enum([
  "contains",
  "attaches",
  "hosts",
  "uses",
  "routes_to",
]);

const VpcConfigSchema = z.object({
  type: z.literal("vpc"),
  cidrBlock: z.string(),
  enableDnsHostnames: z.boolean().optional().default(true),
  enableDnsSupport: z.boolean().optional().default(true),
});

const SubnetConfigSchema = z.object({
  type: z.literal("subnet"),
  cidrBlock: z.string(),
  az: z.string().optional(),
  mapPublicIpOnLaunch: z.boolean().optional().default(true),
});

const IgwConfigSchema = z.object({
  type: z.literal("igw"),
});

const SgRuleSchema = z.object({
  protocol: z.union([z.literal("tcp"), z.literal("udp"), z.literal("icmp"), z.literal("-1")]),
  fromPort: z.number().int(),
  toPort: z.number().int(),
  cidr: z.string().optional(),
});

const SecurityGroupConfigSchema = z.object({
  type: z.literal("security_group"),
  description: z.string().optional(),
  ingress: z.array(SgRuleSchema).optional(),
  egress: z.array(SgRuleSchema).optional(),
});

const Ec2ConfigSchema = z.object({
  type: z.literal("ec2_instance"),
  ami: z.string(),
  instanceType: z.string(),
  keyName: z.string().optional(),
  userDataBase64: z.string().optional(),
});

const AwsNodeConfigSchema = z.discriminatedUnion("type", [
  VpcConfigSchema,
  SubnetConfigSchema,
  IgwConfigSchema,
  SecurityGroupConfigSchema,
  Ec2ConfigSchema,
]);

const NodeRefsSchema = z.object({
  vpcId: z.string().optional(),
  subnetId: z.string().optional(),
  securityGroupIds: z.array(z.string()).optional(),
  igwId: z.string().optional(),
});

export const InfraNodeSchema = z.object({
  id: z.string(),
  type: AwsResourceTypeEnum,
  name: z.string(),
  rf: z.object({ x: z.number(), y: z.number() }),
  config: AwsNodeConfigSchema,
  refs: NodeRefsSchema.optional(),
});

export const InfraEdgeSchema = z.object({
  id: z.string(),
  kind: EdgeKindEnum,
  source: z.string(),
  target: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const VariableSchema = z.object({
  type: z.enum(["string", "number", "bool"]),
  default: z.unknown().optional(),
  description: z.string().optional(),
});

export const InfraGraphSchema = z.object({
  schemaVersion: z.literal("cloudweaver.aws.v1"),
  provider: z.object({
    name: z.literal("aws"),
    region: z.string().optional(),
  }),
  nodes: z.array(InfraNodeSchema),
  edges: z.array(InfraEdgeSchema),
  variables: z.record(z.string(), VariableSchema).optional(),
});

export type InfraGraphV1 = z.infer<typeof InfraGraphSchema>;
export type InfraNode = z.infer<typeof InfraNodeSchema>;
export type InfraEdge = z.infer<typeof InfraEdgeSchema>;

