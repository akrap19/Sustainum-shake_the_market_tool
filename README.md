# Shake the Market — Sustainium Paper Lids

A one-page preview tool for Sustainium sales. It ranks UK operators to approach first for **PFAS-free moulded-fibre paper lids**, names who to contact, and shows how trustworthy each piece of data is.

It is a focused prototype built for an AI Automation Engineer case study — not a production CRM.

**Best viewed on a laptop or desktop.** The prospect table is not designed for small screens.

---

# What you get

Open the page and you see a ranked shortlist of UK multi-site QSR, coffee, bakery, and food-to-go chains (20+ physical locations). Current Sustainium customers are already excluded (Starbucks, Burger King, KFC, Costa Coffee).

Each row shows:

- **Priority** — rank and a 0–100 score
- **Company** — segment, UK site scale, why it fits paper lids
- **Decision-maker** — named person or buying role, with a source
- **Contact** — email plus a validation status
- **Trust** — whether fields are live, reviewed, or still need a human check

Click a row for the full score breakdown, source links, and any *Needs review* reasons.

**Export CSV** downloads the same records in HubSpot’s contacts + companies import format. Review anything flagged *Needs review* before outreach — this tool does not send emails or write to HubSpot.

---

# Run it

You need [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

It works immediately against a prepared, labelled dataset. No API keys required.

| Command | What it does |
|---|---|
| `pnpm dev` | Local preview at http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Lint |

---

# Optional live data

To refresh against live sources, copy `.env.example` to `.env.local` and add any of these keys. All are optional — missing keys fall back to labelled data instead of failing.

```bash
cp .env.example .env.local
```

| Variable | Used for | Cost |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini proposes real UK operators and suggested personal emails | Free via [Google AI Studio](https://aistudio.google.com/apikey) |
| `COMPANIES_HOUSE_API_KEY` | UK company number, status, SIC codes, directors | Free |
| `VRFYMAIL_API_KEY` | Mailbox check (the only way an email becomes *Verified*) | Optional, 5k/month free at [vrfymail](https://vrfymail.com/email-verification-api) |
| `HUNTER_API_KEY` | Extra Domain Search email candidates | Optional |
| `BLOB_READ_WRITE_TOKEN` | Persist the live-pull cache to [Vercel Blob](https://vercel.com/docs/vercel-blob) on Vercel | Included on Pro; leave empty locally to keep writing `data/cache.json` |

**On Vercel:** create a Blob store, connect this project, and redeploy. Vercel injects `BLOB_READ_WRITE_TOKEN` (OIDC also works once the store is linked). Localhost without the token still writes `data/cache.json`.

**With a Gemini key:** the first page load runs AI discovery once and caches the result for 24 hours. Click **Refetch data** to run it again.

**Without keys:** you see the prepared dataset. Refetch still runs OpenStreetMap location counts plus keyless email checks (Mailverdict). Gemini suggestions are never treated as verified facts on their own.

---

# How to read the dashboard

## Priority score (0–100)

Same inputs always produce the same score.

| Factor | Points | What it measures |
|---|---|---|
| Segment fit | 25 | Coffee, food-to-go, bakery, or QSR alignment with paper lids |
| UK location scale | 25 | Number of UK sites (20+ required by the brief) |
| Paper-lid need | 20 | Estimated hot-beverage cup volume |
| Sustainability signal | 15 | Public PFAS / packaging commitments on the operator’s own site |
| Contact confidence | 15 | Email validation status |

Each company also gets a short plain-English explanation of why it ranks where it does.

## Data labels

Every field carries a provenance badge:

| Label | Meaning |
|---|---|
| **Live** | Confirmed by Companies House, OpenStreetMap, Hunter, or a fetched company page — not by Gemini |
| **Cached** | Last live pull, reused until Refetch or 24 hours |
| **Reviewed** | Hand-checked from public filings or store locators |
| **Inferred** | Gemini suggestion or guessed email, not yet grounded |
| **Mocked** | Placeholder, not from a real source |

## Email status

An LLM cannot confirm that a mailbox exists. **Verified** is only set when vrfymail confirms the mailbox (`deliverable`). Mailverdict is MX-only, so its hits stay **Unverified**. Role inboxes such as `packaging@` are not used.

| Status | Meaning |
|---|---|
| **Verified** | Mailbox confirmed by vrfymail |
| **Unverified** | We have an address; it has not been confirmed |
| **Unknown** | No email found |
| **Invalid** | Verifier marked the address undeliverable |

*Needs review* stays on until a live source confirms the field, or the mailbox is still unverified. In the prepared dataset, emails stay Unverified or Unknown.

---

# How the data is built

1. **Brief** — UK, multi-site QSR / coffee / food-to-go / bakery, 20+ locations, paper lids, current customers excluded.
2. **Discovery** — With a Gemini key, AI proposes real operators matching that brief. Suggestions are labelled *Inferred*. Without a key, a hand-curated shortlist is used (labelled *Reviewed*).
3. **Enrichment** — Per company: Companies House registration and officers, OpenStreetMap location count, a fetched sustainability page, one decision-maker, and a mailbox check.
4. **Scoring** — Deterministic 0–100 rank (table above).
5. **Trust** — Every field keeps its provenance label.
6. **Export** — The exact records on screen go to a HubSpot-ready CSV.

Gemini is used only to **propose** companies, likely buying roles, and optional personal emails. It is never used to assert a verified mailbox, an exact location count, a company number, or a sustainability claim. Those are grounded afterwards by Companies House, OpenStreetMap, the operator’s own site, and a mailbox verifier. Source links go to the register, a UK store map, a LinkedIn people search, or the operator’s site — never a placeholder.

---

# Tools and data sources

| Purpose | Source | Notes |
|---|---|---|
| Company discovery + suggested emails | Google Gemini via Vercel AI SDK | Free tier; output labelled *Inferred* |
| UK company verification, SIC codes, directors | Companies House Public Data API | Free key; authoritative UK register |
| UK physical location count | OpenStreetMap Overpass API | Free, no key; community data, treated as approximate |
| Sustainability page | HTTP fetch of the operator’s own site | Live only if that page mentions packaging |
| Email validation | vrfymail, then Mailverdict | Mailbox proof only from vrfymail |
| Extra email candidates | Hunter.io Domain Search | Only if `HUNTER_API_KEY` is set |
| Interface | Next.js 16, React 19, Tailwind v4, shadcn/ui | One page + one API route |

---

# CSV export (HubSpot)

File: `sustainium-shake-the-market-hubspot.csv`

Columns match HubSpot’s sample contacts + companies import: First Name, Last Name, Email Address, Name, Company Domain Name, Job Title, Website URL, Industry, Country/Region, Type, Lifecycle Stage, Description.

The Description field includes segment, fit reason, location evidence, priority, confidence, contact status, and provenance — so a reviewer can see trust signals after import. Rows without an email still export the company; contact fields are left blank for manual fill-in.

---

# Scope and limitations

This is a preview, not production software. No production credentials were used and no prospects were contacted.

- OpenStreetMap location counts are approximate. Production would cross-check a places provider or official store locators.
- Decision-makers in the prepared data are often role-level. Live Gemini / Companies House lookups can name individuals — still review before outreach.
- Free-tier credits are small. Production would need caching, retries, rate-limit backoff, cost tracking, and deduplication.
- HubSpot writes would be upsert-by-domain with a dry-run and field-level guards. Human review stays mandatory for any *Needs review* record.

---

# Project structure

For anyone opening the repo:

| Path | Role |
|---|---|
| `app/page.tsx`, `components/shake/` | Dashboard UI |
| `app/api/companies/route.ts` | `GET` cached data, `?refresh=true` for a live pull |
| `lib/seed.ts` | Curated shortlist and customer exclusions |
| `lib/sources/` | Companies House, Overpass, Gemini, email verifier, optional Hunter |
| `lib/pipeline.ts` | Live enrichment |
| `lib/scoring.ts` | Deterministic scoring |
| `lib/csv.ts` | HubSpot CSV mapping |
| `data/cache.json` | Prepared dataset / last local live pull. On Vercel, Refetch writes the same JSON to Blob |
