"""Tests for packages/core/chunker.py — schema chunking logic."""
from packages.core.chunker import schema_to_chunks


class TestSchemaToChunks:
    def test_produces_chunks_for_each_table_and_column(self, sample_indian_schema):
        chunks = schema_to_chunks(sample_indian_schema)
        table_chunks = [c for c in chunks if c["metadata"]["chunk_type"] == "table"]
        column_chunks = [c for c in chunks if c["metadata"]["chunk_type"] == "column"]

        assert len(table_chunks) == 3  # customers, orders, products
        assert len(column_chunks) == 17  # 6 + 6 + 5 columns

    def test_table_chunk_contains_table_name(self, sample_indian_schema):
        chunks = schema_to_chunks(sample_indian_schema)
        table_chunks = [c for c in chunks if c["metadata"]["chunk_type"] == "table"]
        table_names = [c["metadata"]["table"] for c in table_chunks]
        assert "customers" in table_names
        assert "orders" in table_names
        assert "products" in table_names

    def test_column_chunk_contains_column_info(self, sample_indian_schema):
        chunks = schema_to_chunks(sample_indian_schema)
        gst_chunks = [
            c for c in chunks
            if c["metadata"].get("column") == "gst_amount"
        ]
        assert len(gst_chunks) == 1
        assert "gst_amount" in gst_chunks[0]["text"]
        assert "numeric" in gst_chunks[0]["text"].lower()

    def test_foreign_key_in_chunk(self, sample_indian_schema):
        chunks = schema_to_chunks(sample_indian_schema)
        fk_chunks = [
            c for c in chunks
            if c["metadata"].get("column") == "customer_id" and c["metadata"].get("table") == "orders"
        ]
        assert len(fk_chunks) == 1
        assert "customers.customer_id" in fk_chunks[0]["text"]

    def test_dialect_in_metadata(self, sample_indian_schema):
        chunks = schema_to_chunks(sample_indian_schema)
        for chunk in chunks:
            assert chunk["metadata"]["dialect"] == "postgresql"

    def test_sample_values_in_chunk(self, sample_indian_schema):
        chunks = schema_to_chunks(sample_indian_schema)
        city_chunks = [
            c for c in chunks
            if c["metadata"].get("column") == "city"
        ]
        assert len(city_chunks) == 1
        assert "Mumbai" in city_chunks[0]["text"]

    def test_empty_schema(self):
        from packages.connectors.base import SchemaInfo
        empty = SchemaInfo(tables=[], dialect="postgresql", database_name="empty_db")
        chunks = schema_to_chunks(empty)
        assert chunks == []

    def test_primary_key_noted(self, sample_indian_schema):
        chunks = schema_to_chunks(sample_indian_schema)
        pk_chunk = [
            c for c in chunks
            if c["metadata"].get("column") == "customer_id" and c["metadata"].get("table") == "customers"
        ]
        assert "Primary key" in pk_chunk[0]["text"]
