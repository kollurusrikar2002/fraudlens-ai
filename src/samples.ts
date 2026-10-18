import type { Recommendation, Sector } from "./types";

export interface SampleDoc {
  title: string;
  kind: string;
  body: string;
}

export interface Sample {
  id: string;
  sector: Sector;
  code: string;
  title: string;
  party: string;
  workflow: string;
  summary: string;
  documents: SampleDoc[];
  ruleId: string;
  ruleText: string;
  quote: string;
  recommendation: Recommendation;
}

export const samples: Sample[] = [
  {
    id: "short-ship",
    sector: "Financial services",
    code: "INV",
    title: "Invoice against the goods receipt",
    party: "Harbour Supplies",
    workflow: "Invoice and payment verification",
    summary: "The invoice bills 80 reams. The goods receipt records 40.",
    documents: [
      {
        title: "Invoice INV-880",
        kind: "Invoice",
        body: "Harbour Supplies\nInvoice INV-880\nQuantity billed: 80 reams at Rs 350.",
      },
      {
        title: "Goods receipt GR-880",
        kind: "Receipt",
        body: "Warehouse\nGoods receipt GR-880\nQuantity received: 40 reams.",
      },
    ],
    ruleId: "AP-2",
    ruleText: "Pay only the quantity recorded on the goods receipt. A higher billed quantity is queried.",
    quote: "Quantity billed: 80 reams at Rs 350.",
    recommendation: "Query",
  },
  {
    id: "address",
    sector: "Banking",
    code: "KYC",
    title: "Address on two documents",
    party: "Priya Nair",
    workflow: "KYC / onboarding",
    summary: "The application and the utility bill give different addresses.",
    documents: [
      {
        title: "Account application",
        kind: "Application",
        body: "Applicant: Priya Nair\nResidential address: 14 Lake View, Pune.",
      },
      {
        title: "Utility bill",
        kind: "Proof",
        body: "Utility bill\nAccount holder: Priya Nair\nService address: 88 Station Road, Pune.",
      },
    ],
    ruleId: "KYC-3",
    ruleText: "The address on the application must match the utility bill before the file is approved.",
    quote: "Residential address: 14 Lake View, Pune.",
    recommendation: "Query",
  },
  {
    id: "room-rent",
    sector: "Insurance",
    code: "CLM",
    title: "Room rent over the policy cap",
    party: "Rohan Desai",
    workflow: "Claims processing",
    summary: "The hospital bill charges Rs 8,000 a day. The policy caps room rent at Rs 5,000.",
    documents: [
      {
        title: "Hospital bill",
        kind: "Bill",
        body: "City Care Hospital\nPatient: Rohan Desai\nRoom rent charged: Rs 8,000 per day.",
      },
      {
        title: "Policy schedule",
        kind: "Policy",
        body: "Aarogya Shield Plus\nInsured: Rohan Desai\nRoom rent cap: Rs 5,000 per day.",
      },
    ],
    ruleId: "AS-4.2",
    ruleText: "Room rent above the policy cap is queried. The handler does not approve the excess.",
    quote: "Room rent charged: Rs 8,000 per day.",
    recommendation: "Query",
  },
];
