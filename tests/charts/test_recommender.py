"""Tests for packages/charts/recommender.py — chart type recommendation."""
from packages.charts.recommender import recommend_chart


class TestRecommendChart:
    def test_timeseries_returns_line(self, sample_query_result_timeseries):
        result = recommend_chart(
            sample_query_result_timeseries["columns"],
            sample_query_result_timeseries["rows"],
        )
        assert result is not None
        assert result.chart_type == "line"
        assert result.echarts_option["series"][0]["type"] == "line"

    def test_categories_returns_bar_or_pie(self, sample_query_result_categories):
        result = recommend_chart(
            sample_query_result_categories["columns"],
            sample_query_result_categories["rows"],
        )
        assert result is not None
        # "city" matches part-of-whole heuristic, so pie is also valid for ≤10 items
        assert result.chart_type in ("bar", "bar_horizontal", "pie")

    def test_few_categories_returns_pie(self, sample_query_result_pie):
        result = recommend_chart(
            sample_query_result_pie["columns"],
            sample_query_result_pie["rows"],
            question="breakdown by status",
        )
        assert result is not None
        assert result.chart_type == "pie"
        assert len(result.echarts_option["series"][0]["data"]) == 4

    def test_scalar_returns_table(self, sample_query_result_scalar):
        result = recommend_chart(
            sample_query_result_scalar["columns"],
            sample_query_result_scalar["rows"],
        )
        assert result.chart_type == "table"

    def test_empty_rows_returns_table(self):
        result = recommend_chart(["col1"], [])
        assert result.chart_type == "table"

    def test_empty_columns_returns_table(self):
        result = recommend_chart([], [[1]])
        assert result.chart_type == "table"

    def test_many_categories_returns_horizontal_bar(self):
        """12 cities → should suggest horizontal bar for readability."""
        rows = [[f"City_{i}", i * 100000] for i in range(12)]
        result = recommend_chart(["city", "revenue"], rows)
        assert result is not None
        assert result.chart_type == "bar_horizontal"

    def test_multiple_numeric_cols_returns_grouped_bar(self):
        """Multiple metrics → grouped bar."""
        rows = [
            ["Apr", 500000, 300000],
            ["May", 600000, 350000],
            ["Jun", 700000, 400000],
        ]
        result = recommend_chart(["month", "revenue", "expenses"], rows)
        assert result is not None
        assert result.chart_type == "grouped_bar"
        assert len(result.echarts_option["series"]) == 2

    def test_pie_chart_values_sum_correctly(self, sample_query_result_pie):
        result = recommend_chart(
            sample_query_result_pie["columns"],
            sample_query_result_pie["rows"],
            question="breakdown by status",
        )
        total = sum(d["value"] for d in result.echarts_option["series"][0]["data"])
        assert total == 15000 + 5000 + 2000 + 800

    def test_line_chart_has_smooth(self, sample_query_result_timeseries):
        result = recommend_chart(
            sample_query_result_timeseries["columns"],
            sample_query_result_timeseries["rows"],
        )
        assert result.echarts_option["series"][0].get("smooth") is True
