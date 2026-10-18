import type { FinCase } from "../types";
import { extractFields } from "./extract";

export function customerMessage(kase: FinCase): string {
  if (kase.recommendation === "Approve" && kase.customerApprove.trim()) return kase.customerApprove.trim();
  if (kase.customerNext.trim()) return kase.customerNext.trim();
  if (kase.customerApprove.trim()) return kase.customerApprove.trim();
  return kase.summary;
}

export function moneyOnFile(kase: FinCase): string[] {
  const values: string[] = [];
  for (const document of kase.documents) {
    for (const field of extractFields(document.body)) {
      if (field.label !== "Amount" && field.label !== "Share") continue;
      if (!values.includes(field.value)) values.push(field.value);
    }
  }
  return values.slice(0, 4);
}
