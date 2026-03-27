"""Tests for packages/core/prompt_builder.py — prompt construction and Indian FY logic."""
from packages.core.prompt_builder import build_sql_prompt


class TestBuildSqlPrompt:
    def test_contains_user_question(self):
        prompt = build_sql_prompt(
            question="Total sales this month",
            schema_chunks=[{"text": "Table: orders, Column: amount"}],
            dialect="postgresql",
        )
        assert "Total sales this month" in prompt

    def test_contains_schema_context(self):
        prompt = build_sql_prompt(
            question="test",
            schema_chunks=[
                {"text": "Table: orders, Column: amount → order total in INR"},
                {"text": "Table: customers, Column: city → customer city"},
            ],
        )
        assert "order total in INR" in prompt
        assert "customer city" in prompt

    def test_contains_fiscal_year(self):
        prompt = build_sql_prompt(
            question="test",
            schema_chunks=[{"text": "test"}],
        )
        assert "FISCAL YEAR" in prompt

    def test_contains_dialect(self):
        prompt = build_sql_prompt(
            question="test",
            schema_chunks=[{"text": "test"}],
            dialect="mysql",
        )
        assert "MYSQL" in prompt

    def test_contains_few_shot_examples(self):
        prompt = build_sql_prompt(
            question="test",
            schema_chunks=[{"text": "test"}],
            few_shot_count=4,
        )
        assert "EXAMPLES" in prompt
        assert "financial year" in prompt.lower()

    def test_no_few_shots_when_zero(self):
        prompt = build_sql_prompt(
            question="test",
            schema_chunks=[{"text": "test"}],
            few_shot_count=0,
        )
        # Header still present but no actual Q/A examples
        assert 'Q: "What is the total' not in prompt

    def test_json_output_instruction(self):
        prompt = build_sql_prompt(
            question="test",
            schema_chunks=[{"text": "test"}],
        )
        assert "JSON" in prompt

    def test_current_date_in_prompt(self):
        prompt = build_sql_prompt(
            question="test",
            schema_chunks=[{"text": "test"}],
        )
        assert "CURRENT DATE" in prompt

    def test_default_dialect_is_postgresql(self):
        prompt = build_sql_prompt(
            question="test",
            schema_chunks=[{"text": "test"}],
        )
        assert "POSTGRESQL" in prompt
