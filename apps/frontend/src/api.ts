import type { Diagnostic, InfraGraphV1 } from "./types";

export type GenerateResponse = {
  ok: boolean;
  diagnostics?: Diagnostic[];
  orderedNodeIds?: string[];
  templateYAML?: string;
};

export async function generateCloudFormation(graph: InfraGraphV1, signal?: AbortSignal): Promise<GenerateResponse> {
  const res = await fetch("/api/generate/cloudformation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(graph),
    signal,
  });

  const json = (await res.json()) as GenerateResponse;
  return json;
}

