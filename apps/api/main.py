"""
BharatBI — FastAPI Backend
Entry point: uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from api.routes import connections, query, health, schema
from api.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await init_db()
    yield


app = FastAPI(
    title="BharatBI API",
    description="India's first open-source GenBI system — API backend",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────
app.include_router(health.router,       prefix="/api",              tags=["Health"])
app.include_router(connections.router,  prefix="/api/connections",  tags=["Connections"])
app.include_router(query.router,        prefix="/api/query",        tags=["Query"])
app.include_router(schema.router,       prefix="/api/schema",       tags=["Schema"])