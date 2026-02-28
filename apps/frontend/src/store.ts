import { create } from "zustand";
import type { Edge, Node } from "reactflow";
import type { AwsNodeConfig, AwsResourceType, Diagnostic, EdgeKind } from "./types";

export type CanvasNodeData = {
  label: string;
  resourceType: AwsResourceType;
};

export type CanvasEdgeData = {
  kind: EdgeKind;
  meta?: Record<string, unknown>;
};

type CloudWeaverState = {
  nodes: Node<CanvasNodeData>[];
  edges: Edge<CanvasEdgeData>[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  configsById: Record<string, AwsNodeConfig>;
  codePreviewYAML: string;
  diagnostics: Diagnostic[];
  isGenerating: boolean;

  setNodes: (nodes: Node<CanvasNodeData>[]) => void;
  setEdges: (edges: Edge<CanvasEdgeData>[]) => void;
  upsertNodeConfig: (id: string, config: AwsNodeConfig) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  updateEdgeData: (edgeId: string, patch: Partial<CanvasEdgeData>) => void;
  setPreview: (yaml: string) => void;
  setDiagnostics: (d: Diagnostic[]) => void;
  setIsGenerating: (b: boolean) => void;
};

export const useCloudWeaverStore = create<CloudWeaverState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  configsById: {},
  codePreviewYAML: "",
  diagnostics: [],
  isGenerating: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  upsertNodeConfig: (id, config) => set((s) => ({ configsById: { ...s.configsById, [id]: config } })),
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  updateEdgeData: (edgeId, patch) =>
    set((s) => ({
      edges: s.edges.map((e) => (e.id === edgeId ? { ...e, data: { ...(e.data ?? { kind: "hosts" }), ...patch } } : e)),
    })),
  setPreview: (yaml) => set({ codePreviewYAML: yaml }),
  setDiagnostics: (d) => set({ diagnostics: d }),
  setIsGenerating: (b) => set({ isGenerating: b }),
}));

