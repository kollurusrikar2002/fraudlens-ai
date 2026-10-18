import { customerMessage, moneyOnFile } from "../pipeline/experience";
import type { FinCase, Sector } from "../types";
import { Reference } from "./Reference";

interface Props {
  rows: FinCase[];
  onOpen: (id: string) => void;
}

const books: Sector[] = ["Banking", "Financial services", "Insurance", "Cross-cutting"];

export function Customers({ rows, onOpen }: Props) {
  const shown = books.filter((book) => rows.some((row) => row.sector === book));

  return (
    <section className="home">
      <div className="home-intro">
        <p className="eyebrow">Customer book</p>
        <h1>What each person is told.</h1>
        <p className="lede">
          Banking, lending, cards, invoices, claims, and policies. The message is taken from that file. It does not add a trade, a payout figure, or a fraud finding.
        </p>
      </div>

      {shown.map((book) => (
        <section key={book} className="customer-book">
          <h2>{book}</h2>
          <ul>
            {rows.filter((row) => row.sector === book).map((row) => {
              const amounts = moneyOnFile(row);
              return (
                <li key={row.id}>
                  <button onClick={() => onOpen(row.id)}>
                    <header>
                      <Reference sector={row.sector} code={row.reference} />
                      <span>
                        <strong>{row.party}</strong>
                        <small>{row.workflow}</small>
                      </span>
                    </header>
                    <p><b>Assistance.</b> {row.summary}</p>
                    {amounts.length ? <p className="mono amounts">{amounts.join(" · ")}</p> : null}
                    <p><b>Recommendation.</b> {customerMessage(row)}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </section>
  );
}
