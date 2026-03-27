# 🇮🇳 BharatBI

> **India's first open-source GenBI system.** Ask questions about your business data in plain English — BharatBI writes the SQL, runs it, and gives you charts + AI insights. No SQL knowledge needed.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/VineethVadlapalli/bharatbi?style=social)](https://github.com/VineethVadlapalli/bharatbi)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## What is BharatBI?

BharatBI connects to your existing data sources — MySQL, PostgreSQL, Google Sheets, **Tally**, or **Zoho** — and lets anyone on your team ask questions in plain English:

> _"What were my top 10 customers by revenue last month?"_
> _"Show me GST collected this financial year by state."_
> _"Which products had declining sales in Q3?"_

BharatBI returns a **chart**, a **data table**, and a **plain English AI summary**. No dashboards to configure. No SQL to write.

**Built for India** — supports Tally exports, Zoho CRM/Books, Indian fiscal year (April–March), INR formatting, and GST workflows out of the box.

---

## Why BharatBI?

| Pain | What every other tool does | What BharatBI does |
|------|----------------------------|--------------------|
| Tally dominance | Ignores it | Native Tally XML/Excel import |
| Google Sheets as DB | No support | Direct connector, treats sheets as tables |
| Zoho ecosystem | No support | OAuth connectors for CRM + Books |
| Data privacy fear | Your data → their cloud | Schema only goes to LLM. Raw data never leaves you. |
| INR / GST workflows | USD-first, no GST | Indian FY, INR, GST dashboard templates |
| ₹ pricing | $50–500/month | Free forever (self-host) · ₹999/month (cloud) |

---

## Quick Start (Docker — 1 command)

```bash
# 1. Clone
git clone https://github.com/VineethVadlapalli/bharatbi.git
cd bharatbi

# 2. Copy env file
cp .env.example .env
# Edit .env — add your OpenAI or Anthropic API key

# 3. Run everything
docker-compose up
```

Open [http://localhost:3000](http://localhost:3000) — that's it.

> **No Docker?** See [Manual Setup Guide](docs/setup/manual.md)

---

## Architecture

```
User question (English)
        ↓
   Next.js frontend  (Vercel)
        ↓
   FastAPI backend   (Railway)
        ↓
  Embed question → Search Qdrant (schema vectors) → Build prompt → LLM (GPT-4o / Claude)
        ↓
   Generated SQL → Validate → Execute on YOUR database
        ↓
   Chart (ECharts) + Table + AI summary → back to user
```

Your actual data **never** leaves your database. Only schema metadata (table/column names + descriptions) is sent to the LLM.

---

## Supported Data Sources

| Source | Status | Notes |
|--------|--------|-------|
| PostgreSQL | ✅ Phase 1 | Full support |
| MySQL | ✅ Phase 1 | Full support |
| Google Sheets | ✅ Phase 2 | OAuth, treats tabs as tables |
| Tally (XML/Excel export) | ✅ Phase 2 | Day book, ledger, stock summary |
| Zoho CRM | ✅ Phase 2 | OAuth, leads/deals/contacts |
| Zoho Books | ✅ Phase 2 | OAuth, invoices/GST/expenses |
| More... | 🗺️ Roadmap | See [ROADMAP.md](docs/ROADMAP.md) |

---

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python 3.11)
- **LLMs**: OpenAI GPT-4o · Anthropic Claude Sonnet (user picks)
- **Vector DB**: Qdrant (self-hosted)
- **App DB**: PostgreSQL via Supabase
- **Charts**: Apache ECharts
- **Jobs**: Celery + Redis
- **Payments**: Razorpay (INR)

---

## Project Structure

```
bharatbi/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── packages/
│   ├── core/         # Schema parser, embedder, SQL validator, prompt builder
│   ├── connectors/   # MySQL, PostgreSQL, Google Sheets, Tally, Zoho
│   ├── llm/          # OpenAI + Anthropic abstraction layer
│   └── charts/       # Chart type recommender
├── docker/           # Docker configs
├── docs/             # Documentation
├── examples/         # Sample Indian datasets
└── scripts/          # Dev utilities
```

---

## Contributing

BharatBI is built in the open and welcomes contributions. See [CONTRIBUTING.md](CONTRIBUTING.md).

**Easy ways to contribute:**
- 🐛 Report bugs via [GitHub Issues](https://github.com/VineethVadlapalli/bharatbi/issues)
- 🔌 Add a new data connector (see [Connector Guide](docs/CONNECTOR_GUIDE.md))
- 🤖 Add a new LLM provider (see [LLM Guide](docs/LLM_GUIDE.md))
- 🌍 Add Indian dataset examples
- 📖 Improve documentation

---

## Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for the full plan.

- [x] Phase 0: Project setup & skeleton
- [ ] Phase 1: Core engine (MySQL/PG + chat UI + charts)
- [ ] Phase 2: Indian connectors (Sheets, Tally, Zoho)
- [ ] Phase 3: Dashboards, teams, SaaS launch

---

## License

MIT — free forever. See [LICENSE](LICENSE).

---

## Star History

If BharatBI helps you, please ⭐ the repo — it helps more Indian developers find it.

---

*Built for Bharat 🇮🇳 — by the community, for Indian businesses.*