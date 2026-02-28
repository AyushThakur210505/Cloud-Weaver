"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraGraphSchema = exports.InfraEdgeSchema = exports.InfraNodeSchema = exports.EdgeKindEnum = exports.AwsResourceTypeEnum = void 0;
const zod_1 = require("zod");
exports.AwsResourceTypeEnum = zod_1.z.enum([
    "vpc",
    "subnet",
    "igw",
    "security_group",
    "ec2_instance",
]);
exports.EdgeKindEnum = zod_1.z.enum([
    "contains",
    "attaches",
    "hosts",
    "uses",
    "routes_to",
]);
const VpcConfigSchema = zod_1.z.object({
    type: zod_1.z.literal("vpc"),
    cidrBlock: zod_1.z.string(),
    enableDnsHostnames: zod_1.z.boolean().optional().default(true),
    enableDnsSupport: zod_1.z.boolean().optional().default(true),
});
const SubnetConfigSchema = zod_1.z.object({
    type: zod_1.z.literal("subnet"),
    cidrBlock: zod_1.z.string(),
    az: zod_1.z.string().optional(),
    mapPublicIpOnLaunch: zod_1.z.boolean().optional().default(true),
});
const IgwConfigSchema = zod_1.z.object({
    type: zod_1.z.literal("igw"),
});
const SgRuleSchema = zod_1.z.object({
    protocol: zod_1.z.union([zod_1.z.literal("tcp"), zod_1.z.literal("udp"), zod_1.z.literal("icmp"), zod_1.z.literal("-1")]),
    fromPort: zod_1.z.number().int(),
    toPort: zod_1.z.number().int(),
    cidr: zod_1.z.string().optional(),
});
const SecurityGroupConfigSchema = zod_1.z.object({
    type: zod_1.z.literal("security_group"),
    description: zod_1.z.string().optional(),
    ingress: zod_1.z.array(SgRuleSchema).optional(),
    egress: zod_1.z.array(SgRuleSchema).optional(),
});
const Ec2ConfigSchema = zod_1.z.object({
    type: zod_1.z.literal("ec2_instance"),
    ami: zod_1.z.string(),
    instanceType: zod_1.z.string(),
    keyName: zod_1.z.string().optional(),
    userDataBase64: zod_1.z.string().optional(),
});
const AwsNodeConfigSchema = zod_1.z.discriminatedUnion("type", [
    VpcConfigSchema,
    SubnetConfigSchema,
    IgwConfigSchema,
    SecurityGroupConfigSchema,
    Ec2ConfigSchema,
]);
const NodeRefsSchema = zod_1.z.object({
    vpcId: zod_1.z.string().optional(),
    subnetId: zod_1.z.string().optional(),
    securityGroupIds: zod_1.z.array(zod_1.z.string()).optional(),
    igwId: zod_1.z.string().optional(),
});
exports.InfraNodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: exports.AwsResourceTypeEnum,
    name: zod_1.z.string(),
    rf: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number() }),
    config: AwsNodeConfigSchema,
    refs: NodeRefsSchema.optional(),
});
exports.InfraEdgeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    kind: exports.EdgeKindEnum,
    source: zod_1.z.string(),
    target: zod_1.z.string(),
    meta: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
const VariableSchema = zod_1.z.object({
    type: zod_1.z.enum(["string", "number", "bool"]),
    default: zod_1.z.unknown().optional(),
    description: zod_1.z.string().optional(),
});
exports.InfraGraphSchema = zod_1.z.object({
    schemaVersion: zod_1.z.literal("cloudweaver.aws.v1"),
    provider: zod_1.z.object({
        name: zod_1.z.literal("aws"),
        region: zod_1.z.string().optional(),
    }),
    nodes: zod_1.z.array(exports.InfraNodeSchema),
    edges: zod_1.z.array(exports.InfraEdgeSchema),
    variables: zod_1.z.record(zod_1.z.string(), VariableSchema).optional(),
});
