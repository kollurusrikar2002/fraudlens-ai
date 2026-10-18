import { useEffect, useState } from "react";
import { anomaliesFor, transactions, type Anomaly, type Txn } from "../ledger";
import { classify } from "../pipeline/assess";
import type { FinCase } from "../types";

interface ReviewEvent {
  at: string;
  reference: string;
  party: string;
  recommendation: string;
}

function money(txn: Txn): string {
  const amount = txn.amount.toLocaleString("en-IN");
  return txn.currency === "GBP" ? `GBP ${amount}` : `Rs ${amount}`;
}

export function Ledger({ rows, onOpen }: { rows: FinCase[]; onOpen: (id: string) => void }) {
  const parties = new Set(rows.map((row) => row.party));
  const txns = transactions.filter((txn) => parties.has(txn.party));
  const anomalies = [...parties].flatMap((party) => anomaliesFor(party).map((item) => ({ ...item, party })));
  const classes = rows.map((row) => classify(row, anomaliesFor(row.party)).label);
  const counts = {
    "Fraud signal": classes.filter((label) => label === "Fraud signal").length,
    "Control break": classes.filter((label) => label === "Control break").length,
    "Policy breach": classes.filter((label) => label === "Policy breach").length,
    "Service request": classes.filter((label) => label === "Service request").length,
  };
  const [events, setEvents] = useState<ReviewEvent[]>([]);

  useEffect(() => {
    fetch("/api/events")
      .then((response) => response.json())
      .then((payload: ReviewEvent[]) => setEvents(Array.isArray(payload) ? payload : []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <section className="home">
      <div className="home-intro">
        <p className="eyebrow">Transactions</p>
        <h1>{anomalies.length} lines are out of pattern.</h1>
        <p className="lede">Each file is classed from its transactions and its rule. Fraud signal, control break, policy breach, or a service request. A person still sends the decision.</p>
      </div>

      <div className="stat-row">
        <div><span>Fraud signal</span><strong>{counts["Fraud signal"]}</strong></div>
        <div><span>Control break</span><strong>{counts["Control break"]}</strong></div>
        <div><span>Policy breach</span><strong>{counts["Policy breach"]}</strong></div>
        <div><span>Service request</span><strong>{counts["Service request"]}</strong></div>
      </div>

      <div className="books">
        <article className="panel">
          <header><h2>Out of pattern</h2></header>
          <ul className="anomaly-list">
            {anomalies.map((anomaly) => (
              <AnomalyRow key={anomaly.id} anomaly={anomaly} rows={rows} onOpen={onOpen} />
            ))}
          </ul>
        </article>
        <article className="panel">
          <header><h2>Ledger</h2></header>
          <table className="txn">
            <thead>
              <tr><th>When</th><th>Party</th><th>Where</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {txns.map((txn) => (
                <tr key={txn.id} className={anomalies.some((item) => item.txnIds.includes(txn.id)) ? "txn-hot" : ""}>
                  <td className="mono">{txn.at.slice(0, 16).replace("T", " ")}</td>
                  <td><button type="button" className="text-btn" onClick={() => {
                    const file = rows.find((row) => row.party === txn.party);
                    if (file) onOpen(file.id);
                  }}>{txn.party}</button></td>
                  <td>{txn.place}<small>{txn.channel}</small></td>
                  <td className="mono">{money(txn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length ? (
            <>
              <h3>Reviews posted</h3>
              <ul className="anomaly-list">
                {events.filter((event) => parties.has(event.party)).map((event) => (
                  <li key={`${event.at}-${event.reference}`}>
                    <strong>{event.reference} · {event.recommendation}</strong>
                    <span>{event.party}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function AnomalyRow({ anomaly, rows, onOpen }: { anomaly: Anomaly & { party: string }; rows: FinCase[]; onOpen: (id: string) => void }) {
  const file = rows.find((row) => row.party === anomaly.party);
  return (
    <li>
      <button type="button" onClick={() => file && onOpen(file.id)}>
        <strong>{anomaly.party}</strong>
        <span>{anomaly.title}. {anomaly.reason}</span>
      </button>
    </li>
  );
}
