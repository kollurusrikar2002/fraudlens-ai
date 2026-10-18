import { useEffect, useMemo, useState } from "react";
import { anomaliesFor } from "../ledger";
import { answerFromFile } from "../pipeline/assist";
import { classify, riskScore, searchPolicy } from "../pipeline/assess";
import { customerMessage } from "../pipeline/experience";
import { extractFields } from "../pipeline/extract";
import { runPacket, STEP_NAMES } from "../pipeline/run";
import type { FinCase, RunResult } from "../types";
import { Reference } from "./Reference";

interface Props {
  kase: FinCase;
  book: FinCase[];
  result?: RunResult;
  onBack: () => void;
  backLabel: string;
  onResult: (result: RunResult) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function CaseDesk({ kase, book, result, onBack, backLabel, onResult }: Props) {
  const [docId, setDocId] = useState(kase.documents[0]?.id ?? "");
  const [quote, setQuote] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [hideResult, setHideResult] = useState(false);
  const [shownSteps, setShownSteps] = useState(result ? STEP_NAMES.length : 0);
  const [error, setError] = useState("");
  const [policyQuery, setPolicyQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<{ q: string; a: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const visible = hideResult ? undefined : result;
  const preview = useMemo(() => {
    try {
      return runPacket(kase);
    } catch {
      return undefined;
    }
  }, [kase]);
  const chain = visible ?? (shownSteps > 0 ? preview : undefined);

  useEffect(() => {
    setDocId(kase.documents[0]?.id ?? "");
    setQuote(null);
    setShownSteps(result ? STEP_NAMES.length : 0);
    setError("");
    setPolicyQuery("");
    setQuestion("");
    setThread([]);
    setRunning(false);
    setHideResult(false);
    // Reset only when a different file is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kase.id]);

  const document = kase.documents.find((item) => item.id === docId) ?? kase.documents[0];
  const peers = kase.peers.reduce((sum, peer) => sum + peer.count, 0);
  const progress = (shownSteps / STEP_NAMES.length) * 100;
  const anomalies = anomaliesFor(kase.party);
  const fields = extractFields(document?.body ?? "");
  const score = riskScore(shownSteps >= 5 ? chain?.findings ?? [] : [], shownSteps >= 3 ? anomalies : []);
  const klass = classify(kase, anomalies);
  const told = customerMessage(kase);
  const policyHits = searchPolicy(policyQuery, book);

  async function ask() {
    const asked = question.trim();
    const local = answerFromFile(asked, kase, visible, anomalies);
    if (!local) return;
    setQuestion("");
    setThread((current) => [...current, { q: asked, a: local }]);
    setAsking(true);
    const evidence = [
      ...kase.documents.map((item) => `${item.title}\n${item.body}`),
      ...kase.rules.map((rule) => `${rule.id}: ${rule.text}`),
      ...anomalies.map((anomaly) => anomaly.reason),
      `What this person is told: ${told}`,
      kase.handlerHint,
      ...thread.map((turn) => `Handler: ${turn.q}\nDesk: ${turn.a}`),
    ].join("\n");
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asked, evidence }),
      });
      const payload = (await response.json()) as { answer?: string | null };
      if (payload.answer) {
        setThread((current) => current.map((turn, index) => (index === current.length - 1 ? { ...turn, a: payload.answer || turn.a } : turn)));
      }
    } catch {
      setThread((current) => current.map((turn, index) => (index === current.length - 1 ? { ...turn, a: local } : turn)));
    } finally {
      setAsking(false);
    }
  }

  async function review() {
    setRunning(true);
    setHideResult(true);
    setError("");
    setShownSteps(0);
    const pending = fetch(`/api/run/${kase.id}`, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) throw new Error("The desk could not finish this case.");
        return (await response.json()) as RunResult;
      })
      .catch(() => runPacket(kase));

    for (let step = 1; step <= STEP_NAMES.length; step += 1) {
      await sleep(340);
      setShownSteps(step);
    }
    try {
      const next = await pending;
      setHideResult(false);
      onResult(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  function focusFinding(documentId: string, nextQuote: string) {
    setDocId(documentId);
    setQuote(nextQuote);
  }

  return (
    <section className="file">
      <header className="file-bar">
        <button className="back" onClick={onBack}>
          {backLabel}
        </button>
        <div className="file-id">
          <Reference sector={kase.sector} code={kase.reference} />
          <h1>{kase.party}</h1>
          <p>
            {kase.sector} · {kase.workflow}
          </p>
        </div>
        <div className={`verdict ${shownSteps >= 5 && chain ? chain.recommendation.toLowerCase() : "waiting"}`}>
          <span>Decision</span>
          <strong>{shownSteps >= 5 && chain ? chain.recommendation : "Not reviewed"}</strong>
          {shownSteps >= 5 && chain ? <em>Risk {score.band} · {score.score} · {klass.label}</em> : <em>The decision lands on step 5.</em>}
        </div>
      </header>

      <div className="file-grid">
        <div className="dossier-wrap">
          <div className="doc-index">
            {kase.documents.map((item, index) => (
              <button key={item.id} className={item.id === document?.id ? "doc-on" : ""} onClick={() => { setDocId(item.id); setQuote(null); }}>
                <span className="mono">0{index + 1}</span>
                <span>
                  <small>{item.kind}</small>
                  {item.title}
                </span>
              </button>
            ))}
          </div>
          <article className="dossier">
            <header>
              <span className="mono">{document?.kind}</span>
              <h2>{document?.title}</h2>
            </header>
            <Highlighted body={document?.body ?? ""} quote={quote} />
            {shownSteps >= 2 && fields.length ? (
              <ul className="fields">
                {fields.map((field) => (
                  <li key={field.value}><span>{field.label}</span><b>{field.value}</b></li>
                ))}
              </ul>
            ) : null}
          </article>
        </div>

        <aside className="ruling">
          <div className="review-box">
            <p>{kase.summary}</p>
            <button className="review" onClick={review} disabled={running}>
              {running ? "Checking the file…" : result ? "Review again" : "Review this file"}
            </button>
            <div className="track" aria-hidden="true">
              <div className="track-fill" style={{ width: `${progress}%` }} />
            </div>
            <ol className="track-names">
              {STEP_NAMES.map((name, index) => (
                <li key={name} className={index < shownSteps ? "done" : ""}>
                  <strong>{name}</strong>
                  {index < shownSteps ? <span>{chain?.steps[index]?.detail}</span> : null}
                </li>
              ))}
            </ol>
            {error ? <p className="error">{error}</p> : null}
          </div>

          {shownSteps >= 3 ? <section>
            <h3>Transactions</h3>
            {anomalies.length === 0 ? <p className="quiet">No card, payment, or bill line is out of pattern for this party.</p> : (
              <ul className="anomaly-list">
                {anomalies.map((anomaly) => (
                  <li key={anomaly.id}>
                    <strong>{anomaly.title}</strong>
                    <span>{anomaly.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </section> : null}

          {shownSteps >= 4 ? <section>
            <h3>Policy</h3>
            <input className="line-input" value={policyQuery} placeholder="Search a rule" onChange={(event) => setPolicyQuery(event.target.value)} />
            <ul className="policy-hits">
              {policyHits.map((hit) => (
                <li key={`${hit.reference}-${hit.id}`}>
                  <span className="mono">{hit.id}</span>
                  <span>{hit.text}</span>
                </li>
              ))}
            </ul>
          </section> : null}

          {shownSteps >= 6 ? <section>
            <h3>What {kase.party.split(" ")[0]} is told</h3>
            <p>{told}</p>
            <p className="quiet">Handler only: {kase.handlerHint}</p>
          </section> : null}

          {shownSteps >= 6 ? <section>
            <h3>Ask this file</h3>
            <ul className="thread">
              {thread.map((turn) => (
                <li key={turn.q}>
                  <strong>{turn.q}</strong>
                  <span>{turn.a}</span>
                </li>
              ))}
            </ul>
            <div className="ask-row">
              <input className="line-input" value={question} placeholder={thread.length ? "Ask a follow-up" : "What should happen next?"} onChange={(event) => setQuestion(event.target.value)} />
              <button type="button" className="maker-next" disabled={asking || !question.trim()} onClick={ask}>Ask</button>
            </div>
          </section> : null}

          {shownSteps >= 6 && chain ? (
            <>
              <section>
                <h3>Evidence</h3>
                {chain.findings.length === 0 ? <p className="quiet">No exception. The clauses below carry the answer.</p> : null}
                <ul className="evidence">
                  {chain.findings.map((finding, index) => (
                    <li key={finding.id}>
                      <button className={quote === finding.quote ? "hot" : ""} onClick={() => focusFinding(finding.documentId, finding.quote)}>
                        <span className="mono rule">{finding.ruleId}</span>
                        <span className="ev-copy">
                          <strong>{finding.title}</strong>
                          <q>{finding.quote}</q>
                          <small>
                            {finding.documentTitle} · {finding.severity}
                          </small>
                        </span>
                        <span className="ev-num">{index + 1}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {chain.supporting.length > 0 ? (
                  <ul className="cleared">
                    {chain.supporting.map((item) => (
                      <li key={item.ruleId}>
                        <button onClick={() => focusFinding(item.documentId, item.quote)}>
                          <span className="mono">{item.ruleId}</span>
                          Holds · {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>

              <section className="letters">
                <article>
                  <h3>For the file {chain.gemini ? "· Gemini" : ""}</h3>
                  <p>{chain.staffNote}</p>
                </article>
                <article>
                  <h3>For the customer</h3>
                  <p>{chain.customerNote}</p>
                </article>
              </section>

              <section>
                <h3>Similar cases</h3>
                <div className="bars">
                  {kase.peers.map((peer) => (
                    <div key={peer.label}>
                      <div className="bar-label">
                        <span>{peer.label}</span>
                        <b>{peer.count}</b>
                      </div>
                      <div className="bar">
                        <i style={{ width: `${peers ? (peer.count / peers) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </>
          ) : shownSteps === 0 ? (
            <p className="quiet hold">Read the packet on the left, then review it. Each step opens the next. Nothing is written to the customer until Draft.</p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function Highlighted({ body, quote }: { body: string; quote: string | null }) {
  if (!quote || !body.includes(quote)) {
    return <p className="doc">{body}</p>;
  }
  const index = body.indexOf(quote);
  return (
    <p className="doc">
      {body.slice(0, index)}
      <mark>{quote}</mark>
      {body.slice(index + quote.length)}
    </p>
  );
}
