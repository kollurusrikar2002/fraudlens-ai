import type { Anomaly } from "../ledger";
import type { FinCase, Severity } from "../types";

export interface Risk {
  score: number;
  band: "Low" | "Medium" | "High";
  drivers: string[];
}

const weight: Record<Severity | "high" | "medium", number> = { high: 56, medium: 18, low: 8 };

export function riskScore(findings: { severity: Severity; title: string }[], anomalies: Anomaly[]): Risk {
  const drivers = [
    ...findings.map((finding) => finding.title),
    ...anomalies.map((anomaly) => anomaly.title),
  ];
  const raw =
    findings.reduce((sum, finding) => sum + weight[finding.severity], 0) +
    anomalies.reduce((sum, anomaly) => sum + weight[anomaly.severity], 0);
  const score = Math.min(99, raw);
  const band = score >= 56 ? "High" : score >= 18 ? "Medium" : "Low";
  return { score, band, drivers };
}

export function nextSteps(kase: FinCase, anomalies: Anomaly[]): string[] {
  const steps = [kase.recommendation === "Approve" ? kase.customerApprove : kase.handlerHint];
  for (const anomaly of anomalies) steps.push(anomaly.reason);
  return steps.filter((step) => step.trim()).slice(0, 4);
}

export interface Classification {
  label: "Fraud signal" | "Control break" | "Policy breach" | "Service request";
  probability: number;
  because: string;
}

export function classify(kase: FinCase, anomalies: Anomaly[]): Classification {
  const titles = anomalies.map((anomaly) => anomaly.title.toLowerCase()).join(" ");
  const workflow = `${kase.workflow} ${kase.summary}`.toLowerCase();
  const because = anomalies[0]?.reason || kase.summary;
  if (/countries|procedure billed/.test(titles) || /fraud/.test(workflow)) {
    const highs = anomalies.filter((anomaly) => anomaly.severity === "high").length;
    return { label: "Fraud signal", probability: Math.min(96, 70 + highs * 8), because };
  }
  if (/approver|unmatched|ledger match/.test(titles)) {
    return { label: "Control break", probability: 74, because };
  }
  if (anomalies.length || kase.recommendation !== "Approve") {
    return { label: "Policy breach", probability: anomalies.length ? 66 : 48, because: kase.handlerHint || because };
  }
  return { label: "Service request", probability: 24, because: kase.customerApprove || kase.handlerHint || because };
}

export function offerFor(kase: FinCase, anomalies: Anomaly[]): string {
  const lead = (kase.recommendation === "Approve" ? kase.customerApprove : kase.handlerHint).trim();
  const extra = anomalies[0]?.reason.trim() ?? "";
  if (extra && lead && !lead.includes(extra.slice(0, 28))) return `${lead} ${extra}`;
  return lead || extra;
}

export function searchPolicy(query: string, book: FinCase[]): { id: string; text: string; party: string; reference: string }[] {
  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2);
  if (!words.length) return [];
  const hits: { id: string; text: string; party: string; reference: string; score: number }[] = [];
  for (const item of book) {
    for (const rule of item.rules) {
      const hay = `${rule.id} ${rule.text} ${item.workflow}`.toLowerCase();
      const score = words.filter((word) => hay.includes(word)).length;
      if (score > 0) hits.push({ id: rule.id, text: rule.text, party: item.party, reference: item.reference, score });
    }
  }
  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((hit) => ({ id: hit.id, text: hit.text, party: hit.party, reference: hit.reference }));
}
