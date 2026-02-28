import { z } from "zod";
export declare const AwsResourceTypeEnum: z.ZodEnum<{
    vpc: "vpc";
    subnet: "subnet";
    igw: "igw";
    security_group: "security_group";
    ec2_instance: "ec2_instance";
}>;
export declare const EdgeKindEnum: z.ZodEnum<{
    contains: "contains";
    attaches: "attaches";
    hosts: "hosts";
    uses: "uses";
    routes_to: "routes_to";
}>;
export declare const InfraNodeSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        vpc: "vpc";
        subnet: "subnet";
        igw: "igw";
        security_group: "security_group";
        ec2_instance: "ec2_instance";
    }>;
    name: z.ZodString;
    rf: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strip>;
    config: z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"vpc">;
        cidrBlock: z.ZodString;
        enableDnsHostnames: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        enableDnsSupport: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"subnet">;
        cidrBlock: z.ZodString;
        az: z.ZodOptional<z.ZodString>;
        mapPublicIpOnLaunch: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"igw">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"security_group">;
        description: z.ZodOptional<z.ZodString>;
        ingress: z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodUnion<readonly [z.ZodLiteral<"tcp">, z.ZodLiteral<"udp">, z.ZodLiteral<"icmp">, z.ZodLiteral<"-1">]>;
            fromPort: z.ZodNumber;
            toPort: z.ZodNumber;
            cidr: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        egress: z.ZodOptional<z.ZodArray<z.ZodObject<{
            protocol: z.ZodUnion<readonly [z.ZodLiteral<"tcp">, z.ZodLiteral<"udp">, z.ZodLiteral<"icmp">, z.ZodLiteral<"-1">]>;
            fromPort: z.ZodNumber;
            toPort: z.ZodNumber;
            cidr: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"ec2_instance">;
        ami: z.ZodString;
        instanceType: z.ZodString;
        keyName: z.ZodOptional<z.ZodString>;
        userDataBase64: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], "type">;
    refs: z.ZodOptional<z.ZodObject<{
        vpcId: z.ZodOptional<z.ZodString>;
        subnetId: z.ZodOptional<z.ZodString>;
        securityGroupIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        igwId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const InfraEdgeSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodEnum<{
        contains: "contains";
        attaches: "attaches";
        hosts: "hosts";
        uses: "uses";
        routes_to: "routes_to";
    }>;
    source: z.ZodString;
    target: z.ZodString;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const InfraGraphSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"cloudweaver.aws.v1">;
    provider: z.ZodObject<{
        name: z.ZodLiteral<"aws">;
        region: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            vpc: "vpc";
            subnet: "subnet";
            igw: "igw";
            security_group: "security_group";
            ec2_instance: "ec2_instance";
        }>;
        name: z.ZodString;
        rf: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>;
        config: z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"vpc">;
            cidrBlock: z.ZodString;
            enableDnsHostnames: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            enableDnsSupport: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"subnet">;
            cidrBlock: z.ZodString;
            az: z.ZodOptional<z.ZodString>;
            mapPublicIpOnLaunch: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"igw">;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"security_group">;
            description: z.ZodOptional<z.ZodString>;
            ingress: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodUnion<readonly [z.ZodLiteral<"tcp">, z.ZodLiteral<"udp">, z.ZodLiteral<"icmp">, z.ZodLiteral<"-1">]>;
                fromPort: z.ZodNumber;
                toPort: z.ZodNumber;
                cidr: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
            egress: z.ZodOptional<z.ZodArray<z.ZodObject<{
                protocol: z.ZodUnion<readonly [z.ZodLiteral<"tcp">, z.ZodLiteral<"udp">, z.ZodLiteral<"icmp">, z.ZodLiteral<"-1">]>;
                fromPort: z.ZodNumber;
                toPort: z.ZodNumber;
                cidr: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ec2_instance">;
            ami: z.ZodString;
            instanceType: z.ZodString;
            keyName: z.ZodOptional<z.ZodString>;
            userDataBase64: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>], "type">;
        refs: z.ZodOptional<z.ZodObject<{
            vpcId: z.ZodOptional<z.ZodString>;
            subnetId: z.ZodOptional<z.ZodString>;
            securityGroupIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            igwId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    edges: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<{
            contains: "contains";
            attaches: "attaches";
            hosts: "hosts";
            uses: "uses";
            routes_to: "routes_to";
        }>;
        source: z.ZodString;
        target: z.ZodString;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodEnum<{
            string: "string";
            number: "number";
            bool: "bool";
        }>;
        default: z.ZodOptional<z.ZodUnknown>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type InfraGraphV1 = z.infer<typeof InfraGraphSchema>;
export type InfraNode = z.infer<typeof InfraNodeSchema>;
export type InfraEdge = z.infer<typeof InfraEdgeSchema>;
