import type { FinCase } from "../types";

export const insuranceCases: FinCase[] = [
  {
    id: "claim-rohan",
    sector: "Insurance",
    workflow: "Claims processing agent",
    party: "Rohan Mehta",
    reference: "CLM-1842",
    summary: "Hospital reimbursement. Room rent, an unrelated procedure, and the dates do not hold together.",
    recommendation: "Query",
    handlerHint: "Send a query to the hospital. Do not reject the fracture admission. Pay nothing until the bill is revised or explained.",
    customerApprove: "",
    customerNext: "The admission is still under review. We have asked the hospital to correct the room charge, explain one procedure, and confirm the dates. You do not need to file the claim again.",
    documents: [
      {
        id: "summary",
        title: "Discharge summary",
        kind: "Clinical",
        body: `City Care Hospital
Patient: Rohan Mehta
Admission: 2 Oct 2026
Discharge: 1 Oct 2026
Diagnosis: closed fracture of the left radius
Procedure: closed reduction and cast
Treating doctor: Dr. S. Iyer`,
      },
      {
        id: "bill",
        title: "Itemized bill",
        kind: "Bill",
        body: `City Care Hospital — bill B-5521
Room rent: Rs 8,000 per day for 3 days
Procedure line: dental implant, Rs 46,000
Pharmacy and consumables: Rs 12,400
Bill total: Rs 82,400`,
      },
      {
        id: "schedule",
        title: "Policy schedule",
        kind: "Policy",
        body: `Aarogya Shield Plus
Insured: Rohan Mehta
Inception: 1 Jan 2024
Room rent cap: Rs 5,000 per day
Unrelated procedures are excluded
Waiting period for this contract is already served.`,
      },
    ],
    rules: [
      {
        id: "AS-4.2",
        text: "Room rent above Rs 5,000 per day is payable only up to the cap. The difference is queried with the hospital.",
      },
      {
        id: "AS-6.1",
        text: "A procedure that is not treatment of the admitted condition is excluded unless the hospital explains the clinical link.",
      },
      {
        id: "AS-1.4",
        text: "Discharge cannot be dated before admission. Impossible dates are a document query.",
      },
    ],
    checks: [
      {
        id: "room",
        pass: false,
        severity: "medium",
        title: "Room rent is above the policy cap",
        documentId: "bill",
        quote: "Room rent: Rs 8,000 per day for 3 days",
        ruleId: "AS-4.2",
        reason: "The schedule caps room rent at Rs 5,000 per day. The bill charges Rs 8,000.",
        plain: "The room charge is Rs 8,000 a day. Your policy covers up to Rs 5,000 a day.",
      },
      {
        id: "implant",
        pass: false,
        severity: "high",
        title: "Dental implant is not the fracture treatment",
        documentId: "bill",
        quote: "Procedure line: dental implant, Rs 46,000",
        ruleId: "AS-6.1",
        reason: "The discharge summary records a wrist fracture and a cast. The bill adds a dental implant with no clinical link.",
        plain: "The bill includes a dental implant. The discharge summary describes treatment for a fracture.",
      },
      {
        id: "dates",
        pass: false,
        severity: "high",
        title: "Discharge is dated before admission",
        documentId: "summary",
        quote: "Discharge: 1 Oct 2026",
        ruleId: "AS-1.4",
        reason: "Admission is 2 Oct 2026 and discharge is 1 Oct 2026. The stay dates are impossible as written.",
        plain: "The discharge date is the day before the admission date, so the form needs to be corrected.",
      },
    ],
    peers: [
      { label: "Queried, then approved on a revised bill", count: 4 },
      { label: "Approved as submitted", count: 1 },
    ],
  },
  {
    id: "underwrite-sameer",
    sector: "Insurance",
    workflow: "Underwriting assistant",
    party: "Sameer Qureshi",
    reference: "UW-290",
    summary: "New health proposal declares diabetes. The condition is still inside the waiting-period question.",
    recommendation: "Escalate",
    handlerHint: "Refer to a senior underwriter. Do not issue the schedule and do not decline in this note.",
    customerApprove: "",
    customerNext: "A senior underwriter will review the diabetes declaration before any policy is issued. You may be asked for a recent lab report.",
    documents: [
      {
        id: "proposal",
        title: "Proposal form",
        kind: "Application",
        body: `Applicant: Sameer Qureshi
Age: 46
Declared condition: type 2 diabetes, diagnosed 2018
Medication: ongoing
Cover requested: Aarogya Shield Plus, sum insured Rs 10,00,000`,
      },
      {
        id: "guide",
        title: "Underwriting guide",
        kind: "Guide",
        body: `Chronic condition declared at inception
Diabetes with ongoing medication is referred to a senior underwriter.
The agent does not set a loading and does not decline.
A current HbA1c may be requested.`,
      },
    ],
    rules: [
      {
        id: "UW-4",
        text: "Ongoing diabetes declared on a new proposal is escalated to a senior underwriter. The assistant does not issue terms.",
      },
    ],
    checks: [
      {
        id: "dm",
        pass: false,
        severity: "high",
        title: "Ongoing diabetes must be referred",
        documentId: "proposal",
        quote: "Declared condition: type 2 diabetes, diagnosed 2018",
        ruleId: "UW-4",
        reason: "The proposal declares diabetes with ongoing medication. The guide says a senior underwriter sets any terms.",
        plain: "Because diabetes is declared, a senior underwriter reviews the application before a policy is issued.",
      },
    ],
    peers: [
      { label: "Issued with a loading", count: 5 },
      { label: "Postponed for reports", count: 3 },
    ],
  },
  {
    id: "explain-kavita",
    sector: "Insurance",
    workflow: "Policy explainer",
    party: "Kavita Joshi",
    reference: "POL-17",
    summary: "Customer asks if cataract surgery is covered. The waiting period has passed.",
    recommendation: "Approve",
    handlerHint: "Answer from clause AS-8 only. Do not estimate the rupee payout. Room rent and co-pay still apply at claim time.",
    customerApprove:
      "Kavita, cataract surgery is covered on Aarogya Shield Plus. Your policy started on 1 March 2022, and the two-year wait for cataract has passed. The hospital still has to bill within your room-rent cap, and any co-pay on the schedule still applies. This answer is about cover, not a claim approval.",
    customerNext: "",
    documents: [
      {
        id: "question",
        title: "Customer question",
        kind: "Conversation",
        body: `Kavita Joshi
Policy: Aarogya Shield Plus, inception 1 March 2022
Question: Is cataract surgery covered if I am admitted next month?`,
      },
      {
        id: "clause",
        title: "Clause AS-8",
        kind: "Policy",
        body: `Cataract surgery is covered after a waiting period of two years from inception.
Room rent cap and any co-pay on the schedule still apply.
This clause does not approve a future bill.`,
      },
    ],
    rules: [
      {
        id: "AS-8",
        text: "Cataract surgery is covered after two years from inception. Explain the waiting period and say that room rent and co-pay still apply. Do not approve a claim that has not been filed.",
      },
    ],
    checks: [
      {
        id: "wait",
        pass: true,
        severity: "low",
        title: "Cataract waiting period has been served",
        documentId: "clause",
        quote: "Cataract surgery is covered after a waiting period of two years from inception.",
        ruleId: "AS-8",
        reason: "Inception is 1 March 2022. A surgery next month is after the two-year wait.",
        plain: "The two-year wait for cataract surgery has passed on your policy.",
      },
    ],
    peers: [
      { label: "Answered from the clause", count: 14 },
      { label: "Referred because the wait had not passed", count: 2 },
    ],
  },
  {
    id: "fraud-claim-vikram",
    sector: "Insurance",
    workflow: "Claims fraud detection",
    party: "Vikram Sethi",
    reference: "CF-556",
    summary: "The same procedure is billed twice in twelve days, and a photo is dated before admission.",
    recommendation: "Escalate",
    handlerHint: "Escalate to the special investigations unit. Do not message the customer with an accusation. Hold both bills.",
    customerApprove: "",
    customerNext: "Both bills are on hold while a specialist reviews the documents. We will write to you with what we need. This message is not a finding of fraud.",
    documents: [
      {
        id: "bills",
        title: "Two bills",
        kind: "Bills",
        body: `Bill A: City Care, 1 Oct 2026, laparoscopic cholecystectomy, Rs 1,85,000
Bill B: City Care, 13 Oct 2026, laparoscopic cholecystectomy, Rs 1,92,000
Same surgeon code on both bills.
Same policy, Vikram Sethi.`,
      },
      {
        id: "photo",
        title: "Photo note",
        kind: "Evidence",
        body: `File name: ward-photo.jpg
Metadata date: 20 Sep 2026
Admission on bill A: 1 Oct 2026
The photo is dated before the admission it is meant to support.`,
      },
    ],
    rules: [
      {
        id: "CF-2",
        text: "A repeat of the same procedure inside 30 days, together with evidence dated before admission, is escalated to investigations. The agent does not label the customer.",
      },
    ],
    checks: [
      {
        id: "dup",
        pass: false,
        severity: "high",
        title: "Same procedure billed twice inside 30 days",
        documentId: "bills",
        quote: "Bill B: City Care, 13 Oct 2026, laparoscopic cholecystectomy, Rs 1,92,000",
        ruleId: "CF-2",
        reason: "Bill A is the same procedure on 1 Oct 2026. The photo metadata is 20 Sep 2026, before the first admission.",
        plain: "The same operation is billed twice within two weeks, and a photo is dated before the admission.",
      },
    ],
    peers: [
      { label: "Escalated to investigations", count: 5 },
      { label: "Second bill was a correction", count: 1 },
    ],
  },
];
