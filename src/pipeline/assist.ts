import type { Anomaly } from "../ledger";
import type { FinCase, RunResult } from "../types";

const stops = new Set(["the", "a", "an", "is", "are", "what", "how", "does", "do", "did", "i", "we", "this", "that", "on", "of", "to", "and", "for", "in", "it", "me", "my", "should", "can", "with"]);

function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stops.has(word));
}

export function answerFromFile(question: string, kase: FinCase, result: RunResult | undefined, anomalies: Anomaly[]): string {
  const asked = question.trim();
  if (!asked) return "";
  const tokens = words(asked);
  if (/next|recommend|should|do now|action/.test(asked.toLowerCase())) {
    const lines = [kase.handlerHint, ...anomalies.map((anomaly) => anomaly.reason)].filter(Boolean);
    return lines.join(" ");
  }

  const passages: { text: string; score: number }[] = [];
  const add = (text: string) => {
    const score = tokens.filter((token) => text.toLowerCase().includes(token)).length;
    if (score > 0) passages.push({ text, score });
  };
  for (const document of kase.documents) {
    for (const line of document.body.split("\n")) add(`${document.title}: ${line.trim()}`);
  }
  for (const rule of kase.rules) add(`${rule.id}: ${rule.text}`);
  for (const anomaly of anomalies) add(anomaly.reason);
  if (result) {
    for (const finding of result.findings) add(`${finding.ruleId}: ${finding.plain}`);
  }

  passages.sort((a, b) => b.score - a.score);
  const best = passages.slice(0, 2).map((passage) => passage.text);
  if (!best.length) return "That is not in this file, its rules, or the transactions on this party.";
  return best.join(" ");
}
