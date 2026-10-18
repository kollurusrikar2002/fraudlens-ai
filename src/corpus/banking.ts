import type { FinCase } from "../types";

export const bankingCases: FinCase[] = [
  {
    id: "kyc-priya",
    sector: "Banking",
    workflow: "KYC / onboarding agent",
    party: "Priya Sharma",
    reference: "KYC-1042",
    summary: "Savings account opening. Identity address and proof of address do not match.",
    recommendation: "Query",
    handlerHint: "Ask for a proof of address that matches the identity document, or a signed declaration of the current address with a fresh bill.",
    customerApprove: "",
    customerNext: "Send a utility bill that shows the same address as the identity document. The account is not declined.",
    documents: [
      {
        id: "id",
        title: "Identity extract",
        kind: "Identity",
        body: `Northline Bank — identity capture
Name: Priya Sharma
Document: Aadhaar, masked XXXX-4821
Address on identity: Flat 12B, Oak Towers, Hitech City, Hyderabad 500081
Date of capture: 12 Oct 2026`,
      },
      {
        id: "bill",
        title: "Utility bill",
        kind: "Proof of address",
        body: `City Power — bill for Sep 2026
Consumer: Priya Sharma
Service address: 44 Lake View, Gachibowli, Hyderabad 500032
Bill date: 28 Sep 2026
Amount: Rs 2,140`,
      },
      {
        id: "form",
        title: "Account application",
        kind: "Application",
        body: `Product: Salary savings
Declared address: Flat 12B, Oak Towers, Hitech City, Hyderabad 500081
Occupation: Product designer
Branch: Banjara Hills`,
      },
    ],
    rules: [
      {
        id: "KYC-2.1",
        text: "The address on the identity document and the proof-of-address document must match before the account is opened. A mismatch is a query, not a decline.",
      },
    ],
    checks: [
      {
        id: "addr",
        pass: false,
        severity: "medium",
        title: "Address on identity and utility bill do not match",
        documentId: "bill",
        quote: "Service address: 44 Lake View, Gachibowli, Hyderabad 500032",
        ruleId: "KYC-2.1",
        reason: "Identity shows Hitech City 500081. The utility bill shows Gachibowli 500032. The application repeats the identity address, so the bill is the break.",
        plain: "The address on your electricity bill is not the same as the address on your identity document.",
      },
    ],
    peers: [
      { label: "Queried, opened after a fresh bill", count: 11 },
      { label: "Opened with no query", count: 3 },
    ],
  },
  {
    id: "loan-arjun",
    sector: "Banking",
    workflow: "Loan underwriting assistant",
    party: "Arjun Rao",
    reference: "LN-3381",
    summary: "Personal loan. Payslip income and bank credits are far apart.",
    recommendation: "Query",
    handlerHint: "Do not issue the credit memo as approved. Ask for six months of credits that explain the gap, or restate eligible income off the bank statement.",
    customerApprove: "",
    customerNext: "Share the account where your salary is credited, or explain the difference in writing. This is a request for documents, not a rejection.",
    documents: [
      {
        id: "payslip",
        title: "Payslip — Sep 2026",
        kind: "Income",
        body: `Northwind Labs Pvt Ltd
Employee: Arjun Rao
Gross monthly income: Rs 1,80,000
Net pay: Rs 1,42,000
Pay date: 30 Sep 2026`,
      },
      {
        id: "bank",
        title: "Salary account credits",
        kind: "Bank statement",
        body: `Northline Bank statement summary, Apr–Sep 2026
Account name: Arjun Rao
Average monthly credit: Rs 95,000
Largest single credit: Rs 1,10,000
No salary narration from Northwind Labs in the six-month window.`,
      },
      {
        id: "memo",
        title: "Draft credit memo",
        kind: "Underwriting note",
        body: `Requested amount: Rs 8,00,000
Tenure: 36 months
Income used in the draft: gross payslip Rs 1,80,000
Proposed decision: recommend approval — not yet issued.`,
      },
    ],
    rules: [
      {
        id: "LN-3.4",
        text: "Eligible monthly income must sit within 15 percent of average bank credits, unless the underwriter documents the gap. A wider gap stops the credit memo.",
      },
    ],
    checks: [
      {
        id: "income",
        pass: false,
        severity: "high",
        title: "Payslip income is not supported by bank credits",
        documentId: "bank",
        quote: "Average monthly credit: Rs 95,000",
        ruleId: "LN-3.4",
        reason: "Gross payslip is Rs 1,80,000. Average credits are Rs 95,000, well outside 15 percent, and the employer narration is missing.",
        plain: "The income on your payslip is much higher than the money coming into the account we can see.",
      },
    ],
    peers: [
      { label: "Queried, then approved on bank income", count: 7 },
      { label: "Declined after no response", count: 2 },
    ],
  },
  {
    id: "fraud-meera",
    sector: "Banking",
    workflow: "Fraud and anomaly detection",
    party: "Meera Iyer",
    reference: "FR-2207",
    summary: "Card present in Mumbai and an online payment in London four minutes apart.",
    recommendation: "Escalate",
    handlerHint: "Block the card for new authorizations and call the number on file. Do not text a one-time password to the number that just changed.",
    customerApprove: "",
    customerNext: "We paused the card and a specialist will call you on the number already on the account. Do not share any code that arrives by message.",
    documents: [
      {
        id: "alert",
        title: "Authorization alert",
        kind: "Transaction",
        body: `Card ending 4412
18 Oct 2026 14:02 IST — card present, Bandra West, Mumbai, Rs 2,450
18 Oct 2026 14:06 IST — card not present, online merchant, London, GBP 860
Device country on the online attempt: United Kingdom`,
      },
      {
        id: "profile",
        title: "Customer profile",
        kind: "Profile",
        body: `Meera Iyer
Home branch: Pune
No travel notice on file
Mobile number changed 18 Oct 2026 13:40 IST
Last successful call-back: 2 Aug 2026`,
      },
    ],
    rules: [
      {
        id: "FR-1.2",
        text: "Two authorizations that cannot both be physical travel within the time gap, especially after a same-day mobile change, are escalated to a person. The card is not closed by the agent.",
      },
    ],
    checks: [
      {
        id: "travel",
        pass: false,
        severity: "high",
        title: "Impossible pair of authorizations after a mobile change",
        documentId: "alert",
        quote: "18 Oct 2026 14:06 IST — card not present, online merchant, London, GBP 860",
        ruleId: "FR-1.2",
        reason: "A card-present purchase in Mumbai and a London online attempt are four minutes apart. The mobile number changed the same afternoon and there is no travel notice.",
        plain: "A payment in Mumbai and a payment in London were attempted a few minutes apart, after the mobile number on the account changed.",
      },
    ],
    peers: [
      { label: "Escalated, confirmed fraud", count: 6 },
      { label: "Escalated, customer travelling", count: 2 },
    ],
  },
  {
    id: "support-anil",
    sector: "Banking",
    workflow: "Customer support copilot",
    party: "Anil Deshmukh",
    reference: "CS-1184",
    summary: "Customer asks to defer this month's home-loan EMI. The account is current.",
    recommendation: "Approve",
    handlerHint: "Offer the one-month hardship deferral. Interest continues to accrue. Do not promise a waiver.",
    customerApprove:
      "Anil, you can defer this month's EMI once this year because the loan is current. Interest continues during the month you skip. This is not a fee waiver. Reply to the hardship offer your banker sends and keep paying from next month.",
    customerNext: "",
    documents: [
      {
        id: "ask",
        title: "Customer message",
        kind: "Conversation",
        body: `From: Anil Deshmukh
Loan: HL-22910
Message: I was unpaid in September. Can I defer this month's EMI?
Account status on the message date: current, zero days past due.`,
      },
      {
        id: "policy",
        title: "Hardship note",
        kind: "Bank policy",
        body: `Northline home loan hardship
A current account may defer one EMI in a calendar year.
Interest accrues during the deferred month.
Fees are not waived.
A second request in the same year goes to a credit officer.`,
      },
    ],
    rules: [
      {
        id: "CS-5",
        text: "One EMI deferral is allowed in a calendar year when the loan is current. The agent may confirm it and must say that interest continues.",
      },
    ],
    checks: [
      {
        id: "hardship",
        pass: true,
        severity: "low",
        title: "Account is current and the yearly deferral is unused",
        documentId: "policy",
        quote: "A current account may defer one EMI in a calendar year.",
        ruleId: "CS-5",
        reason: "The loan is current and this is the first hardship request described in the packet.",
        plain: "Your loan is up to date, so one month's EMI can be deferred.",
      },
    ],
    peers: [
      { label: "Deferral confirmed", count: 9 },
      { label: "Sent to credit officer", count: 1 },
    ],
  },
];
