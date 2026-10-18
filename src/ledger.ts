export interface Txn {
  id: string;
  party: string;
  at: string;
  channel: string;
  place: string;
  country: string;
  amount: number;
  currency: "INR" | "GBP";
  detail: string;
  approvers?: number;
  matched?: boolean;
  code?: string;
  limit?: number;
}

export interface Anomaly {
  id: string;
  severity: "high" | "medium";
  title: string;
  reason: string;
  txnIds: string[];
}

export const transactions: Txn[] = [
  { id: "mi-1", party: "Meera Iyer", at: "2026-10-01T11:04:00+05:30", channel: "Card present", place: "Pune", country: "India", amount: 640, currency: "INR", detail: "Grocery" },
  { id: "mi-2", party: "Meera Iyer", at: "2026-10-08T19:12:00+05:30", channel: "Card present", place: "Pune", country: "India", amount: 1180, currency: "INR", detail: "Fuel" },
  { id: "mi-3", party: "Meera Iyer", at: "2026-10-18T14:02:00+05:30", channel: "Card present", place: "Bandra West, Mumbai", country: "India", amount: 2450, currency: "INR", detail: "Card ending 4412" },
  { id: "mi-4", party: "Meera Iyer", at: "2026-10-18T14:06:00+05:30", channel: "Card not present", place: "London", country: "United Kingdom", amount: 860, currency: "GBP", detail: "Online merchant" },
  { id: "nl-1", party: "Northline Operations", at: "2026-10-10T09:15:00+05:30", channel: "NEFT", place: "Bank statement", country: "India", amount: 250000, currency: "INR", detail: "Harbour Supplies VP-8831", matched: true },
  { id: "nl-2", party: "Northline Operations", at: "2026-10-10T09:16:00+05:30", channel: "Bank charge", place: "Bank statement", country: "India", amount: 18000, currency: "INR", detail: "Charge with no ledger line", matched: false },
  { id: "au-1", party: "Payments sample Q3", at: "2026-07-14T10:00:00+05:30", channel: "Payment", place: "Sample", country: "India", amount: 420000, currency: "INR", detail: "Vendor draw", approvers: 1 },
  { id: "au-2", party: "Payments sample Q3", at: "2026-08-02T10:00:00+05:30", channel: "Payment", place: "Sample", country: "India", amount: 510000, currency: "INR", detail: "Vendor draw", approvers: 1 },
  { id: "au-3", party: "Payments sample Q3", at: "2026-08-19T10:00:00+05:30", channel: "Payment", place: "Sample", country: "India", amount: 380000, currency: "INR", detail: "Vendor draw", approvers: 1 },
  { id: "au-4", party: "Payments sample Q3", at: "2026-09-11T10:00:00+05:30", channel: "Payment", place: "Sample", country: "India", amount: 530000, currency: "INR", detail: "Vendor draw", approvers: 1 },
  { id: "au-5", party: "Payments sample Q3", at: "2026-09-20T10:00:00+05:30", channel: "Payment", place: "Sample", country: "India", amount: 260000, currency: "INR", detail: "Vendor draw", approvers: 2 },
  { id: "vs-1", party: "Vikram Sethi", at: "2026-10-01T08:00:00+05:30", channel: "Claim bill", place: "City Care", country: "India", amount: 185000, currency: "INR", detail: "Laparoscopic cholecystectomy", code: "cholecystectomy" },
  { id: "vs-2", party: "Vikram Sethi", at: "2026-10-13T08:00:00+05:30", channel: "Claim bill", place: "City Care", country: "India", amount: 192000, currency: "INR", detail: "Laparoscopic cholecystectomy", code: "cholecystectomy" },
  { id: "ps-1", party: "Priya Sharma", at: "2026-09-28T10:00:00+05:30", channel: "Utility bill", place: "Pune", country: "India", amount: 2140, currency: "INR", detail: "Electricity bill on the KYC packet" },
  { id: "ar-1", party: "Arjun Rao", at: "2026-09-30T00:00:00+05:30", channel: "Payslip", place: "Northwind Labs", country: "India", amount: 180000, currency: "INR", detail: "Gross monthly income", code: "income" },
  { id: "ar-2", party: "Arjun Rao", at: "2026-09-30T00:01:00+05:30", channel: "Bank credits", place: "Salary account", country: "India", amount: 95000, currency: "INR", detail: "Average monthly credit", code: "income" },
  { id: "hs-1", party: "Harbour Supplies", at: "2026-10-04T11:00:00+05:30", channel: "Purchase order", place: "PO-118", country: "India", amount: 42000, currency: "INR", detail: "350 units at Rs 120", code: "order" },
  { id: "hs-2", party: "Harbour Supplies", at: "2026-10-06T11:00:00+05:30", channel: "Invoice", place: "INV-204", country: "India", amount: 60000, currency: "INR", detail: "500 units at Rs 120", code: "order" },
  { id: "ln-1", party: "Leela Nair", at: "2026-10-12T09:00:00+05:30", channel: "Installment", place: "HL-88421", country: "India", amount: 42000, currency: "INR", detail: "Monthly installment" },
  { id: "ln-2", party: "Leela Nair", at: "2026-10-12T09:01:00+05:30", channel: "Late fee", place: "HL-88421", country: "India", amount: 3360, currency: "INR", detail: "Fee at 8 percent of the installment", limit: 840 },
  { id: "rm-1", party: "Rohan Mehta", at: "2026-10-02T08:00:00+05:30", channel: "Room rent", place: "City Care", country: "India", amount: 8000, currency: "INR", detail: "Charged per day for 3 days", limit: 5000 },
];

const INR_PER_GBP = 110;

function inr(txn: Txn): number {
  return txn.currency === "GBP" ? txn.amount * INR_PER_GBP : txn.amount;
}

function minutesBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 60000;
}

export function anomaliesFor(party: string): Anomaly[] {
  const rows = transactions.filter((txn) => txn.party === party).slice().sort((a, b) => a.at.localeCompare(b.at));
  const found: Anomaly[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    if (previous.country !== current.country && minutesBetween(previous.at, current.at) <= 30) {
      found.push({
        id: `travel-${current.id}`,
        severity: "high",
        title: "Two countries inside 30 minutes",
        reason: `${previous.place} (${previous.country}) and ${current.place} (${current.country}) are ${Math.round(minutesBetween(previous.at, current.at))} minutes apart.`,
        txnIds: [previous.id, current.id],
      });
    }
    if (previous.channel === "Claim bill" && previous.code && previous.code === current.code && minutesBetween(previous.at, current.at) <= 30 * 24 * 60) {
      found.push({
        id: `repeat-${current.id}`,
        severity: "high",
        title: "Same procedure billed again inside 30 days",
        reason: `${previous.detail} at ${previous.place} on ${previous.at.slice(0, 10)}, and again at ${current.place} on ${current.at.slice(0, 10)}.`,
        txnIds: [previous.id, current.id],
      });
    }
  }

  const amounts = rows.map(inr).sort((a, b) => a - b);
  const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : 0;
  for (const txn of rows) {
    const value = inr(txn);
    if (median > 0 && rows.length >= 3 && value > median * 4) {
      found.push({
        id: `spike-${txn.id}`,
        severity: "medium",
        title: "Amount is more than four times the middle payment",
        reason: `${txn.currency} ${txn.amount.toLocaleString("en-IN")} at ${txn.place} is above four times the middle amount on this party.`,
        txnIds: [txn.id],
      });
    }
    if (txn.approvers === 1 && txn.amount >= 100000) {
      found.push({
        id: `approver-${txn.id}`,
        severity: "high",
        title: "One approver above Rs 1,00,000",
        reason: `${txn.detail} of Rs ${txn.amount.toLocaleString("en-IN")} has a single approver.`,
        txnIds: [txn.id],
      });
    }
    if (txn.matched === false) {
      found.push({
        id: `unmatched-${txn.id}`,
        severity: "medium",
        title: "Bank line with no ledger match",
        reason: `${txn.detail}: Rs ${txn.amount.toLocaleString("en-IN")} is on the statement and not in the ledger.`,
        txnIds: [txn.id],
      });
    }
    if (txn.limit != null && inr(txn) > txn.limit) {
      found.push({
        id: `cap-${txn.id}`,
        severity: "medium",
        title: `${txn.channel} is above the cap`,
        reason: `${txn.detail}. Rs ${txn.amount.toLocaleString("en-IN")} is above the cap of Rs ${txn.limit.toLocaleString("en-IN")}.`,
        txnIds: [txn.id],
      });
    }
  }

  const grouped = new Map<string, Txn[]>();
  for (const txn of rows) {
    if (!txn.code) continue;
    grouped.set(txn.code, [...(grouped.get(txn.code) ?? []), txn]);
  }
  for (const [code, group] of grouped) {
    if (group.length < 2) continue;
    const amounts = group.map((txn) => txn.amount);
    const high = Math.max(...amounts);
    const low = Math.min(...amounts);
    if (code === "income" && low > 0 && high / low > 1.15) {
      found.push({
        id: `income-${group[0].id}`,
        severity: "medium",
        title: "Stated income and credits differ by more than 15 percent",
        reason: group.map((txn) => `${txn.detail}: Rs ${txn.amount.toLocaleString("en-IN")}`).join(". ") + ".",
        txnIds: group.map((txn) => txn.id),
      });
    }
    if (code === "order" && high !== low) {
      found.push({
        id: `order-${group[0].id}`,
        severity: "medium",
        title: "Invoice amount does not match the purchase order",
        reason: group.map((txn) => `${txn.place}: Rs ${txn.amount.toLocaleString("en-IN")}`).join(". ") + ".",
        txnIds: group.map((txn) => txn.id),
      });
    }
  }

  return found;
}

export function anomaliesForParties(parties: string[]): Anomaly[] {
  return parties.flatMap((party) => anomaliesFor(party).map((item) => ({ ...item, id: `${party}:${item.id}` })));
}
