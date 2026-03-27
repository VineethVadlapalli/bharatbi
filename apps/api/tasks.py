from __future__ import annotations

"""
BharatBI — Celery Background Tasks
Full schema ingestion pipeline.
"""


"""Celery tasks — background jobs for schema ingestion and embedding."""
import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("bharatbi", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)


@celery_app.task(name="sync_connection")
def sync_connection_task(connection_id: str):
    """
    Background task: extract schema → chunk → embed → store.
    For now, sync is done inline in the API route for simplicity.
    This task will be used when we move to async processing.
    """
    # TODO: Move the sync logic from connections.py route here
    # This enables non-blocking schema ingestion for large databases
    print(f"[Celery] Sync task received for connection: {connection_id}")
    return {"status": "completed", "connection_id": connection_id}