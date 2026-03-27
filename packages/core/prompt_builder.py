from __future__ import annotations
"""
BharatBI — Prompt Builder
Assembles the final prompt sent to the LLM for SQL generation.

This is the most important file for SQL accuracy.
Better prompts = better SQL = happier users.

India-specific considerations baked in:
- Indian fiscal year (April–March, not Jan–Dec)
- INR as default currency
- Common Indian business terminology
- GST awareness
"""

from datetime import date
from typing import Optional


# ── System prompt ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are BharatBI, an expert SQL analyst for Indian businesses.
Your job: convert a natural language question into a valid SQL query.

STRICT RULES:
1. Return ONLY valid JSON in this exact format:
   {{"sql": "SELECT ...", "explanation": "One sentence in plain English"}}
2. Use ONLY the tables and columns listed in SCHEMA below. No invented columns.
3. Use the database dialect specified (postgresql or mysql). No dialect mixing.
4. For monetary values, assume Indian Rupees (INR) unless stated otherwise.
5. Indian fiscal year runs April 1 to March 31 (NOT January–December).
   When user says "this year", "last year", "FY", interpret accordingly.
6. Always add LIMIT 1000 unless the user asks for a different number.
7. For aggregations, always alias the result columns clearly (e.g. AS total_revenue).
8. If a question is ambiguous, pick the most reasonable interpretation.
9. Never generate INSERT, UPDATE, DELETE, DROP, or DDL statements.
10. Do not use markdown code fences in your response. Pure JSON only.
"""

# ── Few-shot examples (India-specific) ───────────────────────

FEW_SHOT_EXAMPLES = [
    {
        "question": "What is the total sales amount this financial year?",
        "sql": "SELECT SUM(amount) AS total_sales_inr FROM orders WHERE created_at >= '2024-04-01' AND created_at < '2025-04-01'",
        "explanation": "Sum of all order amounts for the current Indian financial year (April 2024 to March 2025).",
    },
    {
        "question": "Top 5 customers by revenue",
        "sql": "SELECT customer_name, SUM(amount) AS total_revenue FROM orders JOIN customers ON orders.customer_id = customers.id GROUP BY customer_name ORDER BY total_revenue DESC LIMIT 5",
        "explanation": "Five customers with the highest total order value.",
    },
    {
        "question": "Month on month revenue trend",
        "sql": "SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS monthly_revenue FROM orders GROUP BY month ORDER BY month",
        "explanation": "Total revenue grouped by month, sorted chronologically.",
    },
    {
        "question": "Which products are running low in stock?",
        "sql": "SELECT product_name, stock_quantity FROM products WHERE stock_quantity < 10 ORDER BY stock_quantity ASC LIMIT 1000",
        "explanation": "Products with fewer than 10 units in stock, sorted from lowest to highest.",
    },
]


# ── Prompt assembly ───────────────────────────────────────────

def build_sql_prompt(
    question: str,
    schema_chunks: list[dict],
    dialect: str = "postgresql",
    few_shot_count: int = 2,
    extra_context: Optional[str] = None,
) -> str:
    """
    Assembles the full prompt for SQL generation.

    Args:
        question: The user's natural language question
        schema_chunks: Retrieved schema chunks from Qdrant (top-k)
        dialect: 'postgresql' or 'mysql'
        few_shot_count: How many few-shot examples to include
        extra_context: Any additional context (e.g. previous error message)

    Returns:
        The full prompt string to send to the LLM.
    """
    today = date.today()
    # Calculate current Indian fiscal year
    if today.month >= 4:
        fy_start = date(today.year, 4, 1)
        fy_end   = date(today.year + 1, 3, 31)
    else:
        fy_start = date(today.year - 1, 4, 1)
        fy_end   = date(today.year, 3, 31)

    prompt_parts = []

    # 1. Date context
    prompt_parts.append(
        f"CURRENT DATE: {today.isoformat()}\n"
        f"CURRENT INDIAN FISCAL YEAR: {fy_start.isoformat()} to {fy_end.isoformat()}\n"
        f"DATABASE DIALECT: {dialect.upper()}\n"
    )

    # 2. Schema context
    prompt_parts.append("SCHEMA (relevant tables and columns from the user's database):")
    for chunk in schema_chunks:
        prompt_parts.append(f"\n---\n{chunk.get('text', '')}")
    prompt_parts.append("---")

    # 3. Few-shot examples (India-specific)
    prompt_parts.append("\nEXAMPLES OF GOOD SQL GENERATION:")
    for ex in FEW_SHOT_EXAMPLES[:few_shot_count]:
        prompt_parts.append(
            f'\nQ: "{ex["question"]}"\n'
            f'A: {{"sql": "{ex["sql"]}", "explanation": "{ex["explanation"]}"}}'
        )

    # 4. Error context (for retry)
    if extra_context:
        prompt_parts.append(f"\nPREVIOUS ATTEMPT FAILED WITH ERROR:\n{extra_context}")
        prompt_parts.append("Fix the SQL so it does not produce this error.")

    # 5. The actual question
    prompt_parts.append(f'\nQUESTION: "{question}"')
    prompt_parts.append('\nRespond with JSON only:')

    return "\n".join(prompt_parts)


def build_summary_prompt(
    question: str,
    columns: list[str],
    rows: list[list],
    max_rows: int = 5,
) -> str:
    """
    Assembles the prompt for generating a plain English result summary.
    """
    # Format result as a small markdown table for context
    header = " | ".join(columns)
    separator = " | ".join(["---"] * len(columns))
    data_rows = []
    for row in rows[:max_rows]:
        data_rows.append(" | ".join(str(v) for v in row))
    table_str = "\n".join([header, separator] + data_rows)

    return f"""The user asked: "{question}"

The query returned this data:
{table_str}
{"[... and more rows]" if len(rows) > max_rows else ""}

Write a 2-3 sentence plain English summary of what this data shows.
Focus on the key insight. Use Indian business context where relevant (crore, lakh, FY, GST etc).
Be direct and specific — mention actual numbers from the data.
Do not start with "The data shows" or "Based on the query".
Then suggest 3 short follow-up questions the user might ask next.

Respond in this JSON format:
{{"summary": "...", "suggested_questions": ["...", "...", "..."]}}"""