import React, { useCallback, useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";

import AwsNode from "./components/AwsNode";
import { Palette } from "./components/Palette";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { generateCloudFormation } from "./api";
import { buildInfraGraph, defaultConfigForType, inferEdgeKind } from "./infra";
import { useCloudWeaverStore } from "./store";
import type { AwsResourceType } from "./types";

const nodeTypes = { aws: AwsNode };

function uuid() {
  if ("randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const {
    nodes,
    edges,
    configsById,
    setNodes,
    setEdges,
    upsertNodeConfig,
    setSelectedNodeId,
    setSelectedEdgeId,
    codePreviewYAML,
    setPreview,
    setDiagnostics,
    diagnostics,
    isGenerating,
    setIsGenerating,
  } = useCloudWeaverStore();

  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>("");
  const importRef = useRef<HTMLInputElement | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const src = nodes.find((n) => n.id === connection.source);
      const tgt = nodes.find((n) => n.id === connection.target);
      const kind = inferEdgeKind(src?.data.resourceType, tgt?.data.resourceType);

      const newEdge: Edge<any> = {
        id: uuid(),
        source: connection.source!,
        target: connection.target!,
        data: { kind, meta: {} },
        animated: true,
        style: { stroke: "rgba(231,236,255,0.65)" },
      };
      setEdges(addEdge(newEdge, edges));
    },
    [edges, nodes, setEdges]
  );

  const addNode = useCallback(
    (t: AwsResourceType) => {
      const id = uuid();
      const labelDefaults: Record<AwsResourceType, string> = {
        vpc: "main-vpc",
        subnet: "public-subnet-a",
        igw: "main-igw",
        security_group: "web-sg",
        ec2_instance: "web-instance",
      };

      const newNode: Node<any> = {
        id,
        type: "aws",
        position: { x: 200 + Math.random() * 240, y: 120 + Math.random() * 220 },
        data: { label: labelDefaults[t], resourceType: t },
      };
      setNodes([...nodes, newNode]);
      upsertNodeConfig(id, defaultConfigForType(t));
      setSelectedNodeId(id);
    },
    [nodes, setNodes, setSelectedNodeId, upsertNodeConfig]
  );

  const infraGraph = useMemo(() => buildInfraGraph(nodes as any, edges as any, configsById, "us-east-1"), [nodes, edges, configsById]);

  // Live preview (debounced)
  useEffect(() => {
    const payload = JSON.stringify(infraGraph);
    if (payload === lastRequestRef.current) return;

    const t = setTimeout(async () => {
      lastRequestRef.current = payload;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      try {
        const res = await generateCloudFormation(infraGraph, controller.signal);
        setDiagnostics(res.diagnostics ?? []);
        if (res.ok && res.templateYAML) setPreview(res.templateYAML);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setDiagnostics([{ level: "error", message: `Failed to generate: ${e?.message ?? String(e)}` }]);
        }
      } finally {
        setIsGenerating(false);
      }
    }, 450);

    return () => clearTimeout(t);
  }, [infraGraph, setDiagnostics, setIsGenerating, setPreview]);

  const errorCount = diagnostics.filter((d) => d.level === "error").length;

  return (
    <div className="cw-app">
      <div className="cw-topbar">
        <div className="cw-topbar-title">
          <h1>CloudWeaver</h1>
          <span className="cw-pill">CloudFormation-first (AWS v1)</span>
          {errorCount > 0 ? <span className="cw-badge-error">{errorCount} error(s)</span> : null}
          {isGenerating ? <span className="cw-pill">generating…</span> : null}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const json = JSON.parse(text);
              const graph = json as any;

              const nextNodes: Node<any>[] = (graph.nodes ?? []).map((n: any) => ({
                id: n.id,
                type: "aws",
                position: { x: n.rf?.x ?? 100, y: n.rf?.y ?? 100 },
                data: { label: n.name ?? n.id, resourceType: n.type },
              }));

              const nextEdges: Edge<any>[] = (graph.edges ?? []).map((ed: any) => ({
                id: ed.id,
                source: ed.source,
                target: ed.target,
                data: { kind: ed.kind, meta: ed.meta ?? {} },
                animated: true,
                style: { stroke: "rgba(231,236,255,0.65)" },
              }));

              setNodes(nextNodes);
              setEdges(nextEdges);
              for (const n of graph.nodes ?? []) {
                if (n?.id && n?.config) upsertNodeConfig(n.id, n.config);
              }
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
              e.target.value = "";
            }}
          />

          <button className="cw-btn" onClick={() => importRef.current?.click()}>
            Import Graph JSON
          </button>
          <button className="cw-btn" onClick={() => downloadText("cloudweaver-template.yaml", codePreviewYAML || "")} disabled={!codePreviewYAML}>
            Export YAML
          </button>
          <button className="cw-btn" onClick={() => downloadText("cloudweaver-graph.json", JSON.stringify(infraGraph, null, 2))} disabled={nodes.length === 0}>
            Export Graph JSON
          </button>
        </div>
      </div>

      <div className="cw-left">
        <Palette onAdd={addNode} />
        <div className="cw-divider" />
        <div className="cw-card cw-grid">
          <div className="cw-panel-title">Quick start</div>
          <div style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.4 }}>
            Add a VPC, Subnet, Security Group, and EC2 instance. Connect:
            <div style={{ marginTop: 6 }}>
              - VPC → Subnet (<strong>contains</strong>)<br />
              - Subnet → EC2 (<strong>hosts</strong>)<br />
              - EC2 → SG (<strong>uses</strong>)
            </div>
          </div>
        </div>
      </div>

      <div className="cw-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => setSelectedNodeId(n.id)}
          onEdgeClick={(_, e) => setSelectedEdgeId(e.id)}
          fitView
        >
          <Background gap={16} color="rgba(255,255,255,0.05)" />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>

      <div className="cw-right">
        <PropertiesPanel />
      </div>

      <div className="cw-preview">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="cw-panel-title" style={{ margin: 0 }}>
            CloudFormation live preview
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{codePreviewYAML ? `${codePreviewYAML.split("\n").length} lines` : "—"}</div>
        </div>
        <div className="cw-code">{codePreviewYAML || "# Add nodes/edges to generate a template."}</div>
      </div>
    </div>
  );
}

