import React from "react";
import { Handle, Position } from "reactflow";
import type { AwsResourceType } from "../types";

const colorByType: Record<AwsResourceType, string> = {
  vpc: "rgba(120,140,255,0.22)",
  subnet: "rgba(72,199,142,0.20)",
  igw: "rgba(255,175,78,0.20)",
  security_group: "rgba(255,99,132,0.18)",
  ec2_instance: "rgba(110,231,255,0.18)",
};

const borderByType: Record<AwsResourceType, string> = {
  vpc: "rgba(120,140,255,0.55)",
  subnet: "rgba(72,199,142,0.55)",
  igw: "rgba(255,175,78,0.55)",
  security_group: "rgba(255,99,132,0.50)",
  ec2_instance: "rgba(110,231,255,0.50)",
};

export default function AwsNode(props: any) {
  const { data, selected } = props as { data: { label: string; resourceType: AwsResourceType }; selected?: boolean };
  const bg = colorByType[data.resourceType];
  const border = borderByType[data.resourceType];

  return (
    <div
      style={{
        minWidth: 170,
        borderRadius: 14,
        padding: 12,
        background: bg,
        border: `1px solid ${selected ? "rgba(255,255,255,0.55)" : border}`,
        boxShadow: selected ? "0 0 0 2px rgba(255,255,255,0.10)" : "none",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {data.resourceType.replace("_", " ")}
      </div>
      <div style={{ marginTop: 4, fontWeight: 750 }}>{data.label}</div>

      <Handle type="target" position={Position.Left} style={{ background: "rgba(255,255,255,0.8)", border: "none" }} />
      <Handle type="source" position={Position.Right} style={{ background: "rgba(255,255,255,0.8)", border: "none" }} />
    </div>
  );
}

