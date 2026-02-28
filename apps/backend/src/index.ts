import cors from "cors";
import express from "express";
import { emitCloudFormationTemplate } from "./cloudformationEmitter";
import { buildDependencyGraphAndTopo } from "./deps";
import { InfraGraphSchema } from "./infraGraph";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/generate/cloudformation", (req, res) => {
  const parsed = InfraGraphSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      diagnostics: [
        {
          level: "error",
          message: "Invalid InfraGraph payload",
          details: parsed.error.flatten(),
        },
      ],
    });
  }

  const graph = parsed.data;

  const depResult = buildDependencyGraphAndTopo(graph);
  if (!depResult.ok || !depResult.orderedNodeIds) {
    return res.json({
      ok: false,
      diagnostics: depResult.diagnostics,
    });
  }

  const emitResult = emitCloudFormationTemplate(
    graph,
    depResult.orderedNodeIds,
    depResult.depEdges
  );

  return res.json({
    ok: emitResult.ok,
    diagnostics: [...depResult.diagnostics, ...emitResult.diagnostics],
    orderedNodeIds: emitResult.orderedNodeIds,
    templateYAML: emitResult.templateYAML,
  });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CloudWeaver backend listening on http://localhost:${port}`);
});

