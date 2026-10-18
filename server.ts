import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ override: true });
import { documentAiText, pdfToText, publishReview } from "./src/cloud.ts";
import { cases } from "./src/corpus/index.ts";
import { askWithGemini, draftWithGemini, suggestWithGemini } from "./src/pipeline/gemini.ts";
import { runPacket } from "./src/pipeline/run.ts";
import { suggestCase } from "./src/pipeline/suggest.ts";
import { pushEvent, readCreated, readEvents, saveCreated } from "./src/store.ts";
import type { FinCase, Sector } from "./src/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 5173);
const isProd = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    cases: cases.length,
    gemini: Boolean(process.env.GEMINI_API_KEY) || process.env.VERTEX_AI === "true" || process.env.GOOGLE_GENAI_USE_VERTEXAI === "true",
  });
});

app.get("/api/cases", (_req, res) => {
  res.json(
    cases.map((item) => ({
      id: item.id,
      sector: item.sector,
      workflow: item.workflow,
      party: item.party,
      reference: item.reference,
      summary: item.summary,
    })),
  );
});

app.post("/api/suggest", async (req, res) => {
  const brief = String(req.body?.brief ?? "");
  const local = suggestCase(brief);
  try {
    const raw = await Promise.race([
      suggestWithGemini(brief),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (raw) {
      const drafted = JSON.parse(raw) as {
        sector?: Sector;
        party?: string;
        workflow?: string;
        summary?: string;
        recommendation?: FinCase["recommendation"];
        ruleId?: string;
        ruleText?: string;
        documentTitle?: string;
        documentBody?: string;
        quote?: string;
        findingTitle?: string;
        plain?: string;
      };
      const body = drafted.documentBody ?? "";
      const quote = drafted.quote ?? "";
      const sectors: Sector[] = ["Banking", "Financial services", "Insurance", "Cross-cutting"];
      const recommendations = ["Approve", "Query", "Escalate"];
      if (
        body.includes(quote) &&
        quote &&
        drafted.party &&
        drafted.sector &&
        sectors.includes(drafted.sector) &&
        (!drafted.recommendation || recommendations.includes(drafted.recommendation))
      ) {
        const merged = suggestCase(brief);
        merged.sector = drafted.sector;
        merged.party = drafted.party;
        merged.workflow = drafted.workflow || merged.workflow;
        merged.summary = drafted.summary || brief;
        merged.recommendation = drafted.recommendation || merged.recommendation;
        merged.documents[0] = {
          id: "packet",
          title: drafted.documentTitle || "Submitted note",
          kind: "Packet",
          body,
        };
        merged.rules[0] = { id: drafted.ruleId || "NEW-1", text: drafted.ruleText || merged.rules[0].text };
        merged.checks[0] = {
          ...merged.checks[0],
          pass: merged.recommendation === "Approve",
          title: drafted.findingTitle || merged.checks[0].title,
          quote,
          ruleId: merged.rules[0].id,
          plain: drafted.plain || merged.checks[0].plain,
        };
        res.json(merged);
        return;
      }
    }
  } catch (error) {
    console.error("Suggest fell back to the desk agent", error);
  }
  res.json(local);
});

app.get("/api/events", (_req, res) => {
  res.json(readEvents().slice(0, 12));
});

app.get("/api/created", (_req, res) => {
  res.json(readCreated());
});

app.post("/api/created", (req, res) => {
  const item = req.body as FinCase;
  if (!item?.id || !item.party || !Array.isArray(item.documents)) {
    res.status(400).json({ error: "A file needs a party and documents." });
    return;
  }
  const created = readCreated().filter((existing) => existing.id !== item.id);
  created.push(item);
  saveCreated(created);
  res.json(item);
});

app.post("/api/extract", async (req, res) => {
  try {
    const name = String(req.body?.name || "Upload");
    const mime = String(req.body?.mime || "text/plain");
    const encoded = String(req.body?.data || "");
    if (!encoded) {
      res.status(400).json({ error: "Choose a text or PDF file." });
      return;
    }
    const buffer = Buffer.from(encoded, "base64");
    let body = "";
    let source = "file";
    if (mime.includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
      const extracted = await documentAiText(buffer, mime || "application/pdf");
      if (extracted) {
        body = extracted;
        source = "document-ai";
      } else {
        body = pdfToText(buffer);
      }
    } else {
      body = buffer.toString("utf8");
    }
    body = body.replace(/\u0000/g, "").trim();
    if (!body) {
      res.status(400).json({ error: "No readable text in that file. Paste the lines, or use a text PDF." });
      return;
    }
    res.json({ title: name.replace(/\.[^.]+$/, ""), kind: "Upload", body: body.slice(0, 8000), source });
  } catch (error) {
    console.error("Extract failed", error);
    res.status(502).json({ error: "The document could not be read." });
  }
});

app.post("/api/ask", async (req, res) => {
  const question = String(req.body?.question ?? "");
  const evidence = String(req.body?.evidence ?? "");
  try {
    const answer = await Promise.race([
      askWithGemini(question, evidence),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    res.json({ answer, gemini: Boolean(answer) });
  } catch (error) {
    console.error("Ask fell back to the file", error);
    res.json({ answer: null, gemini: false });
  }
});

app.post("/api/run/:id", async (req, res) => {
  try {
    const kase = cases.find((item) => item.id === req.params.id) ?? readCreated().find((item) => item.id === req.params.id);
    if (!kase) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const result = runPacket(kase);
    try {
      const drafted = await Promise.race([
        draftWithGemini(result, kase.party, kase.workflow),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
      if (drafted) {
        result.staffNote = drafted.staffNote;
        result.customerNote = drafted.customerNote;
        result.gemini = true;
        result.steps = result.steps.map((step) =>
          step.name === "Draft" ? { ...step, detail: "Gemini drafted both notes from the cited findings." } : step,
        );
      }
    } catch (error) {
      console.error("Gemini draft failed", error);
    }
    res.json(result);
    const event = {
      at: new Date().toISOString(),
      reference: kase.reference,
      party: kase.party,
      recommendation: result.recommendation,
    };
    pushEvent(event);
    publishReview(event).catch((error) => console.error("Pub/Sub publish skipped", error));
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : "Case not found" });
  }
});

if (isProd) {
  const dist = path.join(__dirname, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`FinProof listening on http://localhost:${port}`);
});
