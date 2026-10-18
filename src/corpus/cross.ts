import type { FinCase } from "../types";

export const crossCases: FinCase[] = [
  {
    id: "compliance-script",
    sector: "Cross-cutting",
    workflow: "Regulatory compliance monitor",
    party: "Retail lending script",
    reference: "RG-090",
    summary: "A customer script quotes a monthly fee. The disclosure rule requires an annualized rate.",
    recommendation: "Query",
    handlerHint: "Pull the script from the call guide today. Replace the monthly wording with the annual percentage before the next campaign.",
    customerApprove: "",
    customerNext: "If you were quoted a monthly fee, ask the lender for the annual percentage rate in writing before you accept the loan.",
    documents: [
      {
        id: "script",
        title: "Call script",
        kind: "Customer script",
        body: `Personal loan campaign, October
Say this: The processing fee is 2 percent per month.
Do not mention other charges unless the customer asks.
Version on the floor: 14 Oct 2026`,
      },
      {
        id: "rulebook",
        title: "Disclosure rule",
        kind: "Internal rule",
        body: `Price spoken to a customer must be an annual percentage.
A monthly rate without the annualized figure is a breach of the disclosure standard.
The script is corrected before the next shift. Existing quotes are reconfirmed in writing.`,
      },
    ],
    rules: [
      {
        id: "RG-1",
        text: "A customer-facing price must be stated as an annual percentage. A monthly fee line in a live script is queried and removed.",
      },
    ],
    checks: [
      {
        id: "apr",
        pass: false,
        severity: "high",
        title: "Live script quotes a monthly fee",
        documentId: "script",
        quote: "The processing fee is 2 percent per month.",
        ruleId: "RG-1",
        reason: "The disclosure rule requires an annual percentage. The script on the floor gives a monthly rate and tells the caller not to volunteer other charges.",
        plain: "The words agents are using quote a monthly fee. The rule requires an annual percentage.",
      },
    ],
    peers: [
      { label: "Script corrected the same day", count: 3 },
      { label: "Campaign paused", count: 1 },
    ],
  },
  {
    id: "audit-sample",
    sector: "Cross-cutting",
    workflow: "Audit assistant",
    party: "Payments sample Q3",
    reference: "AU-312",
    summary: "Four payments above the threshold have only one approver.",
    recommendation: "Escalate",
    handlerHint: "Issue the finding to the control owner. Sample the next 25 payments above Rs 1,00,000 before you close the test.",
    customerApprove: "",
    customerNext: "This is an internal control finding. It is not a customer decision.",
    documents: [
      {
        id: "sample",
        title: "Sample of 25 payments",
        kind: "Audit sample",
        body: `Period: July to September 2026
Population: payments above Rs 1,00,000
Sample size: 25
Payments with a single approver: 4
Those four total Rs 18,40,000`,
      },
      {
        id: "control",
        title: "Control description",
        kind: "Control",
        body: `Control AU-6
Every payment above Rs 1,00,000 needs two approvers.
A miss is a control exception.
The test is escalated when any exception is found in the sample.`,
      },
    ],
    rules: [
      {
        id: "AU-6",
        text: "Payments above Rs 1,00,000 need two approvers. One or more misses in a sample are escalated to the control owner.",
      },
    ],
    checks: [
      {
        id: "approver",
        pass: false,
        severity: "high",
        title: "Four payments have a single approver",
        documentId: "sample",
        quote: "Payments with a single approver: 4",
        ruleId: "AU-6",
        reason: "The control requires two approvers above Rs 1,00,000. Four payments in a sample of 25 have one.",
        plain: "Four large payments were approved by only one person.",
      },
    ],
    peers: [
      { label: "Exception, control redesigned", count: 2 },
      { label: "Sample clean", count: 6 },
    ],
  },
  {
    id: "contract-vendor",
    sector: "Cross-cutting",
    workflow: "Contract / document review",
    party: "Harbour Supplies MSA",
    reference: "CT-128",
    summary: "The master agreement auto-renews and does not cap liability.",
    recommendation: "Query",
    handlerHint: "Do not sign. Ask counsel to add a liability cap and to shorten the non-renewal notice to 30 days or make renewal opt-in.",
    customerApprove: "",
    customerNext: "The contract is not signed. Legal will ask the supplier for a liability cap and a shorter renewal notice.",
    documents: [
      {
        id: "msa",
        title: "Master agreement extract",
        kind: "Contract",
        body: `Harbour Supplies MSA, draft 7
Clause 14.3: this agreement renews for one year unless either party gives notice 90 days before the end date.
Clause 19: each party bears its own losses. No overall cap is stated.
Signed: not signed.`,
      },
      {
        id: "playbook",
        title: "Contract playbook",
        kind: "Playbook",
        body: `Liability: an overall cap is mandatory before signature.
Auto-renewal notice longer than 30 days is queried.
Missing cap is a query to the counterparty, not a silent edit.`,
      },
    ],
    rules: [
      {
        id: "CT-8",
        text: "No contract is signed without an overall liability cap. Auto-renewal notice longer than 30 days is queried with the supplier.",
      },
    ],
    checks: [
      {
        id: "cap",
        pass: false,
        severity: "high",
        title: "The draft has no liability cap",
        documentId: "msa",
        quote: "Clause 19: each party bears its own losses. No overall cap is stated.",
        ruleId: "CT-8",
        reason: "Clause 19 states there is no overall cap. Clause 14.3 also renews unless notice is given 90 days ahead, which is longer than the 30-day playbook.",
        plain: "The draft does not limit liability, and it renews unless someone cancels 90 days ahead.",
      },
    ],
    peers: [
      { label: "Signed after a cap was added", count: 7 },
      { label: "Walked away", count: 1 },
    ],
  },
];
