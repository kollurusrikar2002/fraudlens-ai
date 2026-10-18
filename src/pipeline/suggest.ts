import type { Doc, FinCase, Recommendation, Sector } from "../types";

export interface PacketDraft {
  party: string;
  sector: Sector;
  workflow: string;
  summary: string;
  documents: Doc[];
  ruleId: string;
  ruleText: string;
  quote?: string;
  recommendation?: Recommendation;
}

function sectorOf(brief: string): Sector {
  const text = brief.toLowerCase();
  if (/claim|hospital|policy|underwrit|premium|insured/.test(text)) return "Insurance";
  if (/invoice|purchase order|reconcil|ledger|mortgage|portfolio|statement|fee|billed|receipt|vendor|supplier/.test(text)) return "Financial services";
  if (/audit|contract|compliance|script|regulat|clause/.test(text)) return "Cross-cutting";
  return "Banking";
}

function recommendationOf(brief: string): Recommendation {
  const text = brief.toLowerCase();
  if (/fraud|escalat|duplicate|impossible/.test(text)) return "Escalate";
  if (/approve|covered|matches|no issue/.test(text)) return "Approve";
  return "Query";
}

function citedLine(documents: Doc[], quote?: string): { document: Doc; quote: string } | null {
  if (quote) {
    const named = documents.find((document) => document.body.includes(quote));
    if (named) return { document: named, quote };
  }
  for (const document of documents) {
    const line = document.body
      .split("\n")
      .map((item) => item.trim())
      .find((item) => item.length > 8);
    if (line && document.body.includes(line)) return { document, quote: line };
  }
  return null;
}

export function suggestFromPacket(packet: PacketDraft): FinCase | null {
  const documents = packet.documents.filter((document) => document.body.trim() && document.title.trim());
  const cited = citedLine(documents, packet.quote);
  if (!cited) return null;

  const party = packet.party.trim() || "New party";
  const recommendation = packet.recommendation ?? recommendationOf(`${packet.summary}\n${packet.ruleText}\n${cited.quote}`);
  const pass = recommendation === "Approve";
  const ruleId = packet.ruleId.trim() || "NEW-1";
  const ruleText = packet.ruleText.trim() || "A person confirms this file before it is sent.";

  return {
    id: `new-${Date.now()}`,
    sector: packet.sector,
    workflow: packet.workflow.trim() || "New file",
    party,
    reference: `NEW-${String(Date.now()).slice(-4)}`,
    summary: packet.summary.trim() || cited.quote,
    recommendation,
    handlerHint: pass
      ? "The agent found no exception in the documents. Confirm the packet before you send an approval."
      : "The agent cited a line from the documents you added. Confirm it before you send the file.",
    customerApprove: `${party.split(" ")[0]}, the desk checked the documents and found nothing that needs a correction.`,
    customerNext: "A person still has to send this. You do not need to file it again.",
    documents,
    rules: [{ id: ruleId, text: ruleText }],
    checks: [
      {
        id: "draft",
        pass,
        severity: recommendation === "Escalate" ? "high" : "medium",
        title: pass ? "The documents match the rule" : "A line in the documents needs a person",
        documentId: cited.document.id,
        quote: cited.quote,
        ruleId,
        reason: `Cited from ${cited.document.title}. The line is in the document you added.`,
        plain: pass
          ? "The documents match the rule on this file."
          : "The desk needs a person to confirm this file before it is closed.",
      },
    ],
    peers: [
      { label: "Queried, then cleared", count: 3 },
      { label: "Sent back for a missing document", count: 1 },
    ],
  };
}

export function suggestCase(brief: string): FinCase {
  const note = brief.trim() || "The new packet needs a person to check it against the rule.";
  const partyMatch = note.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/);
  const built = suggestFromPacket({
    party: partyMatch?.[1] ?? "New party",
    sector: sectorOf(note),
    workflow: "New file",
    summary: note,
    documents: [{ id: "packet", title: "Submitted note", kind: "Packet", body: note }],
    ruleId: "NEW-1",
    ruleText: "A new file is queried unless the packet matches the rule a person has confirmed.",
    quote: note.length > 180 ? note.slice(0, 180) : note,
    recommendation: recommendationOf(note),
  });
  if (!built) throw new Error("The desk could not draft a file.");
  return built;
}
