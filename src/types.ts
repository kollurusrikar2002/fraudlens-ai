export type Sector = "Banking" | "Financial services" | "Insurance" | "Cross-cutting";

export type Recommendation = "Approve" | "Query" | "Escalate";

export type Severity = "low" | "medium" | "high";

export interface Rule {
  id: string;
  text: string;
}

export interface Doc {
  id: string;
  title: string;
  kind: string;
  body: string;
}

export interface Check {
  id: string;
  pass: boolean;
  severity: Severity;
  title: string;
  documentId: string;
  quote: string;
  ruleId: string;
  reason: string;
  plain: string;
}

export interface FinCase {
  id: string;
  sector: Sector;
  workflow: string;
  party: string;
  reference: string;
  summary: string;
  recommendation: Recommendation;
  handlerHint: string;
  customerApprove: string;
  customerNext: string;
  documents: Doc[];
  rules: Rule[];
  checks: Check[];
  peers: { label: string; count: number }[];
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  documentId: string;
  documentTitle: string;
  quote: string;
  ruleId: string;
  ruleText: string;
  reason: string;
  plain: string;
}

export interface Support {
  documentId: string;
  documentTitle: string;
  quote: string;
  ruleId: string;
  ruleText: string;
  title: string;
}

export interface StepLog {
  name: string;
  detail: string;
}

export interface RunResult {
  caseId: string;
  recommendation: Recommendation;
  risk: "Low" | "Medium" | "High";
  findings: Finding[];
  supporting: Support[];
  steps: StepLog[];
  staffNote: string;
  customerNote: string;
  gemini: boolean;
}
