import React, { useMemo } from "react";
import { useCloudWeaverStore } from "../store";
import type { AwsNodeConfig, AwsResourceType, EdgeKind } from "../types";

function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="cw-field">
      <div className="cw-label">{props.label}</div>
      <input
        className="cw-input"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
}

function BoolField(props: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <input type="checkbox" checked={props.value} onChange={(e) => props.onChange(e.target.checked)} />
      <span style={{ fontSize: 12, opacity: 0.9 }}>{props.label}</span>
    </label>
  );
}

function NumberField(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="cw-field">
      <div className="cw-label">{props.label}</div>
      <input
        className="cw-input"
        type="number"
        value={Number.isFinite(props.value) ? String(props.value) : ""}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </div>
  );
}

const edgeKindOptions: Array<{ id: EdgeKind; label: string }> = [
  { id: "contains", label: "contains (VPC → Subnet)" },
  { id: "attaches", label: "attaches (VPC → IGW)" },
  { id: "hosts", label: "hosts (Subnet → EC2)" },
  { id: "uses", label: "uses (EC2 → SG)" },
  { id: "routes_to", label: "routes_to (Subnet → IGW)" },
];

export function PropertiesPanel() {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    configsById,
    upsertNodeConfig,
    setNodes,
    updateEdgeData,
    diagnostics,
  } = useCloudWeaverStore();

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((e) => e.id === selectedEdgeId) ?? null, [edges, selectedEdgeId]);

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="cw-grid">
        <div className="cw-panel-title">Inspector</div>
        <div className="cw-card" style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.4 }}>
          Select a node to edit its properties, or select an edge to edit relationship kind/metadata.
        </div>
        <div className="cw-card">
          <div className="cw-panel-title">Diagnostics</div>
          {diagnostics.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.88 }}>None</div>
          ) : (
            <div className="cw-grid" style={{ gap: 8 }}>
              {diagnostics.map((d, idx) => (
                <div key={idx} style={{ fontSize: 12, opacity: 0.9 }}>
                  <span className={d.level === "error" ? "cw-badge-error" : "cw-pill"}>{d.level}</span>{" "}
                  <span style={{ marginLeft: 8 }}>{d.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    const kind = selectedEdge.data?.kind ?? "hosts";
    const traffic = (selectedEdge.data?.meta?.traffic as string | undefined) ?? "";
    const port = (selectedEdge.data?.meta?.port as number | undefined) ?? 80;
    const cidr = (selectedEdge.data?.meta?.cidr as string | undefined) ?? "0.0.0.0/0";

    return (
      <div className="cw-grid">
        <div className="cw-panel-title">Edge</div>
        <div className="cw-card cw-grid">
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            <div>
              <strong>From</strong>: {selectedEdge.source}
            </div>
            <div>
              <strong>To</strong>: {selectedEdge.target}
            </div>
          </div>

          <div className="cw-field">
            <div className="cw-label">Kind</div>
            <select
              className="cw-select"
              value={kind}
              onChange={(e) => updateEdgeData(selectedEdge.id, { kind: e.target.value as EdgeKind })}
            >
              {edgeKindOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="cw-divider" />
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Edge metadata (used for auto-SG rules; optional)
          </div>
          <TextField
            label="traffic (ssh/http/https/custom)"
            value={traffic}
            onChange={(v) => updateEdgeData(selectedEdge.id, { meta: { ...(selectedEdge.data?.meta ?? {}), traffic: v } })}
          />
          <NumberField
            label="port (for traffic=custom)"
            value={port}
            onChange={(v) => updateEdgeData(selectedEdge.id, { meta: { ...(selectedEdge.data?.meta ?? {}), port: v } })}
          />
          <TextField
            label="cidr"
            value={cidr}
            onChange={(v) => updateEdgeData(selectedEdge.id, { meta: { ...(selectedEdge.data?.meta ?? {}), cidr: v } })}
          />
        </div>
      </div>
    );
  }

  const resourceType = selectedNode!.data.resourceType;
  const label = selectedNode!.data.label;
  const config = (configsById[selectedNode!.id] ?? null) as AwsNodeConfig | null;

  const setLabel = (newLabel: string) => {
    setNodes(
      nodes.map((n) => (n.id === selectedNode!.id ? { ...n, data: { ...n.data, label: newLabel } } : n))
    );
  };

  const setConfig = (cfg: AwsNodeConfig) => upsertNodeConfig(selectedNode!.id, cfg);

  return (
    <div className="cw-grid">
      <div className="cw-panel-title">Node</div>
      <div className="cw-card cw-grid">
        <TextField label="Name" value={label} onChange={setLabel} />
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          Type: <strong>{resourceType}</strong>
        </div>
      </div>

      <div className="cw-panel-title">Properties</div>
      <div className="cw-card cw-grid">
        {renderNodeConfig(resourceType, config, setConfig)}
      </div>

      <div className="cw-card">
        <div className="cw-panel-title">Diagnostics</div>
        {diagnostics.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.88 }}>None</div>
        ) : (
          <div className="cw-grid" style={{ gap: 8 }}>
            {diagnostics.map((d, idx) => (
              <div key={idx} style={{ fontSize: 12, opacity: 0.9 }}>
                <span className={d.level === "error" ? "cw-badge-error" : "cw-pill"}>{d.level}</span>{" "}
                <span style={{ marginLeft: 8 }}>{d.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderNodeConfig(
  t: AwsResourceType,
  cfg: AwsNodeConfig | null,
  setCfg: (c: AwsNodeConfig) => void
) {
  if (!cfg) return <div style={{ fontSize: 12, opacity: 0.88 }}>No config available.</div>;

  switch (t) {
    case "vpc": {
      const c = cfg.type === "vpc" ? cfg : { type: "vpc", cidrBlock: "10.0.0.0/16" };
      return (
        <>
          <TextField label="CIDR block" value={c.cidrBlock} onChange={(v) => setCfg({ ...c, cidrBlock: v })} />
          <BoolField
            label="Enable DNS support"
            value={c.enableDnsSupport ?? true}
            onChange={(v) => setCfg({ ...c, enableDnsSupport: v })}
          />
          <BoolField
            label="Enable DNS hostnames"
            value={c.enableDnsHostnames ?? true}
            onChange={(v) => setCfg({ ...c, enableDnsHostnames: v })}
          />
        </>
      );
    }

    case "subnet": {
      const c = cfg.type === "subnet" ? cfg : { type: "subnet", cidrBlock: "10.0.1.0/24" };
      return (
        <>
          <TextField label="CIDR block" value={c.cidrBlock} onChange={(v) => setCfg({ ...c, cidrBlock: v })} />
          <TextField label="Availability Zone" value={c.az ?? ""} onChange={(v) => setCfg({ ...c, az: v })} placeholder="us-east-1a" />
          <BoolField
            label="Map public IP on launch"
            value={c.mapPublicIpOnLaunch ?? true}
            onChange={(v) => setCfg({ ...c, mapPublicIpOnLaunch: v })}
          />
        </>
      );
    }

    case "igw":
      return <div style={{ fontSize: 12, opacity: 0.9 }}>No properties for IGW in v1.</div>;

    case "security_group": {
      const c = cfg.type === "security_group" ? cfg : { type: "security_group" };
      const firstIngress = c.ingress?.[0] ?? { protocol: "tcp", fromPort: 80, toPort: 80, cidr: "0.0.0.0/0" };
      const firstEgress = c.egress?.[0] ?? { protocol: "-1", fromPort: 0, toPort: 0, cidr: "0.0.0.0/0" };
      return (
        <>
          <TextField label="Description" value={c.description ?? ""} onChange={(v) => setCfg({ ...c, description: v })} />
          <div className="cw-divider" />
          <div style={{ fontSize: 12, opacity: 0.85 }}>Ingress rule (v1: single rule editor)</div>
          <TextField
            label="Protocol"
            value={firstIngress.protocol}
            onChange={(v) =>
              setCfg({ ...c, ingress: [{ ...firstIngress, protocol: v as any }] })
            }
            placeholder="tcp"
          />
          <NumberField
            label="From port"
            value={firstIngress.fromPort}
            onChange={(v) => setCfg({ ...c, ingress: [{ ...firstIngress, fromPort: v }] })}
          />
          <NumberField
            label="To port"
            value={firstIngress.toPort}
            onChange={(v) => setCfg({ ...c, ingress: [{ ...firstIngress, toPort: v }] })}
          />
          <TextField
            label="CIDR"
            value={firstIngress.cidr ?? "0.0.0.0/0"}
            onChange={(v) => setCfg({ ...c, ingress: [{ ...firstIngress, cidr: v }] })}
          />
          <div className="cw-divider" />
          <div style={{ fontSize: 12, opacity: 0.85 }}>Egress rule (v1: single rule editor)</div>
          <TextField
            label="Protocol"
            value={firstEgress.protocol}
            onChange={(v) => setCfg({ ...c, egress: [{ ...firstEgress, protocol: v as any }] })}
          />
          <NumberField
            label="From port"
            value={firstEgress.fromPort}
            onChange={(v) => setCfg({ ...c, egress: [{ ...firstEgress, fromPort: v }] })}
          />
          <NumberField
            label="To port"
            value={firstEgress.toPort}
            onChange={(v) => setCfg({ ...c, egress: [{ ...firstEgress, toPort: v }] })}
          />
          <TextField
            label="CIDR"
            value={firstEgress.cidr ?? "0.0.0.0/0"}
            onChange={(v) => setCfg({ ...c, egress: [{ ...firstEgress, cidr: v }] })}
          />
        </>
      );
    }

    case "ec2_instance": {
      const c = cfg.type === "ec2_instance" ? cfg : { type: "ec2_instance", ami: "", instanceType: "" };
      return (
        <>
          <TextField label="AMI" value={c.ami} onChange={(v) => setCfg({ ...c, ami: v })} placeholder="ami-..." />
          <TextField
            label="Instance type"
            value={c.instanceType}
            onChange={(v) => setCfg({ ...c, instanceType: v })}
            placeholder="t3.micro"
          />
          <TextField label="Key pair name" value={c.keyName ?? ""} onChange={(v) => setCfg({ ...c, keyName: v })} />
          <div className="cw-field">
            <div className="cw-label">UserData (base64, optional)</div>
            <textarea
              className="cw-textarea"
              value={c.userDataBase64 ?? ""}
              onChange={(e) => setCfg({ ...c, userDataBase64: e.target.value })}
            />
          </div>
        </>
      );
    }
  }
}

