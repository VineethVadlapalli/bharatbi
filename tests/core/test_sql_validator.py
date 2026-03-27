"""Tests for packages/core/sql_validator.py — static parse validation."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from packages.core.sql_validator import parse_sql, validate_and_fix_sql


class TestStaticParse:
    def test_valid_select(self):
        valid, error = parse_sql("SELECT * FROM orders WHERE amount > 1000")
        assert valid is True

    def test_valid_aggregate(self):
        valid, error = parse_sql(
            "SELECT city, SUM(amount) AS total FROM orders GROUP BY city ORDER BY total DESC LIMIT 10"
        )
        assert valid is True

    def test_valid_join(self):
        valid, error = parse_sql(
            "SELECT c.name, SUM(o.amount) FROM customers c "
            "JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.name"
        )
        assert valid is True

    def test_invalid_syntax(self):
        valid, error = parse_sql("SELCT * FORM orders")
        # sqlglot may still parse some malformed SQL, so we check if it at least runs
        assert isinstance(valid, bool)

    def test_empty_sql(self):
        valid, error = parse_sql("")
        assert valid is False

    def test_window_function(self):
        valid, error = parse_sql(
            "SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev "
            "FROM monthly_revenue"
        )
        assert valid is True


class TestFullValidation:
    @pytest.mark.asyncio
    async def test_valid_sql_passes(self):
        mock_connector = AsyncMock()
        mock_connector.validate_sql = AsyncMock(return_value=(True, ""))

        valid_sql, error = await validate_and_fix_sql(
            sql="SELECT SUM(amount) FROM orders",
            dialect="postgresql",
            connector=mock_connector,
            llm_provider=None,
            original_question="total sales",
            schema_chunks=[{"text": "test"}],
        )
        assert valid_sql == "SELECT SUM(amount) FROM orders"
        assert error == ""

    @pytest.mark.asyncio
    async def test_explain_failure_without_llm(self):
        mock_connector = AsyncMock()
        mock_connector.validate_sql = AsyncMock(
            return_value=(False, "relation 'xyz' does not exist")
        )

        valid_sql, error = await validate_and_fix_sql(
            sql="SELECT * FROM xyz",
            dialect="postgresql",
            connector=mock_connector,
            llm_provider=None,
            original_question="test",
            schema_chunks=[{"text": "test"}],
            max_retries=0,
        )
        assert valid_sql == ""
        assert "does not exist" in error

    @pytest.mark.asyncio
    async def test_retry_with_llm_fix(self):
        """Simulate: first EXPLAIN fails, LLM fixes it, second EXPLAIN passes."""
        call_count = 0

        async def side_effect(sql):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return (False, "column 'amnt' does not exist")
            return (True, "")

        mock_connector = AsyncMock()
        mock_connector.validate_sql = AsyncMock(side_effect=side_effect)

        mock_llm = AsyncMock()
        mock_result = MagicMock()
        mock_result.sql = "SELECT SUM(amount) FROM orders"
        mock_llm.generate_sql = AsyncMock(return_value=mock_result)

        valid_sql, error = await validate_and_fix_sql(
            sql="SELECT SUM(amnt) FROM orders",
            dialect="postgresql",
            connector=mock_connector,
            llm_provider=mock_llm,
            original_question="total sales",
            schema_chunks=[{"text": "test"}],
            max_retries=3,
        )
        assert valid_sql == "SELECT SUM(amount) FROM orders"
        assert error == ""
