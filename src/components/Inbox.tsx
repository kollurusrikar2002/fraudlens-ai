import { cases } from "../corpus";
import type { FinCase, RunResult, Sector } from "../types";
import { Reference } from "./Reference";

interface Props {
  rows: FinCase[];
  runs: Record<string, RunResult>;
  sector: Sector | "All";
  search: string;
  sectors: Array<Sector | "All">;
  onSector: (sector: Sector | "All") => void;
  onSearch: (value: string) => void;
  onOpen: (id: string) => void;
}

export function Inbox({ rows, runs, sector, search, sectors, onSector, onSearch, onOpen }: Props) {
  return (
    <section className="queue">
      <div className="queue-head">
        <div>
          <p className="eyebrow">Today’s file</p>
          <h1>Open a packet. Leave with a cited decision.</h1>
        </div>
        <label className="search">
          <span>Find</span>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Name, reference, workflow"
            aria-label="Search cases"
          />
        </label>
      </div>

      <div className="filters" role="tablist" aria-label="Sectors">
        {sectors.map((item) => {
          const count = item === "All" ? cases.length : cases.filter((row) => row.sector === item).length;
          return (
            <button key={item} role="tab" aria-selected={item === sector} className={item === sector ? "on" : ""} onClick={() => onSector(item)}>
              {item}
              <b>{count}</b>
            </button>
          );
        })}
      </div>

      <div className="queue-list">
        <div className="queue-legend" aria-hidden="true">
          <span>Reference</span>
          <span>Party</span>
          <span>Workflow</span>
          <span>Book</span>
          <span>Status</span>
        </div>
        {rows.length === 0 ? <p className="empty">Nothing in this book matches that search.</p> : null}
        {rows.map((row) => {
          const status = runs[row.id]?.recommendation ?? "New";
          return (
            <button key={row.id} className="queue-row" onClick={() => onOpen(row.id)} data-sector={row.sector}>
              <Reference sector={row.sector} code={row.reference} />
              <span className="who">
                <strong>{row.party}</strong>
                <small>{row.summary}</small>
              </span>
              <span className="flow">{row.workflow}</span>
              <span className="book">{row.sector}</span>
              <span className={`status status-${status.toLowerCase()}`}>{status}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
