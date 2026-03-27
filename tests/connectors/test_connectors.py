"""Tests for connector base classes and the factory function."""
import pytest
from packages.connectors import get_connector, PostgreSQLConnector, MySQLConnector
from packages.connectors.base import BaseConnector, SchemaInfo, TableInfo, ColumnInfo


class TestConnectorFactory:
    def test_postgresql_returns_correct_type(self):
        conn = get_connector("postgresql", {
            "host": "localhost", "port": 5432,
            "username": "test", "password": "test", "database": "testdb",
        })
        assert isinstance(conn, PostgreSQLConnector)

    def test_mysql_returns_correct_type(self):
        conn = get_connector("mysql", {
            "host": "localhost", "port": 3306,
            "username": "test", "password": "test", "database": "testdb",
        })
        assert isinstance(conn, MySQLConnector)

    def test_unknown_type_raises(self):
        with pytest.raises(ValueError, match="Unknown connector type"):
            get_connector("oracle", {"host": "x", "port": 1, "username": "x", "password": "x", "database": "x"})


class TestDataClasses:
    def test_column_info_defaults(self):
        col = ColumnInfo(name="test", data_type="varchar")
        assert col.is_nullable is True
        assert col.is_primary_key is False
        assert col.is_foreign_key is False
        assert col.references_table is None
        assert col.sample_values == []

    def test_table_info_defaults(self):
        table = TableInfo(name="orders")
        assert table.columns == []
        assert table.row_count is None
        assert table.description is None

    def test_schema_info_fields(self):
        schema = SchemaInfo(tables=[], dialect="postgresql", database_name="test")
        assert schema.tables == []
        assert schema.dialect == "postgresql"
        assert schema.database_name == "test"

    def test_column_with_foreign_key(self):
        col = ColumnInfo(
            name="customer_id", data_type="integer",
            is_foreign_key=True,
            references_table="customers",
            references_column="customer_id",
        )
        assert col.is_foreign_key is True
        assert col.references_table == "customers"
        assert col.references_column == "customer_id"

    def test_schema_with_tables(self, sample_indian_schema):
        assert len(sample_indian_schema.tables) == 3
        table_names = [t.name for t in sample_indian_schema.tables]
        assert "customers" in table_names
        assert "orders" in table_names
        assert "products" in table_names
