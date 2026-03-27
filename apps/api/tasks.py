"""
BharatBI — Celery Background Tasks
Full schema ingestion pipeline.
"""

from celery import Celery
import asyncio
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "bharatbi",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
)


def _run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="tasks.sync_schema")
def sync_schema(self, connection_id: str, connection_type: str, credentials: dict):
    """
    Full schema ingestion pipeline:
    1. Connect → extract schema → chunk → describe (LLM) → embed → store in Qdrant
    """
    self.update_state(state="PROGRESS", meta={"step": "connecting", "progress": 5})

    async def _pipeline():
        from packages.connectors import get_connector
        from packages.core.chunker import schema_to_chunks, enrich_chunks_with_descriptions
        from packages.core.embedder import store_chunks
        from packages.llm import get_llm_provider

        connector = get_connector(connection_type, credentials)
        ok, msg = await connector.test_connection()
        if not ok:
            raise RuntimeError(f"Connection failed: {msg}")

        schema = await connector.extract_schema()
        await connector.close()

        chunks = schema_to_chunks(schema)
        if not chunks:
            raise RuntimeError("No schema found in this database.")

        schema_items = [
            {
                "table":   c["metadata"]["table"],
                "column":  c["metadata"].get("column"),
                "type":    c["metadata"].get("data_type", "unknown"),
                "samples": [],
            }
            for c in chunks
        ]

        llm = get_llm_provider("openai")
        descriptions = await llm.generate_descriptions(schema_items, dialect=schema.dialect)
        enriched_chunks = enrich_chunks_with_descriptions(chunks, descriptions)
        point_ids = await store_chunks(connection_id, enriched_chunks)

        return {
            "tables":  len(schema.tables),
            "chunks":  len(enriched_chunks),
            "vectors": len(point_ids),
        }

    self.update_state(state="PROGRESS", meta={"step": "ingesting", "progress": 20})
    result = _run_async(_pipeline())
    return {"status": "completed", "connection_id": connection_id, **result}