import { cases, getCase } from "../corpus";
import type { FinCase, Finding, Recommendation, RunResult, Support } from "../types";

function riskOf(findings: Finding[]): RunResult["risk"] {
  if (findings.some((finding) => finding.severity === "high")) return "High";
  if (findings.some((finding) => finding.severity === "medium")) return "Medium";
  return "Low";
}

function ruleText(kase: FinCase, ruleId: string): string {
  return kase.rules.find((rule) => rule.id === ruleId)?.text ?? "";
}

export function runCase(caseId: string): RunResult {
  return runPacket(getCase(caseId));
}

export function runPacket(kase: FinCase): RunResult {
  const caseId = kase.id;
  const findings: Finding[] = [];
  const supporting: Support[] = [];

  for (const check of kase.checks) {
    const document = kase.documents.find((doc) => doc.id === check.documentId);
    if (!document || !document.body.includes(check.quote)) {
      throw new Error(`Ungrounded check ${kase.id}/${check.id}`);
    }
    const cited = {
      documentId: document.id,
      documentTitle: document.title,
      quote: check.quote,
      ruleId: check.ruleId,
      ruleText: ruleText(kase, check.ruleId),
    };
    if (check.pass) {
      supporting.push({ ...cited, title: check.title });
    } else {
      findings.push({
        id: check.id,
        severity: check.severity,
        title: check.title,
        reason: check.reason,
        plain: check.plain,
        ...cited,
      });
    }
  }

  const recommendation: Recommendation = findings.length === 0 ? "Approve" : kase.recommendation;
  const notes = buildNotes(kase, findings, supporting, recommendation);
  const citedRules = [...new Set([...findings, ...supporting].map((item) => item.ruleId))].join(", ");

  return {
    caseId,
    recommendation,
    risk: riskOf(findings),
    findings,
    supporting,
    staffNote: notes.staffNote,
    customerNote: notes.customerNote,
    gemini: false,
    steps: [
      { name: "Ingest", detail: `${kase.documents.length} documents accepted for ${kase.reference}.` },
      { name: "Extract", detail: `Locked ${kase.checks.length} fields from the packet.` },
      {
        name: "Cross-check",
        detail: `${findings.length} exception${findings.length === 1 ? "" : "s"}, ${supporting.length} check${supporting.length === 1 ? "" : "s"} cleared.`,
      },
      { name: "Match rules", detail: citedRules ? `Cited ${citedRules}.` : "No rule cited." },
      { name: "Decide", detail: `${recommendation}. Risk ${riskOf(findings)}.` },
      { name: "Draft", detail: "Staff note and customer note are ready for a person to send." },
    ],
  };
}

function buildNotes(
  kase: FinCase,
  findings: Finding[],
  supporting: Support[],
  recommendation: Recommendation,
): { staffNote: string; customerNote: string } {
  if (recommendation === "Approve") {
    const cites = supporting.map((item) => `${item.ruleId}: ${item.ruleText}`).join(" ");
    return {
      staffNote: `Recommendation: Approve. ${kase.workflow} for ${kase.party} (${kase.reference}). ${cites} ${kase.handlerHint}`,
      customerNote: kase.customerApprove,
    };
  }

  const lines = findings.map(
    (finding, index) =>
      `${index + 1}. ${finding.title}. “${finding.quote}” (${finding.documentTitle}). ${finding.ruleId}: ${finding.ruleText}`,
  );
  return {
    staffNote: [`Recommendation: ${recommendation}. ${kase.workflow} for ${kase.party} (${kase.reference}).`, ...lines, kase.handlerHint].join(
      "\n",
    ),
    customerNote: `${kase.party.split(" ")[0]}, this is not closed. ${findings.map((finding) => finding.plain).join(" ")} ${kase.customerNext}`,
  };
}

export function corpusErrors(): string[] {
  const errors: string[] = [];
  for (const kase of cases) {
    try {
      const result = runCase(kase.id);
      if (result.recommendation !== kase.recommendation) {
        errors.push(`${kase.id} decided ${result.recommendation}, expected ${kase.recommendation}`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return errors;
}

export const STEP_NAMES = ["Ingest", "Extract", "Cross-check", "Match rules", "Decide", "Draft"] as const;
