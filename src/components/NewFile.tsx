import { useState } from "react";
import { suggestFromPacket, type PacketDraft } from "../pipeline/suggest";
import { samples, type SampleDoc } from "../samples";
import type { Doc, FinCase, Sector } from "../types";
import { Reference } from "./Reference";

const steps = ["Sample", "Documents", "Rule", "Agent"];
const kinds = ["Invoice", "Receipt", "Application", "Proof", "Bill", "Policy", "Contract", "Statement", "Upload", "Other"];

interface Packet {
  party: string;
  sector: Sector;
  workflow: string;
  summary: string;
  documents: Doc[];
  ruleId: string;
  ruleText: string;
  quote?: string;
  recommendation?: FinCase["recommendation"];
}

const emptyPacket = (): Packet => ({
  party: "",
  sector: "Banking",
  workflow: "",
  summary: "",
  documents: [{ id: "d1", title: "", kind: "Invoice", body: "" }],
  ruleId: "NEW-1",
  ruleText: "",
});

function fromSample(sample: (typeof samples)[number]): Packet {
  return {
    party: sample.party,
    sector: sample.sector,
    workflow: sample.workflow,
    summary: sample.summary,
    documents: sample.documents.map((document, index) => ({ ...document, id: `d${index + 1}` })),
    ruleId: sample.ruleId,
    ruleText: sample.ruleText,
    quote: sample.quote,
    recommendation: sample.recommendation,
  };
}

export function NewFile({ onCancel, onSave }: { onCancel: () => void; onSave: (item: FinCase) => void }) {
  const [step, setStep] = useState(0);
  const [packet, setPacket] = useState<Packet>(emptyPacket);
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FinCase | null>(null);
  const [agentNote, setAgentNote] = useState("");
  const [uploadNote, setUploadNote] = useState("");

  async function upload(file: File) {
    setUploadNote("Reading the file…");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, mime: file.type || "text/plain", data: btoa(binary) }),
      });
      const payload = (await response.json()) as { title?: string; body?: string; error?: string; source?: string };
      if (!response.ok || !payload.body) {
        setUploadNote(payload.error || "That file could not be read.");
        return;
      }
      setPacket((current) => ({
        ...current,
        documents: [
          ...current.documents.filter((document) => document.title.trim() || document.body.trim()),
          { id: `d${Date.now()}`, title: payload.title || file.name, kind: "Upload", body: payload.body || "" },
        ],
      }));
      setUploadNote(payload.source === "document-ai" ? "Document AI read this file." : "The text from the file is on a new sheet.");
    } catch {
      setUploadNote("That file could not be read.");
    }
  }

  function choose(sample: (typeof samples)[number]) {
    setSampleId(sample.id);
    setPacket(fromSample(sample));
    setDraft(null);
    setStep(1);
  }

  function startBlank() {
    setSampleId("blank");
    setPacket(emptyPacket());
    setDraft(null);
    setStep(1);
  }

  function updateDoc(id: string, patch: Partial<SampleDoc>) {
    setPacket((current) => ({
      ...current,
      documents: current.documents.map((document) => (document.id === id ? { ...document, ...patch } : document)),
    }));
  }

  function addDocument() {
    setPacket((current) => ({
      ...current,
      documents: [...current.documents, { id: `d${Date.now()}`, title: "", kind: "Other", body: "" }],
    }));
  }

  function readDocuments() {
    const built = suggestFromPacket(packet as PacketDraft);
    setDraft(built);
    setAgentNote(
      built
        ? "The agent cited a line that is already in one of the documents. The original 16 stay as they are."
        : "Add a title and at least one line of text on a document, then come back.",
    );
    setStep(3);
  }

  const docsReady = packet.documents.some((document) => document.title.trim() && document.body.trim());
  const ruleReady = Boolean(packet.party.trim() && packet.ruleText.trim());

  return (
    <section className="maker">
      <aside className="maker-rail">
        <button className="back" onClick={onCancel}>Dashboard</button>
        <p className="eyebrow">Admin · new file</p>
        <ol>
          {steps.map((label, index) => (
            <li key={label} className={index === step ? "on" : index < step ? "done" : ""}>
              <button type="button" onClick={() => index < step && setStep(index)} disabled={index > step}>
                <b>{index + 1}</b>
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      {step === 0 ? (
        <div className="maker-stage">
          <h1>Start from a sample.</h1>
          <p className="lede">Pick a packet that already has documents. You can change every line before it is added. This does not replace the 16.</p>
          <div className="sample-grid">
            {samples.map((sample) => (
              <button key={sample.id} className="sample-card" onClick={() => choose(sample)}>
                <Reference sector={sample.sector} code={sample.code} />
                <strong>{sample.title}</strong>
                <small>{sample.party}</small>
                <ul>
                  {sample.documents.map((document) => (
                    <li key={document.title}>{document.kind} · {document.title}</li>
                  ))}
                </ul>
              </button>
            ))}
            <button className={`sample-card sample-blank ${sampleId === "blank" ? "on" : ""}`} onClick={startBlank}>
              <span className="eyebrow">Empty</span>
              <strong>Blank file</strong>
              <small>Add your own documents on the next step.</small>
            </button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="maker-stage">
          <h1>Add the documents.</h1>
          <p className="lede">Each sheet is a document on the file. The agent can only cite a line that appears here.</p>
          <div className="sheets">
            {packet.documents.map((document, index) => (
              <article key={document.id} className="sheet">
                <header>
                  <span className="mono">0{index + 1}</span>
                  <select value={document.kind} onChange={(event) => updateDoc(document.id, { kind: event.target.value })}>
                    {kinds.map((kind) => (
                      <option key={kind}>{kind}</option>
                    ))}
                  </select>
                  {packet.documents.length > 1 ? (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() =>
                        setPacket((current) => ({
                          ...current,
                          documents: current.documents.filter((item) => item.id !== document.id),
                        }))
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                </header>
                <input
                  value={document.title}
                  placeholder="Document title"
                  onChange={(event) => updateDoc(document.id, { title: event.target.value })}
                />
                <textarea
                  value={document.body}
                  placeholder="Paste the lines from this document."
                  onChange={(event) => updateDoc(document.id, { body: event.target.value })}
                />
              </article>
            ))}
          </div>
          <div className="maker-actions">
            <span>
              <button type="button" className="text-btn" onClick={addDocument}>Add a document</button>
              <label className="text-btn upload">
                Upload a file
                <input
                  type="file"
                  accept=".txt,.md,.csv,text/plain,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) upload(file);
                  }}
                />
              </label>
            </span>
            <span>
              <button type="button" className="text-btn" onClick={() => setStep(0)}>Back</button>
              <button type="button" className="maker-next" disabled={!docsReady} onClick={() => setStep(2)}>Rule</button>
            </span>
          </div>
          {uploadNote ? <p className="quiet">{uploadNote}</p> : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="maker-stage">
          <h1>Name the file and the rule.</h1>
          <p className="lede">The rule is what the agent cites. A person still sends the decision.</p>
          <div className="rule-grid">
            <label>
              Party
              <input value={packet.party} onChange={(event) => setPacket({ ...packet, party: event.target.value })} />
            </label>
            <label>
              Book
              <select value={packet.sector} onChange={(event) => setPacket({ ...packet, sector: event.target.value as Sector })}>
                <option>Banking</option>
                <option>Financial services</option>
                <option>Insurance</option>
                <option>Cross-cutting</option>
              </select>
            </label>
            <label className="wide">
              Workflow
              <input value={packet.workflow} onChange={(event) => setPacket({ ...packet, workflow: event.target.value })} />
            </label>
            <label>
              Rule id
              <input value={packet.ruleId} onChange={(event) => setPacket({ ...packet, ruleId: event.target.value })} />
            </label>
            <label className="wide">
              Rule
              <textarea value={packet.ruleText} onChange={(event) => setPacket({ ...packet, ruleText: event.target.value })} />
            </label>
          </div>
          <div className="maker-actions">
            <button type="button" className="text-btn" onClick={() => setStep(1)}>Back</button>
            <button type="button" className="maker-next" disabled={!ruleReady} onClick={readDocuments}>Ask the agent</button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="maker-stage">
          <h1>The agent read the documents.</h1>
          <p className="lede">{agentNote}</p>
          {draft ? (
            <article className="agent-card">
              <header>
                <Reference sector={draft.sector} code={draft.reference} />
                <strong>{draft.recommendation}</strong>
              </header>
              <p>{draft.party} · {draft.workflow}</p>
              <blockquote>{draft.checks[0]?.quote}</blockquote>
              <p className="quiet">
                From {draft.documents.find((document) => document.id === draft.checks[0]?.documentId)?.title}. {draft.rules[0]?.id}: {draft.rules[0]?.text}
              </p>
              <label>
                Recommendation
                <select
                  value={draft.recommendation}
                  onChange={(event) => setDraft({ ...draft, recommendation: event.target.value as FinCase["recommendation"] })}
                >
                  <option>Approve</option>
                  <option>Query</option>
                  <option>Escalate</option>
                </select>
              </label>
              <div className="maker-actions">
                <button type="button" className="text-btn" onClick={() => setStep(1)}>Edit documents</button>
                <button type="button" className="maker-next" onClick={() => onSave(draft)}>Add this file</button>
              </div>
            </article>
          ) : (
            <div className="maker-actions">
              <button type="button" className="text-btn" onClick={() => setStep(1)}>Back to documents</button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
