import React from "react";
import type { AwsResourceType } from "../types";

const items: Array<{ type: AwsResourceType; title: string; desc: string }> = [
  { type: "vpc", title: "VPC", desc: "Network boundary + CIDR" },
  { type: "subnet", title: "Subnet", desc: "AZ-scoped network segment" },
  { type: "igw", title: "Internet Gateway", desc: "Internet connectivity" },
  { type: "security_group", title: "Security Group", desc: "Stateful firewall rules" },
  { type: "ec2_instance", title: "EC2 Instance", desc: "Compute node" },
];

export function Palette(props: { onAdd: (t: AwsResourceType) => void }) {
  return (
    <div className="cw-grid">
      <div className="cw-panel-title">Components</div>
      <div className="cw-card cw-grid">
        {items.map((it) => (
          <button
            key={it.type}
            className="cw-btn"
            onClick={() => props.onAdd(it.type)}
            style={{ display: "grid", gap: 2, textAlign: "left" }}
          >
            <div style={{ fontWeight: 800 }}>{it.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{it.desc}</div>
          </button>
        ))}
      </div>
      <div className="cw-card">
        <div className="cw-panel-title">Edge semantics</div>
        <div style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.4 }}>
          Draw edges between nodes. CloudWeaver auto-infers the relationship type (contains/hosts/uses/attaches).
          You can override edge kind in the right panel after selecting an edge.
        </div>
      </div>
    </div>
  );
}

