# Karnataka Crime Intelligence Platform

Palantir-Gotham-style crime intelligence and predictive-policing platform built for the
Karnataka Police datathon. Three layers:

- **`apps/web`** — Next.js 16 + React 19 dashboard (auth, visualizations, intelligence UI)
- **`apps/ml-service`** — FastAPI ML microservice (embeddings, clustering, graph analytics, forecasting, NL→SQL)
- **PostgreSQL + Prisma** — full FIR schema (`prisma/schema.prisma`) with ~1,000 seeded synthetic FIRs

## Prerequisites

- Node 22+, pnpm 10 (`corepack enable`)
- Python 3.11+
- PostgreSQL 17 (`brew install postgresql@17 && brew services start postgresql@17`)

## Setup

```bash
# 1. Install JS dependencies (workspace: apps/web + packages/*)
pnpm install

# 2. Create the database
createdb crime_intel   # or: /opt/homebrew/opt/postgresql@17/bin/createdb crime_intel

# 3. Environment files (edit DATABASE_URL if your postgres user differs)
cp apps/web/.env.example apps/web/.env
cp apps/ml-service/.env.example apps/ml-service/.env
echo 'DATABASE_URL="postgresql://<your-user>@localhost:5432/crime_intel"' > .env
# generate a real secret for apps/web/.env:  openssl rand -base64 32

# 4. Schema + seed + SQL view (view powers the NL→SQL assistant)
pnpm db:push
pnpm db:seed
pnpm db:views

# 5. Python ML service
cd apps/ml-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ../..
```

## Run

```bash
pnpm dev:ml    # FastAPI on http://localhost:8000 (terminal 1)
pnpm dev:web   # Next.js on http://localhost:3000 (terminal 2)
```

Log in at http://localhost:3000/login — all seeded users share the password `Password@123`:

| Email | Role |
|---|---|
| admin@karnatakapolice.gov.in | SUPER_ADMIN |
| scrbanalyst@karnatakapolice.gov.in | SCRB_ANALYST |
| sp.bengaluru@karnatakapolice.gov.in | DISTRICT_SP |
| analyst@karnatakapolice.gov.in | ANALYST |

## Features

| Page | Backing |
|---|---|
| `/dashboard` (+district, station) | Prisma aggregations over seeded FIRs + Emerging Trend Alerts |
| `/intelligence/graph` | NetworkX entity graph (cases, persons, locations, weapons) |
| `/intelligence/gangs` | Louvain community detection on person co-occurrence projection |
| `/intelligence/criminals` | PageRank influence + betweenness centrality |
| `/intelligence/crime-dna` | Sentence-transformer FIR embeddings + MO fingerprint similarity |
| `/intelligence/mo-clustering`, `/repeat-mo` | MO clustering (DBSCAN-style) — serial-pattern detection |
| `/intelligence/crime-evolution` | Monthly severity/dominant-crime escalation from Prisma |
| `/intelligence/socio-economic` | Crime-urbanization-literacy correlation overlay with scatter plots |
| `/ai/assistant` | NL→SQL over the read-only `fir` Postgres view, executed live |
| `/ai/forecasting` | Stored predictions + live model calls with factor explanations |
| `/ai/hotspot-detection` | Model-predicted grid hotspots + real historical coordinate clusters |
| `/ai/anomaly-detection` | Outlier FIR detection + emerging-pattern spikes |
| `/ai/similarity-search` | Semantic search over FIR narratives (MiniLM embeddings) |
| `/ai/fir-summarizer` | Extractive summarization + keywords + related FIRs |

ML service API docs: http://localhost:8000/api/v1/docs

## Useful commands

```bash
pnpm db:seed          # re-seed (idempotency not guaranteed — reset first)
pnpm prisma migrate reset --force && pnpm db:seed && pnpm db:views   # full DB reset
pnpm tsx scripts/fix-users.ts   # repair user passwords on an old seed
cd apps/web && pnpm exec tsc --noEmit   # typecheck
```