import { bankingCases } from "./banking";
import { crossCases } from "./cross";
import { financeCases } from "./finance";
import { insuranceCases } from "./insurance";
import type { FinCase, Sector } from "../types";

export const cases: FinCase[] = [
  ...bankingCases,
  ...financeCases,
  ...insuranceCases,
  ...crossCases,
];

export const sectors: Array<Sector | "All"> = [
  "All",
  "Banking",
  "Financial services",
  "Insurance",
  "Cross-cutting",
];

export function getCase(id: string): FinCase {
  const found = cases.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Unknown case ${id}`);
  }
  return found;
}
