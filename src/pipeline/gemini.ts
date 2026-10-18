import { GoogleGenAI } from "@google/genai";
import type { RunResult } from "../types";

function geminiClient(): GoogleGenAI | null {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const vertex = process.env.VERTEX_AI === "true" || process.env.GOOGLE_GENAI_USE_VERTEXAI === "true";
  if (vertex && project) {
    return new GoogleGenAI({
      vertexai: true,
      project,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function modelName(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export async function draftWithGemini(result: RunResult, party: string, workflow: string): Promise<{ staffNote: string; customerNote: string } | null> {
  const ai = geminiClient();
  if (!ai) return null;
  const model = modelName();
  const evidence = result.findings.length
    ? result.findings.map((finding) => ({
        title: finding.title,
        quote: finding.quote,
        document: finding.documentTitle,
        ruleId: finding.ruleId,
        rule: finding.ruleText,
        plain: finding.plain,
      }))
    : result.supporting.map((item) => ({
        title: item.title,
        quote: item.quote,
        document: item.documentTitle,
        ruleId: item.ruleId,
        rule: item.ruleText,
      }));

  const prompt = `You draft two short notes for a financial-services handler.
Party: ${party}
Workflow: ${workflow}
Recommendation: ${result.recommendation}
Evidence JSON: ${JSON.stringify(evidence)}

Rules:
- Use only the evidence above. Do not add findings, amounts, or rule ids.
- The handler makes the final decision. Do not say the case is declined or fraud is proven.
- staffNote is for the handler, plain prose, under 120 words.
- customerNote is for the customer, plain prose, under 90 words.
- If the recommendation is Approve, answer the question and mention the rule id.
- Return JSON only: {"staffNote":"...","customerNote":"..."}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const text = response.text?.trim();
  if (!text) return null;
  const parsed = JSON.parse(text) as { staffNote?: string; customerNote?: string };
  if (!parsed.staffNote || !parsed.customerNote) return null;
  return { staffNote: parsed.staffNote, customerNote: parsed.customerNote };
}

export async function suggestWithGemini(brief: string): Promise<string | null> {
  const ai = geminiClient();
  if (!ai || !brief.trim()) return null;
  const model = modelName();
  const response = await ai.models.generateContent({
    model,
    contents: `You help a financial-services handler draft one new case. The handler wrote: ${brief}
Return JSON only with keys: sector (Banking, Financial services, Insurance, or Cross-cutting), party, workflow, summary, recommendation (Approve, Query, or Escalate), ruleId, ruleText, documentTitle, documentBody, quote, findingTitle, plain.
The quote must appear exactly inside documentBody. Do not invent a fraud accusation. A person still sends the decision.`,
    config: { temperature: 0.2, responseMimeType: "application/json" },
  });
  return response.text?.trim() || null;
}

export async function askWithGemini(question: string, evidence: string): Promise<string | null> {
  const ai = geminiClient();
  if (!ai || !question.trim() || !evidence.trim()) return null;
  const model = modelName();
  const response = await ai.models.generateContent({
    model,
    contents: `Answer the handler in under 80 words. Use only the evidence. If the evidence does not contain the answer, say so. Do not accuse anyone of fraud. Do not tell the customer to buy or sell.
Question: ${question}
Evidence:
${evidence}`,
    config: { temperature: 0.1 },
  });
  const text = response.text?.trim();
  return text || null;
}
