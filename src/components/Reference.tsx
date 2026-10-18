import type { Sector } from "../types";

const marks: Record<Sector, { code: string; tone: string }> = {
  Banking: { code: "BK", tone: "banking" },
  "Financial services": { code: "FS", tone: "finance" },
  Insurance: { code: "IN", tone: "insurance" },
  "Cross-cutting": { code: "XC", tone: "cross" },
};

export function Reference({ sector, code }: { sector: Sector; code: string }) {
  const mark = marks[sector];
  return (
    <span className={`ref ref-${mark.tone}`}>
      <i>{mark.code}</i>
      {code}
    </span>
  );
}
