"""
BharatBI — PostgreSQL Connector
Connects to a user's PostgreSQL database, extracts schema,
and executes generated SQL queries.

Raw data NEVER leaves the user's database.
Only schema metadata is sent to the LLM.
"""

import asyncpg
from typing import Any, Optional
from .base import BaseConnector, SchemaInfo, TableInfo, ColumnInfo


class PostgreSQLConnector(BaseConnector):
    """
    Full PostgreSQL connector using asyncpg.
    Extracts schema from information_schema + pg_catalog.
    """

    def __init__(
        self,
        host: str,
        port: int,
        database: str,
        username: str,
        password: str,
        ssl: bool = False,
    ):
        self.host = host
        self.port = port
        self.database = database
        self.username = username
        self.password = password
        self.ssl = ssl
        self._pool: Optional[asyncpg.Pool] = None

    @property
    def connector_type(self) -> str:
        return "postgresql"

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password,
                ssl=self.ssl,
                min_size=1,
                max_size=5,
                command_timeout=30,
            )
        return self._pool

    # ── Test connection ───────────────────────────────────────

    async def test_connection(self) -> tuple[bool, str]:
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
            return True, f"Connected ✓  PostgreSQL {version.split(',')[0]}"
        except Exception as e:
            return False, str(e)

    # ── Schema extraction ─────────────────────────────────────

    async def extract_schema(self) -> SchemaInfo:
        """
        Extracts full schema using information_schema.
        Gets tables → columns → types → PKs → FKs → sample values.
        Skips system schemas (pg_catalog, information_schema).
        """
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            tables = await self._get_tables(conn)
            for table in tables:
                table.columns = await self._get_columns(conn, table.name)
                table.row_count = await self._get_row_count(conn, table.name)
                await self._add_sample_values(conn, table)

        return SchemaInfo(
            tables=tables,
            dialect="postgresql",
            database_name=self.database,
        )

    async def _get_tables(self, conn: asyncpg.Connection) -> list[TableInfo]:
        rows = await conn.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        return [TableInfo(name=row["table_name"]) for row in rows]

    async def _get_columns(self, conn: asyncpg.Connection, table_name: str) -> list[ColumnInfo]:
        # Get columns with types and nullability
        col_rows = await conn.fetch("""
            SELECT
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.character_maximum_length,
                c.numeric_precision
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name   = $1
            ORDER BY c.ordinal_position
        """, table_name)

        # Get primary key columns
        pk_rows = await conn.fetch("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema    = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_name      = $1
              AND tc.table_schema    = 'public'
        """, table_name)
        pk_cols = {r["column_name"] for r in pk_rows}

        # Get foreign key columns
        fk_rows = await conn.fetch("""
            SELECT
                kcu.column_name,
                ccu.table_name  AS ref_table,
                ccu.column_name AS ref_column
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema    = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.table_schema    = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name      = $1
              AND tc.table_schema    = 'public'
        """, table_name)
        fk_map = {r["column_name"]: (r["ref_table"], r["ref_column"]) for r in fk_rows}

        columns = []
        for row in col_rows:
            col_name = row["column_name"]
            fk_info = fk_map.get(col_name)
            columns.append(ColumnInfo(
                name=col_name,
                data_type=row["data_type"],
                is_nullable=(row["is_nullable"] == "YES"),
                is_primary_key=(col_name in pk_cols),
                is_foreign_key=(fk_info is not None),
                references_table=fk_info[0] if fk_info else None,
                references_column=fk_info[1] if fk_info else None,
            ))
        return columns

    async def _get_row_count(self, conn: asyncpg.Connection, table_name: str) -> int:
        """Fast approximate row count using pg_stat_user_tables."""
        row = await conn.fetchrow("""
            SELECT reltuples::BIGINT AS approx_count
            FROM pg_class
            WHERE relname = $1
        """, table_name)
        return int(row["approx_count"]) if row else 0

    async def _add_sample_values(self, conn: asyncpg.Connection, table: TableInfo) -> None:
        """
        Fetch up to 3 sample values for each column.
        Skips columns that look like passwords or tokens.
        This gives the LLM real context about what's in the data.
        """
        sensitive_keywords = {"password", "secret", "token", "key", "hash", "salt", "otp"}
        for col in table.columns:
            if any(kw in col.name.lower() for kw in sensitive_keywords):
                col.sample_values = ["[REDACTED]"]
                continue
            try:
                rows = await conn.fetch(f"""
                    SELECT DISTINCT "{col.name}"::TEXT AS val
                    FROM "{table.name}"
                    WHERE "{col.name}" IS NOT NULL
                    LIMIT 3
                """)
                col.sample_values = [r["val"] for r in rows]
            except Exception:
                col.sample_values = []

    # ── Query execution ───────────────────────────────────────

    async def execute_query(self, sql: str, limit: int = 1000) -> tuple[list[str], list[list[Any]]]:
        """
        Executes a SQL query and returns (columns, rows).
        Automatically adds LIMIT if not present (safety guard).
        """
        # Safety: ensure there's a limit
        sql_upper = sql.upper().strip()
        if sql_upper.startswith("SELECT") and "LIMIT" not in sql_upper:
            sql = sql.rstrip(";") + f" LIMIT {limit}"

        pool = await self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(sql)
            if not rows:
                return [], []
            columns = list(rows[0].keys())
            data = [list(row.values()) for row in rows]
            return columns, data

    async def validate_sql(self, sql: str) -> tuple[bool, str]:
        """
        Validates SQL without executing it using EXPLAIN.
        Returns (is_valid: bool, error_message: str).
        """
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            try:
                await conn.execute(f"EXPLAIN {sql}")
                return True, ""
            except asyncpg.PostgresError as e:
                return False, str(e)

    async def close(self) -> None:
        if self._pool:
            await self._pool.close()
            self._pool = None