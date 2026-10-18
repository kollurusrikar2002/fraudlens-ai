import type { Desk } from "./RoleSwitch";
import type { FinCase, RunResult, Sector } from "../types";
import { Reference } from "./Reference";

interface Props {
  desk: Desk;
  rows: FinCase[];
  runs: Record<string, RunResult>;
  onOpen: (id: string) => void;
  onQueue: (sector: Sector | "All") => void;
}

const books: Sector[] = ["Banking", "Financial services", "Insurance", "Cross-cutting"];

export function Dashboard({ desk, rows, runs, onOpen, onQueue }: Props) {
  const shown = desk.sector === "All" ? books : books.filter((book) => book === desk.sector);
  const sent = rows.filter((row) => runs[row.id]);
  const waiting = rows.length - sent.length;
  const counts = {
    Approve: sent.filter((row) => runs[row.id].recommendation === "Approve").length,
    Query: sent.filter((row) => runs[row.id].recommendation === "Query").length,
    Escalate: sent.filter((row) => runs[row.id].recommendation === "Escalate").length,
  };

  return (
    <section className="home">
      <div className="home-intro">
        <p className="eyebrow">{desk.label}</p>
        <h1>{desk.sector === "All" ? `${rows.length} files on this desk.` : `${desk.label} book only.`}</h1>
        <p className="lede">
          {desk.sector === "All"
            ? "Admin sees every book. A banking, finance, insurance, or compliance role sees only its own files."
            : `${desk.scope}. The other books stay off this desk.`}
        </p>
      </div>

      <div className="stat-row">
        <div><span>In this role</span><strong>{rows.length}</strong></div>
        <div><span>Waiting</span><strong>{waiting}</strong></div>
        <div><span>Approve</span><strong>{counts.Approve}</strong></div>
        <div><span>Query</span><strong>{counts.Query}</strong></div>
        <div><span>Escalate</span><strong>{counts.Escalate}</strong></div>
      </div>

      <div className={`books ${shown.length === 1 ? "books-one" : ""}`}>
        {shown.map((book) => {
          const items = rows.filter((item) => item.sector === book);
          return (
            <article key={book} className="panel">
              <header>
                <h2>{book}</h2>
                <button className="count-btn" onClick={() => onQueue(book)}>{items.length} files</button>
              </header>
              <ul className="need-list">
                {items.map((row) => {
                  const status = runs[row.id]?.recommendation ?? "New";
                  return (
                    <li key={row.id}>
                      <button onClick={() => onOpen(row.id)}>
                        <Reference sector={row.sector} code={row.reference} />
                        <span>
                          <strong>{row.party}</strong>
                          <small>{row.workflow}</small>
                        </span>
                        <em className={`status status-${status.toLowerCase()}`}>{status}</em>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
