import type { FinCase, RunResult } from "../types";

interface Props {
  kase: FinCase;
  result?: RunResult;
}

export function CustomerLetter({ kase, result }: Props) {
  const first = kase.party.split(" ")[0];
  return (
    <section className="letter">
      <p className="eyebrow">
        Your file · {kase.reference} · {kase.sector}
      </p>
      <h1>{first}, here is where your file stands.</h1>
      <p className="lede">This screen is only this file, one of the sixteen. The handler’s working note stays on the desk.</p>

      <article className="letter-card">
        <header>
          <span>{result ? "Sent to you" : "Not sent yet"}</span>
          <strong>{result ? result.recommendation : "With the desk"}</strong>
        </header>
        {result ? (
          <>
            <p>{result.customerNote}</p>
            <ul>
              {(result.findings.length ? result.findings : result.supporting).map((item) => (
                <li key={item.ruleId + item.title}>
                  <b>{item.ruleId}</b>
                  <span>{"plain" in item ? item.plain : item.title}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>The desk is still reading {kase.workflow.toLowerCase()} for {kase.reference}. The reason appears here only after a person sends it.</p>
        )}
      </article>
    </section>
  );
}
