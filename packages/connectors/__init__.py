from __future__ import annotations
"""
BharatBI — Connector Registry
Single entry point: get_connector(type, credentials) → BaseConnector

Adding a new connector = add one import + one dict entry here.
"""

from .base import BaseConnector
from .postgresql import PostgreSQLConnector
from .mysql import MySQLConnector
# Phase 2 imports (uncomment when implemented):
# from .google_sheets import GoogleSheetsConnector
# from .tally import TallyConnector
# from .zoho_crm import ZohoCRMConnector
# from .zoho_books import ZohoBooksConnector


def get_connector(connector_type: str, credentials: dict) -> BaseConnector:
    """
    Factory function — returns the right connector for a given type.

    Args:
        connector_type: 'postgresql' | 'mysql' | 'google_sheets' | 'tally' | ...
        credentials: dict with connection params (host, port, user, password, etc.)

    Returns:
        An initialized BaseConnector subclass (not yet connected).

    Raises:
        ValueError: if connector_type is unknown.
    """
    registry = {
        "postgresql": _make_postgresql,
        "mysql":      _make_mysql,
        # Phase 2:
        # "google_sheets": _make_google_sheets,
        # "tally":         _make_tally,
        # "zoho_crm":      _make_zoho_crm,
        # "zoho_books":    _make_zoho_books,
    }

    factory = registry.get(connector_type)
    if not factory:
        available = list(registry.keys())
        raise ValueError(
            f"Unknown connector type '{connector_type}'. "
            f"Available: {available}"
        )
    return factory(credentials)


def _make_postgresql(creds: dict) -> PostgreSQLConnector:
    return PostgreSQLConnector(
        host=creds["host"],
        port=int(creds.get("port", 5432)),
        database=creds["database"],
        username=creds["username"],
        password=creds["password"],
        ssl=creds.get("ssl", False),
    )


def _make_mysql(creds: dict) -> MySQLConnector:
    return MySQLConnector(
        host=creds["host"],
        port=int(creds.get("port", 3306)),
        database=creds["database"],
        username=creds["username"],
        password=creds["password"],
    )


__all__ = ["get_connector", "BaseConnector", "PostgreSQLConnector", "MySQLConnector"]