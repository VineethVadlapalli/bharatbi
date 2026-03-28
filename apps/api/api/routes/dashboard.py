from __future__ import annotations

"""Dashboard API — pin queries as dashboard cards, list pinned, re-run them."""
from uuid import UUID
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from apps.api.api.db import async_session

router = APIRouter()

DEV_ORG_ID = "00000000-0000-0000-0000-000000000001"


class PinRequest(BaseModel):
    query_id: str
    name: str = ""


@router.post("/pin")
async def pin_query(req: PinRequest):
    """Pin a query result to the dashboard."""
    async with async_session() as db:
        # Check query exists
        result = await db.execute(
            text("SELECT id, question FROM queries WHERE id = :id AND org_id = :org_id"),
            {"id": req.query_id, "org_id": DEV_ORG_ID},
        )
        query_row = result.mappings().first()
        if not query_row:
            raise HTTPException(status_code=404, detail="Query not found")

        name = req.name or query_row["question"][:100]

        # Check if already pinned
        existing = await db.execute(
            text("SELECT id FROM saved_questions WHERE query_id = :qid AND org_id = :org_id"),
            {"qid": req.query_id, "org_id": DEV_ORG_ID},
        )
        if existing.first():
            raise HTTPException(status_code=400, detail="Already pinned")

        result = await db.execute(
            text("""
                INSERT INTO saved_questions (org_id, query_id, name, is_pinned)
                VALUES (:org_id, :qid, :name, true)
                RETURNING id
            """),
            {"org_id": DEV_ORG_ID, "qid": req.query_id, "name": name},
        )
        await db.commit()
        pin_id = str(result.scalars().first())

    return {"id": pin_id, "query_id": req.query_id, "name": name, "is_pinned": True}


@router.delete("/pin/{query_id}")
async def unpin_query(query_id: str):
    """Unpin a query from the dashboard."""
    async with async_session() as db:
        result = await db.execute(
            text("DELETE FROM saved_questions WHERE query_id = :qid AND org_id = :org_id"),
            {"qid": query_id, "org_id": DEV_ORG_ID},
        )
        await db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Pin not found")
    return {"status": "unpinned", "query_id": query_id}


@router.get("/pinned")
async def list_pinned():
    """List all pinned dashboard queries with their last results."""
    async with async_session() as db:
        result = await db.execute(
            text("""
                SELECT sq.id as pin_id, sq.name, sq.query_id, sq.created_at as pinned_at,
                       q.question, q.generated_sql, q.result_row_count, q.duration_ms,
                       q.chart_type, q.summary, q.llm_provider, q.connection_id
                FROM saved_questions sq
                JOIN queries q ON sq.query_id = q.id
                WHERE sq.org_id = :org_id AND sq.is_pinned = true
                ORDER BY sq.created_at DESC
            """),
            {"org_id": DEV_ORG_ID},
        )
        rows = result.mappings().all()
        return [dict(r) for r in rows]
