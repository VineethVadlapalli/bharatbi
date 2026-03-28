<p align="center">
  <img src="https://img.shields.io/badge/🇮🇳-Made_in_India-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Tests-86_Passing-success?style=for-the-badge" />
</p>

<h1 align="center">BharatBI</h1>
<p align="center"><strong>India's First Open-Source GenBI System</strong></p>
<p align="center">Ask questions about your business data in plain English — BharatBI generates SQL, runs it, and returns charts, tables, and insights. No SQL knowledge needed.</p>

---

## What is BharatBI?

BharatBI is an open-source, AI-powered Business Intelligence platform built specifically for Indian businesses. Connect your database, Tally export, or Google Sheets — and start asking questions in plain English.

**The only GenBI system that understands Indian business reality:** Tally exports, Indian fiscal year (April–March), GST/CGST/SGST/IGST, INR formatting (lakh/crore), and the deep suspicion Indian businesses have about their data leaving their premises.

## Features

| Feature | Description |
|---------|-------------|
| **Natural Language → SQL** | Ask questions in English. Get SQL generated, validated, and executed automatically |
| **Auto Charts** | Line, bar, pie, horizontal bar, grouped bar — auto-detected from your data shape |
| **AI Summaries** | Every result comes with a plain English insight using Indian number formatting |
| **Tally Connector** | Upload Tally XML or Excel exports. BharatBI auto-maps vouchers, ledgers, stock items |
| **Google Sheets** | Connect via OAuth or simply upload a CSV export |
| **PostgreSQL + MySQL** | Native connectors with schema extraction, sample values, FK detection |
| **Multi-LLM** | Choose OpenAI GPT-4o or Anthropic Claude — switch with one click |
| **Pin to Dashboard** | Pin any query result as a dashboard card with one-click refresh |
| **Scheduled Reports** | Run queries on a cron schedule, email results as CSV/PDF |
| **Alerts** | Monitor metrics against thresholds — get notified when revenue drops |
| **Multi-User Teams** | Invite members with role-based access (Admin / Analyst / Viewer) |
| **SQL Explainer** | "Explain this SQL" button — breaks down queries for non-technical users |
| **Schema Explorer** | Browse your tables and columns with search |
| **Query History** | All past questions saved with timing and results |
| **Indian FY Aware** | "This year" = April–March. GST terminology. INR formatting. |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Next.js UI  │────▶│  FastAPI API  │────▶│ User's Own  │
│  (Vercel)    │     │  (Railway)   │     │  Database   │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ OpenAI / │ │  Qdrant  │ │PostgreSQL│
        │ Anthropic│ │ (Vectors)│ │ (App DB) │
        └──────────┘ └──────────┘ └──────────┘
```

**How a query works (10 steps, ~5 seconds):**

1. User types question → embed it with OpenAI
2. Search Qdrant for relevant schema chunks (top 8)
3. Build prompt with schema context + Indian FY + few-shot examples
4. LLM generates SQL (temperature=0 for deterministic output)
5. Validate: parse with sqlglot → EXPLAIN on target DB → auto-retry if error
6. Execute SQL on user's own database (data never leaves their system)
7. Auto-detect chart type from result shape
8. Generate AI summary with Indian number formatting
9. Suggest 3 follow-up questions
10. Return everything: SQL + table + chart + summary + suggestions

## Quick Start

```bash
# 1. Clone
git clone https://github.com/VineethVadlapalli/bharatbi.git
cd bharatbi

# 2. Configure
cp .env.example .env
# Edit .env → add your OpenAI and/or Anthropic API keys

# 3. Run (all 6 services start with one command)
docker-compose up --build

# 4. Open
# API:      http://localhost:8000/docs
# Frontend: http://localhost:3000
```

**First-time setup:**
1. Go to http://localhost:3000/connections
2. Add a database connection (or upload a Tally/CSV file)
3. Click "Sync" to extract and embed the schema
4. Go to Chat → ask your first question!

A sample Indian e-commerce dataset (15 customers, 60 orders, GST invoices) is pre-loaded in the demo database for testing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, ECharts |
| Backend | FastAPI, Python 3.11+ |
| LLM | OpenAI GPT-4o, Anthropic Claude Sonnet |
| Embeddings | OpenAI text-embedding-3-small |
| Vector DB | Qdrant (self-hosted) |
| App DB | PostgreSQL (Supabase) |
| Charts | Apache ECharts |
| Background Jobs | Celery + Redis |
| State Management | Zustand |

## India-Specific Design

| Pain Point | BharatBI Solution |
|-----------|------------------|
| 80%+ SMBs use Tally | Native Tally XML/Excel import |
| Millions run business on Google Sheets | Direct Sheets/CSV connector |
| ₹50-500/month SaaS tools too expensive | Free open-source. Self-host forever |
| "Our data can't leave our server" | Only schema metadata goes to LLM. Raw data stays on your DB |
| Indian FY is April–March, not Jan–Dec | FY-aware prompts. "This year" = correct FY |
| GST/CGST/SGST/IGST complexity | Pre-built Indian accounting templates |
| No SQL skills in most SMBs | Plain English only. SQL hidden by default |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/connections/test` | Test a database connection |
| POST | `/api/connections` | Save a connection |
| POST | `/api/connections/{id}/sync` | Extract schema + embed |
| POST | `/api/query` | Ask a question → get SQL + results + chart |
| GET | `/api/queries` | Query history |
| GET | `/api/schema/{id}` | Browse schema metadata |
| POST | `/api/tally/upload` | Upload Tally XML/Excel |
| POST | `/api/sheets/upload-csv` | Upload CSV from Google Sheets |
| POST | `/api/dashboard/pin` | Pin a query to dashboard |
| GET | `/api/dashboard/pinned` | List dashboard cards |
| POST | `/api/reports/schedules` | Create scheduled report |
| POST | `/api/reports/alerts` | Create threshold alert |
| POST | `/api/explain-sql` | Explain SQL in plain English |
| POST | `/api/teams/invite` | Invite team member |
| GET | `/api/teams/members` | List team |

Full API docs at `http://localhost:8000/docs` (Swagger UI).

## Project Structure

```
bharatbi/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── main.py             # App entry point, route mounting
│   │   ├── api/routes/         # All API endpoints
│   │   └── requirements.txt    # Python dependencies
│   └── web/                    # Next.js frontend
│       ├── app/                # Pages (chat, connections, dashboard, etc.)
│       ├── components/         # Shared UI components
│       └── lib/                # API client, store, utilities
├── packages/
│   ├── connectors/             # Database connectors (PostgreSQL, MySQL, Tally, Sheets)
│   ├── core/                   # Chunker, embedder, prompt builder, SQL validator
│   ├── llm/                    # LLM providers (OpenAI, Anthropic)
│   └── charts/                 # Chart recommendation engine
├── docker/                     # Docker configs and init SQL
├── examples/                   # Sample Indian datasets
├── tests/                      # 86 unit tests
└── docker-compose.yml          # One-command local setup
```

## Contributing

We'd love your help! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Easy ways to contribute:**
- Add a new data connector (Zoho, Shopify India, Razorpay)
- Add a new LLM provider (Gemini, Groq, Ollama)
- Add sample Indian datasets (kirana store, hospital billing, CA firm)
- Improve prompt engineering for better SQL accuracy
- Add Hindi/regional language support

## License

[MIT License](LICENSE) — free forever, for everyone.

---

<p align="center"><strong>Built for Bharat 🇮🇳</strong></p>
