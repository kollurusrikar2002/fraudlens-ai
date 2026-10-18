import type { FinCase } from "../types";

export const financeCases: FinCase[] = [
  {
    id: "invoice-204",
    sector: "Financial services",
    workflow: "Invoice and payment verification",
    party: "Harbour Supplies",
    reference: "INV-204",
    summary: "Invoice bills 500 units. The purchase order and the goods receipt are 350.",
    recommendation: "Query",
    handlerHint: "Hold payment for the excess 150 units. You can pass the 350 units that were received if the price matches.",
    customerApprove: "",
    customerNext: "Send a revised invoice for the quantity we received, or a goods receipt for the extra units. The matched quantity can still be paid.",
    documents: [
      {
        id: "po",
        title: "Purchase order PO-118",
        kind: "Purchase order",
        body: `Buyer: Northline Operations
Supplier: Harbour Supplies
PO-118
Item: A4 copier paper, ream
Quantity ordered: 350
Rate: Rs 120
PO value: Rs 42,000`,
      },
      {
        id: "grn",
        title: "Goods receipt",
        kind: "Receipt",
        body: `Warehouse: Hyderabad DC
Against PO-118
Quantity received: 350
Received on: 9 Oct 2026
Receiver: L. Khan
No shortage and no overage noted.`,
      },
      {
        id: "inv",
        title: "Invoice INV-204",
        kind: "Invoice",
        body: `Harbour Supplies
Invoice INV-204
Reference PO-118
Quantity billed: 500
Rate: Rs 120
Invoice total: Rs 60,000
Invoice date: 11 Oct 2026`,
      },
    ],
    rules: [
      {
        id: "AP-4",
        text: "Invoice quantity cannot exceed the quantity received. Pay the received quantity only after the supplier corrects the bill or the warehouse confirms the extra units.",
      },
    ],
    checks: [
      {
        id: "qty",
        pass: false,
        severity: "medium",
        title: "Billed quantity is higher than the goods receipt",
        documentId: "inv",
        quote: "Quantity billed: 500",
        ruleId: "AP-4",
        reason: "PO-118 and the goods receipt are both 350 units at Rs 120. INV-204 bills 500 units, which is Rs 18,000 above the receipt.",
        plain: "The invoice asks for 500 units. We received 350.",
      },
    ],
    peers: [
      { label: "Queried, paid after a revised bill", count: 4 },
      { label: "Paid as billed", count: 1 },
    ],
  },
  {
    id: "mortgage-leela",
    sector: "Financial services",
    workflow: "Mortgage servicing and foreclosure compliance",
    party: "Leela Nair",
    reference: "MG-7741",
    summary: "A late fee was charged above the cap stated in the servicing circular.",
    recommendation: "Query",
    handlerHint: "Reverse the fee down to 2 percent of the installment and send a corrected statement before any foreclosure quote.",
    customerApprove: "",
    customerNext: "The late fee on your statement is higher than the cap we publish. We will correct the statement before any foreclosure figure is issued.",
    documents: [
      {
        id: "stmt",
        title: "Servicing statement",
        kind: "Statement",
        body: `Loan HL-88421
Borrower: Leela Nair
Installment: Rs 42,000
Days past due: 12
Late fee posted: Rs 3,360
Late fee rate applied: 8 percent of the installment`,
      },
      {
        id: "cap",
        title: "Servicing circular",
        kind: "Policy",
        body: `Foreclosure and fee circular, effective 1 Apr 2026
Late fee cap: 2 percent of the overdue installment
A foreclosure quote must use the corrected ledger.
Fees above the cap are refunded before the quote is shared.`,
      },
    ],
    rules: [
      {
        id: "MG-7",
        text: "Late fees are capped at 2 percent of the overdue installment. A foreclosure quote cannot be issued on a ledger that still shows a fee above the cap.",
      },
    ],
    checks: [
      {
        id: "fee",
        pass: false,
        severity: "medium",
        title: "Late fee is above the 2 percent cap",
        documentId: "stmt",
        quote: "Late fee rate applied: 8 percent of the installment",
        ruleId: "MG-7",
        reason: "Rs 3,360 is 8 percent of Rs 42,000. The circular caps the fee at 2 percent, which is Rs 840.",
        plain: "The late fee on your statement is above the cap in our servicing rules.",
      },
    ],
    peers: [
      { label: "Fee corrected, quote then issued", count: 5 },
      { label: "Quote blocked", count: 2 },
    ],
  },
  {
    id: "statements-kestrel",
    sector: "Financial services",
    workflow: "Financial statement analysis",
    party: "Kestrel Textiles",
    reference: "FS-509",
    summary: "Renewal pack. Debt service cover has fallen below 1.",
    recommendation: "Query",
    handlerHint: "Do not renew the limit on this pack. Ask for a 13-week cash forecast and the new term-loan schedule.",
    customerApprove: "",
    customerNext: "We need an updated cash forecast and the schedule for the new loan before the limit can be renewed.",
    documents: [
      {
        id: "pl",
        title: "Management accounts",
        kind: "Financial statements",
        body: `Kestrel Textiles — year to 31 Mar 2026
Revenue: Rs 18.4 cr, flat on last year
EBITDA: Rs 1.1 cr
New term loan drawn in February: Rs 4.0 cr
Debt service cover: 0.8`,
      },
      {
        id: "facility",
        title: "Facility letter extract",
        kind: "Covenant",
        body: `Working capital limit Rs 3 cr, renewal due 30 Nov 2026
Covenant: debt service cover at or above 1.0
A cover below 1.0 is a query. It is not an automatic recall.`,
      },
    ],
    rules: [
      {
        id: "FS-2",
        text: "If debt service cover is below 1.0, the renewal is queried until a cash forecast and the debt schedule are on file.",
      },
    ],
    checks: [
      {
        id: "dscr",
        pass: false,
        severity: "medium",
        title: "Debt service cover is below the covenant",
        documentId: "pl",
        quote: "Debt service cover: 0.8",
        ruleId: "FS-2",
        reason: "The facility letter requires cover of at least 1.0. The management accounts show 0.8 after the February term loan.",
        plain: "The business is not covering its debt payments at the level the facility letter requires.",
      },
    ],
    peers: [
      { label: "Renewed after a forecast", count: 4 },
      { label: "Limit reduced", count: 2 },
    ],
  },
  {
    id: "portfolio-neha",
    sector: "Financial services",
    workflow: "Personal finance and investment advisor",
    party: "Neha Kapoor",
    reference: "PF-882",
    summary: "One listed stock is 72 percent of the portfolio. The stated policy cap is 25 percent.",
    recommendation: "Query",
    handlerHint: "Explain the concentration. Do not place a trade. Ask Neha if she wants a person to discuss a rebalance.",
    customerApprove: "",
    customerNext: "This is an explanation of the portfolio you already hold, not an instruction to buy or sell. A person can talk it through with you if you want.",
    documents: [
      {
        id: "hold",
        title: "Holdings",
        kind: "Portfolio",
        body: `Neha Kapoor — custody snapshot 15 Oct 2026
Total value: Rs 46,00,000
Largest line: Orion Motors, Rs 33,12,000
Share of portfolio: 72 percent
Cash: 4 percent`,
      },
      {
        id: "ips",
        title: "Investment policy",
        kind: "Policy",
        body: `Single listed name: not more than 25 percent of the portfolio
The note explains risk. It does not place an order.
Any sale needs a separate instruction from the client.`,
      },
    ],
    rules: [
      {
        id: "PF-1",
        text: "When one listed name is above 25 percent, explain the concentration in plain language and offer a conversation. Do not recommend a specific trade inside this note.",
      },
    ],
    checks: [
      {
        id: "conc",
        pass: false,
        severity: "medium",
        title: "One stock is above the 25 percent policy cap",
        documentId: "hold",
        quote: "Share of portfolio: 72 percent",
        ruleId: "PF-1",
        reason: "Orion Motors is 72 percent of Rs 46,00,000. The investment policy caps a single listed name at 25 percent. The note must not tell her what to sell.",
        plain: "One company is most of your portfolio, which is above the limit written in your investment policy.",
      },
    ],
    peers: [
      { label: "Client booked a review", count: 6 },
      { label: "Client kept the holding", count: 3 },
    ],
  },
  {
    id: "recon-northline",
    sector: "Financial services",
    workflow: "Reconciliation automation",
    party: "Northline Operations",
    reference: "RC-441",
    summary: "Ledger and bank agree on the supplier payment, then a bank charge is unbooked.",
    recommendation: "Query",
    handlerHint: "Book the Rs 18,000 bank charge to the bank-charges account and clear the break. Do not reopen the supplier payment.",
    customerApprove: "",
    customerNext: "The supplier was paid in full. A bank charge on the same day is missing from the ledger, so the statement still shows a break.",
    documents: [
      {
        id: "ledger",
        title: "Payables ledger",
        kind: "Ledger",
        body: `Vendor payment VP-8831
Harbour Supplies
Ledger amount: Rs 2,50,000
Value date: 10 Oct 2026
Status: cleared in payables
No bank-charge line on this date.`,
      },
      {
        id: "stmt",
        title: "Bank statement",
        kind: "Bank",
        body: `10 Oct 2026 NEFT Harbour Supplies Rs 2,50,000
10 Oct 2026 bank charge Rs 18,000
Statement balance is Rs 18,000 lower than the ledger cash book.`,
      },
    ],
    rules: [
      {
        id: "RC-3",
        text: "A break above Rs 1,000 between the cash book and the bank statement is queried. The matching payment is not reversed when the break is a separate bank charge.",
      },
    ],
    checks: [
      {
        id: "break",
        pass: false,
        severity: "medium",
        title: "Bank charge is missing from the ledger",
        documentId: "stmt",
        quote: "10 Oct 2026 bank charge Rs 18,000",
        ruleId: "RC-3",
        reason: "The supplier payment of Rs 2,50,000 matches. The statement then shows a Rs 18,000 charge that the ledger does not contain.",
        plain: "The payment matches. A bank charge of Rs 18,000 was not entered in the ledger.",
      },
    ],
    peers: [
      { label: "Cleared by booking the charge", count: 8 },
      { label: "Still open after 10 days", count: 1 },
    ],
  },
];
