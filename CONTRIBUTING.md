# Contributing to BharatBI

Thank you for your interest in contributing to BharatBI! This project is built for the Indian developer and business community, and your contributions make it better for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/VineethVadlapalli/bharatbi.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `PYTHONPATH=. python3 -m pytest tests/ -m "not integration" -v`
6. Commit with a descriptive message: `git commit -m "feat: add Zoho CRM connector"`
7. Push and create a Pull Request

## Development Setup

```bash
# Start all services
docker-compose up --build

# Run backend tests
cd bharatbi && PYTHONPATH=. python3 -m pytest tests/ -v

# Run frontend dev server
cd apps/web && npm install && npm run dev
```

## How to Add a New Data Connector

This is the most impactful contribution you can make. BharatBI's connector system is designed to be extensible.

**Step 1:** Create a new file in `packages/connectors/`:

```python
# packages/connectors/your_connector.py
from packages.connectors.base import BaseConnector, SchemaInfo

class YourConnector(BaseConnector):
    async def test_connection(self) -> dict:
        # Test if connection works
        ...

    async def extract_schema(self) -> SchemaInfo:
        # Extract tables, columns, types, relationships
        ...

    async def execute_query(self, sql: str) -> dict:
        # Run SQL and return results
        ...

    async def validate_sql(self, sql: str) -> dict:
        # Validate SQL using EXPLAIN
        ...

    async def close(self) -> None:
        # Clean up
        ...
```

**Step 2:** Register it in `packages/connectors/__init__.py`:

```python
from .your_connector import YourConnector

def get_connector(conn_type, **kwargs):
    connectors = {
        ...
        "your_type": YourConnector,
    }
```

**Step 3:** Add an API route in `apps/api/api/routes/` if it needs special handling (like file upload for Tally).

**Step 4:** Write tests in `tests/connectors/`.

### Connectors We'd Love to See

- Zoho CRM / Zoho Books (OAuth + API)
- Shopify India
- Razorpay (transaction data)
- Paytm Business
- Busy Accounting Software
- HRMS tools (Keka, Darwinbox)

## How to Add a New LLM Provider

**Step 1:** Create `packages/llm/your_provider.py` implementing `BaseLLMProvider`:

```python
from packages.llm.base import BaseLLMProvider

class YourProvider(BaseLLMProvider):
    async def generate_sql(self, prompt: str) -> str: ...
    async def summarize(self, question, columns, rows, sql) -> str: ...
    async def describe_column(self, table, column, data_type, sample_values) -> str: ...
    async def suggest_followups(self, question, summary) -> list[str]: ...
```

**Step 2:** Register in `packages/llm/__init__.py`.

### LLM Providers We'd Love to See

- Google Gemini
- Groq (fast inference)
- Ollama (fully local, no API key needed)
- Mistral
- Together AI

## How to Add Sample Indian Datasets

Add SQL files to `examples/` with realistic Indian business data. Include:

- Indian city names, state names
- GSTIN numbers (use fictional ones)
- HSN codes
- INR amounts (realistic ranges)
- Indian date patterns (FY April–March)
- Payment modes: UPI, NEFT, RTGS, COD, Cheque

Good datasets we'd love: kirana store inventory, hospital billing, CA firm ledger, Flipkart-style e-commerce, payroll/HR.

## Commit Message Format

We use conventional commits:

```
feat: add Zoho CRM connector
fix: correct FY date calculation for March
docs: add connector development guide
test: add tests for Tally XML parser
refactor: simplify query pipeline error handling
```

## Code Style

- **Python:** We use `ruff` for linting. Run `ruff check packages/ tests/`
- **TypeScript:** Standard Next.js/React patterns
- **Tests:** Every new feature needs tests. Aim for unit tests that don't need a live DB (use mocks)

## Questions?

- Open a [GitHub Discussion](https://github.com/VineethVadlapalli/bharatbi/discussions)
- File a [Bug Report](https://github.com/VineethVadlapalli/bharatbi/issues/new)

Thank you for contributing to BharatBI! 🇮🇳
