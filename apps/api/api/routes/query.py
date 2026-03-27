"""
BharatBI — Query API (Phase 1 — Real Implementation)
The heart of BharatBI: takes a natural language question,
runs the full RAG pipeline, and returns SQL + results + chart + summary.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Literal, Any

router = APIRouter()


# ── Pydantic models ───────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str
    connection_id: str
    llm_provider: Literal["openai", "anthropic"] = "openai"
    org_id: str = "00000000-0000-0000-0000-000000000001"
    user_id: Optional[str] = None


class ChartConfig(BaseModel):
    chart_type: str        # bar | line | pie | table
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    title: str = ""


class QueryResponse(BaseModel):
    query_id: str
    question: str
    sql: str
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    chart: ChartConfig
    summary: str               # AI-written plain English insight
    suggested_questions: list[str]
    duration_ms: int
    llm_provider: str
    llm_model: str


# ── Route ─────────────────────────────────────────────────────

@router.post("/", response_model=QueryResponse, summary="Run a natural language query")
async def run_query(req: QueryRequest):
    """
    The main BharatBI query endpoint.

    Pipeline:
    1. Embed user question (OpenAI text-embedding-3-small)
    2. Search Qdrant for relevant schema chunks (top 8)
    3. Build prompt (system + schema context + question)
    4. Call LLM → get SQL
    5. Validate SQL (sqlglot parse + EXPLAIN)
    6. Execute SQL on user's database
    7. Recommend chart type
    8. Generate plain English summary (second LLM call)
    9. Generate suggested follow-up questions
    10. Return everything
    """
    start = time.time()
    query_id = str(uuid.uuid4())

    # ── TODO (Phase 1 — Step 1.4): Implement each step ────────
    # from packages.core.embedder import embed_text
    # from packages.core.retriever import search_schema
    # from packages.llm.router import get_llm_provider
    # from packages.core.prompt_builder import build_sql_prompt
    # from packages.core.sql_validator import validate_and_execute
    # from packages.charts.recommender import recommend_chart
    #
    # question_vector = await embed_text(req.question)
    # schema_chunks = await search_schema(question_vector, req.connection_id, top_k=8)
    # prompt = build_sql_prompt(req.question, schema_chunks, dialect="postgresql")
    # llm = get_llm_provider(req.llm_provider)
    # sql = await llm.generate_sql(prompt)
    # rows, columns = await validate_and_execute(sql, req.connection_id, max_retries=3)
    # chart = recommend_chart(columns, rows)
    # summary = await llm.summarize(req.question, rows[:5], columns)
    # suggested = await llm.suggest_follow_ups(req.question, schema_chunks)

    # ── Stub response for skeleton (remove in Phase 1) ─────────
    duration_ms = int((time.time() - start) * 1000)
    return QueryResponse(
        query_id=query_id,
        question=req.question,
        sql="-- Query pipeline not yet implemented. Coming in Phase 1.",
        columns=["status"],
        rows=[["skeleton response"]],
        row_count=1,
        chart=ChartConfig(chart_type="table", title="Result"),
        summary="BharatBI query engine is being built. Check back in Phase 1!",
        suggested_questions=[
            "What data sources are connected?",
            "How do I add a MySQL database?",
        ],
        duration_ms=duration_ms,
        llm_provider=req.llm_provider,
        llm_model="gpt-4o" if req.llm_provider == "openai" else "claude-sonnet-4-5",
    )