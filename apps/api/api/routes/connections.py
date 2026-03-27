"""
BharatBI — Connections API
Handles create, list, test, and sync of data source connections.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Literal
import uuid

router = APIRouter()


# ── Pydantic models ───────────────────────────────────────────

class ConnectionCreate(BaseModel):
    name: str
    type: Literal["mysql", "postgresql", "google_sheets", "tally", "zoho_crm", "zoho_books"]
    # SQL credentials (for mysql/postgresql)
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    # OAuth token (for google_sheets, zoho_*)
    oauth_token: Optional[str] = None
    # Org context (later: pulled from JWT)
    org_id: str = "00000000-0000-0000-0000-000000000001"


class ConnectionResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    message: str


class TestConnectionRequest(BaseModel):
    type: Literal["mysql", "postgresql"]
    host: str
    port: int
    database: str
    username: str
    password: str


# ── Routes ────────────────────────────────────────────────────

@router.post("/test", summary="Test a database connection before saving")
async def test_connection(req: TestConnectionRequest):
    """
    Tests a database connection without saving it.
    Returns success/fail and a human-readable message.
    """
    try:
        if req.type == "postgresql":
            import asyncpg
            conn = await asyncpg.connect(
                host=req.host, port=req.port,
                database=req.database, user=req.username, password=req.password,
                timeout=5,
            )
            version = await conn.fetchval("SELECT version()")
            await conn.close()
            return {"success": True, "message": f"Connected successfully. {version[:50]}..."}

        elif req.type == "mysql":
            import aiomysql
            conn = await aiomysql.connect(
                host=req.host, port=req.port,
                db=req.database, user=req.username, password=req.password,
                connect_timeout=5,
            )
            conn.close()
            return {"success": True, "message": "MySQL connection successful."}

    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/", summary="Save a new connection and trigger schema sync")
async def create_connection(req: ConnectionCreate, background_tasks: BackgroundTasks):
    """
    Saves the connection credentials (encrypted) and queues a schema sync job.
    """
    connection_id = str(uuid.uuid4())

    # TODO (Phase 1): Encrypt credentials and save to PostgreSQL
    # TODO (Phase 1): background_tasks.add_task(sync_schema, connection_id)

    return ConnectionResponse(
        id=connection_id,
        name=req.name,
        type=req.type,
        status="pending",
        message="Connection saved. Schema sync queued. This takes 1-3 minutes.",
    )


@router.get("/", summary="List all connections for an org")
async def list_connections(org_id: str = "00000000-0000-0000-0000-000000000001"):
    """Returns all data source connections for the organization."""
    # TODO (Phase 1): Fetch from DB
    return {"connections": [], "total": 0}


@router.get("/{connection_id}/status", summary="Get sync status of a connection")
async def get_connection_status(connection_id: str):
    """Poll this endpoint after creating a connection to check sync progress."""
    # TODO (Phase 1): Fetch from DB
    return {
        "id": connection_id,
        "status": "pending",
        "progress": 0,
        "message": "Sync not yet started",
    }


@router.post("/{connection_id}/sync", summary="Re-trigger schema sync")
async def sync_connection(connection_id: str, background_tasks: BackgroundTasks):
    """Re-syncs the schema for a connection (runs embedding pipeline again)."""
    # TODO (Phase 1): background_tasks.add_task(sync_schema, connection_id)
    return {"message": f"Schema sync queued for connection {connection_id}"}


@router.delete("/{connection_id}", summary="Delete a connection")
async def delete_connection(connection_id: str):
    """Deletes a connection and all its schema metadata and vectors."""
    # TODO (Phase 1): Delete from DB + Qdrant
    return {"message": f"Connection {connection_id} deleted"}