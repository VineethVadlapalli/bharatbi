"""
BharatBI — Schema API
Endpoints to browse and edit the semantic schema (LLM-generated descriptions).
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class SchemaColumn(BaseModel):
    table_name: str
    column_name: Optional[str]
    data_type: Optional[str]
    description: str


class UpdateDescriptionRequest(BaseModel):
    description: str


@router.get("/{connection_id}", summary="Get full schema for a connection")
async def get_schema(connection_id: str):
    """Returns all tables and columns with their LLM-generated descriptions."""
    # TODO (Phase 1): Fetch from schema_metadata table
    return {"connection_id": connection_id, "tables": [], "total_columns": 0}


@router.put("/{connection_id}/column", summary="Update a column description")
async def update_column_description(connection_id: str, req: UpdateDescriptionRequest, table: str, column: str):
    """
    Admin can edit the LLM-generated description for any column.
    The updated description is re-embedded and stored in Qdrant.
    """
    # TODO (Phase 1): Update DB + re-embed + update Qdrant
    return {"message": f"Description for {table}.{column} updated successfully"}