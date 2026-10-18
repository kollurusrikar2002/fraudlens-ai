# FinProof

One desk for banking, financial services, and insurance. A handler opens a case. FinProof reads the packet, cites the rule, and returns Approve, Query, or Escalate. A person sends the decision.

Sixteen workflows share that pipeline. Three of them are the live demo: Priya Sharma's KYC mismatch, invoice INV-204 against PO-118, and Rohan Mehta's health claim.

## Run

```bash
npm install
npm run check
npm run dev
```

Open http://localhost:5173

Copy `.env.example` to `.env` and set `GEMINI_API_KEY` if you want Gemini to draft the handler and customer notes from the cited findings. Without a key, the notes are still written from those findings.

## What maps to Google Cloud

| In this prototype | On Google Cloud |
|---|---|
| Express server | Cloud Run |
| Seeded packets | Document AI output |
| Rule packs | Vertex AI Search |
| Similar-case counts | BigQuery |
| `POST /api/run/:id` | Pub/Sub starts the job, Cloud SQL stores the audit |
| Gemini note draft | Gemini on Vertex AI |

The findings themselves come from the rule pack, so a citation cannot be invented.
